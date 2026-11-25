// Cena Three.js da simulação educativa do GPS: Terra no elipsoide WGS 84, satélites, sinais, esferas de
// pseudodistância e a convergência da solução. A cena não anima sozinha: recebe { etapa, p } das timelines
// do Anime.js (DemoGps.jsx) e desenha esse estado. Só a câmera amortece o movimento entre enquadramentos.
// Escala: 1 unidade = 1 000 km. Eixos: ECEF (X, Y, Z) vira (x, y, z) = (X, Z, −Y), com o polo norte para cima.
import * as THREE from 'three';
import { WGS84, baseEnu, geodesicasParaEcef } from '../lib/gnss.js';

const S = 1e-6;
const v3 = ([X, Y, Z]) => new THREE.Vector3(X * S, Z * S, -Y * S);

// Cores do manual: azul para dados, laranja para o ponto em destaque; uma cor por satélite.
const COR = {
  azul: 0x0367a6,
  turquesa: 0x04adbf,
  oliva: 0x5f7009,
  amarelo: 0xf29f05,
  laranja: 0xf28705,
  papel: 0xf3f2ec,
  tinta: 0x0b1218
};
export const CORES_SATELITES = [COR.azul, COR.turquesa, COR.oliva, COR.amarelo];

const ABERTURA_CALOTA = 0.014; // ângulo da calota de cada esfera mostrada perto do receptor, em radianos

export function suportaWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

const suave = t => t * t * (3 - 2 * t);
const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Linhas de latitude e longitude sobre o elipsoide, um pouco acima da superfície. */
function graticula(passo, h) {
  const pts = [];
  const add = (a, b) => pts.push(...v3(a).toArray(), ...v3(b).toArray());
  for (let lat = -90 + passo; lat < 90; lat += passo) {
    for (let lon = -180; lon < 180; lon += 4) add(geodesicasParaEcef(lat, lon, h), geodesicasParaEcef(lat, lon + 4, h));
  }
  for (let lon = -180; lon < 180; lon += passo) {
    for (let lat = -90; lat < 90; lat += 4) add(geodesicasParaEcef(lat, lon, h), geodesicasParaEcef(lat + 4, lon, h));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function satelite(cor) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: cor }));
  const painelMat = new THREE.MeshLambertMaterial({ color: 0x1d3a52, side: THREE.DoubleSide });
  const painel = new THREE.PlaneGeometry(1.1, 0.46);
  const p1 = new THREE.Mesh(painel, painelMat);
  const p2 = new THREE.Mesh(painel, painelMat);
  p1.position.x = 0.95;
  p2.position.x = -0.95;
  g.add(corpo, p1, p2);
  return g;
}

export function criarCenaGps(canvas, cenario, { mobile = false, rotulos = {}, reduzido = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 400);
  cena.add(new THREE.HemisphereLight(0xffffff, 0xd9e4ec, 2.2));
  const sol = new THREE.DirectionalLight(0xffffff, 1.4);
  cena.add(sol);

  const descartar = [];
  const guardar = (...o) => (descartar.push(...o), o[0]);

  // Terra: elipsoide WGS 84 em tom de papel e a grade de 15 graus no azul da marca
  const terraGeo = guardar(new THREE.SphereGeometry(1, 96, 64));
  const terraMat = guardar(new THREE.MeshLambertMaterial({ color: COR.papel, transparent: true, opacity: 1 }));
  const terra = new THREE.Mesh(terraGeo, terraMat);
  terra.scale.set(WGS84.a * S, WGS84.b * S, WGS84.a * S);
  cena.add(terra);
  const grade = new THREE.LineSegments(
    guardar(graticula(15, 8000)),
    guardar(new THREE.LineBasicMaterial({ color: COR.azul, transparent: true, opacity: 0.32 }))
  );
  cena.add(grade);
  const equador = new THREE.LineSegments(
    guardar(
      (() => {
        const pts = [];
        for (let lon = -180; lon < 180; lon += 2) {
          pts.push(...v3(geodesicasParaEcef(0, lon, 9000)).toArray(), ...v3(geodesicasParaEcef(0, lon + 2, 9000)).toArray());
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return g;
      })()
    ),
    guardar(new THREE.LineBasicMaterial({ color: COR.azul, transparent: true, opacity: 0.7 }))
  );
  cena.add(equador);

  // Receptor verdadeiro da simulação
  const rPos = v3(cenario.receptorEcef);
  const { e, n, u } = baseEnu(cenario.receptor.lat, cenario.receptor.lon);
  const cima = v3(u).normalize();
  const leste = v3(e).normalize();
  const norte = v3(n).normalize();
  const receptor = new THREE.Mesh(guardar(new THREE.SphereGeometry(0.12, 24, 16)), guardar(new THREE.MeshBasicMaterial({ color: COR.laranja })));
  receptor.position.copy(rPos);
  cena.add(receptor);

  // Onda de chegada no receptor (etapa 2)
  const ondaMat = guardar(new THREE.MeshBasicMaterial({ color: COR.laranja, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  const onda = new THREE.Mesh(guardar(new THREE.RingGeometry(0.9, 1, 48)), ondaMat);
  onda.position.copy(rPos);
  onda.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cima);
  cena.add(onda);

  // Satélites, sinais, esferas completas e calotas
  const sats = cenario.satelites.map((s, i) => {
    const cor = CORES_SATELITES[i % CORES_SATELITES.length];
    const pos = v3(s.pos);
    const grupo = satelite(cor);
    grupo.position.copy(pos);
    grupo.lookAt(0, 0, 0);
    cena.add(grupo);

    const linhaGeo = new THREE.BufferGeometry().setFromPoints([pos, pos.clone()]);
    const linhaMat = new THREE.LineDashedMaterial({ color: cor, dashSize: 0.22, gapSize: 0.14, transparent: true, opacity: 0.9 });
    const linha = new THREE.Line(linhaGeo, linhaMat);
    cena.add(linha);

    const pulso = new THREE.Mesh(guardar(new THREE.SphereGeometry(0.22, 16, 12)), guardar(new THREE.MeshBasicMaterial({ color: cor })));
    cena.add(pulso);

    const esferaMat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const esfera = new THREE.Mesh(guardar(new THREE.SphereGeometry(1, 48, 32)), esferaMat);
    esfera.position.copy(pos);
    cena.add(esfera);

    // Calota: a parte da esfera que passa perto do receptor, com o polo apontado para ele
    const dir = rPos.clone().sub(pos).normalize();
    const calotaMat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const calota = new THREE.Mesh(guardar(new THREE.SphereGeometry(1, 72, 10, 0, Math.PI * 2, 0, ABERTURA_CALOTA)), calotaMat);
    calota.position.copy(pos);
    calota.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    cena.add(calota);
    const bordaPts = [];
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      bordaPts.push(new THREE.Vector3(Math.sin(ABERTURA_CALOTA) * Math.cos(a), Math.cos(ABERTURA_CALOTA), Math.sin(ABERTURA_CALOTA) * Math.sin(a)));
    }
    const bordaMat = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0 });
    const borda = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bordaPts), bordaMat);
    calota.add(borda);
    descartar.push(linhaGeo, linhaMat, esferaMat, calotaMat, bordaMat, borda.geometry);

    return { s, pos, grupo, linha, linhaGeo, linhaMat, pulso, esfera, esferaMat, calota, calotaMat, bordaMat, dir, raioPseudo: s.pseudo * S };
  });
  descartar.push(...sats.flatMap(o => o.grupo.children.flatMap(c => [c.geometry, c.material])));

  // Estimativa: marcador, anel e o caminho das iterações
  const estimativa = new THREE.Group();
  const estMat = guardar(new THREE.MeshBasicMaterial({ color: COR.tinta }));
  estimativa.add(new THREE.Mesh(guardar(new THREE.SphereGeometry(0.07, 20, 14)), estMat));
  const anelMat = guardar(new THREE.MeshBasicMaterial({ color: COR.laranja, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
  const anel = new THREE.Mesh(guardar(new THREE.RingGeometry(0.16, 0.2, 48)), anelMat);
  anel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cima);
  estimativa.add(anel);
  cena.add(estimativa);
  const iter = cenario.solucao.iteracoes;
  const caminhoGeo = guardar(new THREE.BufferGeometry().setFromPoints(iter.map(it => v3(it.x))));
  const caminhoMat = guardar(new THREE.LineDashedMaterial({ color: COR.tinta, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.55 }));
  const caminho = new THREE.Line(caminhoGeo, caminhoMat);
  caminho.computeLineDistances();
  cena.add(caminho);

  // Eixos locais leste, norte e cima na solução (etapa 6)
  const eixos = new THREE.Group();
  [
    [leste, COR.azul],
    [norte, COR.turquesa],
    [cima, COR.oliva]
  ].forEach(([d, cor]) => {
    const seta = new THREE.ArrowHelper(d, new THREE.Vector3(), 1.1, cor, 0.22, 0.12);
    eixos.add(seta);
    descartar.push(seta.line.geometry, seta.line.material, seta.cone.geometry, seta.cone.material);
  });
  eixos.scale.setScalar(0.5);
  cena.add(eixos);

  /* ---------- Câmera ---------- */
  // Enquadramento geral (satélites e Terra) e de perto (as calotas cruzando sobre o receptor)
  // Geral: de cima e do sul, para separar os satélites. Perto: quase rasante, para ver as calotas passarem acima do receptor.
  const dirGeral = cima.clone().multiplyScalar(0.62).add(norte.clone().multiplyScalar(-0.72)).add(leste.clone().multiplyScalar(0.3)).normalize();
  const dirPerto = cima.clone().multiplyScalar(0.3).add(norte.clone().multiplyScalar(-0.86)).add(leste.clone().multiplyScalar(0.4)).normalize();
  const VISTAS = {
    geral: { alvo: rPos.clone().add(cima.clone().multiplyScalar(10)), dist: mobile ? 76 : 66, dir: dirGeral },
    perto: { alvo: rPos.clone().add(cima.clone().multiplyScalar(-0.3)), dist: mobile ? 4 : 3.4, dir: dirPerto },
    ponto: { alvo: rPos.clone(), dist: mobile ? 3.4 : 2.8, dir: dirPerto }
  };
  const giro = { yaw: 0, pitch: 0 };
  const atual = { alvo: VISTAS.geral.alvo.clone(), dist: VISTAS.geral.dist, dir: dirGeral.clone() };
  let vista = VISTAS.geral;

  function posicionarCamera(amortecer) {
    const k = amortecer && !reduzido ? 0.075 : 1;
    atual.alvo.lerp(vista.alvo, k);
    atual.dist += (vista.dist - atual.dist) * k;
    atual.dir.lerp(vista.dir, k).normalize();
    const d = atual.dir.clone().applyAxisAngle(cima, giro.yaw);
    const lado = new THREE.Vector3().crossVectors(d, cima).normalize();
    d.applyAxisAngle(lado, giro.pitch);
    camera.position.copy(atual.alvo).addScaledVector(d, atual.dist);
    camera.up.copy(cima);
    camera.lookAt(atual.alvo);
  }

  /* ---------- Estado ---------- */
  let estado = { etapa: 0, p: 0 };

  function aplicar() {
    const { etapa, p } = estado;
    vista = etapa <= 2 ? VISTAS.geral : etapa === 5 ? VISTAS.ponto : VISTAS.perto;
    // De perto, a Terra fica translúcida: as esferas com o erro do relógio passam por dentro dela
    const perto = etapa >= 3;
    terraMat.opacity = perto ? 0.5 : 1;
    terraMat.depthWrite = !perto;
    receptor.scale.setScalar(perto ? 0.45 : 1);
    estimativa.scale.setScalar(perto ? 0.6 : 1);

    // Ordem de chegada dos sinais: o mais próximo chega primeiro
    const tempos = sats.map(o => o.s.Δt);
    const tMin = Math.min(...tempos);
    const tMax = Math.max(...tempos);

    // Correção de relógio estimada até aqui (etapa 5 percorre as iterações)
    let bEst = 0;
    let xEst = null;
    if (etapa === 4) {
      const f = p * (iter.length - 1);
      const i0 = Math.floor(f);
      const i1 = Math.min(iter.length - 1, i0 + 1);
      const t = suave(f - i0);
      const a = iter[i0];
      const b = iter[i1];
      bEst = a.b + (b.b - a.b) * t;
      xEst = v3(a.x).lerp(v3(b.x), t);
    } else if (etapa === 5) {
      bEst = cenario.solucao.b;
      xEst = v3(cenario.solucao.x);
    }

    sats.forEach(o => {
      // Sinal: na etapa 1 avança do satélite ao receptor; depois fica inteiro
      const chegada = (o.s.Δt - tMin) / (tMax - tMin || 1);
      const avanco = etapa === 0 ? lim(p * 1.6 - chegada * 0.6) : 1;
      // A partir da combinação, a linha vai até a esfera medida (ρ − c·δt estimado), além do receptor se houver erro
      const ponta = etapa >= 3 ? o.pos.clone().addScaledVector(o.dir, o.raioPseudo - bEst * S) : o.pos.clone().lerp(rPos, suave(avanco));
      o.linhaGeo.setFromPoints([o.pos, ponta]);
      o.linha.computeLineDistances();
      o.linhaMat.opacity = etapa >= 3 ? 0.55 : 0.9;
      o.pulso.visible = etapa === 0 && avanco > 0 && avanco < 1;
      o.pulso.position.copy(ponta);

      // Esfera completa crescendo na etapa 3; some quando a calota assume
      const crescer = etapa === 2 ? suave(lim(p / 0.75)) : 0;
      o.esfera.visible = etapa === 2 && crescer > 0;
      o.esfera.scale.setScalar(Math.max(1e-3, o.raioPseudo * crescer));
      o.esferaMat.opacity = etapa === 2 ? 0.075 * (1 - lim((p - 0.75) / 0.25)) + 0.01 : 0;

      // Calota: raio medido (com erro do relógio) e, durante a solução, ρ − c·δt estimado
      const vis = etapa === 2 ? lim((p - 0.7) / 0.3) : etapa >= 3 ? 1 : 0;
      o.calota.visible = vis > 0;
      o.calota.scale.setScalar(o.raioPseudo - bEst * S);
      o.calotaMat.opacity = (etapa >= 3 ? 0.32 : 0.2) * vis;
      o.bordaMat.opacity = 0.85 * vis;
    });

    // Onda de chegada: um anel por satélite, na ordem dos tempos
    if (etapa === 1) {
      const fase = (p * sats.length) % 1;
      ondaMat.opacity = 0.6 * (1 - fase);
      onda.scale.setScalar(0.15 + fase * 0.9);
    } else ondaMat.opacity = 0;

    receptor.visible = etapa <= 3 || etapa === 4;
    estimativa.visible = xEst !== null && (etapa === 5 || p > 0.02);
    if (xEst) estimativa.position.copy(xEst);
    caminho.visible = etapa === 4;
    caminho.geometry.setDrawRange(0, Math.max(2, Math.ceil(p * (iter.length - 1)) + 1));
    eixos.visible = etapa === 5;
    if (xEst) eixos.position.copy(xEst);
  }

  /* ---------- Rótulos em HTML, posicionados pela projeção ---------- */
  const tela = new THREE.Vector3();
  function rotular() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pos = (el, p, visivel = true) => {
      if (!el) return;
      tela.copy(p).project(camera);
      const fora = tela.z > 1 || Math.abs(tela.x) > 1.05 || Math.abs(tela.y) > 1.05;
      el.style.opacity = visivel && !fora ? '1' : '0';
      el.style.transform = `translate(${((tela.x + 1) / 2) * w}px, ${((1 - tela.y) / 2) * h}px)`;
    };
    sats.forEach((o, i) => pos(rotulos[`sat-${i}`], o.pos, estado.etapa !== 5));
    pos(rotulos.receptor, rPos, estado.etapa <= 3);
    pos(rotulos.estimativa, estimativa.position, estimativa.visible && estado.etapa >= 4);
  }

  let quadro = 0;
  let pausada = false;
  function desenhar() {
    quadro = 0;
    posicionarCamera(true);
    sol.position.copy(camera.position);
    renderer.render(cena, camera);
    rotular();
    const parada = atual.alvo.distanceToSquared(vista.alvo) < 1e-6 && Math.abs(atual.dist - vista.dist) < 1e-3 && atual.dir.distanceToSquared(vista.dir) < 1e-8;
    if (!pausada && !parada) quadro = requestAnimationFrame(desenhar);
  }
  const pedir = () => {
    if (!quadro && !pausada) quadro = requestAnimationFrame(desenhar);
  };

  aplicar();
  posicionarCamera(false);

  return {
    definir(novo) {
      estado = novo;
      aplicar();
      pedir();
    },
    girar(dx, dy) {
      giro.yaw -= dx * 0.006;
      giro.pitch = lim(giro.pitch - dy * 0.005, -0.9, 0.7);
      pedir();
    },
    recentrar() {
      giro.yaw = 0;
      giro.pitch = 0;
      pedir();
    },
    redimensionar() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      pedir();
    },
    pausar(sim) {
      pausada = sim;
      if (sim && quadro) {
        cancelAnimationFrame(quadro);
        quadro = 0;
      } else pedir();
    },
    destruir() {
      cancelAnimationFrame(quadro);
      descartar.forEach(o => o?.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}

