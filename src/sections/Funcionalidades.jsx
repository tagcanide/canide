import { useRef } from 'react';
import { asset } from '../lib/asset.js';
import { useEntrada } from '../lib/movimento.js';
import { PAINEL } from '../data/modulos.js';
import { INFO } from '../bancada/placas/info.js';
import './Funcionalidades.css';

// Telas confirmadas no código do gateway (GATEWAY_PC) e nas capturas do painel: fonte única em data/modulos.js.
const MODULOS = PAINEL;

export default function Funcionalidades() {
  const ref = useRef(null);
  useEntrada(ref);

  return (
    <section id="funcionalidades" ref={ref} className="funcionalidades secao" aria-labelledby="func-titulo">
      <div className="moldura funcionalidades__cabeca" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">05</span> Funcionalidades
        </p>
        <h2 id="func-titulo" className="titulo" data-titulo>
          Uma tela para cada pergunta.
        </h2>
        <p className="enunciado" data-entra>
          Onde está, como está o ambiente, o que já foi gravado e se os dados merecem confiança.
        </p>
      </div>

      <ol className="moldura modulos">
        {MODULOS.map((m, i) => (
          <li key={m.id} id={`modulo-${m.id}`} className="modulo" data-grupo aria-labelledby={`mod-${m.id}`}>
            <div className="modulo__texto">
              <span className="modulo__num numeros" data-entra>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 id={`mod-${m.id}`} className="subtitulo" data-entra>
                {m.titulo}
              </h3>
              <p data-entra>{m.texto}</p>
              {m.origem && (
                <p className="modulo__origem" data-entra>
                  <span className="modulo__origem-rotulo">Dados de</span>{' '}
                  {m.origem.map(id => (
                    <a key={id} href="#desmontagem" data-placa={id}>
                      {INFO[id].nome}
                    </a>
                  ))}
                </p>
              )}
            </div>
            <figure className="modulo__tela" data-entra>
              <img src={asset(`media/${m.img}.webp`)} width={m.w} height={m.h} loading="lazy" decoding="async" alt={m.alt} />
            </figure>
          </li>
        ))}
      </ol>
    </section>
  );
}
