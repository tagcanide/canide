// Porte para 3D de gy-neo6mv2-exploded.html (raiz do projeto). Medidas em mm, mesmas peças,
// deslocamentos e atrasos do original. Os <polygon> escritos à mão viraram poly3/trilho; o cabo coaxial,
// que o original redesenha a cada quadro entre a antena e o plugue, virou um cabo da cena (campo `cabo`).
import { rectPoly, roundRect, seeded, box, flat, ell, cyl, isoText, poly3, trilho, prism, definirPcb } from '../kit.js';
import { INFO } from './info.js';

const COL = {
  pcb: '#1f4f9c', gold: '#d6ab55', goldD: '#9e7533', silver: '#c9ccd0', tin: '#d2d4d6', silk: '#eef3fb',
  cap: '#c49a6a', chip: '#1d1e21', yellow: '#f2d75a', black: '#18191b'
};
const BW = 25, BL = 35, BT = 1.2;
const HOLES = [[2.6, 2.6], [22.4, 2.6], [2.6, 32.4], [22.4, 32.4]];
const PINX = [7.2, 9.74, 12.28, 14.82], PINY = 32.6;
const NEO = { x: 12.5, y: 13.5, w: 12.2, d: 16, h: 2.4 };
const SOCK = { x: 3.0, y: 9.6 };
const rr = (x0, y0, x1, y1, r) => roundRect(x0, y0, x1, y1, r, 5);

// Constantes da projeção do original, usadas por iso() para resolver os deslocamentos.
const S = 15, C = Math.cos(Math.PI / 6), H = 0.5, CX = 0, CY = 16;
function iso(x, y, axis, TX, TY, dz) {
  if (axis === 'z') return [0, 0, dz];
  if (axis === 'x') { const dx = TX / (C * S) + (CX - CY) - (x - y); const dzz = ((x + dx + y - (CX + CY)) * H * S - TY) / S; return [dx, 0, dzz]; }
  const dy = x - y - (CX - CY) - TX / (C * S); const dzz = ((x + y + dy - (CX + CY)) * H * S - TY) / S; return [0, dy, dzz];
}

function passive(x, y, rot, col, L = 1.6, W = 0.8, h = 0.55) {
  box(x, y, L, W, 0, h, col, rot);
  const r = (rot * Math.PI) / 180, c = L * 0.2;
  for (const sg of [-1, 1]) box(x + Math.cos(r) * sg * (L / 2 - c / 2), y + Math.sin(r) * sg * (L / 2 - c / 2), c, W * 1.02, 0, h * 1.02, COL.silver, rot);
}
const padsRect = (cx, cy, w, d, rot = 0, fill = COL.gold) => flat(rectPoly(cx, cy, w, d, rot), 0.001, fill);

function placa() {
  definirPcb(COL.pcb, '#173b74');
  prism(rr(0, 0, BW, BL, 0.8), -BT, 0, COL.pcb);
  for (const t of [[[4.6, 8], [4.6, 11], [6.4, 13]], [[18.7, 13], [20, 13], [20, 19.5]], [[12.5, 22], [12.5, 25], [9.7, 28], [9.7, 31]], [[7.2, 31], [7.2, 27], [5.5, 25.5]],
    [[14.8, 31], [16.5, 29], [19, 29]], [[6.4, 19], [8, 21.5], [11, 21.5]], [[18.7, 8], [21, 8], [21, 5]], [[16, 24], [19.5, 24]]])
    trilho(t, 0, 0.45, '#2c62b5');
  const rnd = seeded(13);
  for (let i = 0; i < 60; i++) { const x = 0.8 + rnd() * 23.4, y = 0.8 + rnd() * 33.4;
    if (x > NEO.x - NEO.w / 2 - 1 && x < NEO.x + NEO.w / 2 + 1 && y > NEO.y - NEO.d / 2 - 1 && y < NEO.y + NEO.d / 2 + 1) continue;
    ell(x, y, 0, 0.17, '#5b8ad6'); ell(x, y, 0.001, 0.08, '#0e2244'); }
  for (const [x, y] of HOLES) { ell(x, y, 0, 1.9, COL.gold); ell(x, y, 0.001, 1.3, '#f2f1ec'); }
  // pinos VCC RX TX GND
  PINX.forEach((x, i) => { ell(x, PINY, 0, 0.95, COL.gold); ell(x, PINY, 0.001, 0.48, '#0b0b0c'); isoText(['VCC', 'RX', 'TX', 'GND'][i], x, 30.2, 0, 0.9, COL.silk, 90, { w: 800 }); });
  isoText('GY-GPS6MV2', 1.4, 17.5, 0, 1.1, COL.silk, 90, { w: 800, ls: 0.06 });
  // SMD fixos
  for (const [x, y, r, c] of [[20.6, 6.2, 90, COL.cap], [21.6, 9.6, 0, '#151517'], [2.6, 22.6, 0, COL.cap], [16.8, 30.6, 0, '#151517'], [5.2, 4.2, 90, COL.cap], [21.4, 16.6, 90, COL.cap], [9.2, 4.0, 0, '#151517'], [15.4, 3.6, 0, COL.cap]])
    passive(x, y, r, c, 1.2, 0.6, 0.45);
  for (const p of PARTES) p.pads?.();
}

const PARTES = [];
const addPart = o => PARTES.push(o);

// antena cerâmica de patch: fica ao lado da placa quando montada
const AX = -17.5, AY = 15.5, AZ = -BT;
const ANT_EXIT = [AX + 11.8, AY - 6.5, AZ + 2.2];
addPart({ id: 'ant', x: AX, y: AY, disp: [0, 0, 13], delay: 0.0, topZ: 2 * (AZ + 5), semGiro: true,
  draw: () => {
    prism(rr(AX - 12, AY - 12, AX + 12, AY + 12, 1.2), AZ, AZ + 1.4, '#b8bbbf', { top: '#c9ccd0' });
    prism(rr(AX - 12.5, AY - 12.5, AX + 12.5, AY + 12.5, 0.8), AZ + 1.4, AZ + 2.0, '#3c8a4a', { top: '#46a056' });
    prism(rr(AX - 12, AY - 12, AX + 12, AY + 12, 2.4), AZ + 2.0, AZ + 5.6, COL.yellow, { top: '#f6e283' });
    flat(rr(AX - 8.6, AY - 8.6, AX + 8.6, AY + 8.6, 0.6), AZ + 5.63, '#f5f4f0');
    ell(AX, AY, AZ + 5.65, 1.5, COL.gold); cyl(AX, AY, AZ + 5.6, AZ + 6.1, 1.15, '#dfe1e3'); } });

// soquete IPEX na placa (sobe um pouco)
addPart({ id: 'sock', x: SOCK.x, y: SOCK.y, ancora: [SOCK.x, SOCK.y, 0.9], disp: [0, 0, 3.0], delay: 0.18, topZ: 1.2,
  pads: () => { padsRect(SOCK.x - 1.3, SOCK.y, 0.8, 2.2); padsRect(SOCK.x + 1.3, SOCK.y, 0.8, 2.2); padsRect(SOCK.x, SOCK.y + 1.3, 1.0, 0.8); },
  draw: () => { box(SOCK.x, SOCK.y, 3.0, 3.0, 0, 0.35, COL.gold); cyl(SOCK.x, SOCK.y, 0.35, 1.25, 1.0, '#e2bb63'); ell(SOCK.x, SOCK.y, 1.251, 0.4, '#6d5020'); } });

// cabo coaxial com plugue U.FL/IPEX: o cabo liga a saída da antena ao plugue durante todo o voo
const arco = (a, b) => [a, [a[0] + (b[0] - a[0]) * 0.35, a[1] + (b[1] - a[1]) * 0.35, a[2] + 6], [b[0] - (b[0] - a[0]) * 0.45, b[1] - (b[1] - a[1]) * 0.45, b[2] + 4], b];
addPart({ id: 'coax', x: SOCK.x, y: SOCK.y, ancora: [SOCK.x, SOCK.y, 1.6], disp: [-1.5, 1.5, 9.0], delay: 0.08, topZ: 3.2, semGiro: true,
  cabo: { de: 'ant', a: ANT_EXIT, b: [SOCK.x - 2.8, SOCK.y, 1.75], raio: 0.475, cor: '#2b2c30', curva: arco },
  draw: () => { box(SOCK.x, SOCK.y, 3.1, 3.1, 1.25, 1.75, '#d6b05a'); cyl(SOCK.x, SOCK.y, 1.75, 2.25, 1.05, '#e4c06b'); box(SOCK.x - 2.0, SOCK.y, 1.6, 1.1, 1.4, 2.1, '#cfa955'); } });

// receptor GPS u-blox NEO-6M
addPart({ id: 'neo', x: NEO.x, y: NEO.y, disp: [5.5, 0, 17.5], delay: 0.22, topZ: NEO.h,
  pads: () => { for (let i = 0; i < 12; i++) { const y = NEO.y - NEO.d / 2 + 0.9 + i * 1.29; padsRect(NEO.x - NEO.w / 2 + 0.3, y, 1.4, 0.75); padsRect(NEO.x + NEO.w / 2 - 0.3, y, 1.4, 0.75); }
    flat(rectPoly(NEO.x, NEO.y, NEO.w - 5, NEO.d - 5), 0.001, '#2a5fae'); },
  draw: () => { const { x, y, w, d, h } = NEO;
    box(x, y, w, d, 0, 0.8, '#2d6a3a', 0, { top: '#378045' });
    for (let i = 0; i < 12; i++) { const yy = y - d / 2 + 0.9 + i * 1.29;
      poly3([[x + w / 2, yy - 0.35, 0], [x + w / 2, yy + 0.35, 0], [x + w / 2, yy + 0.35, 0.8], [x + w / 2, yy - 0.35, 0.8]], COL.gold);
      flat(rectPoly(x - w / 2 + 0.4, yy, 0.6, 0.7), 0.801, COL.gold); flat(rectPoly(x + w / 2 - 0.4, yy, 0.6, 0.7), 0.801, COL.gold); }
    box(x, y, w - 1.6, d - 0.6, 0.8, h, '#c7cacd', 0, { top: 'url(#metal)' });
    isoText('u-blox', x + 0.6, y - 4.6, h + 0.001, 1.6, '#c8202a', 90, { w: 800 });
    isoText('NEO-6M-0-001', x - 2.0, y, h + 0.001, 0.85, '#55595e', 90, { w: 600 }); isoText('1305 0200', x - 0.6, y, h + 0.001, 0.8, '#6a6e73', 90, { w: 600 });
    ell(x + 3.2, y + 5.6, h + 0.001, 0.75, '#1b1b1d'); } });

// EEPROM SOIC-8
const EE = { x: 19.4, y: 22.4 };
addPart({ id: 'ee', x: EE.x, y: EE.y, disp: iso(EE.x, EE.y, 'x', 500, -300), delay: 0.3, topZ: 1.5,
  pads: () => { for (let i = 0; i < 4; i++) { const y = EE.y - 1.9 + i * 1.27; padsRect(EE.x - 2.7, y, 1.5, 0.6, 0, COL.tin); padsRect(EE.x + 2.7, y, 1.5, 0.6, 0, COL.tin); } },
  draw: () => { for (let i = 0; i < 4; i++) { const y = EE.y - 1.9 + i * 1.27; box(EE.x - 2.6, y, 1.2, 0.42, 0, 0.25, COL.silver); box(EE.x + 2.6, y, 1.2, 0.42, 0, 0.25, COL.silver); }
    box(EE.x, EE.y, 3.9, 4.9, 0.1, 1.5, COL.chip, 0, { top: '#232428' }); ell(EE.x - 1.2, EE.y - 1.7, 1.501, 0.3, '#4a4c51'); isoText('24C32', EE.x, EE.y, 1.501, 0.75, '#7c8086', 90, { w: 700 }); } });

// regulador de tensão SOT-23-5
const RG = { x: 6.0, y: 25.6 };
const RG_PADS = [[-1.2, -0.95], [-1.2, 0], [-1.2, 0.95], [1.2, -0.95], [1.2, 0.95]];
addPart({ id: 'reg', x: RG.x, y: RG.y, disp: iso(RG.x, RG.y, 'x', 520, -170), delay: 0.34, topZ: 1.1,
  pads: () => RG_PADS.forEach(([u, v]) => padsRect(RG.x + u, RG.y + v, 0.9, 0.55, 0, COL.tin)),
  draw: () => { for (const [u, v] of RG_PADS) box(RG.x + u * 0.96, RG.y + v, 0.7, 0.4, 0, 0.3, COL.silver);
    box(RG.x, RG.y, 1.65, 2.95, 0.05, 1.1, COL.chip, 0, { top: '#232428' }); isoText('LDO', RG.x, RG.y, 1.101, 0.55, '#71757a', 90, { w: 700 }); } });

// bateria de backup e suporte
const BAT = { x: 19.6, y: 29.2, r: 3.4 };
addPart({ id: 'bat', x: BAT.x, y: BAT.y, disp: iso(BAT.x, BAT.y, 'x', 520, 10), delay: 0.26, topZ: 2.2,
  pads: () => { padsRect(BAT.x - 3.9, BAT.y, 1.4, 1.8, 0, COL.tin); padsRect(BAT.x + 4.3, BAT.y - 1.4, 1.6, 1.6, 0, COL.tin); },
  draw: () => { box(BAT.x - 3.6, BAT.y, 1.0, 1.4, 0, 0.3, COL.silver);
    cyl(BAT.x, BAT.y, 0, 1.4, BAT.r, '#d7b24a'); cyl(BAT.x, BAT.y, 1.4, 1.75, BAT.r * 0.92, '#c9cbcf');
    isoText('ML414', BAT.x, BAT.y + 0.4, 1.751, 0.9, '#7a7e83', 0, { w: 700 });
    // lingueta metálica do suporte
    box(BAT.x + 1.6, BAT.y - 0.6, 4.2, 1.3, 1.8, 2.05, '#b3b6ba', 0, { top: '#d9dbde' }); box(BAT.x + 3.95, BAT.y - 0.6, 0.5, 1.3, 0, 2.05, '#b3b6ba'); box(BAT.x + 4.3, BAT.y - 1.4, 1.2, 1.4, 0, 0.25, '#c9ccd0'); } });

// resistores, capacitores e LEDs SMD
const SMD = [
  { id: 's1', x: 10.0, y: 24.2, rot: 0, col: COL.cap, T: [-560, -60] },
  { id: 's2', x: 12.6, y: 25.4, rot: 0, col: '#151517', T: [-500, -20] },
  { id: 's3', x: 15.0, y: 24.4, rot: 90, col: '#151517', T: [-440, -60] },
  { id: 's4', x: 9.6, y: 27.6, rot: 0, col: COL.cap, T: [-560, 30] },
  { id: 's5', x: 12.4, y: 28.4, rot: 0, col: 'led-g', T: [-500, 70] },
  { id: 's6', x: 15.2, y: 27.6, rot: 0, col: 'led-w', T: [-440, 30] }
];
SMD.forEach((c, i) => addPart({ id: c.id, group: 'smd', x: c.x, y: c.y, disp: iso(c.x, c.y, 'y', c.T[0], c.T[1]), delay: 0.38 + i * 0.02, topZ: 0.6,
  pads: () => { const r = (c.rot * Math.PI) / 180; for (const sg of [-1, 1]) padsRect(c.x + Math.cos(r) * sg * 0.8, c.y + Math.sin(r) * sg * 0.8, 0.8, 1.0, c.rot, COL.tin); },
  draw: () => {
    if (!c.col.startsWith('led')) return passive(c.x, c.y, c.rot, c.col);
    box(c.x, c.y, 1.6, 0.8, 0, 0.55, '#eeece6', c.rot);
    flat(rectPoly(c.x, c.y, 0.9, 0.55, c.rot), 0.551, c.col === 'led-g' ? '#4fd17a' : '#f4f1c8', { op: 0.9 });
  } }));

export default {
  ...INFO['gy-neo6mv2'],
  centro: [0, 16, 4],
  placa,
  partes: PARTES
};
