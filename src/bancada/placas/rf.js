// Porte para 3D de rf-modules-exploded.html (raiz do projeto). Medidas em mm, mesmas peças,
// deslocamentos e atrasos do original. Os <polygon> escritos à mão viraram poly3.
import { rectPoly, roundRect, seeded, box, flat, ell, isoText, poly3, trilho, prism, vcyl, rodX, extrudeY, definirPcb } from '../kit.js';
import { INFO } from './info.js';

const COL = {
  pcb: '#151619', gold: '#d6ab52', goldD: '#9c7430', silver: '#c9ccd0', tin: '#c4c7ca', silk: '#e4e8ec',
  cap: '#b98d5c', capB: '#4f7fb6', black: '#1d1e21', chip: '#1f2023', rubber: '#2a2b2f', beige: '#efdcc0', sock: '#5d7088'
};
const BT = 1.0;
const rr = (x0, y0, x1, y1, r) => roundRect(x0, y0, x1, y1, r, 5);

function passive(x, y, rot, col) {
  const L = 1.0, W = 0.5, h = 0.4;
  box(x, y, L, W, 0, h, col, rot);
  const r = (rot * Math.PI) / 180;
  for (const sg of [-1, 1]) box(x + Math.cos(r) * sg * 0.4, y + Math.sin(r) * sg * 0.4, 0.2, 0.52, 0, 0.42, COL.silver, rot);
}
const padsRect = (cx, cy, w, d, rot = 0, fill = COL.tin) => flat(rectPoly(cx, cy, w, d, rot), 0.001, fill);

// Circuito integrado com terminais em asa de gaivota (QFP) ou pads inferiores (QFN), nos quatro lados.
function chip(cx, cy, size, h, n, kind, o = {}) {
  const half = size / 2, pitch = (size - 1.2) / (n - 1);
  for (let i = 0; i < n; i++) {
    const t = -half + 0.6 + i * pitch;
    if (kind === 'qfp') {
      const L = 0.9, w = 0.22;
      box(cx + t, cy - half - L / 2, w, L, 0, 0.25, COL.silver); box(cx - half - L / 2, cy + t, L, w, 0, 0.25, COL.silver);
      box(cx + t, cy + half + L / 2, w, L, 0, 0.25, COL.silver); box(cx + half + L / 2, cy + t, L, w, 0, 0.25, COL.silver);
    } else {
      box(cx + t, cy + half - 0.1, 0.24, 0.22, 0, 0.18, COL.silver); box(cx + half - 0.1, cy + t, 0.22, 0.24, 0, 0.18, COL.silver);
      box(cx + t, cy - half + 0.1, 0.24, 0.22, 0, 0.18, COL.silver); box(cx - half + 0.1, cy + t, 0.22, 0.24, 0, 0.18, COL.silver);
    }
  }
  box(cx, cy, size, size, kind === 'qfp' ? 0.1 : 0, h, COL.chip, 0, { top: o.top || '#25262a' });
  ell(cx - half + 0.8, cy - half + 0.8, h + 0.001, 0.22, '#55585d');
  if (o.text) isoText(o.text, cx, cy, h + 0.001, o.ts || 0.55, '#6c6f74', 0, { w: 700 });
}
function chipPads(cx, cy, size, n, kind) {
  const half = size / 2, pitch = (size - 1.2) / (n - 1), off = kind === 'qfp' ? 0.75 : 0.15, L = kind === 'qfp' ? 1.1 : 0.6, k = kind === 'qfp' ? 0 : 0.3;
  for (let i = 0; i < n; i++) {
    const t = -half + 0.6 + i * pitch;
    padsRect(cx + t, cy - half - off + k, 0.26, L); padsRect(cx + t, cy + half + off - k, 0.26, L);
    padsRect(cx - half - off + k, cy + t, L, 0.26); padsRect(cx + half + off - k, cy + t, L, 0.26);
  }
  if (kind !== 'qfp') flat(rectPoly(cx, cy, size * 0.55, size * 0.55), 0.002, '#8a8d90');
}
function boardBase(x0, y0, x1, y1, seed, keep) {
  prism(rr(x0, y0, x1, y1, 0.7), -BT, 0, COL.pcb);
  const rnd = seeded(seed);
  const cl = (v, a, b) => Math.min(b, Math.max(a, v));
  for (let i = 0; i < 7; i++) {
    const ax = x0 + 1 + rnd() * (x1 - x0 - 2), ay = y0 + 1 + rnd() * (y1 - y0 - 2), bx = ax + (rnd() - 0.5) * 5, by = ay + (rnd() - 0.5) * 5;
    trilho([[ax, ay], [bx, ay], [bx, by]].map(p => [cl(p[0], x0 + 0.6, x1 - 0.6), cl(p[1], y0 + 0.6, y1 - 0.6)]), 0, 0.3, '#25272c');
  }
  for (let i = 0; i < 10; i++) {
    const x = x0 + 0.8 + rnd() * (x1 - x0 - 1.6), y = y0 + 0.8 + rnd() * (y1 - y0 - 1.6);
    if (keep.some(k => x > k[0] && x < k[2] && y > k[1] && y < k[3])) continue;
    ell(x, y, 0, 0.22, '#6b5230'); ell(x, y, 0.001, 0.1, '#0b0b0c');
  }
  const cols = [COL.cap, COL.cap, COL.capB, '#141416', COL.cap];
  let n = 0;
  for (let i = 0; i < 60 && n < 16; i++) {
    const x = x0 + 1 + rnd() * (x1 - x0 - 2), y = y0 + 1 + rnd() * (y1 - y0 - 2);
    if (keep.some(k => x > k[0] - 0.8 && x < k[2] + 0.8 && y > k[1] - 0.8 && y < k[3] + 0.8)) continue;
    passive(x, y, rnd() < 0.5 ? 0 : 90, cols[n % cols.length]); n++;
  }
}

const B1 = [0, 0, 12, 18], B2 = [16, -4, 27, 7], B3 = [30, -8, 39, 2];
const SOCK1 = [10.0, 2.6], SOCK2 = [25.4, -2.4];
const PADS1 = [1.8, 4.6, 7.4, 10.2];

function placa() {
  definirPcb(COL.pcb);
  boardBase(...B1, 11, [[3, 8.5, 9, 14.5], [2.5, 2, 8.5, 8], [8.5, 1.2, 11.6, 4.2], [0.5, 15, 11.5, 17.8]]);
  PADS1.forEach((x, i) => { flat(rectPoly(x, 16.6, 2.2, 2.2), 0.002, COL.gold); ell(x, 16.6, 0.003, 0.6, '#151515');
    isoText(['RX', 'TX', '5V', 'GND'][i], x, 14.6, 0, 0.8, COL.silk, 0, { w: 700 }); });
  box(3.2, 15.0 - 2.6, 2.0, 1.6, 0, 0.8, COL.silver, 0, { top: 'url(#metal)' });
  boardBase(...B2, 23, [[19, -1.5, 24.5, 4.5], [23.8, -4, 27, -0.8], [16.2, 5.8, 27, 7]]);
  for (const [x, y] of [[16.9, 6.3], [26.6, 6.3], [16.9, -3.3]]) flat(rectPoly(x, y, 1.1, 1.1), 0.002, COL.gold);
  box(17.6, 4.8, 1.8, 1.4, 0, 0.7, COL.silver, 0, { top: 'url(#metal)' });
  boardBase(...B3, 37, [[31, -6.6, 34.8, -2.4], [35, -7.6, 39, -0.4], [30, 0.6, 39, 2]]);
  for (let i = 0; i < 4; i++) { const x = 31.4 + i * 2.1;
    flat(rectPoly(x, 1.3, 1.3, 1.4), 0.002, COL.gold); ell(x, 2.0, 0.003, 0.45, '#0f0f10');
    poly3([[x - 0.6, 2.01, -BT], [x + 0.6, 2.01, -BT], [x + 0.6, 2.01, 0], [x - 0.6, 2.01, 0]], COL.goldD); }
  // soquete de 5 vias (fixo)
  box(37.2, -4.0, 2.6, 6.2, 0, 0.25, COL.silver);
  box(37.2, -4.0, 2.4, 6.0, 0.25, 2.4, COL.sock, 0, { top: '#7286a0' });
  flat(rectPoly(37.0, -4.0, 1.5, 5.2), 2.401, '#2e3846');
  for (let i = 0; i < 5; i++) ell(37.0, -5.6 + i * 0.8, 2.402, 0.14, COL.gold);
  // soquetes U.FL
  for (const [x, y] of [SOCK1, SOCK2]) { box(x, y, 2.6, 2.6, 0, 0.35, COL.gold); vcyl(x, y, 0.35, 0.95, 0.9, '#e2bb63'); ell(x, y, 0.951, 0.35, '#7a5a22'); }
  for (const p of PARTES) p.pads?.();
}

const PARTES = [];
const addPart = o => PARTES.push(o);

// antena, cabo coaxial e plugue U.FL: corrente vertical
function chain(id, sx, sy, L, dPlug, dCable, dAnt, delay, rodL, rodOff) {
  const zPlug0 = 0.95, zPlug1 = 2.0, zc0 = zPlug1, zc1 = zc0 + L, zr = zc1 + 3.4 + 1.6;
  addPart({ id: 'plug' + id, group: 'ufl', x: sx, y: sy, disp: [0, 0, dPlug], delay: delay + 0.12, topZ: 3.0,
    draw: () => { box(sx, sy, 2.7, 2.7, zPlug0, zPlug0 + 0.45, '#d9b35d'); vcyl(sx, sy, zPlug0 + 0.45, zPlug1, 1.0, '#e7c26c'); box(sx + 1.5, sy, 0.9, 1.4, zPlug0, zPlug0 + 0.55, '#cfa955'); } });
  addPart({ id: 'coax' + id, group: 'coax', x: sx, y: sy, disp: [0, 0, dCable], delay: delay + 0.06, topZ: 2 * (zc0 + L * 0.42),
    draw: () => { vcyl(sx, sy, zc0, zc0 + 1.4, 0.75, '#b99a55'); vcyl(sx, sy, zc0 + 1.4, zc1, 0.55, '#232427'); } });
  addPart({ id: 'ant' + id, group: 'ant', x: sx, y: sy, disp: [0, 0, dAnt], delay, topZ: 2 * (zr + 0.6),
    draw: () => {
      vcyl(sx, sy, zc1, zr - 3.6, 0.85, '#2c2d31');
      rodX(sx - rodL / 2 + rodOff, sx + rodL / 2 + rodOff, sy, zr, 0.72, COL.rubber);
      const prof = [[-7, zr + 0.2], [-6.5, zr + 1.15], [-5.8, zr + 1.5], [5.8, zr + 1.5], [6.5, zr + 1.15], [7, zr + 0.2], [6.4, zr - 0.8], [2.6, zr - 2.0], [1.3, zr - 3.0], [1.0, zr - 3.7], [-1.0, zr - 3.7], [-1.3, zr - 3.0], [-2.6, zr - 2.0], [-6.4, zr - 0.8]].map(([u, z]) => [sx + u, z]);
      extrudeY(prof, sy - 1.25, sy + 1.25, COL.rubber);
    } });
}
chain('1', SOCK1[0], SOCK1[1], 25, 4.2, 9.0, 15.5, 0.0, 46, 0);
chain('2', SOCK2[0], SOCK2[1], 15, 3.6, 8.0, 12.0, 0.05, 46, 3);

addPart({ id: 'rf1', x: 5.5, y: 5, disp: [0, 0, 19], delay: 0.22, topZ: 1.2, pads: () => chipPads(5.5, 5, 5, 10, 'qfp'), draw: () => chip(5.5, 5, 5, 1.2, 10, 'qfp', { text: 'SX1280', ts: 0.7 }) });
addPart({ id: 'mcu1', x: 6.0, y: 11.5, disp: [0, 0, 11], delay: 0.28, topZ: 1.2, pads: () => chipPads(6, 11.5, 5, 10, 'qfp'), draw: () => chip(6, 11.5, 5, 1.2, 10, 'qfp', { text: 'MCU', ts: 0.7 }) });
addPart({ id: 'mcu2', x: 21.8, y: 1.5, disp: [0, 0, 12.5], delay: 0.34, topZ: 0.9, pads: () => chipPads(21.8, 1.5, 4, 6, 'qfn'), draw: () => chip(21.8, 1.5, 4, 0.9, 6, 'qfn', { text: 'ESP', ts: 0.6 }) });
addPart({ id: 'mcu3', x: 32.9, y: -4.5, disp: [0, 0, 11.5], delay: 0.4, topZ: 0.85, pads: () => chipPads(32.9, -4.5, 3, 5, 'qfn'), draw: () => chip(32.9, -4.5, 3, 0.85, 5, 'qfn') });

addPart({ id: 'hdr', x: 37.0, y: -4.0, disp: [0, 0, 6.0], delay: 0.46, topZ: 2 * (2.4 + 0.8),
  draw: () => { box(37.0, -4.0, 1.5, 5.2, 1.2, 3.6, COL.beige, 0, { top: '#f4e7d1' });
    for (let i = 0; i < 5; i++) box(37.0, -5.6 + i * 0.8, 0.3, 0.3, 3.6, 4.2, COL.gold);
    box(37.85, -4.0, 0.3, 4.4, 2.0, 3.4, '#e6d2b2'); } });

export default {
  ...INFO['modulos-rf'],
  centro: [19.5, 3, 10],
  placa,
  partes: PARTES
};
