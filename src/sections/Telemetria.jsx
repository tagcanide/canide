import { useLayoutEffect, useRef } from 'react';
import { animate, onScroll, reduzMovimento, useEntrada, utils } from '../lib/movimento.js';
import './Telemetria.css';

// "Da matemática à telemetria": quem calcula o quê, do satélite à tela.
// Conferido em clone git/ECOTAM: GATEWAY_PC (ecotam_gateway.py, dashboard.js), docs/software/OnlineSync.md,
// site/sync-core.js (trajetória online) e nas funções das placas informadas pela equipe (src/bancada/placas/info.js).
const ETAPAS = [
  {
    nome: 'Satélites GPS',
    onde: 'Órbita a cerca de 20 200 km',
    faz: 'Transmitem o instante de envio, marcado por relógios atômicos, e os dados da própria órbita.',
    mat: 'Tempo e órbitas: a referência de cada medida.',
    tipo: 'externo'
  },
  {
    nome: 'Receptor GPS',
    onde: 'NEO-6M, dentro da tag',
    faz: 'Mede os tempos de chegada, calcula as pseudodistâncias, resolve posição e relógio e converte para latitude, longitude e altitude. Informa também os satélites em uso e se há fix.',
    mat: 'ρ = c·Δt, trilateração, mínimos quadrados, WGS 84 e modelo do geoide. Toda a matemática do posicionamento acontece aqui.',
    tipo: 'calcula'
  },
  {
    nome: 'Tag CANIDÉ',
    onde: 'ESP32-C3 · BME280',
    faz: 'Lê a posição pronta do receptor e as medidas do sensor ambiental, monta o pacote V3 de 84 bytes e o transmite.',
    mat: 'Não recalcula a posição. Só organiza e envia os números.',
    tipo: 'transporta'
  },
  {
    nome: 'Rádio e receptor',
    onde: 'ESP-NOW · NodeMCU V3 · USB',
    faz: 'O rádio leva cada pacote até a central; o receptor o entrega ao computador pela porta serial.',
    mat: 'Nenhum cálculo de posição.',
    tipo: 'transporta'
  },
  {
    nome: 'Gateway',
    onde: 'Programa no computador da equipe',
    faz: 'Interpreta os pacotes, identifica a sessão e descarta coordenadas quando não há fix. Converte a posição em metros a partir da primeira, para o plano de voo, e audita lacunas e sequências.',
    mat: 'Projeção local equiretangular e verificações de qualidade dos registros.',
    tipo: 'calcula'
  },
  {
    nome: 'Banco de dados',
    onde: 'InfluxDB 2.x · CSV diário',
    faz: 'Guarda cada amostra com horário em UTC e o identificador da sessão. O InfluxDB local é o registro oficial; o Firebase só distribui a sessão ativa para quem acompanha online.',
    mat: 'Armazena os números como chegaram, sem médias nem valores inventados.',
    tipo: 'guarda'
  },
  {
    nome: 'Visualização',
    onde: 'Painel local · trajetória online',
    faz: 'O painel mostra tempo real, plano de voo, atmosfera, histórico e qualidade. A trajetória online mostra o percurso da sessão ativa, só para leitura.',
    mat: 'Haversine para a distância percorrida e a fórmula do rumo para a direção.',
    tipo: 'calcula'
  }
];

const TIPO = {
  externo: 'Fonte externa',
  calcula: 'Calcula',
  transporta: 'Transporta',
  guarda: 'Armazena'
};

const RESPONSABILIDADES = [
  { quem: 'O receptor GPS calcula', o: 'latitude, longitude, altitude, número de satélites e fix' },
  { quem: 'O CANIDÉ recebe', o: 'essas grandezas prontas, mais temperatura, pressão, umidade e altitude barométrica' },
  { quem: 'O gateway processa', o: 'pacotes, sessões, posições em metros para o plano de voo e auditoria dos registros' },
  { quem: 'O banco armazena', o: 'cada amostra com horário e sessão; o InfluxDB é o registro oficial' },
  { quem: 'Este site apresenta', o: 'o projeto e uma sessão real sem coordenadas; não recebe dados ao vivo' }
];

export default function Telemetria() {
  const ref = useRef(null);
  const fluxoRef = useRef(null);
  useEntrada(ref);

  // O trilho vertical se preenche com a rolagem, como no caminho da leitura (Integração)
  useLayoutEffect(() => {
    const fluxo = fluxoRef.current;
    const nos = [...fluxo.querySelectorAll('.tele-etapa')];
    if (reduzMovimento()) {
      fluxo.style.setProperty('--avanco', 1);
      nos.forEach(n => n.classList.add('tele-etapa--ativa'));
      return undefined;
    }
    const v = { a: 0 };
    const a = animate(v, {
      a: [0, 1],
      ease: 'linear',
      autoplay: onScroll({ target: fluxo, enter: 'bottom-=25% top', leave: 'bottom-=15% bottom', sync: 0.5 }),
      onUpdate: () => {
        fluxo.style.setProperty('--avanco', v.a.toFixed(4));
        nos.forEach((n, i) => n.classList.toggle('tele-etapa--ativa', v.a >= i / (nos.length - 1) - 0.03));
      }
    });
    return () => {
      a.revert();
      utils.remove(v);
    };
  }, []);

  return (
    <section id="telemetria" ref={ref} className="telemetria secao" aria-labelledby="tele-titulo">
      <div className="moldura tele-cabeca" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">08</span> Arquitetura
        </p>
        <h2 id="tele-titulo" className="titulo" data-titulo>
          Da matemática à telemetria.
        </h2>
        <p className="enunciado" data-entra>
          A conta difícil acontece dentro do receptor GPS. O CANIDÉ cuida do que vem depois: levar, guardar e mostrar cada
          posição sem perder nem inventar dados.
        </p>
      </div>

      <div className="moldura">
        <ol ref={fluxoRef} className="tele-fluxo" aria-label="Caminho de uma posição, do satélite à tela">
          {ETAPAS.map((e, i) => (
            <li key={e.nome} className={`tele-etapa tele-etapa--${e.tipo}`} data-entra>
              <span className="tele-etapa__no" aria-hidden="true" />
              <div className="tele-etapa__quem">
                <span className="tele-etapa__num numeros">{String(i + 1).padStart(2, '0')}</span>
                <p className="tele-etapa__nome editorial">{e.nome}</p>
                <p className="tele-etapa__onde">{e.onde}</p>
              </div>
              <p className="tele-etapa__faz">{e.faz}</p>
              <div className="tele-etapa__mat">
                <p className="tele-etapa__tipo">{TIPO[e.tipo]}</p>
                <p>{e.mat}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="moldura tele-resp" data-grupo>
        <h3 className="subtitulo" data-entra>
          Cada parte com a sua responsabilidade.
        </h3>
        <dl className="tele-resp__lista">
          {RESPONSABILIDADES.map(r => (
            <div key={r.quem} data-entra>
              <dt>{r.quem}</dt>
              <dd>{r.o}</dd>
            </div>
          ))}
        </dl>
        <p className="nota tele-resp__nota" data-entra>
          Arquitetura conferida no código do gateway e da trajetória online. A posição de uma sessão online é pública por
          decisão do projeto; o painel local só escuta no próprio computador.
        </p>
      </div>
    </section>
  );
}
