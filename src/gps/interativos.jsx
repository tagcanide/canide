import { useId, useMemo, useRef, useState } from 'react';
import { C, R_MEDIO, dopDoCeu, haversine, pontoCardeal, rumo, vincenty } from '../lib/gnss.js';

// Peças interativas da seção "A matemática que nos localiza". Todas calculam com gnss.js;
// os valores de entrada são demonstrativos e estão identificados como tal na interface.

// Milhares separados por espaço fino (SI), para não confundir com a vírgula decimal
const num = (v, casas = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).replace(/\./g, '\u202f');

/* ---------- 3.1 · Tempo vira distância ---------- */
export function Propagacao() {
  const id = useId();
  const [ms, setMs] = useState(72);
  const ρ = C * (ms / 1000);
  return (
    <div className="calc calc--propagacao">
      <label className="calc__rotulo" htmlFor={id}>
        Tempo de propagação Δt
        <output className="calc__saida numeros" htmlFor={id}>
          {num(ms, 1)} ms
        </output>
      </label>
      <input id={id} type="range" min="64" max="90" step="0.1" value={ms} onChange={e => setMs(Number(e.target.value))} />
      <p className="calc__resultado">
        <span className="calc__igual">ρ = c · Δt =</span>{' '}
        <strong className="editorial numeros">{num(ρ / 1000, 0)} km</strong>
      </p>
      <p className="nota">
        Um erro de apenas 1 μs no tempo medido muda a distância em {num(C * 1e-6, 0)} m. Por isso o GPS depende de relógios
        tão estáveis.
      </p>
    </div>
  );
}

/* ---------- 3.2 · Trilateração no plano ---------- */
const P = { x: 300, y: 236 };
const SAT2D = [
  { x: 92, y: 64 },
  { x: 520, y: 54 },
  { x: 560, y: 330 }
];
const VIES = 46; // erro de relógio comum, em unidades do desenho

export function Trilateracao2D({ corrigido: externo, interativo = false }) {
  const [interno, setInterno] = useState(false);
  const corrigido = externo ?? interno;
  const titulo = useId();
  return (
    <figure className="trila">
      <svg viewBox="0 0 640 420" role="img" aria-labelledby={titulo}>
        <title id={titulo}>
          {corrigido
            ? 'Três círculos de distância que se cruzam num único ponto: a posição do receptor.'
            : 'Três círculos aumentados pelo mesmo erro de relógio: eles não se cruzam num ponto único.'}
        </title>
        {SAT2D.map((s, i) => {
          const r = Math.hypot(s.x - P.x, s.y - P.y) + (corrigido ? 0 : VIES);
          return (
            <g key={i} className={`trila__sat trila__sat--s${i}`}>
              <circle className="trila__circulo" cx={s.x} cy={s.y} r={r} />
              <path className="trila__raio" d={`M${s.x} ${s.y} L${P.x} ${P.y}`} />
              <rect x={s.x - 7} y={s.y - 7} width="14" height="14" />
            </g>
          );
        })}
        <circle className="trila__receptor" cx={P.x} cy={P.y} r="7" />
        {!corrigido && <circle className="trila__duvida" cx={P.x} cy={P.y} r="34" />}
      </svg>
      {interativo && (
        <div className="alternador" role="group" aria-label="Erro do relógio do receptor">
          <button type="button" aria-pressed={!corrigido} onClick={() => setInterno(false)}>
            Com erro de relógio
          </button>
          <button type="button" aria-pressed={corrigido} onClick={() => setInterno(true)}>
            Relógio corrigido
          </button>
        </div>
      )}
      <figcaption className="legenda">
        {corrigido
          ? 'Com δt resolvido, as três distâncias passam pelo mesmo ponto.'
          : 'O mesmo erro c·δt aumenta todas as distâncias: sobra uma região de dúvida, não um ponto.'}{' '}
        Esquema em duas dimensões, fora de escala.
      </figcaption>
    </figure>
  );
}

/* ---------- 3.4 · Haversine e elipsoide ---------- */
const PREDEFINIDOS = [
  { nome: '1° de longitude no equador', p: ['0', '0', '0', '1'] },
  { nome: 'Brasília → São Paulo (centros)', p: ['-15,7939', '-47,8828', '-23,5505', '-46,6333'] },
  { nome: 'Dois pontos a cerca de 100 m', p: ['-15,8000', '-47,8600', '-15,8009', '-47,8600'] }
];
const CAMPOS = [
  { rotulo: 'φ₁ latitude 1', min: -90, max: 90 },
  { rotulo: 'λ₁ longitude 1', min: -180, max: 180 },
  { rotulo: 'φ₂ latitude 2', min: -90, max: 90 },
  { rotulo: 'λ₂ longitude 2', min: -180, max: 180 }
];
// Aceita vírgula ou ponto decimal e espaços (Postel): "-15,79" e "-15.79" valem o mesmo.
const lerNumero = t => {
  const v = Number(String(t).trim().replace(/\s/g, '').replace(',', '.'));
  return t.trim() === '' || !Number.isFinite(v) ? null : v;
};

export function CalculadoraHaversine() {
  const base = useId();
  const [campos, setCampos] = useState(PREDEFINIDOS[1].p);
  const valores = campos.map(lerNumero);
  const erros = valores.map((v, i) => (v === null ? 'Digite um número.' : v < CAMPOS[i].min || v > CAMPOS[i].max ? `Entre ${CAMPOS[i].min} e ${CAMPOS[i].max}.` : null));
  const valido = erros.every(e => !e);
  const r = useMemo(() => {
    if (!valido) return null;
    const [a, b, c, d] = valores;
    const h = haversine(a, b, c, d);
    const v = vincenty(a, b, c, d);
    return { ...h, v, Δφ: ((c - a) * Math.PI) / 180, Δλ: ((d - b) * Math.PI) / 180 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valido, ...valores]);

  const dist = m => (m >= 10000 ? `${num(m / 1000, 3)} km` : `${num(m, 2)} m`);

  return (
    <div className="calc calc--haversine">
      <div className="calc__presets" role="group" aria-label="Exemplos">
        {PREDEFINIDOS.map(p => (
          <button key={p.nome} type="button" className="chip" aria-pressed={campos.join() === p.p.join()} onClick={() => setCampos(p.p)}>
            {p.nome}
          </button>
        ))}
      </div>
      <div className="calc__campos">
        {CAMPOS.map((c, i) => (
          <div key={c.rotulo} className="campo">
            <label htmlFor={`${base}-${i}`}>{c.rotulo} (graus)</label>
            <input
              id={`${base}-${i}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck="false"
              value={campos[i]}
              aria-invalid={!!erros[i]}
              aria-describedby={erros[i] ? `${base}-${i}-erro` : undefined}
              onChange={e => setCampos(cs => cs.map((v, j) => (j === i ? e.target.value : v)))}
            />
            {erros[i] && (
              <span id={`${base}-${i}-erro`} className="campo__erro">
                {erros[i]}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="calc__passos" aria-live="polite">
        {r ? (
          <>
            <p className="formula-linha">
              Δφ = {num(r.Δφ, 6)} rad · Δλ = {num(r.Δλ, 6)} rad
            </p>
            <p className="formula-linha">a = {num(r.a, 10)}</p>
            <p className="formula-linha">
              d = 2R · atan2(√a, √(1 − a)) = <strong>{dist(r.d)}</strong>
            </p>
            <p className="calc__comparacao">
              Sobre o elipsoide WGS 84 (Vincenty): <strong className="numeros">{r.v === null ? 'não convergiu' : dist(r.v)}</strong>
              {r.v ? (
                <span className="nota">
                  {' '}
                  · diferença de {dist(Math.abs(r.d - r.v))} ({num((Math.abs(r.d - r.v) / r.v) * 100, 2)}%)
                </span>
              ) : null}
            </p>
          </>
        ) : (
          <p className="campo__erro">Corrija os campos destacados para calcular.</p>
        )}
      </div>
      <p className="nota">R = {num(R_MEDIO, 1)} m, raio médio da Terra. Coordenadas de exemplo, sem relação com dados do CANIDÉ.</p>
    </div>
  );
}

/* ---------- 3.5 · Velocidade e trajetória ---------- */
// Trajeto demonstrativo: posições a 1 amostra por segundo em torno de um ponto fictício, em metros (leste, norte).
const ORIGEM = { lat: -15.8, lon: -47.86 };
const TRAJETO_M = [
  [0, 0], [1.2, 1.0], [2.6, 2.3], [4.3, 3.2], [6.1, 3.6], [8.2, 3.5], [10.1, 2.9],
  [11.6, 1.7], [12.6, 0.1], [13.4, -1.8], [14.6, -3.4], [16.4, -4.4], [18.6, -4.7]
];
const PARA_GRAUS = ([x, y]) => ({
  lat: ORIGEM.lat + y / 110574,
  lon: ORIGEM.lon + x / (111320 * Math.cos((ORIGEM.lat * Math.PI) / 180))
});

export function Trajetoria() {
  const id = useId();
  const pontos = useMemo(() => TRAJETO_M.map((m, i) => ({ ...PARA_GRAUS(m), m, t: i })), []);
  const [i, setI] = useState(6);
  const a = pontos[i - 1];
  const b = pontos[i];
  const Δs = haversine(a.lat, a.lon, b.lat, b.lon).d;
  const Δt = b.t - a.t;
  const total = pontos.slice(1, i + 1).reduce((s, p, k) => s + haversine(pontos[k].lat, pontos[k].lon, p.lat, p.lon).d, 0);
  const r = rumo(a.lat, a.lon, b.lat, b.lon);

  // Desenho: metros para o quadro 560 × 260
  const esc = 24;
  const px = ([x, y]) => [40 + x * esc, 130 - y * esc];
  const caminho = pontos.map((p, k) => `${k ? 'L' : 'M'}${px(p.m).join(' ')}`).join(' ');
  const [ax, ay] = px(a.m);
  const [bx, by] = px(b.m);

  return (
    <div className="calc calc--trajetoria">
      <svg className="trajeto" viewBox="0 0 560 270" role="img" aria-label={`Trajeto demonstrativo com ${pontos.length} posições; trecho ${i} destacado.`}>
        <path className="trajeto__norte" d="M520 60 V24 M514 32 L520 22 L526 32" />
        <text className="trajeto__n" x="520" y="78" textAnchor="middle">N</text>
        <path className="trajeto__linha" d={caminho} />
        <path className="trajeto__ativo" d={`M${ax} ${ay} L${bx} ${by}`} />
        {pontos.map((p, k) => {
          const [x, y] = px(p.m);
          return <circle key={k} className={`trajeto__ponto ${k === 0 ? 'trajeto__ponto--inicio' : ''} ${k <= i ? 'trajeto__ponto--feito' : ''}`} cx={x} cy={y} r={k === i ? 6 : 4} />;
        })}
        <text className="trajeto__rotulo" x={px(pontos[0].m)[0]} y={px(pontos[0].m)[1] + 22} textAnchor="middle">t₀</text>
        <path className="trajeto__escala" d="M40 258 H88 M40 252 V264 M88 252 V264" />
        <text className="trajeto__rotulo" x="96" y="262">2 m</text>
      </svg>
      <label className="calc__rotulo" htmlFor={id}>
        Trecho entre as amostras
        <output className="calc__saida numeros" htmlFor={id}>
          t{i - 1} → t{i}
        </output>
      </label>
      <input id={id} type="range" min="1" max={pontos.length - 1} step="1" value={i} onChange={e => setI(Number(e.target.value))} />
      <dl className="leituras">
        <div><dt>Δs (Haversine)</dt><dd className="numeros">{num(Δs, 2)} m</dd></div>
        <div><dt>Δt</dt><dd className="numeros">{Δt} s</dd></div>
        <div><dt>v = Δs / Δt</dt><dd className="numeros">{num(Δs / Δt, 2)} m/s</dd></div>
        <div><dt>Rumo</dt><dd className="numeros">{num(r, 0)}° {pontoCardeal(r)}</dd></div>
        <div><dt>Distância acumulada</dt><dd className="numeros">{num(total, 2)} m</dd></div>
        <div><dt>Velocidade média desde t₀</dt><dd className="numeros">{num(total / i, 2)} m/s</dd></div>
      </dl>
      <p className="nota">Trajeto fictício a uma amostra por segundo, criado para a explicação.</p>
    </div>
  );
}

/* ---------- 3.6 · Geometria e DOP ---------- */
const CEUS = {
  espalhados: { nome: 'Espalhados', sats: [{ az: 0, el: 82 }, { az: 20, el: 22 }, { az: 140, el: 28 }, { az: 255, el: 20 }, { az: 300, el: 55 }] },
  agrupados: { nome: 'Agrupados', sats: [{ az: 30, el: 62 }, { az: 52, el: 50 }, { az: 38, el: 75 }, { az: 70, el: 64 }, { az: 18, el: 46 }] },
  encoberto: { nome: 'Céu parcialmente bloqueado', sats: [{ az: 100, el: 30 }, { az: 140, el: 60 }, { az: 170, el: 24 }, { az: 210, el: 48 }, { az: 120, el: 80 }] }
};
const CEU_R = 120;
const polar = ({ az, el }) => {
  const r = ((90 - el) / 90) * CEU_R;
  const a = (az * Math.PI) / 180;
  return [140 + r * Math.sin(a), 140 - r * Math.cos(a)];
};

export function CeuDop() {
  const [chave, setChave] = useState('espalhados');
  const [sats, setSats] = useState(CEUS.espalhados.sats);
  const svgRef = useRef(null);
  const arrastando = useRef(null);
  const d = dopDoCeu(sats);

  const escolher = k => {
    setChave(k);
    setSats(CEUS[k].sats);
  };
  const mover = (i, az, el) => {
    setChave(null);
    setSats(ss => ss.map((s, j) => (j === i ? { az: ((az % 360) + 360) % 360, el: Math.max(5, Math.min(90, el)) } : s)));
  };
  const aoMover = e => {
    const i = arrastando.current;
    if (i === null || !svgRef.current) return;
    const caixa = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - caixa.left) / caixa.width) * 280 - 140;
    const y = ((e.clientY - caixa.top) / caixa.height) * 280 - 140;
    const r = Math.min(CEU_R, Math.hypot(x, y));
    mover(i, (Math.atan2(x, -y) * 180) / Math.PI, 90 - (r / CEU_R) * 90);
  };
  const aoTeclar = (i, e) => {
    const s = sats[i];
    const passos = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] };
    const p = passos[e.key];
    if (!p) return;
    e.preventDefault();
    mover(i, s.az + p[0], s.el + p[1]);
  };

  return (
    <div className="calc calc--dop">
      <div className="calc__presets" role="group" aria-label="Distribuições de exemplo">
        {Object.entries(CEUS).map(([k, c]) => (
          <button key={k} type="button" className="chip" aria-pressed={chave === k} onClick={() => escolher(k)}>
            {c.nome}
          </button>
        ))}
      </div>
      <div className="dop__grade">
        <svg
          ref={svgRef}
          className="ceu"
          viewBox="0 0 280 280"
          role="group"
          aria-label="Céu visto do receptor: o centro é o zênite e a borda é o horizonte. Arraste ou use as setas para mover os satélites."
          onPointerMove={aoMover}
          onPointerUp={() => (arrastando.current = null)}
          onPointerCancel={() => (arrastando.current = null)}
        >
          {[1, 2 / 3, 1 / 3].map(f => (
            <circle key={f} className="ceu__anel" cx="140" cy="140" r={CEU_R * f} />
          ))}
          <path className="ceu__eixo" d="M140 16 V264 M16 140 H264" />
          <text className="ceu__ponto" x="140" y="12" textAnchor="middle">N</text>
          <text className="ceu__ponto" x="272" y="144" textAnchor="middle">L</text>
          <text className="ceu__ponto" x="140" y="278" textAnchor="middle">S</text>
          <text className="ceu__ponto" x="8" y="144" textAnchor="middle">O</text>
          {sats.map((s, i) => {
            const [x, y] = polar(s);
            return (
              <g
                key={i}
                className="ceu__sat"
                tabIndex={0}
                role="slider"
                aria-label={`Satélite ${i + 1}`}
                aria-valuetext={`azimute ${Math.round(s.az)} graus, elevação ${Math.round(s.el)} graus`}
                aria-valuenow={Math.round(s.el)}
                aria-valuemin={5}
                aria-valuemax={90}
                onKeyDown={e => aoTeclar(i, e)}
                onPointerDown={e => {
                  arrastando.current = i;
                  svgRef.current.setPointerCapture(e.pointerId);
                }}
              >
                <circle className="ceu__alvo" cx={x} cy={y} r="22" />
                <circle cx={x} cy={y} r="9" />
                <text x={x} y={y + 4} textAnchor="middle">{i + 1}</text>
              </g>
            );
          })}
        </svg>
        <dl className="leituras leituras--dop" aria-live="polite">
          {d ? (
            <>
              <div><dt>PDOP · posição 3D</dt><dd className="numeros">{num(d.pdop, 2)}</dd></div>
              <div><dt>HDOP · horizontal</dt><dd className="numeros">{num(d.hdop, 2)}</dd></div>
              <div><dt>VDOP · vertical</dt><dd className="numeros">{num(d.vdop, 2)}</dd></div>
              <div><dt>GDOP · com o relógio</dt><dd className="numeros">{num(d.gdop, 2)}</dd></div>
            </>
          ) : (
            <div><dt>Geometria</dt><dd>Degenerada: não há solução estável.</dd></div>
          )}
        </dl>
      </div>
      <p className="nota">
        Incerteza da posição ≈ DOP × incerteza de cada pseudodistância. Quanto menor o DOP, melhor a geometria. Arraste os
        satélites ou use as setas do teclado.
      </p>
    </div>
  );
}
