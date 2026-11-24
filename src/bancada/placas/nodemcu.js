// Porte para 3D de nodemcu-v3-exploded.html (raiz do projeto). Medidas em mm, mesmas peças,
// deslocamentos e atrasos do original. Os <polygon> escritos à mão viraram poly3/trilho.
import { rectPoly, roundRect, box, flat, ell, cyl, isoText, poly3, trilho, prism, pyramid, definirPcb } from '../kit.js';
import { INFO } from './info.js';

const COL = {
  pcb: '#141517', gold: '#d6ab52', goldD: '#9c7430', silver: '#c9ccd0', tin: '#c4c7ca',
  silk: '#e4e8ec', cap: '#b98d5c', black: '#1d1e21', chip: '#1f2023'
};
const BW = 31, BL = 58, BT = 1.6;
const BOARD = roundRect(0, 0, BW, BL, 2.2, 6);
const PITCH = 2.54, PIN0 = 11.2, NP = 15;
const ROWX = [1.7, 29.3];
const PIN_Y = [...Array(NP)].map((_, i) => PIN0 + i * PITCH);
const LEFT_NAMES = ['A0', 'GND', 'VU', 'S3', 'S2', 'S1', 'SC', 'S0', 'SK', 'GND', '3V3', 'EN', 'RST', 'GND', 'Vin'];
const RIGHT_NAMES = ['D0', 'D1', 'D2', 'D3', 'D4', '3V3', 'GND', 'D5', 'D6', 'D7', 'D8', 'RX', 'TX', 'GND', '3V3'];
const HOLES = [[2.6, 2.6], [28.4, 2.6], [2.6, 55.4], [28.4, 55.4]];

// Constantes da projeção do original, usadas por iso() para resolver os deslocamentos.
const S = 13, C = Math.cos(Math.PI / 6), H = 0.5, CX = 15.5, CY = 29.5;
function iso(x, y, axis, TX, TY, dz) {
  if (axis === 'z') return [0, 0, dz];
  if (axis === 'x') { const dx = TX / (C * S) + (CX - CY) - (x - y); const dzz = ((x + dx + y - (CX + CY)) * H * S - TY) / S; return [dx, 0, dzz]; }
  const dy = x - y - (CX - CY) - TX / (C * S); const dzz = ((x + y + dy - (CX + CY)) * H * S - TY) / S; return [0, dy, dzz];
}

function meander(x0, y0, z, w, h, n) {
  const p = [[x0, y0 + h]]; const step = w / n;
  for (let i = 0; i < n; i++) { const x = x0 + i * step; p.push([x, y0 + h], [x, y0], [x + step * 0.5, y0], [x + step * 0.5, y0 + h]); }
  p.push([x0 + w, y0 + h], [x0 + w + 2.2, y0 + h]);
  trilho(p, z, 0.55, COL.gold);
}
function passive(x, y, rot, z0, kind) {
  const big = kind === '0805', L = big ? 2.0 : 1.6, W = big ? 1.25 : 0.8, h = big ? 0.7 : 0.55, cap = big ? 0.4 : 0.32;
  const res = kind === 'res';
  box(x, y, L, W, z0, z0 + h, res ? '#141416' : COL.cap, rot);
  const r = (rot * Math.PI) / 180, ux = Math.cos(r), uy = Math.sin(r);
  for (const sg of [-1, 1]) box(x + ux * sg * (L / 2 - cap / 2), y + uy * sg * (L / 2 - cap / 2), cap, W * 1.02, z0, z0 + h * 1.02, COL.silver, rot);
  if (res) isoText('103', x, y, z0 + h + 0.001, 0.5, '#d0d0d0', rot, { w: 700 });
}
function sot23(x, y, rot) {
  for (const [u, v] of [[-0.95, 1.1], [0.95, 1.1], [0, -1.1]]) box(x + u, y + v, 0.45, 0.7, 0, 0.3, COL.silver);
  box(x, y, 2.9, 1.5, 0.05, 1.0, '#18191b', rot, { top: '#222327' });
}
function diode(x, y, rot) {
  box(x, y, 3.4, 1.3, 0, 1.2, '#b8402f', rot, { top: 'url(#melf)' });
  const r = (rot * Math.PI) / 180;
  for (const sg of [-1, 1]) box(x + Math.cos(r) * sg * 1.45, y + Math.sin(r) * sg * 1.45, 0.5, 1.36, 0, 1.24, COL.silver, rot);
  box(x + Math.cos(r) * 0.75, y + Math.sin(r) * 0.75, 0.35, 1.33, 0, 1.22, '#1c1c1c', rot);
}
const padsRect = (cx, cy, w, d, rot = 0, fill = COL.tin) => flat(rectPoly(cx, cy, w, d, rot), 0.001, fill);
const goldPad = (cx, cy, w, d, rot = 0) => flat(rectPoly(cx, cy, w, d, rot), 0.002, COL.gold);

function microUSB() {
  const x0 = 10.2, x1 = 17.8, y0 = 52.6, y1 = 58.6, h = 2.7;
  box(14, y0 + 0.6, 8.2, 1.0, 0, 0.4, COL.silver);
  box(14, (y0 + y1) / 2, x1 - x0, y1 - y0, 0, h, '#c6c9cd', 0, { top: 'url(#metal)' });
  poly3([[x0 + 0.6, y1 + 0.02, 0.5], [x1 - 0.6, y1 + 0.02, 0.5], [x1 - 0.25, y1 + 0.02, h - 0.45], [x0 + 0.25, y1 + 0.02, h - 0.45]], '#151618');
  poly3([[x0 + 2, y1 + 0.05, 1.3], [x1 - 2, y1 + 0.05, 1.3], [x1 - 2, y1 + 0.05, 1.7], [x0 + 2, y1 + 0.05, 1.7]], '#2d2f33');
  flat(rectPoly(12.0, 54.2, 1.0, 1.8), h + 0.001, '#5c6065'); flat(rectPoly(16.0, 54.2, 1.0, 1.8), h + 0.001, '#5c6065');
  for (const xx of [x0 - 0.2, x1 + 0.2]) box(xx, y0 + 1.6, 0.5, 2.2, 0, 1.4, COL.silver);
}

function placa() {
  definirPcb(COL.pcb);
  prism(BOARD, -BT, 0, COL.pcb);
  const tr = [[[6, 14], [8, 16], [8, 26]], [[6.5, 30], [9, 33], [9, 38]], [[16, 36], [16, 44], [18, 46]], [[22, 30], [22, 36], [25, 39], [26, 39]],
    [[4.2, 44], [6, 46], [9, 46]], [[13, 48], [13, 51]], [[18, 50], [20, 52], [20, 53]], [[26, 13], [24, 15]], [[10.4, 30], [10.4, 34]]];
  for (const t of tr) trilho(t, 0, 0.42, '#23252a');
  meander(13.0, 3.2, 0.001, 9.6, 5.2, 4);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0 || i === 1) { ell(15.5 + i * 2.2, 15 + j * 2.6, 0, 0.36, '#7a5b2e'); ell(15.5 + i * 2.2, 15 + j * 2.6, 0.001, 0.18, '#0b0b0c'); }
  for (const [x, y] of HOLES) { ell(x, y, 0, 1.75, COL.gold); ell(x, y, 0.001, 1.35, '#0a0a0b'); }
  for (const x of ROWX) for (const y of PIN_Y) { ell(x, y, 0, 0.95, COL.tin); ell(x, y, 0.001, 0.5, '#0c0c0d'); }
  PIN_Y.forEach((y, i) => { isoText(LEFT_NAMES[i], 4.1, y, 0, 1.05, COL.silk, 0, { anchor: 'start', w: 700 });
    isoText(RIGHT_NAMES[i], 26.9, y, 0, 1.05, COL.silk, 0, { anchor: 'end', w: 700 }); });
  isoText('RST', 6.8, 50.6, 0, 1.05, COL.silk, 0); isoText('IO0', 21.6, 50.6, 0, 1.05, COL.silk, 0);
  for (const [x, y, r] of [[11.6, 2.4, 0], [24.2, 9.6, 90], [6.5, 36, 90], [19.5, 33, 0], [9.5, 44, 0], [24.5, 45, 90], [16.5, 50, 0], [13.3, 46.8, 90], [22.2, 26.8, 0]]) passive(x, y, r, 0, '0603');
  sot23(8.2, 46.8, 0); sot23(11.6, 48.4, 0);
  microUSB();
  for (const p of PARTES) p.pads?.();
}

const PARTES = [];
const addPart = o => PARTES.push(o);
const MOD = { x0: 11, x1: 27, y0: 2.6, y1: 26.6 };

addPart({ id: 'mod', x: 19, y: 14.6, disp: [0.6, -0.6, 14.5], delay: 0.0, topZ: 3.0,
  pads: () => { for (let i = 0; i < 8; i++) { const y = 12.4 + i * 2.0; goldPad(11.6, y, 1.6, 1.0); goldPad(26.4, y, 1.6, 1.0); } for (let i = 0; i < 6; i++) goldPad(14 + i * 2.0, 26.0, 1.0, 1.4); },
  draw: () => {
    prism([[MOD.x0, MOD.y0], [MOD.x1, MOD.y0], [MOD.x1, MOD.y1], [MOD.x0, MOD.y1]], 0, 0.9, '#17181a', { top: '#1c1d20' });
    for (let i = 0; i < 8; i++) { const y = 12.4 + i * 2.0;
      poly3([[27.01, y - 0.5, 0], [27.01, y + 0.5, 0], [27.01, y + 0.5, 0.9], [27.01, y - 0.5, 0.9]], COL.goldD);
      poly3([[10.99, y - 0.5, 0], [10.99, y + 0.5, 0], [10.99, y + 0.5, 0.9], [10.99, y - 0.5, 0.9]], COL.goldD);
      flat(rectPoly(11.6, y, 1.2, 0.9), 0.901, COL.gold); flat(rectPoly(26.4, y, 1.2, 0.9), 0.901, COL.gold);
      ell(11.25, y, 0.903, 0.25, '#3a2c12'); ell(26.75, y, 0.903, 0.25, '#3a2c12'); }
    for (let i = 0; i < 6; i++) { const x = 14 + i * 2.0;
      poly3([[x - 0.5, 26.61, 0], [x + 0.5, 26.61, 0], [x + 0.5, 26.61, 0.9], [x - 0.5, 26.61, 0.9]], COL.goldD); flat(rectPoly(x, 26.0, 0.9, 1.2), 0.901, COL.gold); }
    meander(13.0, 3.2, 0.902, 9.6, 5.2, 4);
    box(19, 19.0, 12.6, 14.6, 0.9, 1.15, '#b4b7bb');
    box(19, 19.0, 12.2, 14.2, 1.15, 3.0, '#c9ccd0', 0, { top: 'url(#metal)' });
    isoText('ESP8266MOD', 19, 16.4, 3.001, 1.25, '#7c8085', 0, { w: 700, ls: 0.05 });
    isoText('Wi-Fi  802.11 b/g/n', 19, 18.6, 3.001, 0.85, '#81858a', 0, { w: 700 });
    isoText('ISM 2.4GHz · FCC', 19, 20.4, 3.001, 0.7, '#878b90', 0, { w: 700 });
    flat(rectPoly(16.0, 23.6, 2.6, 1.8), 3.001, 'none', { stroke: '#8f9398' });
    ell(23.4, 23.6, 3.001, 0.9, 'none', 'stroke="#8f9398" stroke-width="1"');
  } });

addPart({ id: 'ch', x: 12.5, y: 41, disp: iso(12.5, 41, 'x', -330, -330), delay: 0.08, topZ: 1.6,
  pads: () => { for (let i = 0; i < 8; i++) { const x = 12.5 - 4.445 + i * 1.27; padsRect(x, 38.3, 0.65, 1.6); padsRect(x, 43.7, 0.65, 1.6); } },
  draw: () => {
    for (let i = 0; i < 8; i++) { const x = 12.5 - 4.445 + i * 1.27;
      box(x, 38.4, 0.42, 1.2, 0, 0.25, COL.silver); box(x, 39.2, 0.42, 0.5, 0.25, 0.75, COL.silver);
      box(x, 43.6, 0.42, 1.2, 0, 0.25, COL.silver); box(x, 42.8, 0.42, 0.5, 0.25, 0.75, COL.silver); }
    box(12.5, 41, 9.9, 3.9, 0.15, 1.6, COL.chip, 0, { top: '#232428' });
    ell(8.4, 39.9, 1.601, 0.35, '#3a3c40');
    isoText('CH340C', 12.5, 40.6, 1.601, 1.05, '#9a9ea4', 0, { w: 700 }); isoText('2104 · WCH', 12.5, 41.9, 1.601, 0.7, '#80848a', 0, { w: 700 });
  } });

addPart({ id: 'reg', x: 14.2, y: 30.4, disp: iso(14.2, 30.4, 'y', -470, -175), delay: 0.16, topZ: 1.6,
  pads: () => { [-2.3, 0, 2.3].forEach(v => padsRect(11.1, 30.4 + v, 1.6, 1.0)); padsRect(17.3, 30.4, 1.6, 3.4); },
  draw: () => {
    for (const v of [-2.3, 0, 2.3]) box(11.2, 30.4 + v, 1.4, 0.7, 0, 0.25, COL.silver);
    box(17.2, 30.4, 1.6, 3.1, 0, 0.3, COL.silver, 0, { top: 'url(#metal)' });
    box(14.2, 30.4, 3.6, 6.5, 0.05, 1.6, COL.black, 0, { top: '#222327' });
    isoText('AMS1117', 14.2, 30.4, 1.601, 0.8, '#9a9ea4', 90, { w: 700 }); isoText('3.3', 15.3, 30.4, 1.601, 0.7, '#9a9ea4', 90, { w: 700 });
  } });

function button(cx, cy) {
  for (const [u, v] of [[-2.25, -1.1], [2.25, -1.1], [-2.25, 1.1], [2.25, 1.1]]) box(cx + u, cy + v, 0.6, 0.6, 0, 0.35, COL.silver);
  box(cx, cy, 4.2, 3.2, 0, 0.9, '#1f2023');
  box(cx, cy, 4.2, 3.2, 0.9, 1.25, COL.silver, 0, { top: 'url(#metal)' });
  flat(rectPoly(cx, cy, 2.6, 2.1), 1.251, '#b3b6ba');
  cyl(cx, cy, 1.25, 1.8, 0.8, '#25262a');
}
const btnPads = (cx, cy) => [[-2.25, -1.1], [2.25, -1.1], [-2.25, 1.1], [2.25, 1.1]].forEach(([u, v]) => padsRect(cx + u, cy + v, 1.0, 0.9));
addPart({ id: 'rst', x: 7.0, y: 53.6, disp: iso(7, 53.6, 'y', -640, -10), delay: 0.22, topZ: 1.8, pads: () => btnPads(7, 53.6), draw: () => button(7, 53.6) });
addPart({ id: 'io0', x: 21.6, y: 53.6, disp: iso(21.6, 53.6, 'y', -560, 250), delay: 0.27, topZ: 1.8, pads: () => btnPads(21.6, 53.6), draw: () => button(21.6, 53.6) });

for (const c of [
  { id: 'c1', x: 22.6, y: 31.4, rot: 0, kind: 'tant', disp: iso(22.6, 31.4, 'x', 560, -40), delay: 0.3 },
  { id: 'd1', x: 19.0, y: 46.6, rot: 90, kind: 'diode', disp: iso(19, 46.6, 'x', 610, 30), delay: 0.34 },
  { id: 'd2', x: 24.0, y: 49.8, rot: 0, kind: 'diode', disp: iso(24, 49.8, 'x', 555, 100), delay: 0.38 },
  { id: 'r1', x: 25.0, y: 36.0, rot: 90, kind: 'res', disp: iso(25, 36, 'x', 600, -115), delay: 0.42 },
  { id: 'c2', x: 9.0, y: 28.0, rot: 90, kind: '0805', disp: iso(9, 28, 'x', 635, -45), delay: 0.36 }
]) {
  const largo = c.kind === 'diode' || c.kind === 'tant';
  addPart({ id: c.id, group: 'smd', x: c.x, y: c.y, disp: c.disp, delay: c.delay, topZ: 1.2,
    pads: () => { const r = (c.rot * Math.PI) / 180, o = largo ? 1.5 : 0.85; [-1, 1].forEach(sg => padsRect(c.x + Math.cos(r) * sg * o, c.y + Math.sin(r) * sg * o, 1.0, 1.5, c.rot)); },
    draw: () => {
      if (c.kind === 'diode') return diode(c.x, c.y, c.rot);
      if (c.kind === 'tant') {
        box(c.x, c.y, 3.4, 1.7, 0, 1.5, '#d8b66a', c.rot, { top: '#e2c47c' });
        box(c.x + 1.45, c.y, 0.5, 1.75, 0, 0.6, COL.silver, c.rot); box(c.x - 1.45, c.y, 0.5, 1.75, 0, 0.6, COL.silver, c.rot);
        return flat(rectPoly(c.x - 1.0, c.y, 0.35, 1.7, c.rot), 1.501, '#8a6d2e');
      }
      return passive(c.x, c.y, c.rot, 0, c.kind);
    } });
}

// barras de pinos macho (2 × 15): descem por baixo da placa
for (const [x, lado, disp, delay] of [[ROWX[0], 'L', [-3.0, 3.0, -10.5], 0.1], [ROWX[1], 'R', [4.4, 0, -9.0], 0.05]]) {
  const yc = PIN0 + ((NP - 1) * PITCH) / 2, len = NP * PITCH, zb = -BT - 2.5, zt = -BT;
  addPart({ id: 'hdr' + lado, group: 'hdr', x, y: yc, disp, delay, topZ: -2 * (BT + 1.25),
    draw: () => {
      box(x, yc, 2.5, len, zb, zt - 0.02, '#1b1c1e', 0, { top: '#26272a' });
      for (let i = 0; i < NP; i++) {
        box(x, PIN_Y[i], 0.64, 0.64, zb - 6.0, zb, '#b9bcc0', 0, { top: '#d4d6d9' });
        pyramid(x, PIN_Y[i], zb - 6.0, -0.5);
        box(x, PIN_Y[i], 0.64, 0.64, zb, 1.2, '#b9bcc0', 0, { top: '#e2e4e6' });
      }
    } });
}

export default {
  ...INFO['nodemcu-v3'],
  centro: [15.5, 29.5, -1],
  placa,
  partes: PARTES
};
