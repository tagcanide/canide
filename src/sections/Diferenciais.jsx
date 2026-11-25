import { useRef } from 'react';
import { useEntrada } from '../lib/movimento.js';
import './Diferenciais.css';

// Garantias confirmadas no gateway (GATEWAY_PC) e o estado atual do projeto.
const REGRAS = [
  { nome: 'Simulação', texto: 'Um modo de simulação gera dados no computador para testar o painel inteiro. A origem simulada fica marcada em cada registro.' },
  { nome: 'Registros abertos', texto: 'Cada amostra vai para um CSV local e para o InfluxDB 2.x. O painel oferece a consulta Flux pronta para copiar.' },
  { nome: 'Privacidade', texto: 'O gateway escuta apenas no próprio computador, o token do banco fica só na memória do processo e as coordenadas podem ser ocultadas.' }
];

const FEITO = [
  'Recepção pelo NodeMCU V3 via USB e modo de simulação, com troca de fonte sem reiniciar',
  'Gráficos do BME280 e do GPS, com trajetória local em metros',
  'Gravação automática em CSV e no InfluxDB 2.x, com identificador de sessão',
  'Auditoria de qualidade dos registros brutos e saúde do gateway ao vivo'
];

const FALTA = [
  'Velocidade GPS: o firmware lê, mas o protocolo V3 ainda não transmite',
  'Acelerômetro, giroscópio e bateria: campos reservados, sem sensores instalados',
  'Estabilidade do enlace ESP-NOW entre a tag e o receptor',
  'Testes de campo com animais, que dependem de critérios éticos para dispositivos em fauna'
];

export default function Diferenciais() {
  const ref = useRef(null);
  useEntrada(ref);

  return (
    <section id="diferenciais" ref={ref} className="diferenciais secao" aria-labelledby="dif-titulo">
      <div className="moldura diferenciais__cabeca" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">06</span> Diferenciais
        </p>
        <h2 id="dif-titulo" className="titulo" data-titulo>
          O que o sistema garante.
        </h2>
        <p className="enunciado" data-entra>
          Dados de campo só servem se forem honestos sobre o que faltou.
        </p>
      </div>

      <div className="moldura regras" data-grupo>
        <dl className="regras__lista">
          {REGRAS.map(r => (
            <div key={r.nome} data-entra>
              <dt>{r.nome}</dt>
              <dd>{r.texto}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div id="estado" className="moldura situacao" data-grupo>
        <h3 className="subtitulo" data-entra>
          Em que ponto o projeto está.
        </h3>
        <div className="situacao__colunas">
          <div data-entra>
            <p className="situacao__titulo situacao__titulo--feito">Funciona hoje</p>
            <ul>
              {FEITO.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div data-entra>
            <p className="situacao__titulo situacao__titulo--falta">Ainda não</p>
            <ul>
              {FALTA.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
