// Matemática do posicionamento por satélite usada nas demonstrações educativas do site.
// Funções puras, sem DOM nem Three.js: o mesmo arquivo serve à cena 3D, aos painéis e ao teste em Node.
// Unidades: metros, segundos e radianos, salvo indicação. Ângulos de entrada e saída das funções *Graus em graus.

/** Velocidade da luz no vácuo, valor exato do SI (NIST/CODATA), em m/s. */
export const C = 299792458;

/** Elipsoide WGS 84 (NGA): semieixo maior e achatamento definidos; o resto é derivado. */
export const WGS84 = (() => {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = f * (2 - f);
  return { a, f, b, e2, ep2: e2 / (1 - e2) };
})();

/** Raio médio da Terra (IUGG), o mesmo usado na trajetória online do CANIDÉ (sync-core.js). */
export const R_MEDIO = 6371008.8;

/** Raio aproximado da órbita GPS: cerca de 20 200 km de altitude (GPS.gov) somados ao raio terrestre. */
export const R_ORBITA_GPS = 26560000;

export const rad = g => (g * Math.PI) / 180;
export const graus = r => (r * 180) / Math.PI;

/* ---------- Vetores ---------- */
export const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
export const soma = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
export const escala = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
export const norma = p => Math.hypot(p[0], p[1], p[2]);
export const dist = (p, q) => norma(sub(p, q));

/* ---------- Coordenadas ---------- */

/** Geodésicas (φ, λ em graus; h elipsoidal em m) para cartesianas geocêntricas ECEF (m). */
export function geodesicasParaEcef(latG, lonG, h) {
  const { a, e2 } = WGS84;
  const φ = rad(latG);
  const λ = rad(lonG);
  const Rn = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2); // raio de curvatura do primeiro vertical
  return [
    (Rn + h) * Math.cos(φ) * Math.cos(λ),
    (Rn + h) * Math.cos(φ) * Math.sin(λ),
    (Rn * (1 - e2) + h) * Math.sin(φ)
  ];
}

/** ECEF (m) para geodésicas WGS 84, por iteração em φ até convergir abaixo de 1e-12 rad. */
export function ecefParaGeodesicas([X, Y, Z]) {
  const { a, e2 } = WGS84;
  const p = Math.hypot(X, Y);
  const λ = Math.atan2(Y, X);
  let φ = Math.atan2(Z, p * (1 - e2));
  let h = 0;
  for (let i = 0; i < 20; i++) {
    const Rn = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2);
    h = p / Math.cos(φ) - Rn;
    const novo = Math.atan2(Z, p * (1 - (e2 * Rn) / (Rn + h)));
    const fim = Math.abs(novo - φ) < 1e-12;
    φ = novo;
    if (fim) break;
  }
  return { lat: graus(φ), lon: graus(λ), h };
}

/** Base local Leste-Norte-Cima no ponto (φ, λ): três vetores unitários em ECEF. */
export function baseEnu(latG, lonG) {
  const φ = rad(latG);
  const λ = rad(lonG);
  return {
    e: [-Math.sin(λ), Math.cos(λ), 0],
    n: [-Math.sin(φ) * Math.cos(λ), -Math.sin(φ) * Math.sin(λ), Math.cos(φ)],
    u: [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)]
  };
}

/** Vetor unitário em ECEF para a direção de azimute e elevação (graus) vista do ponto. */
export function direcaoAzEl(latG, lonG, azG, elG) {
  const { e, n, u } = baseEnu(latG, lonG);
  const az = rad(azG);
  const el = rad(elG);
  const ce = Math.cos(el);
  return soma(soma(escala(e, ce * Math.sin(az)), escala(n, ce * Math.cos(az))), escala(u, Math.sin(el)));
}

/* ---------- Distância e rumo na superfície ---------- */

/** Fórmula de Haversine (esfera de raio R). Devolve também os termos intermediários para exibição. */
export function haversine(lat1, lon1, lat2, lon2, R = R_MEDIO) {
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1);
  const Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { a, c, d: R * c };
}

/**
 * Distância geodésica sobre o elipsoide WGS 84 (Vincenty, 1975, problema inverso).
 * Devolve null quando a iteração não converge (pontos quase antípodas).
 */
export function vincenty(lat1, lon1, lat2, lon2) {
  const { a, b, f } = WGS84;
  const L = rad(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(rad(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(rad(lat2)));
  const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
  let λ = L;
  let sσ, cσ, σ, cos2α, cos2σm;
  for (let i = 0; i < 200; i++) {
    const sλ = Math.sin(λ), cλ = Math.cos(λ);
    sσ = Math.hypot(cU2 * sλ, cU1 * sU2 - sU1 * cU2 * cλ);
    if (sσ === 0) return 0; // pontos coincidentes
    cσ = sU1 * sU2 + cU1 * cU2 * cλ;
    σ = Math.atan2(sσ, cσ);
    const sα = (cU1 * cU2 * sλ) / sσ;
    cos2α = 1 - sα * sα;
    cos2σm = cos2α ? cσ - (2 * sU1 * sU2) / cos2α : 0;
    const Cc = (f / 16) * cos2α * (4 + f * (4 - 3 * cos2α));
    const anterior = λ;
    λ = L + (1 - Cc) * f * sα * (σ + Cc * sσ * (cos2σm + Cc * cσ * (-1 + 2 * cos2σm * cos2σm)));
    if (Math.abs(λ - anterior) < 1e-12) {
      const u2 = (cos2α * (a * a - b * b)) / (b * b);
      const A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
      const B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
      const Δσ = B * sσ * (cos2σm + (B / 4) * (cσ * (-1 + 2 * cos2σm * cos2σm) - (B / 6) * cos2σm * (-3 + 4 * sσ * sσ) * (-3 + 4 * cos2σm * cos2σm)));
      return b * A * (σ - Δσ);
    }
  }
  return null;
}

/** Rumo inicial de 1 para 2, em graus a partir do norte, no sentido horário (mesma fórmula da trajetória online). */
export function rumo(lat1, lon1, lat2, lon2) {
  const φ1 = rad(lat1), φ2 = rad(lat2), Δλ = rad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (graus(Math.atan2(y, x)) + 360) % 360;
}

const BUSSOLA = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
export const pontoCardeal = g => BUSSOLA[Math.round(g / 45) % 8];

/* ---------- Álgebra para mínimos quadrados ---------- */

/** Inversa de uma matriz quadrada pequena por Gauss-Jordan com pivotamento parcial. */
export function inversa(M) {
  const n = M.length;
  const A = M.map((linha, i) => [...linha, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-14) return null; // geometria degenerada
    [A[c], A[p]] = [A[p], A[c]];
    const piv = A[c][c];
    for (let j = 0; j < 2 * n; j++) A[c][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const k = A[r][c];
      for (let j = 0; j < 2 * n; j++) A[r][j] -= k * A[c][j];
    }
  }
  return A.map(linha => linha.slice(n));
}

const transposta = M => M[0].map((_, j) => M.map(l => l[j]));
const produto = (A, B) => A.map(l => B[0].map((_, j) => l.reduce((s, v, k) => s + v * B[k][j], 0)));

/**
 * Resolve a posição e o termo de relógio a partir das pseudodistâncias (Gauss-Newton).
 * Incógnitas: x, y, z e b = c·δt, todas em metros. Parte do centro da Terra, como um receptor sem pista inicial.
 * Devolve cada iteração, para que a demonstração mostre a convergência.
 */
export function resolverPosicao(satelites, pseudodistancias, { inicio = [0, 0, 0, 0], tolerancia = 1e-4, maxIter = 12 } = {}) {
  let est = [...inicio];
  const iteracoes = [{ k: 0, x: est.slice(0, 3), b: est[3], passo: null }];
  for (let k = 1; k <= maxIter; k++) {
    const H = [];
    const r = [];
    satelites.forEach((s, i) => {
      const d = dist(est, s);
      const u = escala(sub(est, s), 1 / d);
      H.push([u[0], u[1], u[2], 1]);
      r.push([pseudodistancias[i] - (d + est[3])]);
    });
    const Ht = transposta(H);
    const N = inversa(produto(Ht, H));
    if (!N) return { ok: false, iteracoes };
    const dx = produto(N, produto(Ht, r)).map(l => l[0]);
    est = est.map((v, i) => v + dx[i]);
    const passo = Math.hypot(dx[0], dx[1], dx[2]);
    iteracoes.push({ k, x: est.slice(0, 3), b: est[3], passo });
    if (passo < tolerancia) break;
  }
  return { ok: true, x: est.slice(0, 3), b: est[3], iteracoes };
}

/**
 * Diluição de precisão a partir da geometria receptor-satélites.
 * Q = (HᵀH)⁻¹ com H em coordenadas locais (leste, norte, cima, relógio).
 */
export function dop(receptor, satelites) {
  const g = ecefParaGeodesicas(receptor);
  const { e, n, u } = baseEnu(g.lat, g.lon);
  const ponto = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const H = satelites.map(s => {
    const l = escala(sub(s, receptor), 1 / dist(s, receptor));
    return [-ponto(l, e), -ponto(l, n), -ponto(l, u), 1];
  });
  const Q = inversa(produto(transposta(H), H));
  if (!Q) return null;
  return {
    gdop: Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2] + Q[3][3]),
    pdop: Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2]),
    hdop: Math.sqrt(Q[0][0] + Q[1][1]),
    vdop: Math.sqrt(Q[2][2]),
    tdop: Math.sqrt(Q[3][3])
  };
}

/** DOP direto de uma lista de { az, el } em graus (céu visto do receptor). */
export function dopDoCeu(lista) {
  const H = lista.map(({ az, el }) => {
    const a = rad(az), h = rad(el);
    return [-Math.cos(h) * Math.sin(a), -Math.cos(h) * Math.cos(a), -Math.sin(h), 1];
  });
  if (H.length < 4) return null;
  const Q = inversa(produto(transposta(H), H));
  if (!Q) return null;
  return {
    gdop: Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2] + Q[3][3]),
    pdop: Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2]),
    hdop: Math.sqrt(Q[0][0] + Q[1][1]),
    vdop: Math.sqrt(Q[2][2])
  };
}

/* ---------- Cenário da simulação educativa ---------- */

/**
 * Monta um cenário demonstrativo coerente: satélites em órbita de ~26 560 km de raio, vistos de um ponto
 * em Brasília, um erro de relógio do receptor e pequenos erros εᵢ fixos. Nada aqui vem da telemetria do CANIDÉ.
 */
export function criarCenario({
  receptor = { lat: -15.8, lon: -47.86, h: 1100 },
  ceu = [
    { prn: 'G05', az: 35, el: 68 },
    { prn: 'G12', az: 145, el: 38 },
    { prn: 'G19', az: 250, el: 52 },
    { prn: 'G27', az: 320, el: 24 }
  ],
  δt = 0.002, // erro do relógio do receptor, em segundos (2 ms)
  ε = [2.4, -3.1, 1.6, -1.2], // erros não modelados, em metros
  tTransmissao = 345600 // instante de transmissão no tempo GPS da semana, em segundos
} = {}) {
  const r = geodesicasParaEcef(receptor.lat, receptor.lon, receptor.h);
  const satelites = ceu.map((s, i) => {
    const u = direcaoAzEl(receptor.lat, receptor.lon, s.az, s.el);
    // |r + t·u| = R_ORBITA: raiz positiva da equação do segundo grau
    const ru = r[0] * u[0] + r[1] * u[1] + r[2] * u[2];
    const t = -ru + Math.sqrt(ru * ru - (norma(r) ** 2 - R_ORBITA_GPS ** 2));
    const pos = soma(r, escala(u, t));
    const geometrica = dist(pos, r);
    const pseudo = geometrica + C * δt + (ε[i] ?? 0);
    return {
      ...s,
      pos,
      geometrica,
      pseudo,
      Δt: pseudo / C,
      tTx: tTransmissao,
      tRx: tTransmissao + pseudo / C
    };
  });
  const solucao = resolverPosicao(satelites.map(s => s.pos), satelites.map(s => s.pseudo));
  const geo = solucao.ok ? ecefParaGeodesicas(solucao.x) : null;
  return {
    receptor,
    receptorEcef: r,
    δt,
    satelites,
    solucao,
    geo,
    erro: solucao.ok ? dist(solucao.x, r) : null,
    dop: dop(r, satelites.map(s => s.pos))
  };
}
