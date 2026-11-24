import { useLayoutEffect, useRef } from 'react';
import { asset } from '../lib/asset.js';
import { animate, onScroll, reduzMovimento, stagger, svg, useEntrada, utils } from '../lib/movimento.js';
import './Identidade.css';

// Proporção de uso das cores, do Manual de identidade (Edição 01).
const CORES = [
  { nome: 'Azul', hex: '#0367A6', parte: 55 },
  { nome: 'Turquesa', hex: '#04ADBF', parte: 15 },
  { nome: 'Amarelo', hex: '#F29F05', parte: 15 },
  { nome: 'Verde-oliva', hex: '#5F7009', parte: 10 },
  { nome: 'Laranja', hex: '#F28705', parte: 5 }
];

// Anotações sobre o símbolo, em coordenadas do viewBox 837 338 164 164 do 05-simbolo.svg.
const NOTAS = [
  { id: 'olho', texto: 'Olho', ponto: [904, 387], rotulo: [1040, 360] },
  { id: 'arcos', texto: 'Arcos da face', ponto: [872, 404], rotulo: [1040, 420] },
  { id: 'bico', texto: 'Bico em espaço negativo', ponto: [932, 458], rotulo: [1040, 480] }
];

export default function Identidade() {
  const ref = useRef(null);
  const notasRef = useRef(null);
  useEntrada(ref);

  // As linhas de chamada se desenham quando o símbolo entra na tela.
  useLayoutEffect(() => {
    if (reduzMovimento()) return undefined;
    const linhas = svg.createDrawable(notasRef.current.querySelectorAll('.notas__linha'));
    const textos = notasRef.current.querySelectorAll('.notas__texto, .notas__ponto');
    utils.set(linhas, { draw: '0 0' });
    utils.set(textos, { opacity: 0 });
    const gatilho = () => onScroll({ target: notasRef.current, enter: 'bottom-=25% top', repeat: false });
    const a = animate(linhas, { draw: ['0 0', '0 1'], duration: 900, ease: 'inOutQuad', delay: stagger(140), autoplay: gatilho() });
    const b = animate(textos, { opacity: [0, 1], duration: 500, delay: stagger(90, { start: 500 }), autoplay: gatilho() });
    return () => {
      a.revert();
      b.revert();
    };
  }, []);

  return (
    <section id="identidade" ref={ref} className="identidade secao" aria-labelledby="identidade-titulo">
      <div className="moldura identidade__grade">
        <div className="identidade__texto" data-grupo>
          <p className="rotulo" data-entra>
            <span className="rotulo__num">01</span> Identidade
          </p>
          <h2 id="identidade-titulo" className="titulo" data-titulo>
            O nome é uma ave.
          </h2>
          <p className="enunciado" data-entra>
            CANIDÉ vem da arara-canindé, Ara ararauna. O D da assinatura guarda a face da ave: o olho, os arcos riscados e
            o bico recortado em branco.
          </p>
        </div>

        <figure className="identidade__simbolo" data-grupo>
          <svg ref={notasRef} className="notas" viewBox="820 320 400 200" role="img" aria-labelledby="simbolo-desc">
            <desc id="simbolo-desc">Símbolo CANIDÉ com três anotações: olho, arcos da face e bico em espaço negativo.</desc>
            <image href={asset('brand/05-simbolo.svg')} x="837" y="338" width="164" height="164" />
            {NOTAS.map(n => (
              <g key={n.id}>
                <circle className="notas__ponto" cx={n.ponto[0]} cy={n.ponto[1]} r="2.4" />
                <path className="notas__linha" d={`M${n.ponto[0]},${n.ponto[1]} L${n.rotulo[0] - 70},${n.rotulo[1]} L${n.rotulo[0] - 6},${n.rotulo[1]}`} />
                <text className="notas__texto" x={n.rotulo[0]} y={n.rotulo[1] + 3.5}>
                  {n.texto}
                </text>
              </g>
            ))}
          </svg>
        </figure>

        <figure className="identidade__foto" data-grupo>
          <div className="midia" data-entra>
            <img
              src={asset('media/arara-caninde-retrato-800.webp')}
              width="800"
              height="531"
              loading="lazy"
              alt="Perfil de uma arara-canindé, com a face branca riscada de preto e o bico curvo."
            />
          </div>
          <figcaption className="legenda" data-entra>
            A face riscada que inspirou o D da marca. Foto: Renato Augusto Martins.
          </figcaption>
        </figure>

        <div className="identidade__cores" data-grupo>
          <p className="rotulo" data-entra>
            Proporção de cor
          </p>
          <ol className="cores" data-entra>
            {CORES.map(c => (
              <li key={c.hex} style={{ '--cor': c.hex, flexGrow: c.parte }}>
                <span className="cores__faixa" aria-hidden="true" />
                <span className="cores__nome">{c.nome}</span>
                <span className="cores__dados numeros">
                  {c.hex} · {c.parte}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
