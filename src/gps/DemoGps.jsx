import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, reduzMovimento } from '../lib/movimento.js';
import { C, criarCenario, ecefParaGeodesicas } from '../lib/gnss.js';
import { Trilateracao2D } from './interativos.jsx';
import './DemoGps.css';

// Simulação educativa: o cenário é calculado em gnss.js com a matemática real do GPS (WGS 84, pseudodistâncias,
// mínimos quadrados), mas satélites, tempos e erros são demonstrativos. Nada aqui vem da telemetria do CANIDÉ.

const ETAPAS = [
  {
    nome: 'Transmissão do sinal',
    curta: 'Transmissão',
    texto: 'Cada satélite transmite um sinal com o instante exato de envio, marcado por relógios atômicos, e os dados da própria órbita (efemérides). Assim o receptor sabe onde cada satélite estava.',
    dur: 3400
  },
  {
    nome: 'Medição do tempo de propagação',
    curta: 'Tempo',
    texto: 'O receptor compara o instante de transmissão com o instante de recepção, lido no seu próprio relógio. A diferença Δt fica perto de 70 a 80 milissegundos: o tempo que a luz leva para percorrer cerca de 20 000 km.',
    dur: 3400
  },
  {
    nome: 'Estimativa das pseudodistâncias',
    curta: 'Distâncias',
    texto: 'Multiplicando Δt pela velocidade da luz, cada satélite fornece uma pseudodistância ρ. O receptor está em algum ponto da esfera de raio ρ centrada no satélite.',
    dur: 3800
  },
  {
    nome: 'Combinação das referências',
    curta: 'Combinação',
    texto: 'As esferas medidas não se cruzam sobre o receptor: todas carregam o mesmo erro do relógio dele. Neste exemplo, 2 ms viram cerca de 600 km a mais em cada pseudodistância, e as esferas passam além do receptor, por dentro da Terra. São quatro equações para quatro incógnitas: x, y, z e δt.',
    dur: 2800
  },
  {
    nome: 'Solução da posição',
    curta: 'Solução',
    texto: 'O sistema não é linear. O receptor parte de uma estimativa grosseira (aqui, o centro da Terra), lineariza as equações, corrige a posição e o relógio e repete. Em poucas iterações as esferas, já sem o erro do relógio, passam pelo mesmo ponto.',
    dur: 5600
  },
  {
    nome: 'Apresentação das coordenadas',
    curta: 'Coordenadas',
    texto: 'A solução sai em coordenadas cartesianas ECEF e é convertida para latitude, longitude e altitude sobre o elipsoide WGS 84. Os pequenos erros εᵢ não somem: a geometria dos satélites os amplia, e a posição final fica a alguns metros do ponto verdadeiro. As setas marcam leste (azul), norte (turquesa) e a vertical local (oliva).',
    dur: 2200
  }
];
const PAUSA_LEITURA = 2200; // ms entre etapas no modo automático

// Milhares separados por espaço fino (SI), para não confundir com a vírgula decimal
const num = (v, casas = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).replace(/\./g, '\u202f');
const grau = (v, pos, neg) => `${num(Math.abs(v), 5)}° ${v >= 0 ? pos : neg}`;
const km = v => num(v / 1000, 1);

export default function DemoGps() {
  const cenario = useMemo(() => criarCenario(), []);
  const palcoRef = useRef(null);
  const canvasRef = useRef(null);
  const rotulosRef = useRef({});
  const cenaRef = useRef(null);
  const animRef = useRef(null);
  const valores = useRef({ p: 0, h: 0 });
  const [etapa, setEtapa] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [k, setK] = useState(0);
  const [modo, setModo] = useState('carregando'); // carregando | 3d | 2d
  const iniciou = useRef(false);
  const iter = cenario.solucao.iteracoes;

  /* ---------- Cena 3D sob demanda ---------- */
  useEffect(() => {
    const palco = palcoRef.current;
    let vivo = true;
    let cena = null;
    let ro = null;
    let io = null;
    const canvas = document.createElement('canvas');
    canvas.className = 'demo-gps__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvasRef.current = canvas;
    palco.prepend(canvas);

    import('./cenaGps.js')
      .then(({ criarCenaGps, suportaWebGL }) => {
        if (!vivo) return;
        if (!suportaWebGL()) throw new Error('sem WebGL');
        cena = criarCenaGps(canvas, cenario, {
          mobile: window.matchMedia('(max-width: 767px)').matches,
          rotulos: rotulosRef.current,
          reduzido: reduzMovimento()
        });
        cenaRef.current = cena;
        cena.redimensionar();
        cena.definir({ etapa: 0, p: valores.current.p });
        ro = new ResizeObserver(() => cena.redimensionar());
        ro.observe(palco);
        io = new IntersectionObserver(([e]) => cena.pausar(!e.isIntersecting), { rootMargin: '120px' });
        io.observe(palco);
        setModo('3d');
      })
      .catch(() => {
        if (!vivo) return;
        canvas.remove();
        setModo('2d');
      });

    return () => {
      vivo = false;
      ro?.disconnect();
      io?.disconnect();
      cena?.destruir();
      cenaRef.current = null;
      canvas.remove();
    };
  }, [cenario]);

  /* ---------- Etapas ---------- */
  const irPara = useCallback(
    (n, { tocar } = {}) => {
      animRef.current?.pause();
      animRef.current = null;
      const alvo = Math.max(0, Math.min(ETAPAS.length - 1, n));
      setEtapa(alvo);
      const v = valores.current;
      const reduzido = reduzMovimento();
      const atualizar = () => {
        cenaRef.current?.definir({ etapa: alvo, p: v.p });
        if (alvo === 4) setK(Math.min(iter.length - 1, Math.ceil(v.p * (iter.length - 1) - 1e-6)));
      };
      if (reduzido || !tocar) {
        // Sem reprodução (ou com movimento reduzido): a etapa aparece já concluída
        v.p = 1;
        v.h = 1;
        atualizar();
        setTocando(false);
        return;
      }
      v.p = 0;
      v.h = 0;
      atualizar();
      const dur = ETAPAS[alvo].dur;
      animRef.current = animate(v, {
        p: { to: 1, duration: dur, ease: alvo === 4 ? 'inOutSine' : 'linear' },
        h: { to: 1, duration: dur + PAUSA_LEITURA, ease: 'linear' },
        onUpdate: atualizar,
        onComplete: () => {
          if (alvo < ETAPAS.length - 1) irPara(alvo + 1, { tocar: true });
          else setTocando(false);
        }
      });
      setTocando(true);
    },
    [iter.length]
  );

  // Começa sozinha na primeira vez que o laboratório aparece (sem movimento reduzido)
  useEffect(() => {
    const palco = palcoRef.current;
    if (reduzMovimento()) {
      valores.current.p = 1;
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !iniciou.current && modo !== 'carregando') {
          iniciou.current = true;
          irPara(0, { tocar: true });
        }
      },
      { threshold: 0.45 }
    );
    io.observe(palco);
    return () => io.disconnect();
  }, [irPara, modo]);

  useEffect(() => () => animRef.current?.pause(), []);

  const fimVisto = !tocando && etapa === ETAPAS.length - 1 && valores.current.p === 1;
  const alternar = () => {
    iniciou.current = true;
    const a = animRef.current;
    if (reduzMovimento()) passo(1);
    else if (tocando && a) {
      a.pause();
      setTocando(false);
    } else if (a && !a.completed) {
      a.play();
      setTocando(true);
    } else if (fimVisto) irPara(0, { tocar: true });
    else irPara(etapa, { tocar: true });
  };
  function passo(d) {
    iniciou.current = true;
    irPara(etapa + d);
  }
  const reiniciar = () => {
    iniciou.current = true;
    cenaRef.current?.recentrar();
    irPara(0, { tocar: !reduzMovimento() });
  };

  /* ---------- Girar a cena arrastando ---------- */
  const arraste = useRef(null);
  const aoPressionar = e => {
    if (modo !== '3d') return;
    arraste.current = { x: e.clientX, y: e.clientY, toque: e.pointerType === 'touch' };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const aoMover = e => {
    const a = arraste.current;
    if (!a) return;
    cenaRef.current?.girar(e.clientX - a.x, a.toque ? 0 : e.clientY - a.y);
    a.x = e.clientX;
    a.y = e.clientY;
  };
  const aoSoltar = () => (arraste.current = null);

  const atual = ETAPAS[etapa];
  const sol = cenario.solucao;
  const geoK = iter[k] && k > 0 ? ecefParaGeodesicas(iter[k].x) : null;

  return (
    <div className="demo-gps">
      <div className="demo-gps__cabeca">
        <p className="demo-gps__selo">
          <span aria-hidden="true">◆</span> Simulação educativa
        </p>
        <p className="demo-gps__aviso">
          Satélites, tempos e erros demonstrativos, calculados com a matemática real do GPS. Não são dados da telemetria
          do CANIDÉ.
        </p>
      </div>

      <ol className="demo-gps__etapas" aria-label="Etapas da demonstração">
        {ETAPAS.map((e, i) => (
          <li key={e.nome}>
            <button
              type="button"
              className="demo-gps__etapa"
              aria-current={i === etapa ? 'step' : undefined}
              data-feita={i < etapa || undefined}
              onClick={() => {
                iniciou.current = true;
                irPara(i);
              }}
            >
              <span className="numeros">{String(i + 1).padStart(2, '0')}</span>
              <span className="demo-gps__etapa-nome">{e.curta}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="demo-gps__grade">
        <div
          ref={palcoRef}
          className={`demo-gps__palco demo-gps__palco--${modo}`}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
        >
          {modo === '2d' && (
            <div className="demo-gps__alternativa">
              <Trilateracao2D corrigido={etapa >= 4} />
              <p className="nota">Seu navegador não exibe 3D. O esquema em duas dimensões mostra a mesma ideia.</p>
            </div>
          )}
          {modo === 'carregando' && <p className="demo-gps__carregando nota">Carregando a cena 3D…</p>}
          <div className="demo-gps__rotulos" aria-hidden="true">
            {cenario.satelites.map((s, i) => (
              <span key={s.prn} ref={el => (rotulosRef.current[`sat-${i}`] = el)} className={`demo-gps__rotulo demo-gps__rotulo--s${i}`}>
                {s.prn}
              </span>
            ))}
            <span ref={el => (rotulosRef.current.receptor = el)} className="demo-gps__rotulo demo-gps__rotulo--receptor">
              Receptor
            </span>
            <span ref={el => (rotulosRef.current.estimativa = el)} className="demo-gps__rotulo demo-gps__rotulo--estimativa">
              {etapa === 5 ? 'Posição calculada' : `Estimativa ${k}`}
            </span>
          </div>
          {modo === '3d' && <p className="demo-gps__dica nota">Arraste para girar. Satélites fora de escala.</p>}
        </div>

        <div className="demo-gps__painel">
          <p className="demo-gps__passo numeros">
            Etapa {String(etapa + 1).padStart(2, '0')} de {String(ETAPAS.length).padStart(2, '0')}
          </p>
          <h4 className="demo-gps__titulo editorial">{atual.nome}</h4>
          <p className="demo-gps__texto" aria-live="polite">
            {atual.texto}
          </p>

          <div className="demo-gps__valores">
            {etapa === 0 && (
              <table className="tabela-num">
                <caption>Posição de cada satélite no instante de envio (ECEF, km)</caption>
                <thead>
                  <tr>
                    <th scope="col">Satélite</th>
                    <th scope="col">X</th>
                    <th scope="col">Y</th>
                    <th scope="col">Z</th>
                  </tr>
                </thead>
                <tbody>
                  {cenario.satelites.map((s, i) => (
                    <tr key={s.prn}>
                      <th scope="row"><i className={`ponto-sat ponto-sat--s${i}`} />{s.prn}</th>
                      {s.pos.map((c, j) => <td key={j}>{km(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {etapa === 1 && (
              <table className="tabela-num">
                <caption>Tempo GPS da semana, em segundos, e Δt = t<sub>recepção</sub> − t<sub>envio</sub></caption>
                <thead>
                  <tr>
                    <th scope="col">Satélite</th>
                    <th scope="col">t envio</th>
                    <th scope="col">t recepção</th>
                    <th scope="col">Δt (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {cenario.satelites.map((s, i) => (
                    <tr key={s.prn}>
                      <th scope="row"><i className={`ponto-sat ponto-sat--s${i}`} />{s.prn}</th>
                      <td>{num(s.tTx, 6)}</td>
                      <td>{num(s.tRx, 6)}</td>
                      <td>{num(s.Δt * 1000, 6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {etapa === 2 && (
              <table className="tabela-num">
                <caption>ρ = c · Δt, com c = 299 792 458 m/s</caption>
                <thead>
                  <tr>
                    <th scope="col">Satélite</th>
                    <th scope="col">Δt (ms)</th>
                    <th scope="col">ρ (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {cenario.satelites.map((s, i) => (
                    <tr key={s.prn}>
                      <th scope="row"><i className={`ponto-sat ponto-sat--s${i}`} />{s.prn}</th>
                      <td>{num(s.Δt * 1000, 6)}</td>
                      <td>{num(s.pseudo / 1000, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {etapa === 3 && (
              <div className="sistema">
                <p className="sistema__rotulo">Quatro equações, quatro incógnitas</p>
                {cenario.satelites.map((s, i) => (
                  <p key={s.prn} className="sistema__linha formula-linha">
                    <i className={`ponto-sat ponto-sat--s${i}`} />
                    {num(s.pseudo / 1000, 3)} km = ‖(x, y, z) − {s.prn}‖ + c·δt
                  </p>
                ))}
                <p className="nota">
                  Um erro de 1 μs no relógio equivale a cerca de 300 m. Como o erro é o mesmo para todos os satélites, ele
                  vira uma quarta incógnita.
                </p>
              </div>
            )}
            {etapa === 4 && (
              <table className="tabela-num tabela-num--iter">
                <caption>Iterações de Gauss-Newton, a partir do centro da Terra</caption>
                <thead>
                  <tr>
                    <th scope="col">k</th>
                    <th scope="col">Latitude</th>
                    <th scope="col">Longitude</th>
                    <th scope="col">h (km)</th>
                    <th scope="col">c·δt (km)</th>
                    <th scope="col">Correção (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {iter.slice(1).map(it => {
                    const g = ecefParaGeodesicas(it.x);
                    return (
                      <tr key={it.k} aria-current={it.k === k ? 'true' : undefined} data-futuro={it.k > k || undefined}>
                        <th scope="row">{it.k}</th>
                        <td>{num(g.lat, 4)}°</td>
                        <td>{num(g.lon, 4)}°</td>
                        <td>{num(g.h / 1000, 3)}</td>
                        <td>{num(it.b / 1000, 3)}</td>
                        <td>{it.passo >= 1000 ? num(it.passo, 0) : it.passo >= 0.01 ? num(it.passo, 3) : '< 0,01'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {etapa === 5 && (
              <dl className="resultado">
                <div>
                  <dt>ECEF (m)</dt>
                  <dd className="numeros">
                    X {num(sol.x[0], 1)}
                    <br />Y {num(sol.x[1], 1)}
                    <br />Z {num(sol.x[2], 1)}
                  </dd>
                </div>
                <div>
                  <dt>Geodésicas · WGS 84</dt>
                  <dd className="numeros">
                    φ {grau(cenario.geo.lat, 'N', 'S')}
                    <br />λ {grau(cenario.geo.lon, 'L', 'O')}
                    <br />h {num(cenario.geo.h, 1)} m (elipsoidal)
                  </dd>
                </div>
                <div>
                  <dt>Relógio do receptor</dt>
                  <dd className="numeros">
                    δt estimado {num((sol.b / C) * 1000, 6)} ms
                    <br />simulado {num(cenario.δt * 1000, 6)} ms
                  </dd>
                </div>
                <div>
                  <dt>Qualidade</dt>
                  <dd className="numeros">
                    PDOP {num(cenario.dop.pdop, 2)} · HDOP {num(cenario.dop.hdop, 2)}
                    <br />
                    {num(cenario.erro, 1)} m do ponto verdadeiro da simulação
                  </dd>
                </div>
              </dl>
            )}
            {etapa === 4 && geoK && (
              <p className="nota demo-gps__iter" aria-live="off">
                Iteração {k}: {num(geoK.h / 1000, 1)} km acima do elipsoide.
              </p>
            )}
          </div>

          <div className="demo-gps__controles" role="group" aria-label="Controles da demonstração">
            <button type="button" className="controle" onClick={() => passo(-1)} disabled={etapa === 0}>
              <span aria-hidden="true">←</span> Voltar
            </button>
            <button type="button" className="controle controle--principal" onClick={alternar}>
              {tocando ? 'Pausar' : fimVisto ? 'Assistir de novo' : 'Reproduzir'}
            </button>
            <button type="button" className="controle" onClick={() => passo(1)} disabled={etapa === ETAPAS.length - 1}>
              Avançar <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="controle controle--discreto" onClick={reiniciar}>
              Reiniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
