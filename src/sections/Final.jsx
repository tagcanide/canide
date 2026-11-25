import { useRef } from 'react';
import { SITE } from '../config.js';
import { useEntrada } from '../lib/movimento.js';
import './Final.css';

export default function Final() {
  const ref = useRef(null);
  useEntrada(ref);

  return (
    <section id="contato" ref={ref} className="final secao campo-azul" aria-labelledby="final-titulo">
      <div className="moldura final__grade" data-grupo>
        <div className="final__texto">
          <p className="rotulo" data-entra>
            <span className="rotulo__num">10</span> Conhecer
          </p>
          <h2 id="final-titulo" className="display editorial final__titulo" data-titulo>
            Cabe outro olhar.
          </h2>
          <p className="enunciado" data-entra>
            Uma tag no campo e uma central no computador da equipe para acompanhar a trajetória de quem volta à natureza.
          </p>
          <div className="final__acoes" data-entra>
            <a className="botao final__botao" href="#desmontagem">
              Ver o produto por dentro <span className="botao__seta" aria-hidden="true">↑</span>
            </a>
            {SITE.contactEmail && (
              <a className="botao botao--contorno" href={`mailto:${SITE.contactEmail}?subject=CANIDÉ`}>
                Escrever para a equipe
              </a>
            )}
            {SITE.systemUrl && (
              <a className="botao botao--contorno" href={SITE.systemUrl}>
                Acessar o sistema
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
