// Porte para 3D de bz251-gps-exploded.html (raiz do projeto). Medidas em mm, mesmas peças,
// deslocamentos e atrasos do original. Os <polygon> escritos à mão viraram poly3/trilho.
import { rectPoly, roundRect, seeded, box, flat, ell, isoText, poly3, trilho, prism, definirPcb } from '../kit.js';
import { INFO } from './info.js';

const COL = {
  pcb: '#5a2a86', gold: '#d9a85a', goldD: '#a2722e', silver: '#c9ccd0', tin: '#d2d4d6', silk: '#f1ecf6',
  cap: '#c49a6a', chip: '#1f2023', ceramic: '#d9b08c', jst: '#efe6d6', copper: '#d08a63'
};
const BW = 25, BT = 1.0;
const MODR = [1.8, 1.8, 15.6, 17.4];
const CAN = [1.2, 1.2, 16.2, 18.0], CANH = 3.0, WALL = 0.35;
const JST = { x: 19.1, y: 10.6, w: 3.6, d: 13.4, h: 3.8 };
const PADY = [4.2, 6.8, 9.4, 12.0, 14.6, 17.2];
const ANT = [1.2, 1.2, 16.2, 18.0];
const rr = (x0, y0, x1, y1, r) => roundRect(x0, y0, x1, y1, r, 5);

function passive(x, y, rot, col, L = 1.6, W = 0.8, h = 0.55) {
  box(x, y, L, W, 0, h, col, rot);
  const r = (rot * Math.PI) / 180, c = L * 0.2;
  for (const sg of [-1, 1]) box(x + Math.cos(r) * sg * (L / 2 - c / 2), y + Math.sin(r) * sg * (L / 2 - c / 2), c, W * 1.02, 0, h * 1.02, COL.silver, rot);
}
const padsRect = (cx, cy, w, d, rot = 0, fill = COL.tin) => flat(rectPoly(cx, cy, w, d, rot), 0.001, fill);

function placa() {
  definirPcb(COL.pcb, '#6a33a0', '#3e1c5e');
  prism(rr(0, 0, BW, BW, 1.4), -BT, 0, COL.pcb);
  const rnd = seeded(5);
  for (let i = 0; i < 46; i++) { const x = 0.8 + rnd() * 23.4, y = 0.8 + rnd() * 23.4;
    if (x > MODR[0] - 0.4 && x < MODR[2] + 0.4 && y > MODR[1] - 0.4 && y < MODR[3] + 0.4) continue; if (x > 16.8 && x < 21.6 && y > 3.4 && y < 17.8) continue;
    ell(x, y, 0, 0.2, '#8a5fb3'); ell(x, y, 0.001, 0.09, '#2b1240'); }
  for (const t of [[[17, 19.5], [19, 21], [22, 21]], [[2, 19.4], [6, 19.4], [7.5, 21]], [[12, 20.2], [16, 20.2], [17.4, 18.6]], [[21.8, 3.0], [23.2, 3.0]]]) trilho(t, 0, 0.32, '#7340a6');
  ell(1.3, 1.3, 0, 0.55, COL.gold); ell(1.3, 1.3, 0.001, 0.32, '#f2f0ec');
  // pegada da blindagem (aparece quando a tampa sobe)
  trilho([[CAN[0], CAN[1]], [CAN[2], CAN[1]], [CAN[2], CAN[3]], [CAN[0], CAN[3]], [CAN[0], CAN[1]]], 0.001, 0.42, COL.tin);
  // módulo receptor GNSS com etiqueta (fica na placa)
  box((MODR[0] + MODR[2]) / 2, (MODR[1] + MODR[3]) / 2, MODR[2] - MODR[0], MODR[3] - MODR[1], 0, 2.0, '#b9bcc0', 0, { top: 'url(#metal)' });
  const cx = (MODR[0] + MODR[2]) / 2;
  flat(rr(MODR[0] + 0.5, MODR[1] + 0.5, MODR[2] - 0.5, MODR[3] - 0.5, 0.8), 2.001, '#f7f7f5');
  isoText('BZGNSS', cx, 4.4, 2.002, 2.3, '#1b1b1d', 0, { w: 700, ls: -0.05 });
  isoText('BZ-251 GPS', cx, 7.4, 2.002, 1.75, '#1b1b1d', 0, { w: 700, ls: 0.05 });
  const r2 = seeded(9); let bx = MODR[0] + 1.4;
  while (bx < MODR[2] - 1.6) { const w = 0.12 + r2() * 0.32; flat([[bx, 9.2], [bx + w, 9.2], [bx + w, 10.6], [bx, 10.6]], 2.004, '#1b1b1d'); bx += w + 0.12 + r2() * 0.3; }
  isoText('86808584321', cx, 12.0, 2.002, 1.15, '#1b1b1d', 0, { w: 400, ls: 0.18 });
  isoText('TX RX GND 5V SCL SDA', cx, 14.2, 2.002, 0.95, '#1b1b1d', 0, { w: 400 });
  for (let i = 0; i < 6; i++) padsRect(JST.x - 0.6, JST.y - 5.2 + i * 2.08, 1.6, 0.9, 0, COL.gold);
  padsRect(JST.x + 1.4, JST.y - 6.4, 1.2, 1.4); padsRect(JST.x + 1.4, JST.y + 6.4, 1.2, 1.4);
  PADY.forEach((y, i) => { flat(rr(22.6, y - 0.85, 24.6, y + 0.85, 0.8), 0.002, COL.gold); ell(23.6, y, 0.003, 0.32, '#3a2a12');
    isoText('TRGVCD'[i], 21.7, y, 0, 0.85, COL.silk, 90, { w: 700 }); });
  box(19.0, 21.8, 1.6, 0.8, 0, 0.5, '#f1efe9'); flat(rectPoly(19.0, 21.8, 0.9, 0.55), 0.501, '#5aa7ff', { op: 0.8 });
  box(22.4, 21.8, 1.6, 0.8, 0, 0.5, '#f1efe9'); flat(rectPoly(22.4, 21.8, 0.9, 0.55), 0.501, '#ff6a3d', { op: 0.85 });
  isoText('PPS', 19.0, 23.4, 0, 0.95, COL.silk, 0, { w: 700 }); isoText('TX', 22.4, 23.4, 0, 0.95, COL.silk, 0, { w: 700 });
  box(8.6, 21.6, 3.0, 3.0, 0.05, 1.0, COL.chip, 0, { top: '#26272b' });
  for (const u of [-1, 0, 1]) { box(8.6 + u * 0.95, 23.4, 0.45, 0.7, 0, 0.28, COL.silver); box(8.6 + u * 0.95, 19.8, 0.45, 0.7, 0, 0.28, COL.silver); }
  passive(3.0, 20.0, 0, COL.cap, 2.0, 1.25, 0.8); passive(3.0, 22.6, 0, '#151517', 1.6, 0.8, 0.5); passive(12.8, 21.0, 90, COL.cap, 2.0, 1.25, 0.8);
  passive(15.2, 23.0, 0, COL.cap); passive(13.0, 24.0, 0, '#151517', 1.0, 0.5, 0.35);
  passive(17.2, 20.4, 90, COL.cap, 1.0, 0.5, 0.4); passive(21.0, 19.3, 0, '#151517', 1.0, 0.5, 0.35);
}

const PARTES = [];
const addPart = o => PARTES.push(o);

// antena cerâmica de patch, sobre a blindagem
addPart({ id: 'ant', x: 8.7, y: 9.6, disp: [0, 0, 26.5], delay: 0.0, topZ: 2 * (CANH + 2.6),
  draw: () => { const z0 = CANH, cx = 8.7, cy = 9.6;
    prism(rr(ANT[0], ANT[1], ANT[2], ANT[3], 0.6), z0, z0 + 0.45, '#a8bba1', { top: '#b8c9b0' });
    prism(rr(ANT[0] + 0.2, ANT[1] + 0.2, ANT[2] - 0.2, ANT[3] - 0.2, 1.2), z0 + 0.45, z0 + 4.4, COL.ceramic, { top: '#e2bd99' });
    flat(rr(ANT[0] + 1.5, ANT[1] + 1.5, ANT[2] - 1.5, ANT[3] - 1.5, 0.8), z0 + 4.401, '#f3f1ec');
    ell(cx + 1.4, cy - 2.6, z0 + 4.402, 1.25, '#9a9ea3'); ell(cx + 1.4, cy - 2.6, z0 + 4.403, 0.9, '#e6e7e8'); ell(cx + 1.4, cy - 2.6, z0 + 4.404, 0.38, '#b0b4b8');
    poly3([[5.4, ANT[3] - 0.18, z0 + 2.4], [7.2, ANT[3] - 0.18, z0 + 2.4], [7.2, ANT[3] - 0.18, z0 + 3.1], [5.4, ANT[3] - 0.18, z0 + 3.1]], '#8f9398'); } });

// blindagem metálica: bandeja aberta, com paredes internas
addPart({ id: 'can', x: 8.7, y: 9.6, disp: [0, 0, 15], delay: 0.12, topZ: CANH,
  draw: () => { const [x0, y0, x1, y1] = CAN, t = WALL, h = CANH;
    prism([[x0 - 0.5, y0 - 0.5], [x1 + 0.5, y0 - 0.5], [x1 + 0.5, y1 + 0.5], [x0 - 0.5, y1 + 0.5]], 0, 0.22, '#b5b8bc', { top: '#c7cacd' });
    // quatro paredes com espessura
    box((x0 + x1) / 2, y0 + t / 2, x1 - x0, t, 0.22, h, '#bfc2c6');
    box((x0 + x1) / 2, y1 - t / 2, x1 - x0, t, 0.22, h, '#b6b9bd');
    box(x0 + t / 2, (y0 + y1) / 2, t, y1 - y0 - 2 * t, 0.22, h, '#cfd2d5');
    box(x1 - t / 2, (y0 + y1) / 2, t, y1 - y0 - 2 * t, 0.22, h, '#9fa3a8'); } });

// conector JST de 6 vias, sai de lado
addPart({ id: 'jst', x: JST.x, y: JST.y, disp: [9.5, -3.5, 8.0], delay: 0.24, topZ: JST.h,
  draw: () => { const { x, y, w, d, h } = JST;
    for (let i = 0; i < 6; i++) box(x - 0.6, y - 5.2 + i * 2.08, 1.4, 0.5, 0, 0.3, COL.gold);
    box(x, y, w, d, 0, h, COL.jst, 0, { top: '#f6f0e5' });
    flat([[x - w / 2 + 0.5, y - d / 2 + 0.6], [x + w / 2 - 0.5, y - d / 2 + 0.6], [x + w / 2 - 0.5, y + d / 2 - 0.6], [x - w / 2 + 0.5, y + d / 2 - 0.6]], h + 0.001, '#d6ccba');
    flat([[x - w / 2 + 0.9, y - d / 2 + 1.0], [x + w / 2 - 0.9, y - d / 2 + 1.0], [x + w / 2 - 0.9, y + d / 2 - 1.0], [x - w / 2 + 0.9, y + d / 2 - 1.0]], h + 0.002, '#3b3630');
    for (let i = 0; i < 6; i++) flat(rectPoly(x, y - 5.2 + i * 2.08, 0.9, 0.35), h + 0.004, '#c9a457');
    box(x + w / 2 + 0.35, y - d / 2 + 1.6, 0.7, 1.6, 0, h * 0.7, '#e7decd'); box(x + w / 2 + 0.35, y + d / 2 - 1.6, 0.7, 1.6, 0, h * 0.7, '#e7decd'); } });

// plano de terra de cobre, sob a placa, desce
addPart({ id: 'gnd', x: 12.5, y: 12.5, ancora: [21, 25.2, -BT - 0.6], disp: [0, 0, -8.5], delay: 0.3, topZ: -2 * (BT + 0.3),
  draw: () => prism(rr(-0.2, -0.2, BW + 0.2, BW + 0.2, 1.5), -BT - 0.6, -BT - 0.02, 'url(#copper)') });

export default {
  ...INFO['bz-251'],
  centro: [12.5, 12.5, 2],
  placa,
  partes: PARTES
};
