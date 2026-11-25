// Porte para 3D de bme-bmp280-exploded.html (raiz do projeto). Medidas em mm, mesmas peças,
// deslocamentos e atrasos do original. Os <polygon> escritos à mão viraram poly3/trilho.
import { rectPoly, roundRect, seeded, box, flat, ell, isoText, poly3, trilho, prism, definirPcb } from '../kit.js';
import { INFO } from './info.js';

const COL = { pcb: '#5a2a86', gold: '#d9ad58', goldD: '#a4772f', silver: '#c9ccd0', tin: '#d2d4d6', silk: '#f4effa', cap: '#c49a6a', chip: '#1f2023' };
const BW = 11.5, BL = 15.0, BT = 1.0;
const PINS = [['VIN', 13.0], ['GND', 10.46], ['SCL', 7.92], ['SDA', 5.38]], PINX = 10.0;
const HOLE = [3.0, 11.8];
const SEN = { x: 3.0, y: 3.6, w: 2.5, d: 2.5 };
const rr = (x0, y0, x1, y1, r) => roundRect(x0, y0, x1, y1, r, 5);

function passive(x, y, rot, col, L = 1.6, W = 0.8, h = 0.55) {
  box(x, y, L, W, 0, h, col, rot);
  const r = (rot * Math.PI) / 180, c = L * 0.2;
  for (const sg of [-1, 1]) box(x + Math.cos(r) * sg * (L / 2 - c / 2), y + Math.sin(r) * sg * (L / 2 - c / 2), c, W * 1.02, 0, h * 1.02, '#d8d9db', rot);
}
const padsRect = (cx, cy, w, d, rot = 0, fill = COL.tin) => flat(rectPoly(cx, cy, w, d, rot), 0.001, fill);

function placa() {
  definirPcb(COL.pcb, '#3e1c5e');
  prism(rr(0, 0, BW, BL, 0.9), -BT, 0, COL.pcb);
  for (const t of [[[1.6, 6.2], [1.6, 8.4], [3.0, 9.2], [5.0, 9.2]], [[4.6, 3.6], [6.2, 3.6], [7.2, 4.6], [9.0, 4.6]], [[3.0, 5.2], [3.0, 6.0], [4.6, 7.0]], [[6.6, 2.0], [8.6, 2.0], [9.4, 2.8]], [[8.2, 7.92], [9.0, 7.92]], [[8.4, 10.46], [9.0, 10.46]]])
    trilho(t, 0, 0.26, '#7240a5');
  const rnd = seeded(4);
  for (let i = 0; i < 16; i++) { const x = 0.7 + rnd() * 10, y = 0.7 + rnd() * 13.6;
    if (Math.hypot(x - HOLE[0], y - HOLE[1]) < 3.2 || x > 8.6) continue;
    ell(x, y, 0, 0.12, '#8d62b6'); ell(x, y, 0.001, 0.055, '#2b1240'); }
  // furo de fixação com borda dourada
  ell(HOLE[0], HOLE[1], 0, 2.55, COL.gold); ell(HOLE[0], HOLE[1], 0.001, 1.65, '#f3f2ee');
  // pads da barra de pinos e serigrafia
  for (const [n, y] of PINS) { ell(PINX, y, 0, 1.05, COL.gold); ell(PINX, y, 0.001, 0.52, '#3a2a12'); isoText(n, 8.75, y, 0, 0.95, COL.silk, 180, { w: 800, anchor: 'start' }); }
  isoText('BME/BMP280', 5.4, 7.0, 0, 1.0, COL.silk, -90, { w: 800, ls: 0.05 });
  // pads do jumper de endereço
  for (const y of [6.2, 7.2, 8.2]) flat(rectPoly(3.6, y, 0.75, 0.8), 0.002, COL.gold);
  for (const p of PARTES) p.pads?.();
}

const PARTES = [];
const addPart = o => PARTES.push(o);

// sensor BME/BMP280 (LGA, tampa metálica com respiro)
addPart({ id: 'sen', x: SEN.x, y: SEN.y, disp: [0, 0, 8.5], delay: 0.0, topZ: 1.0,
  pads: () => { for (let i = 0; i < 4; i++) { const t = -0.95 + i * 0.633; padsRect(SEN.x + t, SEN.y - 1.0, 0.32, 0.55); padsRect(SEN.x + t, SEN.y + 1.0, 0.32, 0.55); } },
  draw: () => { const { x, y } = SEN;
    box(x, y, 2.5, 2.5, 0, 0.3, '#c99a45', 0, { top: '#d8ad5a' });
    for (let i = 0; i < 4; i++) { const t = -0.95 + i * 0.633;
      poly3([[x + t - 0.15, y + 1.25, 0], [x + t + 0.15, y + 1.25, 0], [x + t + 0.15, y + 1.25, 0.12], [x + t - 0.15, y + 1.25, 0.12]], '#e9c77c');
      poly3([[x + 1.25, y + t - 0.15, 0], [x + 1.25, y + t + 0.15, 0], [x + 1.25, y + t + 0.15, 0.12], [x + 1.25, y + t - 0.15, 0.12]], '#e9c77c'); }
    prism(rr(x - 1.12, y - 1.12, x + 1.12, y + 1.12, 0.28), 0.3, 0.95, '#bfc2c6', { top: 'url(#metal)' });
    flat(rr(x - 0.95, y - 0.95, x + 0.95, y + 0.95, 0.2), 0.951, 'rgba(255,255,255,.18)');
    ell(x + 0.55, y + 0.25, 0.952, 0.13, '#2a2b2e'); ell(x + 0.55, y + 0.25, 0.953, 0.07, '#0d0d0e');
    isoText('HB', x - 0.35, y - 0.1, 0.952, 0.32, '#7e8287', 0, { w: 700 }); isoText('KN', x - 0.35, y + 0.35, 0.952, 0.28, '#868a8f', 0, { w: 700 }); } });

// capacitores e resistores SMD em volta do sensor
const SMD = [
  { id: 'c1', x: 1.4, y: 7.6, rot: 90, col: COL.cap, dz: 5.2, d: [-1.2, 1.2] },
  { id: 'c2', x: 6.0, y: 1.6, rot: 0, col: COL.cap, dz: 3.6, d: [2.6, -2.6] },
  { id: 'r1', x: 6.4, y: 4.4, rot: 0, col: '#4a3a2e', dz: 4.4, d: [1.4, 0.2] },
  { id: 'r2', x: 1.6, y: 3.0, rot: 90, col: '#4a3a2e', dz: 7.0, d: [-3.4, 1.2] }
];
SMD.forEach((c, i) => addPart({ id: c.id, group: 'smd', x: c.x, y: c.y, disp: [c.d[0], c.d[1], c.dz], delay: 0.14 + i * 0.05, topZ: 0.6,
  pads: () => { const r = (c.rot * Math.PI) / 180; for (const sg of [-1, 1]) padsRect(c.x + Math.cos(r) * sg * 0.75, c.y + Math.sin(r) * sg * 0.75, 0.6, 0.9, c.rot); },
  draw: () => passive(c.x, c.y, c.rot, c.col) }));

export default {
  ...INFO['bme-280'],
  centro: [5.75, 7.5, 2.5],
  placa,
  partes: PARTES
};
