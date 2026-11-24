// Kit de modelagem das placas.
// Reimplementa em Three.js os primitivos dos arquivos *-exploded.html (box, prism, flat, ell, cyl, isoText...),
// com a mesma assinatura e as mesmas coordenadas em milímetros: x e y no plano da placa, z para cima.
// Cada chamada acrescenta geometria ao construtor ativo e devolve '' para que o código original,
// escrito como `s += box(...)`, continue valendo sem alteração.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ---------- utilitários dos arquivos originais ---------- */
export function rectPoly(cx, cy, w, d, rot = 0) {
  const r = (rot * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2]
  ].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}
export function roundRect(x0, y0, x1, y1, r, n = 5) {
  const o = [];
  const c = [
    [x1 - r, y0 + r, -90],
    [x1 - r, y1 - r, 0],
    [x0 + r, y1 - r, 90],
    [x0 + r, y0 + r, 180]
  ];
  for (const [cx, cy, a0] of c)
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + (90 * i) / n) * Math.PI) / 180;
      o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  return o;
}
export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------- materiais ---------- */
// Os gradientes SVG dos originais viram acabamentos físicos.
const PRESETS = {
  metal: { cor: '#d4d7db', metal: 1, aspereza: 0.28 },
  usbBody: { cor: '#c9ccd1', metal: 1, aspereza: 0.3 },
  usbTop: { cor: '#e2e4e7', metal: 1, aspereza: 0.24 },
  copper: { cor: '#c98058', metal: 1, aspereza: 0.34 },
  melf: { cor: '#b8402f', metal: 0, aspereza: 0.12, verniz: 1 }
};
const NAO_METAL = new Set(['#d8b66a', '#e2c47c', '#e6d2b2', '#efdcc0', '#f4e7d1']);

function lerCor(fill) {
  const m = /^rgba?\(([^)]+)\)$/.exec(fill);
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(v => v.trim());
    return { cor: new THREE.Color(`rgb(${r},${g},${b})`), opacidade: parseFloat(a) };
  }
  return { cor: new THREE.Color(fill), opacidade: 1 };
}

function ehMetal(hex, cor) {
  if (NAO_METAL.has(hex)) return false;
  const hsl = {};
  cor.getHSL(hsl);
  const hue = hsl.h * 360;
  if (hsl.s < 0.1 && hsl.l > 0.6 && hsl.l <= 0.92) return true; // prata, estanho, aço
  if (hue >= 18 && hue <= 52 && hsl.s >= 0.5 && hsl.l > 0.35 && hsl.l < 0.78) return true; // ouro, cobre
  return false;
}

/* ---------- construtor ---------- */
let alvo = null;
let pcbCores = new Set();
let baseTexto = 'Open Sans, Segoe UI, Arial, sans-serif';

/** Cores tratadas como máscara de solda (verniz brilhante) na placa atual. */
export function definirPcb(...cores) {
  pcbCores = new Set(cores.map(c => c.toLowerCase()));
}

class Construtor {
  constructor() {
    this.baldes = new Map(); // chave do material → { mat, geos: [] }
    this.textos = [];
  }
  material(fill) {
    if (!fill || fill === 'none') return null;
    const preset = /^url\(#(\w+)\)$/.exec(fill);
    if (preset) {
      const p = PRESETS[preset[1]];
      if (!p) return this.material(pcbCores.values().next().value || '#1b1c20'); // pcbTop
      return { chave: `p:${preset[1]}`, ...p, opacidade: 1 };
    }
    const hex = fill.toLowerCase();
    const { cor, opacidade } = lerCor(fill);
    if (pcbCores.has(hex)) return { chave: `pcb:${hex}`, cor, metal: 0, aspereza: 0.62, verniz: 0.18, opacidade };
    if (ehMetal(hex, cor)) return { chave: `m:${hex}`, cor, metal: 1, aspereza: 0.32, opacidade };
    return { chave: `d:${hex}:${opacidade}`, cor, metal: 0, aspereza: 0.55, opacidade };
  }
  add(geo, fill) {
    const m = this.material(fill);
    if (!m) {
      geo.dispose();
      return;
    }
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    for (const nome of Object.keys(g.attributes)) if (nome !== 'position' && nome !== 'normal') g.deleteAttribute(nome);
    if (!g.attributes.normal) g.computeVertexNormals();
    let b = this.baldes.get(m.chave);
    if (!b) this.baldes.set(m.chave, (b = { m, geos: [] }));
    b.geos.push(g);
  }
  montar() {
    const grupo = new THREE.Group();
    for (const { m, geos } of this.baldes.values()) {
      const geo = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      const mat = new THREE.MeshPhysicalMaterial({
        color: m.cor,
        metalness: m.metal,
        roughness: m.aspereza,
        clearcoat: m.verniz || 0,
        clearcoatRoughness: 0.35,
        transparent: m.opacidade < 1,
        opacity: m.opacidade
      });
      // dielétricos refletem menos o ambiente de estúdio; a máscara preta continua preta
      mat.envMapIntensity = m.metal ? 1 : m.verniz ? 0.12 : 0.5;
      mat.userData.opacidadeBase = m.opacidade;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      grupo.add(mesh);
    }
    for (const t of this.textos) grupo.add(t);
    return grupo;
  }
}

/** Executa fn com um construtor novo e devolve o grupo montado (coordenadas da placa, z para cima). */
export function construir(fn) {
  const anterior = alvo;
  alvo = new Construtor();
  try {
    fn();
    return alvo.montar();
  } finally {
    alvo = anterior;
  }
}

/* ---------- geometrias ---------- */
const v2 = poly => poly.map(([x, y]) => new THREE.Vector2(x, y));
function formato(poly) {
  const pts = v2(poly);
  if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
  return new THREE.Shape(pts);
}

// Pequenos degraus em z para que decalques e pads não disputem profundidade com a superfície.
const DEGRAU = 0.012;

export function prism(poly, z0, z1, color, o = {}) {
  if (z1 - z0 <= 0) return '';
  const geo = new THREE.ExtrudeGeometry(formato(poly), { depth: z1 - z0, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, z0);
  alvo.add(geo, color);
  if (o.top && o.top !== color) flat(poly, z1, o.top);
  return '';
}

export const box = (cx, cy, w, d, z0, z1, color, rot = 0, o = {}) => prism(rectPoly(cx, cy, w, d, rot), z0, z1, color, o);

export function flat(poly, z, fill, o = {}) {
  if (fill && fill !== 'none') {
    const geo = new THREE.ShapeGeometry(formato(poly));
    geo.translate(0, 0, z + DEGRAU);
    alvo.add(geo, o.op != null && /^#/.test(fill) ? hexComAlfa(fill, o.op) : fill);
  } else if (o.stroke) {
    trilho([...poly, poly[0]], z + DEGRAU, 0.12, o.stroke);
  }
  return '';
}

function hexComAlfa(hex, a) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

export function ell(x, y, z, r, fill, extra = '') {
  const op = /opacity="([\d.]+)"/.exec(extra);
  const traco = /stroke="([^"]+)"/.exec(extra);
  if ((!fill || fill === 'none') && traco) {
    const geo = new THREE.RingGeometry(r - 0.06, r + 0.06, 32);
    geo.translate(x, y, z + DEGRAU * 1.5);
    alvo.add(geo, traco[1]);
    return '';
  }
  const geo = new THREE.CircleGeometry(r, r > 1 ? 32 : 16);
  geo.translate(x, y, z + DEGRAU * 1.5);
  alvo.add(geo, op && /^#/.test(fill) ? hexComAlfa(fill, parseFloat(op[1])) : fill);
  return '';
}

export function cyl(x, y, z0, z1, r, color) {
  const geo = new THREE.CylinderGeometry(r, r, z1 - z0, 28, 1);
  geo.rotateX(Math.PI / 2);
  geo.translate(x, y, (z0 + z1) / 2);
  alvo.add(geo, color);
  return '';
}
export const vcyl = cyl;

/** Barra cilíndrica horizontal ao longo de x (elemento da antena dipolo). */
export function rodX(x0, x1, y, z, r, color) {
  const geo = new THREE.CapsuleGeometry(r, x1 - x0, 4, 20);
  geo.rotateZ(Math.PI / 2);
  geo.translate((x0 + x1) / 2, y, z);
  alvo.add(geo, color);
  return '';
}

/** Perfil no plano xz extrudado ao longo de y. */
export function extrudeY(prof, y0, y1, color) {
  const geo = new THREE.ExtrudeGeometry(formato(prof), { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  // (sx, sy, sz) → (sx, y1 - sz, sy): rotação própria, mantém o sentido das faces.
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, y1, 0, 1, 0, 0, 0, 0, 0, 1));
  alvo.add(geo, color);
  return '';
}

/** Polígono plano qualquer no espaço (substitui os <polygon> escritos à mão nos originais). */
export function poly3(pts, fill) {
  if (pts.length < 3) return '';
  const pos = [];
  for (let i = 1; i < pts.length - 1; i++) pos.push(...pts[0], ...pts[i], ...pts[i + 1]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  alvo.add(geo, fill);
  // Face dupla: os originais desenham só o lado visível.
  const verso = geo.clone();
  const p = verso.attributes.position.array;
  for (let i = 0; i < p.length; i += 9)
    for (let k = 0; k < 3; k++) [p[i + 3 + k], p[i + 6 + k]] = [p[i + 6 + k], p[i + 3 + k]];
  verso.computeVertexNormals();
  alvo.add(verso, fill);
  return '';
}

/** Trilha ou fio plano de largura w (mm) sobre o plano z. */
export function trilho(pts, z, w, fill) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i],
      [bx, by] = pts[i + 1];
    const L = Math.hypot(bx - ax, by - ay);
    if (L < 1e-6) continue;
    const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    const geo = new THREE.ShapeGeometry(formato(rectPoly((ax + bx) / 2, (ay + by) / 2, L + w, w, ang)));
    geo.translate(0, 0, z + DEGRAU);
    alvo.add(geo, fill);
  }
  return '';
}

/** Pirâmide de ponta de pino (base quadrada de lado 0,64 mm). */
export function pyramid(x, y, z, dz) {
  const geo = new THREE.ConeGeometry(0.45, Math.abs(dz), 4, 1);
  geo.rotateY(Math.PI / 4);
  geo.rotateX(dz < 0 ? -Math.PI / 2 : Math.PI / 2);
  geo.translate(x, y, z + dz / 2);
  alvo.add(geo, '#9a9da1');
  return '';
}

/* ---------- texto impresso ---------- */
const cacheTex = new Map();
function texturaTexto(str, cor, peso, ls) {
  const chave = `${str}|${cor}|${peso}|${ls}`;
  if (cacheTex.has(chave)) return cacheTex.get(chave);
  const px = 96;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const fonte = `${peso} ${px}px ${baseTexto}`;
  ctx.font = fonte;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${ls * px}px`;
  const largura = Math.ceil(ctx.measureText(str).width + px * 0.2);
  c.width = Math.max(8, largura);
  c.height = Math.ceil(px * 1.3);
  ctx.font = fonte;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${ls * px}px`;
  ctx.fillStyle = cor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(str, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const r = { tex, proporcao: c.width / c.height, escala: c.height / px };
  cacheTex.set(chave, r);
  return r;
}

export function isoText(str, x, y, z, size, fill, rot = 0, o = {}) {
  if (typeof document === 'undefined') return '';
  const { tex, proporcao, escala } = texturaTexto(String(str), fill, o.w || 700, o.ls || 0);
  const h = size * escala,
    w = h * proporcao;
  const geo = new THREE.PlaneGeometry(w, h);
  const anchor = o.anchor || 'middle';
  if (anchor === 'start') geo.translate(w / 2 - size * 0.1, 0, 0);
  if (anchor === 'end') geo.translate(-w / 2 + size * 0.1, 0, 0);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    roughness: 0.7,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4
  });
  mat.userData.opacidadeBase = 1;
  const m = new THREE.Mesh(geo, mat);
  // Mesma orientação do SVG: direita do texto em (cos r, sin r) e topo em −(−sin r, cos r).
  const r = (rot * Math.PI) / 180;
  const ex = new THREE.Vector3(Math.cos(r), Math.sin(r), 0);
  const ey = new THREE.Vector3(Math.sin(r), -Math.cos(r), 0);
  m.matrixAutoUpdate = false;
  m.matrix.makeBasis(ex, ey, new THREE.Vector3(0, 0, 1)).setPosition(x, y, z + DEGRAU * 2);
  m.renderOrder = 2;
  alvo.textos.push(m);
  return '';
}
