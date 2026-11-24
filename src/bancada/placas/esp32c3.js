// Porte para 3D de esp32-c3-exploded.html (raiz do projeto). Medidas em mm, mesmas peças,
// deslocamentos e atrasos do original. Os <polygon> escritos à mão viraram poly3/trilho.
import { rectPoly, seeded, box, flat, ell, cyl, isoText, poly3, trilho, extrudeY, prism, definirPcb } from '../kit.js';
import { INFO } from './info.js';

const COL = {
  pcb: '#17181b', gold: '#d4a94e', goldD: '#a67b2c', silver: '#c9ccd0', tin: '#b9bcbf',
  silk: '#d6dde3', red: '#c3191f', ceramic: '#d9cfb6', cap: '#a77c55', black: '#1e1f22', chip: '#202124'
};
const BOARD = [[0, 0], [18, 0], [18, 23.4], [14.6, 23.4], [14.6, 22.4], [3.4, 22.4], [3.4, 23.4], [0, 23.4]];
const PIN_Y = [...Array(8)].map((_, i) => 2.6 + i * 2.62);
const BT = 1.0;

function passive(x, y, rot, z0, kind) {
  const big = kind === '0603', L = big ? 1.6 : 1.0, W = big ? 0.8 : 0.5, h = big ? 0.55 : 0.35, cap = big ? 0.32 : 0.2;
  box(x, y, L, W, z0, z0 + h, kind === 'res' ? '#151517' : COL.cap, rot);
  const r = (rot * Math.PI) / 180, ux = Math.cos(r), uy = Math.sin(r);
  for (const sg of [-1, 1]) box(x + ux * sg * (L / 2 - cap / 2), y + uy * sg * (L / 2 - cap / 2), cap, W * 1.02, z0, z0 + h * 1.02, COL.silver, rot);
  if (kind === 'res') flat(rectPoly(x, y, L * 0.45, W * 0.7, rot), z0 + h + 0.001, '#2c2d31');
  return '';
}
const padsRect = (cx, cy, w, d, rot = 0, fill = COL.tin) => flat(rectPoly(cx, cy, w, d, rot), 0.001, fill);

function button(cx, cy) {
  for (const [u, v] of [[-1.7, -0.75], [1.7, -0.75], [-1.7, 0.75], [1.7, 0.75]]) box(cx + u, cy + v, 0.5, 0.45, 0, 0.3, COL.silver);
  box(cx, cy, 3.0, 2.2, 0, 0.75, '#222326');
  box(cx, cy, 3.0, 2.2, 0.75, 1.0, COL.silver, 0, { top: 'url(#metal)' });
  flat(rectPoly(cx, cy, 1.8, 1.4, 0), 1.001, '#b5b8bc');
  cyl(cx, cy, 1.0, 1.4, 0.58, '#26272a');
}
const btnPads = (cx, cy) => [[-1.7, -0.75], [1.7, -0.75], [-1.7, 0.75], [1.7, 0.75]].forEach(([u, v]) => padsRect(cx + u, cy + v, 0.8, 0.65));

const USB = { x: 9.0, y0: 17.2, y1: 24.6, w: 8.94, h: 3.2, r: 1.45 };
function rr(cx, cz, w, h, r, n = 7) {
  const o = [];
  const q = [[cx + w / 2 - r, cz + h / 2 - r, 0], [cx - w / 2 + r, cz + h / 2 - r, 90], [cx - w / 2 + r, cz - h / 2 + r, 180], [cx + w / 2 - r, cz - h / 2 + r, 270]];
  for (const [x, z, a0] of q) for (let i = 0; i <= n; i++) { const a = ((a0 + (90 * i) / n) * Math.PI) / 180; o.push([x + r * Math.cos(a), z + r * Math.sin(a)]); }
  return o;
}

function placa() {
  definirPcb(COL.pcb, '#1b1c20');
  prism(BOARD, -BT, 0, COL.pcb);
  // pinos castelados: face dourada em x = 18 e dedos dourados nas abas
  for (const y of PIN_Y) {
    poly3([[18.01, y - 0.85, -BT], [18.01, y + 0.85, -BT], [18.01, y + 0.85, 0], [18.01, y - 0.85, 0]], COL.goldD);
    poly3([[18.02, y - 0.45, -BT], [18.02, y + 0.45, -BT], [18.02, y + 0.45, 0], [18.02, y - 0.45, 0]], '#6d5222');
  }
  for (const x0 of [0.5, 14.9]) for (let i = 0; i < 4; i++) { const x = x0 + i * 0.75;
    poly3([[x, 23.41, -BT], [x + 0.42, 23.41, -BT], [x + 0.42, 23.41, 0], [x, 23.41, 0]], COL.gold); }
  // trilhas
  const tr = [[[2.2, 4], [4, 5.8], [6.4, 5.8]], [[2.2, 9.2], [4.2, 9.2], [6, 7.6]], [[16, 4.6], [13.8, 4.6], [12.2, 6.2]], [[16, 12], [14.2, 12], [12.6, 10.6]],
    [[3, 14], [3, 17.6], [5, 19.4]], [[8.9, 12.4], [8.9, 16.4]], [[11, 12], [12.6, 13.6], [12.6, 17]], [[15.4, 17.8], [15.4, 20.4], [16, 21]], [[6.8, 2.2], [8.6, 4.2]]];
  for (const t of tr) trilho(t, 0, 0.32, '#25272c');
  // vias
  const rnd = seeded(7);
  for (let i = 0; i < 34; i++) { const x = 2.6 + rnd() * 12.8, y = 1.4 + rnd() * 15.6; if (Math.hypot(x - 9, y - 8.6) < 3.9) continue;
    ell(x, y, 0, 0.32, '#3a2a1c'); ell(x, y, 0.001, 0.16, '#0d0d0f'); }
  // pads dos pinos castelados
  for (const y of PIN_Y) for (const [x0, x1, hx] of [[0, 1.7, 0.75], [16.3, 18, 17.25]]) {
    flat([[x0, y - 0.85], [x1, y - 0.85], [x1, y + 0.85], [x0, y + 0.85]], 0, COL.gold);
    ell(hx, y, 0.002, 0.5, '#0c0c0d');
  }
  for (const x0 of [0.5, 14.9]) for (let i = 0; i < 4; i++) ell(x0 + 0.2 + i * 0.75, 22.8, 0, 0.17, COL.gold);
  // serigrafia
  isoText('0', 2.8, 1.5, 0, 1.5, COL.silk, 0); isoText('21', 15.4, 2.2, 0, 1.3, COL.silk, 0);
  isoText('RST', 2.5, 13.4, 0, 0.95, COL.silk, 90); isoText('3', 2.55, 15.9, 0, 1.0, COL.silk, 90);
  isoText('G', 2.55, 18.6, 0, 1.0, COL.silk, 90); isoText('5V', 2.55, 21.0, 0, 1.0, COL.silk, 90);
  isoText('BOOT', 14.6, 18.2, 0, 0.95, COL.silk, 90);
  trilho([[4.1, 12.6], [4.1, 15.6], [7.9, 15.6]], 0, 0.06, COL.silk);
  trilho([[13.8, 13.1], [13.8, 16.1], [9.8, 16.1]], 0, 0.06, COL.silk);
  // passivos fixos (não se separam)
  for (const [x, y, r] of [[6.4, 2.4, 0], [8.0, 1.6, 90], [12.8, 12.2, 0], [16.0, 7.6, 90], [16.2, 5.6, 0], [13.4, 5.9, 0], [15.4, 16.4, 90], [15.6, 19.4, 0], [15.9, 21.0, 0], [12.6, 3.6, 90]])
    passive(x, y, r, 0.0, '0402');
  // pads expostos quando as peças sobem
  for (const p of PARTES) p.pads?.();
}

const PARTES = [];
const addPart = o => PARTES.push(o);

addPart({ id: 'ant', x: 11.4, y: 2.0, disp: [0.4, -0.4, 16.5], delay: 0.0, topZ: 1.15,
  pads: () => { padsRect(8.45, 2.0, 1.1, 2.1); padsRect(14.35, 2.0, 1.1, 2.1); },
  draw: () => { box(11.4, 2.0, 4.9, 1.7, 0, 1.05, COL.red, 0, { top: '#cf2128' });
    box(8.5, 2.0, 1.0, 1.75, 0, 1.12, COL.silver); box(14.3, 2.0, 1.0, 1.75, 0, 1.12, COL.silver);
    const rnd = seeded(3); for (let i = 0; i < 14; i++) ell(9.3 + rnd() * 4.2, 1.4 + rnd() * 1.2, 1.051, 0.09, '#8e1015');
    isoText('C3', 11.4, 2.0, 1.051, 1.15, '#ffffff', 0); } });

addPart({ id: 'mcu', x: 9.0, y: 8.6, disp: [0, 0, 11.2], delay: 0.06, topZ: 0.85,
  pads: () => { flat(rectPoly(9, 8.6, 3.4, 3.4, 45), 0.001, '#7f8285');
    for (let i = 0; i < 8; i++) { const t = -1.75 + i * 0.5; for (const [u, v] of [[t, -2.55], [t, 2.55], [-2.55, t], [2.55, t]]) {
      const r = Math.PI / 4, x = 9 + u * Math.cos(r) - v * Math.sin(r), y = 8.6 + u * Math.sin(r) + v * Math.cos(r);
      flat(rectPoly(x, y, Math.abs(u) > 2 ? 0.6 : 0.22, Math.abs(u) > 2 ? 0.22 : 0.6, 45), 0.002, COL.tin); } } },
  draw: () => { box(9, 8.6, 5, 5, 0, 0.85, COL.chip, 45, { top: '#25262a' });
    const r = Math.PI / 4;
    for (let i = 0; i < 8; i++) { const t = -1.75 + i * 0.5;
      for (const [u, v] of [[2.5, t], [t, 2.5], [-2.5, t], [t, -2.5]]) { const x = 9 + u * Math.cos(r) - v * Math.sin(r), y = 8.6 + u * Math.sin(r) + v * Math.cos(r);
        const lado = Math.abs(u) === 2.5; box(x, y, lado ? 0.06 : 0.26, lado ? 0.26 : 0.06, 0, 0.2, COL.silver, 45); } }
    ell(9 + -1.8 * Math.cos(r) - -1.8 * Math.sin(r), 8.6 + -1.8 * Math.sin(r) + -1.8 * Math.cos(r), 0.851, 0.28, '#5b5d61');
    isoText('ESP32-C3', 9, 8.2, 0.851, 0.62, '#6a6c71', 45, { w: 700 }); isoText('FH4', 9, 9.1, 0.851, 0.5, '#5f6166', 45, { w: 700 }); } });

addPart({ id: 'xtal', x: 14.7, y: 9.4, disp: [3.0, -3.0, 9.2], delay: 0.12, topZ: 0.85,
  pads: () => [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]].forEach(([u, v]) => padsRect(14.7 + u, 9.4 + v, 0.9, 0.75)),
  draw: () => { box(14.7, 9.4, 3.3, 2.6, 0, 0.28, COL.ceramic); box(14.7, 9.4, 3.0, 2.3, 0.28, 0.36, COL.gold);
    box(14.7, 9.4, 2.8, 2.1, 0.36, 0.85, COL.silver, 0, { top: 'url(#metal)' });
    isoText('40.000', 14.7, 9.05, 0.851, 0.62, '#55585d', 0, { w: 700 }); isoText('MHZ', 14.7, 9.8, 0.851, 0.5, '#55585d', 0, { w: 700 }); } });

addPart({ id: 'rst', x: 6.0, y: 14.1, disp: [-3.6, 3.0, 7.0], delay: 0.18, topZ: 1.6, pads: () => btnPads(6.0, 14.1), draw: () => button(6.0, 14.1) });
addPart({ id: 'boot', x: 11.7, y: 14.6, disp: [5.4, -2.6, 6.4], delay: 0.24, topZ: 1.6, pads: () => btnPads(11.7, 14.6), draw: () => button(11.7, 14.6) });

addPart({ id: 'reg', x: 14.9, y: 13.0, disp: [4.2, -0.6, 5.4], delay: 0.3, topZ: 1.1,
  pads: () => [[-1.2, -0.95], [-1.2, 0], [-1.2, 0.95], [1.2, -0.95], [1.2, 0.95]].forEach(([u, v]) => padsRect(14.9 + u, 13.0 + v, 0.9, 0.55)),
  draw: () => { for (const [u, v] of [[-1.15, -0.95], [-1.15, 0], [-1.15, 0.95], [1.15, -0.95], [1.15, 0.95]]) box(14.9 + u, 13.0 + v, 0.7, 0.4, 0, 0.3, COL.silver);
    box(14.9, 13.0, 1.65, 2.95, 0.05, 1.1, '#18191b', 0, { top: '#202125' });
    isoText('662K', 14.9, 13.0, 1.101, 0.45, '#6a6c70', 90, { w: 700 }); } });

addPart({ id: 'usb', x: 9.0, y: 20.9, disp: [-2.4, 4.2, 4.6], delay: 0.36, topZ: 3.2,
  pads: () => { for (let i = 0; i < 12; i++) padsRect(5.9 + i * 0.56, 17.9, 0.3, 1.0);
    for (const [x, y] of [[4.42, 18.6], [13.58, 18.6], [4.42, 21.6], [13.58, 21.6]]) { flat(rectPoly(x, y, 0.9, 1.6), 0.002, COL.gold); flat(rectPoly(x, y, 0.4, 1.1), 0.003, '#0c0c0d'); } },
  draw: () => {
    extrudeY(rr(USB.x, USB.h / 2, USB.w, USB.h, USB.r), USB.y0, USB.y1, 'url(#usbBody)');
    flat(rectPoly(7.0, 18.9, 1.4, 0.8), USB.h + 0.001, '#3b3e43'); flat(rectPoly(11.0, 18.9, 1.4, 0.8), USB.h + 0.001, '#3b3e43');
    ell(9.0, 20.6, USB.h + 0.001, 0.42, '#8a8e93'); ell(9.0, 20.6, USB.h + 0.002, 0.25, '#2a2c2f');
    // abertura frontal (+y)
    poly3(rr(USB.x, USB.h / 2, USB.w - 0.7, USB.h - 0.7, USB.r - 0.35).map(([x, z]) => [x, USB.y1 + 0.02, z]), '#141517');
    poly3(rr(USB.x, USB.h / 2, 5.6, 0.7, 0.2, 3).map(([x, z]) => [x, USB.y1 - 0.3 + 0.35, z]), '#2d2f33');
    for (let i = 0; i < 12; i++) { const x = 6.45 + i * 0.39;
      poly3([[x, USB.y1 + 0.06, USB.h / 2 + 0.1], [x + 0.2, USB.y1 + 0.06, USB.h / 2 + 0.1], [x + 0.2, USB.y1 + 0.06, USB.h / 2 + 0.33], [x, USB.y1 + 0.06, USB.h / 2 + 0.33]], COL.gold); }
  } });

for (const c of [
  { id: 'c1', x: 4.8, y: 4.4, rot: 90, kind: '0603', disp: [-3.4, 1.4, 8.4], delay: 0.4 },
  { id: 'r1', x: 6.6, y: 6.8, rot: 0, kind: 'res', disp: [-3.0, 2.4, 10.6], delay: 0.43 },
  { id: 'c4', x: 3.0, y: 8.8, rot: 90, kind: '0603', disp: [-3.2, 2.0, 6.2], delay: 0.46 },
  { id: 'led', x: 5.0, y: 11.3, rot: 0, kind: 'led', disp: [-3.4, 2.8, 4.4], delay: 0.49 }
]) {
  addPart({ id: c.id, group: 'smd', x: c.x, y: c.y, disp: c.disp, delay: c.delay, topZ: 0.6,
    pads: () => { const r = (c.rot * Math.PI) / 180; [-1, 1].forEach(sg => padsRect(c.x + Math.cos(r) * sg * 0.75, c.y + Math.sin(r) * sg * 0.75, 0.7, 0.9, c.rot)); },
    draw: () => c.kind === 'led'
      ? (box(c.x, c.y, 1.6, 0.8, 0, 0.5, '#e9e6dc', c.rot), flat(rectPoly(c.x, c.y, 0.9, 0.6, c.rot), 0.501, '#f04a3a', { op: 0.85 }))
      : passive(c.x, c.y, c.rot, 0, c.kind === 'res' ? 'res' : '0603') });
}

export default {
  ...INFO['esp32-c3'],
  centro: [9, 12.2, 0],
  placa,
  partes: PARTES
};
