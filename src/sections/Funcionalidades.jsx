import { useRef } from 'react';
import { asset } from '../lib/asset.js';
import { useEntrada } from '../lib/movimento.js';
import './Funcionalidades.css';

// Módulos confirmados no código do gateway (GATEWAY_PC) e nas capturas do painel.
const MODULOS = [
  {
    id: 'tempo-real',
    titulo: 'Tempo real',
    texto: 'Sessão, fluxo, protocolo e o estado de cada parte: gateway, fonte, pacotes, sensores, CSV e banco. Os gráficos usam uma janela de 60, 120 ou 240 amostras.',
    img: 'painel-visao-geral', w: 1440, h: 1450,
    alt: 'Tela Tempo real do painel CANIDÉ com cartões de sessão e protocolo e o estado do sistema.'
  },
  {
    id: 'plano-de-voo',
    titulo: 'Plano de voo local',
    texto: 'A trajetória aparece em metros a partir da primeira posição válida, sem mapas externos. Sem fix, nenhuma posição é desenhada, e um botão oculta as coordenadas da tela.',
    img: 'painel-plano-de-voo', w: 740, h: 813,
    alt: 'Quadro Plano de voo local aguardando fix de GPS, com bússola e campos de fix, satélites, latitude, longitude e altitude vazios.'
  },
  {
    id: 'atmosfera',
    titulo: 'Atmosfera',
    texto: 'Temperatura, pressão em hPa, umidade relativa e altitude barométrica. Cada canal tem sua curva e uma fita com o valor atual entre o mínimo e o máximo da janela.',
    img: 'painel-atmosfera', w: 1184, h: 834,
    alt: 'Quatro gráficos do sensor BME280: temperatura, pressão, umidade e altitude barométrica.'
  },
  {
    id: 'historico',
    titulo: 'Histórico',
    texto: 'Consulte períodos de até 31 dias, compare duas sessões alinhadas pelo tempo decorrido e exporte os pontos em CSV. A consulta só lê: nenhum dado é alterado.',
    img: 'painel-historico', w: 1440, h: 1300,
    alt: 'Tela Histórico de sessões com seleção de período e variável e a área de comparação entre sessão A e sessão B.'
  },
  {
    id: 'qualidade',
    titulo: 'Qualidade dos dados',
    texto: 'A auditoria lê os registros brutos, sem médias, e aponta lacunas de tempo, sequências duplicadas, puladas ou em retrocesso e campos ausentes ou fora de faixa.',
    img: 'painel-qualidade', w: 1440, h: 1050,
    alt: 'Tela Qualidade dos dados com auditoria de período, índice de integridade, contadores de amostras e lacunas.'
  }
];


export default function Funcionalidades() {
  const ref = useRef(null);
  useEntrada(ref);

  return (
    <section id="funcionalidades" ref={ref} className="funcionalidades secao" aria-labelledby="func-titulo">
      <div className="moldura funcionalidades__cabeca" data-grupo>
        <p className="rotulo" data-entra>
          <span className="rotulo__num">04</span> Funcionalidades
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
          <li key={m.id} className="modulo" data-grupo aria-labelledby={`mod-${m.id}`}>
            <div className="modulo__texto">
              <span className="modulo__num numeros" data-entra>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 id={`mod-${m.id}`} className="subtitulo" data-entra>
                {m.titulo}
              </h3>
              <p data-entra>{m.texto}</p>
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
