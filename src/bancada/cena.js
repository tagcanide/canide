// Bancada 3D: monta uma placa a partir do seu módulo em ./placas, separa as peças pelo progresso
// e devolve as posições de tela dos rótulos. Não anima nada por conta própria: progresso, câmera e foco
// chegam prontos da timeline do Anime.js (camada React). Só desenha quando algo muda.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { cabo, construir, geometriaCabo } from './kit.js';

// Mesma curva e janela de cada peça dos arquivos originais.
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const SPAN = 0.52;
export const local = (p, parte) => ease(clamp((p - parte.delay) / SPAN));

export function suportaWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

// Coordenadas da placa (x, y no plano, z para cima) para o mundo do Three (y para cima).
// É a mesma orientação da vista isométrica dos originais; o Three corrige o sentido das faces.
const PARA_MUNDO = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);

export function criarBancada(canvas, { mobile = false, sombras = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = sombras;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);

  // Luz principal de estúdio com sombra, contraluz fria e preenchimento baixo.
  const chave = new THREE.DirectionalLight('#ffffff', 2.4);
  chave.castShadow = sombras;
  chave.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  chave.shadow.bias = -0.0004;
  chave.shadow.normalBias = 0.02;
  scene.add(chave, chave.target);
  const contra = new THREE.DirectionalLight('#9fd8ff', 1.1);
  scene.add(contra);
  const baixo = new THREE.HemisphereLight('#ffffff', '#1a2430', 0.35);
  scene.add(baixo);

  const raiz = new THREE.Group();
  raiz.matrixAutoUpdate = false;
  raiz.matrix.copy(PARA_MUNDO);
  scene.add(raiz);

  // Recebe a sombra das peças sem aparecer como superfície.
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.38 }));
  chao.receiveShadow = true;
  raiz.add(chao);

  const guiasMat = new THREE.LineDashedMaterial({ color: '#7f8a96', dashSize: 1.1, gapSize: 0.9, transparent: true, opacity: 0 });
  let guias = null;

  let def = null;
  let interno = null;
  let placaGrupo = null;
  const partes = []; // { def, grupo, chave, giro }
  const cabos = []; // { grupo, malha, def, de, dono }: cabos que ligam duas peças e se redesenham no voo
  let raio = 30;
  let quadros = [{ centro: new THREE.Vector3(), raio: 30 }, { centro: new THREE.Vector3(), raio: 30 }];
  const alvoMundo = new THREE.Vector3();
  let estado = { p: 0, az: 38, el: 24, dist: 1, foco: null, nivelFoco: 0, giro: 0, desloc: [0, 0] };
  let ponteiro = { x: 0, y: 0 };
  let largura = 1,
    altura = 1;
  let sujo = true;
  let pausado = false;
  let quadro = 0;
  let aoQuadro = null;
  const ray = new THREE.Raycaster();

  function limpar() {
    if (!interno) return;
    interno.traverse(o => {
      o.geometry?.dispose();
      if (o.material && !o.material.map) o.material.dispose();
    });
    raiz.remove(interno);
    interno = null;
    partes.length = 0;
    cabos.length = 0;
  }

  function carregar(placa) {
    limpar();
    def = placa;
    interno = new THREE.Group();
    interno.position.set(-placa.centro[0], -placa.centro[1], -placa.centro[2]);
    raiz.add(interno);
    placaGrupo = construir(placa.placa);
    placaGrupo.userData.chave = 'pcb';
    interno.add(placaGrupo);
    const rnd = (i => () => ((i = (i * 9301 + 49297) % 233280) / 233280))(placa.id.length * 977);
    for (const d of placa.partes) {
      const grupo = construir(d.draw);
      // pivô no centro da peça para a rotação durante o voo
      const pivo = new THREE.Group();
      const base = d.ancora || [d.x, d.y, d.topZ > 0 ? d.topZ * 0.5 : d.topZ * 0.25];
      pivo.position.set(base[0], base[1], base[2]);
      grupo.position.set(-base[0], -base[1], -base[2]);
      pivo.add(grupo);
      pivo.userData.chave = d.group || d.id;
      interno.add(pivo);
      const giro = [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.7];
      partes.push({ def: d, grupo: pivo, base, chave: d.group || d.id, giro: d.semGiro ? [0, 0, 0] : giro });
    }
    // cabo entre a peça dona e outra (d.cabo.de): as pontas acompanham o deslocamento das duas
    for (const dono of partes) {
      const c = dono.def.cabo;
      if (!c) continue;
      const de = partes.find(q => q.def.id === c.de);
      const grupo = construir(() => cabo(c.curva(c.a, c.b), c.raio, c.cor));
      grupo.userData.chave = dono.chave;
      interno.add(grupo);
      cabos.push({ grupo, malha: grupo.children[0], def: c, de, dono });
    }
    // caixa da desmontagem completa, para enquadrar e posicionar o chão
    // (em coordenadas do mundo: x, z da placa para cima, y da placa)
    scene.updateMatrixWorld(true);
    const montada = new THREE.Box3().setFromObject(placaGrupo, true);
    const tmp = new THREE.Box3();
    for (const pt of partes) montada.union(tmp.setFromObject(pt.grupo, true));
    const aberta = montada.clone();
    for (const pt of partes) {
      tmp.setFromObject(pt.grupo, true);
      const [dx, dy, dz] = pt.def.disp;
      aberta.union(tmp.translate(new THREE.Vector3(dx, dz, dy)));
    }
    quadros = [montada, aberta].map(b => ({ centro: b.getCenter(new THREE.Vector3()), raio: b.getSize(new THREE.Vector3()).length() / 2 }));
    raio = quadros[1].raio;
    const caixa = aberta;
    chao.scale.setScalar(raio * 6);
    chao.position.set(placa.centro[0], placa.centro[1], caixa.min.y + placa.centro[2] - 0.4);
    // guias tracejadas entre o pad e a peça
    if (guias) {
      guias.geometry.dispose();
      interno.remove(guias);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(partes.length * 6), 3));
    guias = new THREE.LineSegments(g, guiasMat);
    interno.add(guias);
    aplicar();
    sujo = true;
  }

  function aplicar() {
    if (!def) return;
    const { p, foco, nivelFoco } = estado;
    const pos = guias.geometry.attributes.position.array;
    partes.forEach((pt, i) => {
      const k = local(p, pt.def);
      const [dx, dy, dz] = pt.def.disp;
      const voo = Math.sin(Math.PI * k); // rotação só no meio do voo: posições inicial e final exatas
      pt.grupo.position.set(pt.base[0] + dx * k, pt.base[1] + dy * k, pt.base[2] + dz * k);
      pt.grupo.rotation.set(pt.giro[0] * voo, pt.giro[1] * voo, pt.giro[2] * voo);
      const realce = foco && pt.chave === foco ? nivelFoco : 0;
      if (realce) pt.grupo.position.z += 2.2 * realce * Math.sign(dz || 1);
      pos.set([pt.def.x, pt.def.y, pt.base[2] - (dz < 0 ? 0 : pt.base[2]), pt.grupo.position.x, pt.grupo.position.y, pt.grupo.position.z], i * 6);
    });
    for (const cb of cabos) {
      const desloc = (pt, p0) => p0.map((v, i) => v + pt.grupo.position.getComponent(i) - pt.base[i]);
      cb.malha.geometry.dispose();
      cb.malha.geometry = geometriaCabo(cb.def.curva(desloc(cb.de, cb.def.a), desloc(cb.dono, cb.def.b)), cb.def.raio);
    }
    guias.geometry.attributes.position.needsUpdate = true;
    guias.computeLineDistances();
    guiasMat.opacity = clamp(p * 4) * 0.55 * (1 - nivelFoco * 0.7);
    // foco: as demais peças recuam para segundo plano
    const dim = o => o.chave !== foco;
    for (const pt of partes) opacidade(pt.grupo, foco && dim(pt) ? 1 - nivelFoco * 0.86 : 1);
    for (const cb of cabos) opacidade(cb.grupo, foco && dim(cb.dono) ? 1 - nivelFoco * 0.86 : 1);
    const naPlaca = foco && def.extras?.some(e => e.id === foco);
    opacidade(placaGrupo, foco && !naPlaca ? 1 - nivelFoco * 0.7 : 1);
  }

  function opacidade(obj, a) {
    obj.traverse(o => {
      if (!o.material) return;
      const base = o.material.userData.opacidadeBase ?? 1;
      const alvoA = base * a;
      const transp = alvoA < 0.999;
      if (o.material.transparent !== (transp || !!o.material.map)) {
        o.material.transparent = transp || !!o.material.map;
        o.material.needsUpdate = true;
      }
      o.material.opacity = alvoA;
      o.material.depthWrite = !o.material.map && a > 0.6;
      o.castShadow = a > 0.6;
    });
  }

  function posicionarCamera() {
    const aspecto = largura / altura;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fov / 2) * aspecto);
    const ang = Math.min(fov, fovH);
    // enquadramento acompanha a desmontagem: perto da placa montada, recuado com as peças abertas
    const t = ease(clamp(estado.p * 1.25));
    alvoMundo.lerpVectors(quadros[0].centro, quadros[1].centro, t);
    const r = THREE.MathUtils.lerp(quadros[0].raio, quadros[1].raio, t);
    const d = (r / Math.sin(ang / 2)) * estado.dist;
    const az = THREE.MathUtils.degToRad(estado.az + estado.giro + ponteiro.x * 6);
    const el = THREE.MathUtils.degToRad(clamp(estado.el + ponteiro.y * 4, 2, 85));
    // direção em coordenadas da placa → mundo (x, z, y)
    const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    const alvo = alvoMundo;
    camera.position.copy(alvo).addScaledVector(dir, d);
    camera.near = Math.max(0.5, d - raio * 3);
    camera.far = d + raio * 3;
    camera.lookAt(alvo);
    // desloca o centro óptico para abrir espaço aos painéis de texto (fração da largura e da altura)
    const [ox, oy] = estado.desloc;
    if (ox || oy) camera.setViewOffset(largura, altura, -ox * largura, oy * altura, largura, altura);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    chave.position.copy(alvo).add(new THREE.Vector3(raio * 1.2, raio * 3, raio * 1.6));
    chave.target.position.copy(alvo);
    const sc = chave.shadow.camera;
    sc.left = sc.bottom = -raio * 1.4;
    sc.right = sc.top = raio * 1.4;
    sc.near = 1;
    sc.far = raio * 8;
    sc.updateProjectionMatrix();
    contra.position.copy(alvo).add(new THREE.Vector3(-raio * 2, raio, -raio * 2.5));
  }

  function desenhar() {
    quadro = 0;
    if (pausado) return;
    if (sujo) {
      sujo = false;
      aplicar();
      posicionarCamera();
      renderer.render(scene, camera);
      aoQuadro?.();
    }
    quadro = requestAnimationFrame(desenhar);
  }

  function redimensionar() {
    const r = canvas.getBoundingClientRect();
    largura = Math.max(1, r.width);
    altura = Math.max(1, r.height);
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    sujo = true;
  }

  const tmpV = new THREE.Vector3();
  function telaDe(ponto) {
    tmpV.set(...ponto).applyMatrix4(interno.matrixWorld);
    tmpV.project(camera);
    return { x: (tmpV.x * 0.5 + 0.5) * largura, y: (-tmpV.y * 0.5 + 0.5) * altura, frente: tmpV.z < 1 };
  }

  return {
    carregar,
    definir(novo) {
      estado = { ...estado, ...novo };
      sujo = true;
    },
    apontar(x, y) {
      ponteiro = { x, y };
      sujo = true;
    },
    /** Posição de tela de cada rótulo (peças agrupadas e extras da placa). */
    ancoras() {
      if (!def || !interno) return [];
      interno.updateWorldMatrix(true, false);
      const grupos = new Map();
      for (const pt of partes) {
        const lista = grupos.get(pt.chave) || [];
        lista.push([pt.grupo.position.x, pt.grupo.position.y, pt.grupo.position.z]);
        grupos.set(pt.chave, lista);
      }
      const out = [];
      for (const [chaveG, pts] of grupos) {
        const m = pts.reduce((a, v) => [a[0] + v[0] / pts.length, a[1] + v[1] / pts.length, a[2] + v[2] / pts.length], [0, 0, 0]);
        out.push({ id: chaveG, ...telaDe(m) });
      }
      for (const e of def.extras || []) out.push({ id: e.id, extra: true, ...telaDe(e.ponto) });
      return out;
    },
    /** Peça sob o ponteiro (coordenadas normalizadas −1..1). */
    pegar(nx, ny) {
      if (!interno) return null;
      ray.setFromCamera({ x: nx, y: ny }, camera);
      const alvos = [...partes.map(p => p.grupo), ...cabos.map(c => c.grupo)];
      const hit = ray.intersectObjects(alvos, true)[0];
      let o = hit?.object;
      while (o && !o.userData.chave) o = o.parent;
      return o?.userData.chave || null;
    },
    aoQuadro(fn) {
      aoQuadro = fn;
    },
    redimensionar,
    pausar(v) {
      pausado = v;
      if (!v && !quadro) {
        sujo = true;
        quadro = requestAnimationFrame(desenhar);
      }
    },
    iniciar() {
      redimensionar();
      if (!quadro) quadro = requestAnimationFrame(desenhar);
    },
    destruir() {
      cancelAnimationFrame(quadro);
      pausado = true;
      limpar();
      guias?.geometry.dispose();
      guiasMat.dispose();
      chao.geometry.dispose();
      chao.material.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
