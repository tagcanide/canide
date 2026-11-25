import { useLayoutEffect, useRef } from 'react';
import { animate, onScroll, reduzMovimento, useEntrada, utils } from '../lib/movimento.js';
import './Integracao.css';

// Caminho de uma leitura, conferido no firmware e no gateway (protocolo V3).
const ETAPAS = [
  { nome: 'Tag', detalhe: 'ESP32-C3 · GPS NEO-6M · BME280', texto: 'Lê posição, altitude, satélites, temperatura, pressão e umidade e monta o pacote.' },
  { nome: 'Rádio', detalhe: 'Módulos RF · ESP-NOW · pacote V3 de 84 bytes', texto: 'Cada leitura viaja sem fio até o receptor.' },
  { nome: 'Receptor', detalhe: 'NodeMCU V3 · porta USB', texto: 'Entrega os pacotes ao computador pela porta serial.' },
  { nome: 'Gateway', detalhe: 'CSV local · InfluxDB 2.x', texto: 'Grava cada amostra com o identificador da sessão.' },
  { nome: 'Painel', detalhe: 'Navegador · 127.0.0.1', texto: 'Mostra o tempo real, o histórico e a qualidade dos dados.' }
];

export default function Integracao() {
  const ref = useRef(null);
  const fluxoRef = useRef(null);
  useEntrada(ref);

  // O trilho se preenche com a rolagem e acende cada etapa quando a leitura chega até ela.
  useLayoutEffect(() => {
    const fluxo = fluxoRef.current;
    const nos = [...fluxo.querySelectorAll('.fluxo__etapa')];
    if (reduzMovimento()) {
      fluxo.style.setProperty('--avanco', 1);
      nos.forEach(n => n.classList.add('fluxo__etapa--ativa'));
      return undefined;
    }
    const v = { a: 0 };
    const a = animate(v, {
      a: [0, 1],
      ease: 'linear',
      autoplay: onScroll({ target: fluxo, enter: 'bottom-=10% top', leave: 'center+=10% center', sync: 0.6 }),
      onUpdate: () => {
        fluxo.style.setProperty('--avanco', v.a.toFixed(4));
        nos.forEach((n, i) => n.classList.toggle('fluxo__etapa--ativa', v.a >= i / (nos.length - 1) - 0.02));
      }
    });
    return () => {
      a.revert();
      utils.remove(v);
    };
  }, []);

  return (
    <section id="integracao" ref={ref} className="integracao secao" aria-labelledby="integracao-titulo">
      <div className="moldura integracao__cabeca" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">06</span> Integração
        </p>
        <h2 id="integracao-titulo" className="titulo" data-titulo>
          Do sensor à tela, um caminho só.
        </h2>
        <p className="enunciado" data-entra>
          Cada parte entrega a leitura para a seguinte. O que chega ao painel é o mesmo registro que ficou gravado, com o
          mesmo identificador de sessão.
        </p>
      </div>

      <div className="moldura">
        <div ref={fluxoRef} className="fluxo">
          <span className="fluxo__trilho" aria-hidden="true">
            <span className="fluxo__preenchido" />
          </span>
          <ol className="fluxo__lista" aria-label="Caminho de uma leitura">
          {ETAPAS.map((e, i) => (
            <li key={e.nome} className="fluxo__etapa">
              <span className="fluxo__no" aria-hidden="true" />
              <span className="fluxo__num numeros">{String(i + 1).padStart(2, '0')}</span>
              <p className="fluxo__nome editorial">{e.nome}</p>
              <p className="fluxo__detalhe">{e.detalhe}</p>
              <p className="fluxo__texto">{e.texto}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
