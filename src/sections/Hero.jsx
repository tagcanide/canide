import { useLayoutEffect, useRef } from 'react';
import Arara from '../components/Arara.jsx';
import { CABECA_CENTRO, OLHO, VIEWBOX } from '../lib/arara.js';
import { animate, createTimeline, onScroll, reduzMovimento, revelarLinhas, stagger, svg, utils } from '../lib/movimento.js';
import { asset } from '../lib/asset.js';
import './Hero.css';

const FICHA = [
  ['Tipo', 'Tag GPS e central de telemetria'],
  ['Sensores', 'GPS e BME280'],
  ['Origem', 'CED 04, Taguatinga, DF'],
  ['Estado', 'Protótipo em teste']
];

// Régua inferior: marcas a cada 100 unidades do desenho, maiores a cada 400.
const MARCAS = Array.from({ length: 17 }, (_, i) => i * 100);

export default function Hero() {
  const secaoRef = useRef(null);
  const araraRef = useRef(null);
  const caixaRef = useRef(null);
  const construcaoRef = useRef(null);
  const marcaRef = useRef(null);
  const fraseRef = useRef(null);
  const apoioRef = useRef(null);

  useLayoutEffect(() => {
    if (reduzMovimento()) return undefined;
    const arara = araraRef.current;
    const linhas = construcaoRef.current.querySelectorAll('.construcao__linha');
    const rotulos = construcaoRef.current.querySelectorAll('.construcao__rotulo');
    const tracos = svg.createDrawable(arara.querySelectorAll('.arara__traco path'));
    const cortes = svg.createDrawable(arara.querySelectorAll('.arara__corte'));
    const desenhoLinhas = svg.createDrawable(linhas);
    const revelar = arara.querySelector('.arara__revelar');
    const olho = arara.querySelector('.arara__olho');
    const desktop = window.matchMedia('(min-width: 900px)').matches;

    // A arara nasce no centro da tela e, já preenchida, desliza para o seu lugar na composição.
    const caixa = caixaRef.current.getBoundingClientRect();
    const deslocamento = desktop ? window.innerWidth / 2 - (caixa.left + caixa.width / 2) : 0;

    utils.set(caixaRef.current, { translateX: deslocamento });
    utils.set(desenhoLinhas, { draw: '0 0' });
    utils.set(tracos, { draw: '0 0' });
    utils.set(cortes, { draw: '0 0' });
    utils.set(revelar, { r: 0 });
    utils.set(olho, { opacity: 0 });
    utils.set(rotulos, { opacity: 0 });
    utils.set(marcaRef.current, { clipPath: 'inset(0 100% 0 0)' });
    utils.set(apoioRef.current.children, { opacity: 0, translateY: 20 });
    fraseRef.current.style.visibility = 'hidden';

    let desfazerFrase = () => {};
    const tl = createTimeline({ defaults: { ease: 'inOutQuad' } })
      .add(desenhoLinhas, { draw: ['0 0', '0 1'], duration: 900, delay: stagger(70) }, 0)
      .add(rotulos, { opacity: [0, 1], duration: 400, delay: stagger(60) }, 400)
      .add(tracos, { draw: ['0 0', '0 1'], duration: 1300, ease: 'inOutSine' }, 250)
      .add(revelar, { r: [0, 1900], duration: 1000, ease: 'inOutCubic' }, 1150)
      .add(arara.querySelector('.arara__traco'), { opacity: [1, 0], duration: 500 }, 1700)
      .add(cortes, { draw: ['0 0', '0 1'], duration: 520, ease: 'outQuad', delay: stagger(60) }, 1800)
      .add(olho, { opacity: [0, 1], duration: 420, ease: 'outQuad' }, 1950)
      .add(caixaRef.current, { translateX: [deslocamento, 0], duration: 1100, ease: 'inOutCubic' }, 2050)
      .add(construcaoRef.current, { opacity: [1, 0.5], duration: 900 }, 2300)
      .add(marcaRef.current, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], duration: 800, ease: 'outExpo' }, 2350)
      .call(() => {
        desfazerFrase = revelarLinhas(fraseRef.current);
      }, 2500)
      .add(apoioRef.current.children, { opacity: [0, 1], translateY: [20, 0], duration: 800, ease: 'outExpo', delay: stagger(80) }, 2750);

    // Depois da abertura: parallax discreto da arara com a rolagem.
    const voo = animate(arara, {
      translateY: [0, -90],
      rotate: [0, -4],
      ease: 'linear',
      autoplay: onScroll({ target: secaoRef.current, enter: 'top top', leave: 'top bottom', sync: 0.5 })
    });

    return () => {
      tl.revert();
      voo.revert();
      desfazerFrase();
      fraseRef.current && (fraseRef.current.style.visibility = '');
    };
  }, []);

  return (
    <section id="inicio" ref={secaoRef} className="hero" aria-labelledby="hero-titulo">
      <div className="moldura hero__grade">
        <div className="hero__texto">
          <h1 id="hero-titulo" className="hero__marca" ref={marcaRef}>
            <img src={asset('brand/02-monocromatica-azul.svg')} alt="CANIDÉ" width="941" height="209" />
          </h1>
          <p ref={fraseRef} className="display hero__frase">
            Rastrear o que volta à natureza.
          </p>
          <div ref={apoioRef} className="hero__apoio">
            <p className="enunciado">
              Uma tag de localização GPS e uma central de telemetria para acompanhar a trajetória e o ambiente de animais
              reintroduzidos.
            </p>
            <div className="hero__acoes">
              <a className="botao" href="#produto">
                Conhecer o produto <span className="botao__seta" aria-hidden="true">→</span>
              </a>
              <a className="botao botao--contorno" href="#identidade">
                A marca
              </a>
            </div>
            <dl className="ficha-tecnica">
              {FICHA.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="hero__arara" ref={caixaRef}>
          <svg ref={construcaoRef} className="construcao" viewBox={VIEWBOX} aria-hidden="true">
            <circle className="construcao__linha" cx="800" cy="900" r="780" />
            <line className="construcao__linha" x1={OLHO.cx} y1="-120" x2={OLHO.cx} y2="1900" />
            <line className="construcao__linha" x1="-120" y1={OLHO.cy} x2="1740" y2={OLHO.cy} />
            <line className="construcao__linha" x1="0" y1="1790" x2="1616" y2="1790" />
            {MARCAS.map(x => (
              <line key={x} className="construcao__linha" x1={x} y1="1790" x2={x} y2={x % 400 === 0 ? 1740 : 1762} />
            ))}
            <circle className="construcao__linha" cx={CABECA_CENTRO[0]} cy={CABECA_CENTRO[1]} r="190" />
            <text className="construcao__rotulo" x={OLHO.cx + 24} y={OLHO.cy - 230}>
              OLHO · X {OLHO.cx} · Y {OLHO.cy}
            </text>
            <text className="construcao__rotulo" x="1616" y="1720" textAnchor="end">
              ARA ARARAUNA · ARARA-CANINDÉ
            </text>
          </svg>
          <Arara ref={araraRef} className="hero__silhueta" />
        </div>
      </div>
    </section>
  );
}
