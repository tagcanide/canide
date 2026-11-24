import { forwardRef, useId } from 'react';
import { CABECA, CABECA_CENTRO, CONTORNO, CORPO, CORTES, OLHO, VIEWBOX } from '../lib/arara.js';

/**
 * Silhueta azul da arara-canindé em camadas animáveis:
 * .arara__traco (contorno para desenhar), .arara__revelar (círculo da máscara de preenchimento),
 * .arara__corte (cortes brancos da face) e .arara__olho.
 * Sem animação, a silhueta aparece completa (o raio da máscara já cobre o desenho).
 */
const Arara = forwardRef(function Arara({ className = '', titulo = 'Silhueta azul de uma arara-canindé em voo, asas erguidas e cauda longa.' }, ref) {
  const id = useId().replace(/:/g, '');
  return (
    <svg ref={ref} className={`arara ${className}`} viewBox={VIEWBOX} role="img" aria-labelledby={`${id}-t`}>
      <title id={`${id}-t`}>{titulo}</title>
      <defs>
        <clipPath id={`${id}-m`}>
          <circle className="arara__revelar" cx={CABECA_CENTRO[0]} cy={CABECA_CENTRO[1]} r="1900" />
        </clipPath>
      </defs>
      <g className="arara__traco" fill="none" stroke="var(--azul)" strokeWidth="3" strokeLinejoin="round">
        <path d={CORPO} />
        <path d={CABECA} />
      </g>
      <g className="arara__preenchimento" clipPath={`url(#${id}-m)`}>
        <path d={CORPO} fill="var(--azul)" />
        <path d={CONTORNO} fill="none" stroke="var(--papel)" strokeWidth="15" strokeLinejoin="round" strokeLinecap="round" />
        <path d={CABECA} fill="var(--azul)" />
        <g fill="none" stroke="var(--papel)" strokeLinecap="round">
          {CORTES.map(([d, w]) => (
            <path key={d} className="arara__corte" d={d} strokeWidth={w} />
          ))}
        </g>
        <g className="arara__olho">
          <circle cx={OLHO.cx} cy={OLHO.cy} r={OLHO.r} fill="var(--papel)" />
          <circle cx={OLHO.cx} cy={OLHO.cy} r={OLHO.pupila} fill="var(--azul)" />
          <circle cx={OLHO.brilho[0]} cy={OLHO.brilho[1]} r={OLHO.brilho[2]} fill="var(--papel)" />
        </g>
      </g>
    </svg>
  );
});

export default Arara;
