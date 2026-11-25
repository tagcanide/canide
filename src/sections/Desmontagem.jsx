import { useCallback, useEffect, useRef, useState } from 'react';
import { useBancada } from '../bancada/useBancada.js';
import { INFO, ORDEM } from '../bancada/placas/info.js';
import { telasDaPlaca } from '../data/modulos.js';
import { animate, createTimeline, onScroll, reduzMovimento, svg, useEntrada, utils } from '../lib/movimento.js';
import { asset } from '../lib/asset.js';
import './Desmontagem.css';

const ETAPAS = [
  { nome: 'Montada', texto: 'A placa completa, na posição em que as peças são soldadas.' },
  { nome: 'Separação', texto: 'Cada peça sai por uma trajetória própria, numa ordem fixa.' },
  { nome: 'Desmontagem completa', texto: 'Pads, trilhas e vias ficam expostos. As linhas tracejadas ligam cada peça ao ponto onde é soldada.' },
  { nome: 'Exploração', texto: 'Escolha uma peça para ver o nome e a medida no modelo.' },
  { nome: 'Reconstrução', texto: 'As peças voltam exatamente às posições de origem.' }
];
// Início de cada etapa no progresso da rolagem (0 a 1) e o trecho em que as peças podem ser escolhidas.
const LIMITES = [0, 0.12, 0.36, 0.5, 0.78];
const etapaDe = s => LIMITES.reduce((n, l, i) => (s >= l ? i : n), 0);
const INTERATIVA = e => e === 2 || e === 3;

// Câmera em graus (azimute, elevação) e distância relativa ao enquadramento.
const CAMERA = {
  inicio: { p: 0, az: 16, el: 12, dist: 0.8 },
  aberta: { p: 1, az: 40, el: 30, dist: 0.86 },
  orbita: { p: 1, az: 58, el: 34, dist: 0.86 },
  fim: { p: 0, az: 28, el: 20, dist: 0.76 }
};

export default function Desmontagem() {
  const secaoRef = useRef(null);
  const palcoRef = useRef(null);
  const cenaRef = useRef(null);
  const linhaRef = useRef(null);
  const fichaRef = useRef(null);
  const marcadoresRef = useRef(new Map());
  const [placa, setPlaca] = useState(ORDEM[0]);
  const [etapa, setEtapa] = useState(0);
  const [foco, setFoco] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [estatico] = useState(reduzMovimento);
  const [aberta, setAberta] = useState(false); // só no modo sem movimento
  const { api, estado } = useBancada(cenaRef, placa);
  const focoRef = useRef({ id: null, n: 0 });
  const info = INFO[placa];
  const telas = telasDaPlaca(placa);
  useEntrada(secaoRef);

  // Outra parte do site pede uma placa: link "Dados de" no painel ou o roteiro do controle remoto.
  useEffect(() => {
    const pedir = id => INFO[id] && setPlaca(id);
    const aoEvento = e => pedir(e.detail);
    const aoClicar = e => {
      const a = e.target.closest?.('[data-placa]');
      if (a) pedir(a.dataset.placa);
    };
    window.addEventListener('canide:placa', aoEvento);
    document.addEventListener('click', aoClicar);
    return () => {
      window.removeEventListener('canide:placa', aoEvento);
      document.removeEventListener('click', aoClicar);
    };
  }, []);

  const itens = [
    ...Object.entries(info.rotulos).map(([id, r]) => ({ id, ...r })),
    ...info.extras.map(e => ({ id: e.id, nome: e.nome, texto: e.texto }))
  ];
  const selecionado = itens.find(i => i.id === foco);
  const semWebgl = estado === 'sem-webgl';
  const interativa = semWebgl || (estatico ? aberta : INTERATIVA(etapa));

  // Timeline principal: a rolagem do palco controla montagem, abertura, órbita e reconstrução.
  useEffect(() => {
    if (estado !== 'pronta') return undefined;
    const b = api.current;
    const celular = window.matchMedia('(max-width: 767px)').matches;
    b.definir({ desloc: celular ? [0, 0.1] : [0.13, 0] });
    // tela estreita: a câmera recua para a placa caber na largura
    const recuo = celular ? 1.3 : 1;
    if (estatico) {
      const c = aberta ? CAMERA.aberta : CAMERA.inicio;
      b.definir({ ...c, dist: c.dist * recuo, az: 36, el: 28 });
      return undefined;
    }
    const cam = { ...CAMERA.inicio };
    let ultima = -1;
    const tl = createTimeline({
      autoplay: onScroll({ target: palcoRef.current, enter: 'top top', leave: 'bottom bottom', sync: 0.6 }),
      defaults: { ease: 'inOutQuad' },
      onUpdate: self => {
        b.definir({ ...cam, dist: cam.dist * recuo });
        const e = etapaDe(self.progress);
        if (e !== ultima) {
          ultima = e;
          setEtapa(e);
        }
      }
    })
      .add(cam, { p: [0, 1], az: [16, 40], el: [12, 30], dist: [0.8, 0.95], duration: 300, ease: 'inOutCubic' }, 120)
      .add(cam, { az: [40, 58], el: [30, 34], duration: 360, ease: 'linear' }, 420)
      .add(cam, { p: [1, 0], az: [58, 28], el: [34, 20], dist: [0.95, 0.82], duration: 220, ease: 'inOutCubic' }, 780);
    b.definir({ ...cam, dist: cam.dist * recuo });
    return () => {
      tl.revert();
      utils.remove(cam);
    };
  }, [estado, api, estatico, aberta]);

  // Foco numa peça: as demais recuam; a linha indicadora se desenha até a ficha.
  const focar = useCallback(
    id => {
      const b = api.current;
      if (!b) {
        setFoco(id); // sem 3D: só a ficha
        return;
      }
      const f = focoRef.current;
      utils.remove(f);
      if (id) f.id = id;
      setFoco(id);
      animate(f, {
        n: id ? 1 : 0,
        duration: estatico ? 0 : 520,
        ease: 'outExpo',
        onUpdate: () => b.definir({ foco: f.id, nivelFoco: f.n }),
        onComplete: () => {
          if (!id) f.id = null;
        }
      });
    },
    [api, estatico]
  );

  useEffect(() => {
    if (!interativa && foco) focar(null);
  }, [interativa, foco, focar]);

  useEffect(() => {
    setFoco(null);
    focoRef.current = { id: null, n: 0 };
    api.current?.definir({ foco: null, nivelFoco: 0 });
  }, [placa, api]);

  useEffect(() => {
    if (!foco || !linhaRef.current || estatico) return undefined;
    const [d] = svg.createDrawable(linhaRef.current);
    const a = animate(d, { draw: ['0 0', '0 1'], duration: 600, ease: 'outExpo' });
    return () => a.revert();
  }, [foco, estatico]);

  // A cada quadro: marcadores e linha indicadora acompanham as peças na tela.
  useEffect(() => {
    if (estado !== 'pronta') return undefined;
    const b = api.current;
    b.aoQuadro(() => {
      const ancoras = b.ancoras();
      for (const a of ancoras) {
        const el = marcadoresRef.current.get(a.id);
        if (el) el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`;
      }
      const alvo = ancoras.find(a => a.id === focoRef.current.id);
      const ficha = fichaRef.current;
      const linha = linhaRef.current;
      if (alvo && ficha && linha) {
        const r = ficha.getBoundingClientRect();
        const base = cenaRef.current.getBoundingClientRect();
        const fx = r.left - base.left;
        const fy = r.top - base.top + 28;
        const ex = fx - 40;
        linha.setAttribute('d', `M${alvo.x.toFixed(1)},${alvo.y.toFixed(1)} L${ex.toFixed(1)},${fy.toFixed(1)} L${fx.toFixed(1)},${fy.toFixed(1)}`);
      }
    });
    return () => b.aoQuadro(null);
  }, [estado, api]);

  // Ponteiro sobre a cena: peça sob o cursor e clique para focar.
  const coords = e => {
    const r = cenaRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1];
  };
  const aoMover = e => {
    if (!interativa || estado !== 'pronta' || e.pointerType === 'touch') return;
    const id = api.current.pegar(...coords(e));
    if (id !== sobre) setSobre(id);
  };
  const aoClicar = e => {
    if (!interativa || estado !== 'pronta') return;
    const id = api.current.pegar(...coords(e));
    if (id) focar(id === foco ? null : id);
  };

  useEffect(() => {
    if (!foco) return undefined;
    const tecla = e => e.key === 'Escape' && focar(null);
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [foco, focar]);

  return (
    <section id="desmontagem" ref={secaoRef} className="desmontagem" aria-labelledby="desmontagem-titulo" data-placa={placa}>
      <div className="moldura desmontagem__cabeca" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">03</span> O produto · por dentro
        </p>
        <h2 id="desmontagem-titulo" className="titulo" data-titulo>
          Peça por peça.
        </h2>
        <p className="enunciado" data-entra>
          Seis placas eletrônicas modeladas em 3D a partir dos desenhos técnicos do projeto. Role para separar as
          peças, explorar cada uma e montar de novo.
        </p>
        <div className="seletor" role="group" aria-label="Placa exibida" data-entra>
          {ORDEM.map(id => (
            <button key={id} type="button" className="seletor__item" aria-pressed={placa === id} onClick={() => setPlaca(id)}>
              <span className="seletor__nome">{INFO[id].nome}</span>
              <span className="seletor__medida">{INFO[id].medidas}</span>
            </button>
          ))}
        </div>
        {/* espaço reservado: a linha só existe nas placas com função confirmada e não pode empurrar o palco */}
        <div className="papel-area">
          {info.funcao && (
            <p className="papel" aria-live="polite">
              <span className="papel__rotulo">No CANIDÉ</span>
              <span className="papel__texto">{info.funcao}</span>
              {telas.length > 0 && (
                <span className="papel__telas">
                  Aparece no painel em{' '}
                  {telas.map((t, i) => (
                    <span key={t.id}>
                      {i > 0 && ', '}
                      <a href={`#modulo-${t.id}`}>{t.titulo}</a>
                    </span>
                  ))}
                  .
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div
        ref={palcoRef}
        className={`palco palco--${estado} ${estatico ? 'palco--estatico' : ''} ${interativa ? 'palco--interativa' : ''} ${foco ? 'palco--foco' : ''}`}
        data-etapa={etapa}
      >
        <div className="palco__vista">
          <div
            ref={cenaRef}
            className="palco__cena"
            style={{ cursor: interativa && sobre ? 'pointer' : undefined }}
            onPointerMove={aoMover}
            onPointerLeave={() => setSobre(null)}
            onClick={aoClicar}
          >
            {estado === 'sem-webgl' && (
              <img
                className="palco__alternativa"
                src={asset(`desmontagem/${placa}.svg`)}
                alt={`Vista explodida isométrica da placa ${info.nome}, com as peças separadas acima da placa.`}
                width="1800"
                height="1080"
              />
            )}
            <svg className="palco__linhas" aria-hidden="true">
              <path ref={linhaRef} d="M0,0" />
            </svg>
            <div className="palco__marcadores" aria-hidden="true">
              {itens.map((it, i) => (
                <span
                  key={`${placa}-${it.id}`}
                  ref={el => (el ? marcadoresRef.current.set(it.id, el) : marcadoresRef.current.delete(it.id))}
                  className={`marcador ${sobre === it.id ? 'marcador--sobre' : ''} ${foco === it.id ? 'marcador--foco' : ''}`}
                >
                  <span className="marcador__ponto">{String(i + 1).padStart(2, '0')}</span>
                  <span className="marcador__nome">{it.nome}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="palco__painel">
            {estado === 'sem-webgl' ? (
              <div className="palco__etapa">
                <p className="subtitulo">Vista explodida</p>
                <p className="palco__texto">Desenho técnico da placa com as peças separadas. Escolha uma peça para ver o nome e a medida.</p>
              </div>
            ) : estatico ? (
              <div className="palco__alternar" role="group" aria-label="Estado da placa">
                <button type="button" aria-pressed={!aberta} onClick={() => setAberta(false)}>
                  Montada
                </button>
                <button type="button" aria-pressed={aberta} onClick={() => setAberta(true)}>
                  Desmontada
                </button>
              </div>
            ) : (
              <div className="palco__etapa" aria-live="polite">
                <p className="palco__num numeros">
                  {String(etapa + 1).padStart(2, '0')} <span>/ 05</span>
                </p>
                <p className="subtitulo">{ETAPAS[etapa].nome}</p>
                <p className="palco__texto">{ETAPAS[etapa].texto}</p>
              </div>
            )}
            {(interativa || estado === 'sem-webgl') && (
              <ul className="pecas" aria-label={`Peças da placa ${info.nome}`}>
                {itens.map((it, i) => (
                  <li key={it.id}>
                    <button type="button" className="pecas__item" aria-pressed={foco === it.id} onClick={() => focar(foco === it.id ? null : it.id)}>
                      <span className="numeros">{String(i + 1).padStart(2, '0')}</span> {it.nome}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!estatico && estado !== 'sem-webgl' && (
            <ol className="palco__progresso" aria-label="Etapas da desmontagem">
              {ETAPAS.map((e, i) => (
                <li key={e.nome} className={i === etapa ? 'atual' : i < etapa ? 'feita' : ''} aria-current={i === etapa ? 'step' : undefined}>
                  <span className="numeros">{String(i + 1).padStart(2, '0')}</span>
                  <span className="palco__progresso-nome">{e.nome}</span>
                </li>
              ))}
            </ol>
          )}

          <div ref={fichaRef} className="ficha" hidden={!selecionado} role="region" aria-label="Peça selecionada">
            {selecionado && (
              <>
                <p className="rotulo">
                  <span className="rotulo__num">{String(itens.indexOf(selecionado) + 1).padStart(2, '0')}</span> {info.nome}
                </p>
                <p className="subtitulo">{selecionado.nome}</p>
                <p className="ficha__texto">{selecionado.texto}</p>
                <button type="button" className="botao botao--contorno ficha__voltar" onClick={() => focar(null)}>
                  Voltar à visão geral
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
