import { useRef } from 'react';
import { useEntrada } from '../lib/movimento.js';
import './Produto.css';

const PARTES = [
  { nome: 'Tag', texto: 'Lê posição, altitude, satélites, temperatura, pressão e umidade.' },
  { nome: 'Receptor', texto: 'Recebe as leituras pelo rádio e as entrega ao computador pela porta USB.' },
  { nome: 'Gateway', texto: 'Grava cada amostra em CSV e no InfluxDB 2.x, com o identificador da sessão.' },
  { nome: 'Painel', texto: 'Mostra no navegador o tempo real, o histórico e a qualidade dos dados.' }
];

export default function Produto() {
  const ref = useRef(null);
  useEntrada(ref);

  return (
    <section id="produto" ref={ref} className="produto secao" aria-labelledby="produto-titulo">
      <div className="moldura produto__grade">
        <div className="produto__texto" data-grupo>
          <p className="rotulo" data-entra>
            <span className="rotulo__num">04</span> O produto
          </p>
          <h2 id="produto-titulo" className="titulo" data-titulo>
            Uma central no computador da equipe.
          </h2>
          <p className="enunciado" data-entra>
            O CANIDÉ é a tag no campo e o sistema que recebe, grava e mostra o que ela mede. O painel roda no próprio
            computador, no endereço local 127.0.0.1.
          </p>
          <ol className="produto__partes">
            {PARTES.map((p, i) => (
              <li key={p.nome} data-entra>
                <span className="numeros">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="produto__parte">{p.nome}</p>
                  <p className="produto__parte-texto">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
