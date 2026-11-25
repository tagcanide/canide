// Executor da apresentação no computador: transforma comandos do controle em rolagem suave.
// A página sempre rola por pequenos passos a cada quadro (nunca salta), então as timelines do Anime.js
// ligadas ao scroll, a cena 3D e as entradas de seção recebem a mesma sequência de eventos de uma
// rolagem feita à mão, nos dois sentidos.
import { SEGURAR_LIMITE_MS } from './conexao.js';
import { MODULO, roteiroValido } from '../data/modulos.js';

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ALTURA_NAV = 72;

// Onde cada placa para dentro do palco da desmontagem: peças separadas, na etapa de exploração.
const FRACAO_PLACA = 0.56;
const ESPERA_PLACA_MS = 520; // tempo para a cena trocar de placa antes de desmontar

// Paradas da apresentação: o topo de cada seção e, dentro da desmontagem, uma parada por etapa.
const SECOES = [
  ['#inicio', 'Início'],
  ['#identidade', 'Identidade'],
  ['#proposito', 'Propósito'],
  ['#produto', 'O produto'],
  ['.palco', 'Desmontagem', [0, 0.28, 0.43, 0.64, 1], ['Montada', 'Separação', 'Desmontagem completa', 'Exploração', 'Reconstrução']],
  ['#funcionalidades', 'Funcionalidades'],
  ['#sessao', 'Sessão real'],
  ['#integracao', 'Integração'],
  ['#diferenciais', 'Diferenciais'],
  ['#contato', 'Conhecer'],
  ['.rodape', 'Assinatura']
];

function maxScroll() {
  return document.documentElement.scrollHeight - window.innerHeight;
}

function topo(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

/** Lista de paradas medida na hora (imagens e fontes mudam a altura da página). */
export function paradas() {
  const lista = [];
  for (const [sel, nome, fracoes, nomes] of SECOES) {
    const el = document.querySelector(sel);
    if (!el) continue;
    if (fracoes) {
      const curso = el.offsetHeight - window.innerHeight;
      fracoes.forEach((f, i) => lista.push({ y: topo(el) + curso * f, nome: `${nome} · ${nomes[i]}` }));
    } else {
      lista.push({ y: sel === '#inicio' ? 0 : topo(el) - ALTURA_NAV, nome });
    }
  }
  const max = maxScroll();
  return lista.map(p => ({ ...p, y: Math.max(0, Math.min(max, Math.round(p.y))) }));
}

export function criarNavegador({ aoMudar } = {}) {
  let quadro = 0;
  let pausado = false;
  let continuo = null; // { dir, ultimoSinal, velocidade }
  let ultimoInstante = 0;
  let espera = 0; // troca de placa em andamento
  let roteiro = null; // { ids, atual }: apresentação personalizada vinda do celular
  let destacado = null;
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raiz = document.documentElement;

  const rolarPara = y => window.scrollTo({ top: y, behavior: 'instant' });

  function parar() {
    cancelAnimationFrame(quadro);
    clearTimeout(espera);
    quadro = 0;
    espera = 0;
    continuo = null;
  }

  /** Desliza até y com aceleração e frenagem; a duração cresce com a distância. */
  function deslizar(y, aoChegar) {
    parar();
    const inicio = window.scrollY;
    const fim = Math.max(0, Math.min(maxScroll(), y));
    const dist = Math.abs(fim - inicio);
    if (dist < 2) {
      if (aoChegar) return aoChegar();
      return informar();
    }
    const dur = reduzir ? 0 : Math.min(2200, Math.max(650, dist * 0.55));
    const t0 = performance.now();
    const passo = agora => {
      const k = dur ? Math.min(1, (agora - t0) / dur) : 1;
      rolarPara(inicio + (fim - inicio) * ease(k));
      if (k < 1) quadro = requestAnimationFrame(passo);
      else {
        quadro = 0;
        if (aoChegar) aoChegar();
        else informar();
      }
    };
    quadro = requestAnimationFrame(passo);
  }

  /** Rolagem contínua enquanto o botão do celular estiver pressionado. */
  function segurar(dir) {
    const agora = performance.now();
    if (continuo && continuo.dir === dir) {
      continuo.ultimoSinal = agora;
      return;
    }
    parar();
    continuo = { dir, ultimoSinal: agora, velocidade: 0 };
    ultimoInstante = agora;
    const passo = t => {
      if (!continuo) return;
      // segurança: se o sinal do celular parar de chegar (conexão perdida), a rolagem freia sozinha
      if (t - continuo.ultimoSinal > SEGURAR_LIMITE_MS) {
        parar();
        informar();
        return;
      }
      const dt = Math.min(0.05, (t - ultimoInstante) / 1000);
      ultimoInstante = t;
      continuo.velocidade = Math.min(1100, continuo.velocidade + 2600 * dt); // acelera até 1100 px/s
      const y = window.scrollY + continuo.dir * continuo.velocidade * dt;
      rolarPara(y);
      if ((continuo.dir > 0 && window.scrollY >= maxScroll() - 1) || (continuo.dir < 0 && window.scrollY <= 0)) {
        parar();
        informar();
        return;
      }
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
  }

  function indiceAtual(lista = paradas()) {
    const y = window.scrollY + 4;
    let i = 0;
    lista.forEach((p, n) => {
      if (p.y <= y) i = n;
    });
    return i;
  }

  function informar() {
    const lista = paradas();
    const i = indiceAtual(lista);
    aoMudar?.({
      secao: i,
      total: lista.length,
      nome: lista[i]?.nome || '',
      pausado,
      // o Realtime Database guarda listas mal: os ids viajam como texto separado por vírgulas
      roteiro: roteiro ? { ids: roteiro.ids.join(','), atual: roteiro.atual } : null
    });
  }

  /* ---------- apresentação personalizada ---------- */

  function destacar(el) {
    if (destacado && destacado !== el) destacado.removeAttribute('data-apresentando');
    destacado = el || null;
    destacado?.setAttribute('data-apresentando', '');
  }

  function marcarModo() {
    if (roteiro) raiz.dataset.apresentacao = pausado ? 'pausada' : 'ativa';
    else delete raiz.dataset.apresentacao;
  }

  // placa exibida agora (a seção marca a escolha atual, feita aqui ou à mão no computador)
  const placaAtual = () => document.querySelector('#desmontagem')?.dataset.placa;

  function trocarPlaca(id) {
    window.dispatchEvent(new CustomEvent('canide:placa', { detail: id }));
  }

  /** Leva a página até um módulo. Placas: monta, troca e desmonta de novo pela rolagem do palco. */
  function mostrar(m) {
    const { alvo } = m;
    if (alvo.tipo === 'placa') {
      const palco = document.querySelector('.palco');
      const secao = document.querySelector('#desmontagem');
      if (!palco || !secao) return informar();
      destacar(secao);
      // medidas sempre na hora: trocar de placa pode mudar a altura do cabeçalho da seção
      const curso = () => palco.offsetHeight - window.innerHeight;
      const yIni = () => topo(palco);
      const yAlvo = () => yIni() + curso() * FRACAO_PLACA;
      const depoisDaTroca = fn => {
        espera = setTimeout(() => {
          espera = 0;
          fn();
        }, ESPERA_PLACA_MS);
      };
      if (curso() <= 0) {
        // sem rolagem ligada à cena (movimento reduzido ou sem WebGL): só troca a placa e mostra a seção
        trocarPlaca(alvo.placa);
        return depoisDaTroca(() => deslizar(topo(secao) - ALTURA_NAV));
      }
      if (placaAtual() === alvo.placa) return deslizar(yAlvo());
      const visivel = window.scrollY > yIni() - window.innerHeight && window.scrollY < yIni() + curso() + window.innerHeight * 0.5;
      if (!visivel) {
        trocarPlaca(alvo.placa);
        return depoisDaTroca(() => deslizar(yAlvo()));
      }
      // a placa atual está na tela: monta (volta ao início do palco), troca e desmonta a nova
      return deslizar(yIni(), () => {
        trocarPlaca(alvo.placa);
        informar();
        depoisDaTroca(() => deslizar(yAlvo()));
      });
    }
    const el = document.querySelector(alvo.sel);
    if (!el) return informar();
    destacar(el);
    if (alvo.tipo === 'painel') {
      // a tela do painel fica centrada; se for mais alta que a janela, mostra o começo
      const livre = window.innerHeight - ALTURA_NAV;
      const y = el.offsetHeight > livre - 48 ? topo(el) - ALTURA_NAV - 24 : topo(el) - ALTURA_NAV - (livre - el.offsetHeight) / 2;
      return deslizar(y);
    }
    return deslizar(m.id === 'abertura' ? 0 : topo(el) - ALTURA_NAV);
  }

  function irPara(i) {
    if (!roteiro || !roteiro.ids.length) return informar();
    const n = Math.max(0, Math.min(roteiro.ids.length - 1, i));
    roteiro.atual = n;
    informar();
    return mostrar(MODULO[roteiro.ids[n]]);
  }

  function iniciarRoteiro(texto) {
    const ids = roteiroValido(String(texto || '').split(','));
    if (!ids.length) return informar();
    roteiro = { ids, atual: 0 };
    pausado = false;
    marcarModo();
    return irPara(0);
  }

  function sairDoRoteiro() {
    roteiro = null;
    destacar(null);
    marcarModo();
    informar();
  }

  function executar(tipo, arg) {
    if (tipo === 'pausar') {
      pausado = true;
      parar();
      marcarModo();
      return informar();
    }
    if (tipo === 'retomar') {
      pausado = false;
      marcarModo();
      return informar();
    }
    if (tipo === 'roteiro-sair') return sairDoRoteiro();
    if (tipo === 'roteiro') return iniciarRoteiro(arg); // começar uma apresentação também tira da pausa
    if (pausado) return undefined;
    if (tipo.startsWith('modulo-')) {
      if (!roteiro) return informar();
      const i = roteiro.atual;
      const ultimo = roteiro.ids.length - 1;
      const destino = { 'modulo-proximo': i + 1, 'modulo-anterior': i - 1, 'modulo-inicio': 0, 'modulo-fim': ultimo, 'modulo-ir': parseInt(arg, 10) }[tipo];
      return Number.isInteger(destino) ? irPara(destino) : undefined;
    }
    const lista = paradas();
    const i = indiceAtual(lista);
    const passo = window.innerHeight * 0.7;
    switch (tipo) {
      case 'descer':
        return deslizar(window.scrollY + passo);
      case 'subir':
        return deslizar(window.scrollY - passo);
      case 'descer-segurar':
        return segurar(1);
      case 'subir-segurar':
        return segurar(-1);
      case 'parar':
        if (continuo) {
          parar();
          informar();
        }
        return undefined;
      case 'proxima': {
        const prox = lista.find(p => p.y > window.scrollY + 8);
        return deslizar(prox ? prox.y : maxScroll());
      }
      case 'anterior': {
        // se estiver no meio de uma seção, volta ao começo dela; senão, à anterior
        const atual = lista[i];
        const alvo = atual && window.scrollY - atual.y > 8 ? atual : lista[Math.max(0, i - 1)];
        return deslizar(alvo ? alvo.y : 0);
      }
      case 'inicio':
        return deslizar(0);
      case 'fim':
        return deslizar(maxScroll());
      default:
        return undefined;
    }
  }

  // Se o apresentador mexer na página pelo próprio computador, a rolagem remota cede na hora.
  const ceder = () => {
    if (quadro) {
      parar();
      informar();
    }
  };
  window.addEventListener('wheel', ceder, { passive: true });
  window.addEventListener('touchstart', ceder, { passive: true });
  let temporizador = 0;
  const aoRolar = () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => !quadro && informar(), 200);
  };
  window.addEventListener('scroll', aoRolar, { passive: true });

  return {
    executar,
    informar,
    get pausado() {
      return pausado;
    },
    get roteiro() {
      return roteiro;
    },
    destruir() {
      parar();
      roteiro = null;
      destacar(null);
      marcarModo();
      clearTimeout(temporizador);
      window.removeEventListener('wheel', ceder);
      window.removeEventListener('touchstart', ceder);
      window.removeEventListener('scroll', aoRolar);
    }
  };
}
