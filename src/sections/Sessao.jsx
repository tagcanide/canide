import { useEffect, useId, useMemo, useRef, useState } from 'react';
import sessao from '../data/session.json';
import { useEntrada } from '../lib/movimento.js';
import './Sessao.css';

const [T, TEMP, PRES, UMID, SAT, FIX] = [0, 1, 2, 3, 4, 5];
const LIMITE_LACUNA = 2.5; // segundos, mesmo critério da auditoria do painel

const VARIAVEIS = [
  { id: TEMP, nome: 'Temperatura', unidade: '°C', casas: 1 },
  { id: PRES, nome: 'Pressão', unidade: 'hPa', casas: 1 },
  { id: UMID, nome: 'Umidade', unidade: '%', casas: 0 },
  { id: SAT, nome: 'Satélites', unidade: '', casas: 0 }
];

const ABAS = [
  { id: 'ao-vivo', nome: 'Ao vivo' },
  { id: 'historico', nome: 'Histórico' },
  { id: 'qualidade', nome: 'Qualidade' }
];

const inicio = Date.parse(sessao.start);
const hora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
const numero = (v, casas) =>
  v == null ? 'sem dado' : v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

const duracao = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = Math.round(s % 60);
  return [h && `${h} h`, (h || m) && `${m} min`, `${seg} s`].filter(Boolean).join(' ');
};

function Grafico({ amostras, variavel, atual, lacunas }) {
  const W = 1000;
  const H = 280;
  const valores = amostras.map(a => a[variavel.id]).filter(v => v != null);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;
  const x = i => (i / (amostras.length - 1)) * W;
  const y = v => H - 16 - ((v - min) / faixa) * (H - 40);

  // Uma linha por trecho contínuo: a lacuna fica visível, nada é interpolado.
  const trechos = [];
  let d = '';
  amostras.forEach((a, i) => {
    const v = a[variavel.id];
    const quebra = lacunas.has(i) || v == null;
    if (quebra && d) {
      trechos.push(d);
      d = '';
    }
    if (v != null) d += `${d ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
  });
  if (d) trechos.push(d);

  const vAtual = amostras[atual][variavel.id];

  return (
    <svg className="grafico" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
      aria-label={`${variavel.nome} ao longo da sessão, de ${numero(min, variavel.casas)} a ${numero(max, variavel.casas)} ${variavel.unidade}`}>
      {[...lacunas].map(i => (
        <rect key={i} className="grafico__lacuna" x={x(i) - 3} y="0" width="6" height={H} />
      ))}
      {trechos.map((p, k) => (
        <path key={k} className="grafico__linha" d={p} vectorEffect="non-scaling-stroke" />
      ))}
      <line className="grafico__cursor" x1={x(atual)} x2={x(atual)} y1="0" y2={H} vectorEffect="non-scaling-stroke" />
      {vAtual != null && <circle className="grafico__ponto" cx={x(atual)} cy={y(vAtual)} r="5" />}
    </svg>
  );
}

export default function Sessao() {
  const ref = useRef(null);
  useEntrada(ref);
  const base = useId();
  const amostras = sessao.samples;
  const [aba, setAba] = useState('ao-vivo');
  const [indice, setIndice] = useState(120);
  const [tocando, setTocando] = useState(false);
  const [variavel, setVariavel] = useState(VARIAVEIS[0]);
  const abasRef = useRef([]);

  const lacunas = useMemo(() => {
    const s = new Set();
    amostras.forEach((a, i) => {
      if (i && a[T] - amostras[i - 1][T] > LIMITE_LACUNA) s.add(i);
    });
    return s;
  }, [amostras]);

  const resumo = useMemo(() => {
    const eventos = [...lacunas].map(i => ({
      i,
      de: inicio + amostras[i - 1][T] * 1000,
      ate: inicio + amostras[i][T] * 1000,
      segundos: amostras[i][T] - amostras[i - 1][T]
    }));
    const comFix = amostras.filter(a => a[FIX]).length;
    return { eventos, comFix, maior: Math.max(...eventos.map(e => e.segundos)) };
  }, [amostras, lacunas]);

  useEffect(() => {
    if (!tocando) return undefined;
    const id = setInterval(() => {
      setIndice(i => {
        if (i >= amostras.length - 1) {
          setTocando(false);
          return i;
        }
        return Math.min(i + 3, amostras.length - 1);
      });
    }, 90);
    return () => clearInterval(id);
  }, [tocando, amostras.length]);

  const a = amostras[indice];
  const instante = inicio + a[T] * 1000;
  const depoisDeLacuna = lacunas.has(indice);

  const aoTeclarAba = (e, k) => {
    const n = ABAS.length;
    let alvo = null;
    if (e.key === 'ArrowRight') alvo = (k + 1) % n;
    if (e.key === 'ArrowLeft') alvo = (k - 1 + n) % n;
    if (e.key === 'Home') alvo = 0;
    if (e.key === 'End') alvo = n - 1;
    if (alvo == null) return;
    e.preventDefault();
    setAba(ABAS[alvo].id);
    abasRef.current[alvo]?.focus();
  };

  return (
    <section id="sessao" ref={ref} className="sessao secao campo-azul" aria-labelledby="sessao-titulo">
      <div className="moldura sessao__grade" data-grupo>
        <div className="sessao__texto">
          <p className="rotulo sessao__rotulo" data-entra>
            <span className="rotulo__num">05</span> Funcionalidades · sessão real
          </p>
          <h2 id="sessao-titulo" className="titulo" data-titulo>
            Uma sessão, três leituras.
          </h2>
          <p data-entra>
            Cada vez que o gateway é iniciado, ele cria um identificador de sessão. O mesmo registro aparece ao vivo,
            volta no histórico e passa pela auditoria de qualidade.
          </p>
          <p data-entra>
            Percorra uma sessão real, gravada pelo receptor em 19 de novembro de 2026: {amostras.length} amostras do
            protocolo V3, com sensores BME280 e GPS.
          </p>
          <p className="nota sessao__privacidade" data-entra>
            Latitude, longitude e altitude GPS foram removidas destes dados. Coordenadas exatas são informação
            sensível, e o próprio painel permite ocultá-las.
          </p>
        </div>

        <div className="painel" data-ui data-entra>
          <div className="painel__abas" role="tablist" aria-label="Leituras da sessão">
            {ABAS.map((t, k) => (
              <button
                key={t.id}
                ref={el => (abasRef.current[k] = el)}
                type="button"
                role="tab"
                id={`${base}-aba-${t.id}`}
                aria-selected={aba === t.id}
                aria-controls={`${base}-painel-${t.id}`}
                tabIndex={aba === t.id ? 0 : -1}
                className="painel__aba"
                onClick={() => setAba(t.id)}
                onKeyDown={e => aoTeclarAba(e, k)}
              >
                {t.nome}
              </button>
            ))}
          </div>

          <div className="painel__controle">
            <button
              type="button"
              className="painel__tocar"
              onClick={() => {
                if (indice >= amostras.length - 1) setIndice(0);
                setTocando(v => !v);
              }}
              aria-pressed={tocando}
            >
              {tocando ? 'Pausar' : 'Reproduzir'}
            </button>
            <label className="painel__faixa">
              <span className="painel__rotulo">
                Amostra <span className="numeros">{indice + 1}</span> de {amostras.length} ·{' '}
                <span className="numeros">{hora.format(instante)}</span> (Brasília)
              </span>
              <input
                type="range"
                min="0"
                max={amostras.length - 1}
                value={indice}
                onChange={e => {
                  setTocando(false);
                  setIndice(Number(e.target.value));
                }}
                aria-valuetext={`Amostra ${indice + 1}, ${hora.format(instante)}`}
              />
            </label>
          </div>

          <div
            role="tabpanel"
            id={`${base}-painel-ao-vivo`}
            aria-labelledby={`${base}-aba-ao-vivo`}
            hidden={aba !== 'ao-vivo'}
            className="painel__conteudo"
          >
            <dl className="leituras">
              <div>
                <dt>Temperatura</dt>
                <dd className="numeros">{numero(a[TEMP], 2)} °C</dd>
              </div>
              <div>
                <dt>Pressão</dt>
                <dd className="numeros">{numero(a[PRES], 2)} hPa</dd>
              </div>
              <div>
                <dt>Umidade relativa</dt>
                <dd className="numeros">{numero(a[UMID], 1)} %</dd>
              </div>
              <div>
                <dt>Satélites</dt>
                <dd className="numeros">{numero(a[SAT], 0)}</dd>
              </div>
              <div>
                <dt>Fix GPS</dt>
                <dd>
                  <span className={`estado estado--${a[FIX] ? 'ok' : 'sem'}`}>
                    {a[FIX] ? 'Posição válida' : 'Sem posição'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Intervalo anterior</dt>
                <dd className="numeros">
                  {indice ? duracao(a[T] - amostras[indice - 1][T]) : 'início'}
                  {depoisDeLacuna && <span className="estado estado--alerta">Lacuna</span>}
                </dd>
              </div>
            </dl>
          </div>

          <div
            role="tabpanel"
            id={`${base}-painel-historico`}
            aria-labelledby={`${base}-aba-historico`}
            hidden={aba !== 'historico'}
            className="painel__conteudo"
          >
            <div className="historico__variaveis" role="group" aria-label="Variável do gráfico">
              {VARIAVEIS.map(v => (
                <button
                  key={v.id}
                  type="button"
                  className="chip"
                  aria-pressed={variavel.id === v.id}
                  onClick={() => setVariavel(v)}
                >
                  {v.nome}
                </button>
              ))}
            </div>
            <Grafico amostras={amostras} variavel={variavel} atual={indice} lacunas={lacunas} />
            <p className="nota painel__ajuda">
              Eixo horizontal por amostra. As faixas marcam lacunas de mais de 2,5 s; a maior separa dois trechos da
              sessão por {duracao(resumo.maior)}.
            </p>
          </div>

          <div
            role="tabpanel"
            id={`${base}-painel-qualidade`}
            aria-labelledby={`${base}-aba-qualidade`}
            hidden={aba !== 'qualidade'}
            className="painel__conteudo"
          >
            <dl className="leituras leituras--resumo">
              <div>
                <dt>Amostras observadas</dt>
                <dd className="numeros">{amostras.length}</dd>
              </div>
              <div>
                <dt>Com fix GPS</dt>
                <dd className="numeros">
                  {resumo.comFix} ({Math.round((resumo.comFix / amostras.length) * 100)} %)
                </dd>
              </div>
              <div>
                <dt>Lacunas de tempo</dt>
                <dd className="numeros">{resumo.eventos.length}</dd>
              </div>
              <div>
                <dt>Maior lacuna</dt>
                <dd className="numeros">{duracao(resumo.maior)}</dd>
              </div>
            </dl>
            <table className="eventos">
              <caption className="sr-only">Lacunas temporais detectadas na sessão</caption>
              <thead>
                <tr>
                  <th scope="col">De</th>
                  <th scope="col">Até</th>
                  <th scope="col">Duração</th>
                  <th scope="col">
                    <span className="sr-only">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resumo.eventos.map(e => (
                  <tr key={e.i} aria-current={indice === e.i ? 'true' : undefined}>
                    <td className="numeros">{hora.format(e.de)}</td>
                    <td className="numeros">{hora.format(e.ate)}</td>
                    <td className="numeros">{duracao(e.segundos)}</td>
                    <td>
                      <button
                        type="button"
                        className="eventos__ir"
                        onClick={() => {
                          setTocando(false);
                          setIndice(e.i);
                        }}
                      >
                        Ver amostra
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
