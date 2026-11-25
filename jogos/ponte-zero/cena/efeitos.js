// Efeitos de desenho: rastros dos tiros (cada arma com sua cor), impactos, foguetes, fogo, explosões, marcas dos golpes.
// Nada pisca sozinho: todo efeito nasce de um tiro, acerto ou golpe e some suavemente.
import * as THREE from 'three';
import { materialDesenho, contorno, Pecas, caixaRedonda } from './desenho.js';
import { foguete, BOCA } from './armas.js';
import { PEGADAS } from './animacoes.js';
import { ARMAS } from '../dados/balanco.js';

const NP = 2400, MARCAS = 18;
// cor, meia largura e meio comprimento do rastro de cada arma
const RASTRO = [['#ffc21a', .13, 1.15], ['#12d0ff', .105, 1.05], ['#7dff1f', .125, 1.6], ['#ff7d0a', .135, 1.5], ['#ff4a2a', 0, 0], ['#ff7a1f', 0, 0]];
const lin = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
export const COR_ARMA = RASTRO.map(r => lin(r[0]));
const R = (a = 1) => (Math.random() - .5) * 2 * a;

export function criarEfeitos(cena, ruido, maxTiros) {
  const lixo = [], D = o => (lixo.push(o), o), V2 = RASTRO.map(r => new THREE.Vector2(r[1], r[2])), V3 = COR_ARMA.map(c => new THREE.Vector3(...c));
  const por = (g, m, ordem) => { const o = new THREE.Mesh(g, m); o.frustumCulled = false; o.renderOrder = ordem; cena.add(o); return o; };
  // ---------- rastros: um risco colorido, com miolo claro e borda escura, sempre de frente para a câmera ----------
  const gT = D(new THREE.InstancedBufferGeometry()); gT.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const aT = new THREE.InstancedBufferAttribute(new Float32Array(maxTiros * 4), 4).setUsage(THREE.DynamicDrawUsage), aK = new THREE.InstancedBufferAttribute(new Float32Array(maxTiros), 1).setUsage(THREE.DynamicDrawUsage); gT.setAttribute('aT', aT); gT.setAttribute('aK', aK); gT.instanceCount = 0;
  const mT = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uCor: { value: V3 }, uTam: { value: V2 } },
    vertexShader: 'attribute vec4 aT; attribute float aK; uniform vec3 uCor[6]; uniform vec2 uTam[6]; varying vec2 vU; varying float vA; varying vec3 vC; void main(){ int k = int(aK + .5); vU = position.xy; vA = aT.w; vC = uCor[k]; vec2 t = uTam[k]; vec3 dir = vec3(sin(aT.z), 0., -cos(aT.z)), c = vec3(aT.x, 1.0, aT.y); vec3 lado = normalize(cross(dir, cameraPosition - c)); float longe = max(1., distance(cameraPosition, c) * .045); gl_Position = projectionMatrix * viewMatrix * vec4(c + dir * position.y * t.y + lado * position.x * t.x * longe, 1.); }',
    fragmentShader: 'varying vec2 vU; varying float vA; varying vec3 vC; void main(){ float y = vU.y * .5 + .5, larg = mix(.2, 1., smoothstep(0., .55, y)) * sqrt(max(0., 1. - pow(max(0., (y - .7) / .3), 2.))), l = abs(vU.x) / max(larg, .001); if (l > 1.) discard; vec3 c = l < .34 ? mix(vC, vec3(1., 1., .92), .8) : l < .78 ? vC : vC * .18; gl_FragColor = vec4(c, vA * smoothstep(0., .3, y) * (l < .78 ? 1. : .75)); \n#include <colorspace_fragment>\n }',
  }));
  const tiros = por(gT, mT, 6);

  // ---------- estrela na boca do cano: acende com o tiro e apaga devagar (tiro seguido = brilho firme, sem piscar) ----------
  const gB = D(new THREE.InstancedBufferGeometry()); gB.setAttribute('position', gT.attributes.position);
  const aB = new THREE.InstancedBufferAttribute(new Float32Array(110 * 4), 4).setUsage(THREE.DynamicDrawUsage), aBk = new THREE.InstancedBufferAttribute(new Float32Array(110), 1).setUsage(THREE.DynamicDrawUsage); gB.setAttribute('aB', aB); gB.setAttribute('aK', aBk); gB.instanceCount = 0;
  const mB = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: { uCor: { value: V3 } },
    vertexShader: 'attribute vec4 aB; attribute float aK; uniform vec3 uCor[6]; varying vec2 vU; varying float vA; varying vec3 vC; void main(){ vU = position.xy; vA = aB.w; vC = uCor[int(aK + .5)]; vec4 c = viewMatrix * vec4(aB.xyz, 1.); c.xy += position.xy * (.1 + .12 * aB.w); gl_Position = projectionMatrix * c; }',
    fragmentShader: 'varying vec2 vU; varying float vA; varying vec3 vC; void main(){ float r = length(vU), a = atan(vU.y, vU.x), e = .55 + .4 * pow(abs(cos(a * 4.)), 3.); if (r > e) discard; gl_FragColor = vec4(r < e * .5 ? vec3(1., 1., .9) : mix(vC, vec3(1., .85, .3), .4), min(1., vA * 1.4) * .9); \n#include <colorspace_fragment>\n }',
  }));
  const bocas = por(gB, mB, 7); let nb = 0;

  // ---------- partículas ----------
  // tipos: 0 brilho, 1 pingo/pedrinha, 2 nuvem de desenho, 3 estrela de impacto, 4 fogo, 5 anel
  const gP = D(new THREE.BufferGeometry()), pos = new Float32Array(NP * 3), cor = new Float32Array(NP * 4), ext = new Float32Array(NP * 3);
  for (const [n, a, t] of [['position', pos, 3], ['aC', cor, 4], ['aE', ext, 3]]) gP.setAttribute(n, new THREE.BufferAttribute(a, t).setUsage(THREE.DynamicDrawUsage));
  const mP = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: { uAlt: { value: 800 }, tRuido: { value: ruido } },
    vertexShader: 'attribute vec4 aC; attribute vec3 aE; varying vec4 vC; varying vec3 vE; uniform float uAlt; void main(){ vC = aC; vE = aE; vec4 p = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * p; gl_PointSize = min(420., aE.x * uAlt * projectionMatrix[1][1] / -p.z); }',
    fragmentShader: `varying vec4 vC; varying vec3 vE; uniform sampler2D tRuido; void main(){ vec2 u = gl_PointCoord * 2. - 1.; float r = length(u), k = vC.a; if (r > 1.) discard; vec3 c = vC.rgb; float a = 1.; int t = int(vE.y + .5); float s = vE.z * 6.28;
      if (t == 0) { a = k * (1. - r) ; a *= a; gl_FragColor = vec4(c * a * 1.6, 0.); return; }
      if (t == 1) { a = smoothstep(1., .8, r) * min(1., k * 3.); if (r > .72) c *= .35; }
      else if (t == 2) { float e = .82 + .16 * sin(atan(u.y, u.x) * 5. + s); if (r > e) discard; c = u.x * .5 + u.y * .7 + r * .4 > .35 ? c * .66 : c; if (r > e - .09) c *= .55; a = min(1., k * 2.2) * .92; }
      else if (t == 3) { float an = atan(u.y, u.x) + s, e = .5 + .5 * pow(abs(cos(an * 3.5)), 2.5); if (r > e) discard; c = r < e * .45 ? vec3(1., 1., .92) : r < e * .8 ? c : c * .25; a = min(1., k * 1.8); }
      else if (t == 4) { float n = texture2D(tRuido, gl_PointCoord * .4 + vE.z).r, q = r + (n - .5) * .9; if (q > .42 + .55 * k) discard; c = q < .18 + .2 * k ? mix(vec3(1., .95, .55), c, 1. - k) : c; a = min(1., k * 3.) * .9; }
      else { if (abs(r - .84) > .13) discard; a = k * .85; c = abs(r - .84) > .085 ? c * .3 : c; }
      gl_FragColor = vec4(c, 1.); \n#include <colorspace_fragment>\n gl_FragColor = vec4(gl_FragColor.rgb * a, a); }`,
  }));
  const pontos = new THREE.Points(gP, mP); pontos.frustumCulled = false; pontos.renderOrder = 5; cena.add(pontos);
  const P = Array.from({ length: NP }, () => ({ v: 0 })); let prox = 0;
  function particula(x, y, z, vx, vy, vz, vida, tam, cresce, c, tipo, grav = 0) { const p = P[prox]; prox = (prox + 1) % NP; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.v = p.vt = vida; p.tam = tam; p.cresce = cresce; p.c = c; p.tipo = tipo; p.grav = grav; p.s = Math.random(); }
  const VERM = [.42, .012, .03], FUM = [.34, .3, .33], FUM2 = [.13, .11, .13], FOGO = [1, .36, .04], FOGO2 = [.85, .12, .02], AMAR = [1, .72, .12], PO = [.5, .42, .36], AZUL = [.15, .55, 1], BRANCO = [1, .97, .88];

  // ---------- manchas no chão ----------
  const NM = 110, gM = D(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), mM = D(new THREE.MeshLambertMaterial({ color: '#8c1020', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mM.onBeforeCompile = sh => { sh.uniforms.tRuido = { value: ruido }; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUm; varying float vS;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvUm = position.xz; vS = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .21;'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; varying vec2 vUm; varying float vS;').replace('#include <color_fragment>', 'float rr = length(vUm) * 2.; diffuseColor.a = smoothstep(.0, .03, texture2D(tRuido, vUm * .5 + vS).r * 1.25 - rr * .72 - .1) * .8;'); };
  const manchas = new THREE.InstancedMesh(gM, mM, NM); manchas.frustumCulled = false; manchas.renderOrder = 1; manchas.count = 0; cena.add(manchas); lixo.push(manchas); let im = 0; const Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), EY = new THREE.Vector3(0, 1, 0), P1 = new THREE.Vector3(), E1 = new THREE.Vector3();

  // ---------- anéis que se abrem no chão ----------
  const NA = 16, gA = D(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2)), mA = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, vertexShader: 'attribute vec4 aA; varying vec2 vU; varying vec4 vA; void main(){ vU = position.xz; vA = aA; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vU; varying vec4 vA; void main(){ float r = length(vU), w = .16 * vA.w + .02; float q = abs(r - .84); if (q > w) discard; gl_FragColor = vec4(q > w * .62 ? vA.rgb * .3 : vA.rgb, min(1., vA.w * 1.6) * .85); \n#include <colorspace_fragment>\n }' }));
  const aA = new THREE.InstancedBufferAttribute(new Float32Array(NA * 4), 4).setUsage(THREE.DynamicDrawUsage); gA.setAttribute('aA', aA); const aneis = new THREE.InstancedMesh(gA, mA, NA); aneis.frustumCulled = false; aneis.renderOrder = 4; cena.add(aneis); lixo.push(aneis); const AN = Array.from({ length: NA }, () => ({ t: 1, dur: 1 })); let ia = 0;
  const anel = (x, z, r, c, dur = .5, espera = 0) => { const a = AN[ia]; ia = (ia + 1) % NA; Object.assign(a, { x, z, r, c, dur, t: -espera }); };

  // ---------- marcas dos golpes do chefe: área listrada que se enche até a hora do golpe ----------
  const gK = D(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), mK = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    vertexShader: 'attribute vec4 aM; varying vec2 vU; varying vec4 vM; void main(){ vU = position.xz * 2.; vM = aM; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }',
    // aM: forma (0 faixa, 1 círculo), andamento, meia largura, meio comprimento
    fragmentShader: 'varying vec2 vU; varying vec4 vM; void main(){ vec2 m = vU * vM.zw; float borda, cheio, k = vM.y; if (vM.x > .5) { float r = length(vU); if (r > 1.) discard; borda = (1. - r) * vM.z; cheio = step(r, k); } else { borda = min((1. - abs(vU.x)) * vM.z, (1. - abs(vU.y)) * vM.w); cheio = step(-vU.y, k * 2. - 1.); } float l = step(.5, fract((m.x + m.y) * .42)); vec3 c = mix(vec3(1., .5, .02), vec3(.95, .05, .03), cheio); float a = mix(.2, .4, l) + cheio * .22; if (borda < .16) { c = cheio > .5 ? vec3(1., .12, .06) : vec3(1., .75, .1); a = .95; } if (borda < .05) { c *= .25; } gl_FragColor = vec4(c, a * smoothstep(0., .06, k + .02)); \n#include <colorspace_fragment>\n }' }));
  const aM = new THREE.InstancedBufferAttribute(new Float32Array(MARCAS * 4), 4).setUsage(THREE.DynamicDrawUsage); gK.setAttribute('aM', aM); const marcas = new THREE.InstancedMesh(gK, mK, MARCAS); marcas.frustumCulled = false; marcas.renderOrder = 2; marcas.count = 0; cena.add(marcas); lixo.push(marcas);

  // ---------- objetos sólidos: foguetes, pedras, porta arremessada, buracos ----------
  const mS = D(materialDesenho({}, { ruido })), mC = D(contorno({ esp: .024 })), mola = (P, n) => { const g = D(P.pronta()), m = new THREE.InstancedMesh(g, mS, n), b = new THREE.InstancedMesh(g, mC, n); for (const o of [m, b]) { o.frustumCulled = false; o.count = 0; cena.add(o); lixo.push(o); } m.castShadow = true; b.instanceMatrix = m.instanceMatrix; return { m, b, n: 0, por(M) { if (this.n < n) m.setMatrixAt(this.n++, M); }, fechar() { m.count = b.count = this.n; m.visible = b.visible = this.n > 0; m.instanceMatrix.needsUpdate = true; this.n = 0; } }; };
  const pF = new Pecas(); for (const [g, c] of foguete()) pF.por(g, c); const foguetes = mola(pF, 48);
  const pedras = mola(new Pecas().por(new THREE.DodecahedronGeometry(.62, 0), '#8d8494').por(new THREE.DodecahedronGeometry(.36, 0), '#6f6878', { x: .45, y: -.2 }).por(caixaRedonda(.12, 1.1, .12, .03, 1), '#b5562e', { x: -.3, y: .3, rz: .6 }), 6);
  const brasas = mola(new Pecas().por(new THREE.DodecahedronGeometry(.5, 0), '#ff7a1e').por(new THREE.DodecahedronGeometry(.36, 0), '#ffd24a', { y: -.24 }).por(new THREE.DodecahedronGeometry(.3, 0), '#5a2f2a', { x: .3, y: .25 }), 8);
  const bolas = mola(new Pecas().por(new THREE.IcosahedronGeometry(1.35, 1), '#f6fbff').por(new THREE.DodecahedronGeometry(.5, 0), '#c4dcf4', { x: .9, y: .5 }).por(new THREE.DodecahedronGeometry(.45, 0), '#c4dcf4', { x: -.8, y: -.6, z: .4 }).por(new THREE.DodecahedronGeometry(.4, 0), '#5a7a9a', { y: .9, z: -.6 }), 4);
  const gosmas = mola(new Pecas().por(new THREE.IcosahedronGeometry(.3, 1), '#8fe01f').por(new THREE.IcosahedronGeometry(.16, 1), '#c8ff5a', { x: .12, y: .2 }), 8);
  const tampas = mola(new Pecas().por(new THREE.CylinderGeometry(.95, .95, .2, 20).rotateX(Math.PI / 2), '#5d6678').por(new THREE.TorusGeometry(.78, .08, 6, 20), '#9aa5b8', { z: .1 }).por(caixaRedonda(1.2, .14, .14, .03, 1), '#9aa5b8', { z: .09 }).por(caixaRedonda(.14, 1.2, .14, .03, 1), '#9aa5b8', { z: .09 }), 2);
  const portas = mola(new Pecas().por(caixaRedonda(1.9, 1.5, .26, .1, 1), '#3fa34d').por(caixaRedonda(1.5, .7, .22, .06, 1), '#86c9e8', { y: .5, z: .05 }).por(caixaRedonda(.4, .12, .12, .04, 1), '#2c2a33', { x: .5, y: -.2, z: .15 }).por(caixaRedonda(1.9, .2, .34, .06, 1), '#2c2a33', { y: -.62 }), 2);
  const gBu = D(new THREE.CircleGeometry(1, 26).rotateX(-Math.PI / 2)), mBu = D(new THREE.ShaderMaterial({ fog: false, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, uniforms: { tRuido: { value: ruido } }, vertexShader: 'varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }', fragmentShader: 'uniform sampler2D tRuido; varying vec2 vU; void main(){ float a = atan(vU.y, vU.x), r = length(vU) + .07 * sin(a * 7.) + .05 * sin(a * 13. + 1.); if (r > .97) discard; vec3 c = r > .84 ? vec3(.34, .3, .36) : r > .72 ? vec3(.1, .085, .12) : vU.y < -.2 - .4 * (1. - r) ? vec3(.06, .05, .08) : vec3(.016, .014, .028); gl_FragColor = vec4(c, 1.); \n#include <colorspace_fragment>\n }' }));
  const buracos = new THREE.InstancedMesh(gBu, mBu, 4); buracos.frustumCulled = false; buracos.renderOrder = 1; buracos.count = 0; cena.add(buracos); lixo.push(buracos);

  // ---------- raios: risco quebrado do céu ao chão, some aos poucos ----------
  const NR = 10, LR = [], pR = [], iR = []; { let sx = 5; const al = () => (sx = (sx * 16807) % 2147483647) / 2147483647 - .5, nS = 11; for (let k = 0; k <= nS; k++) { const y = k / nS, x = k && k < nS ? al() * 1.5 * Math.min(1, y * 3) : 0, w = .07 + .1 * y; pR.push(x - w, y, -1, x + w, y, 1); if (k) { const a = (k - 1) * 2; iR.push(a, a + 1, a + 3, a, a + 3, a + 2); } } }
  const gR = D(new THREE.InstancedBufferGeometry()); gR.setAttribute('position', new THREE.Float32BufferAttribute(pR, 3)); gR.setIndex(iR); const aR = new THREE.InstancedBufferAttribute(new Float32Array(NR * 4), 4).setUsage(THREE.DynamicDrawUsage); gR.setAttribute('aR', aR); gR.instanceCount = 0;
  const mR = D(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, vertexShader: 'attribute vec4 aR; varying float vX, vA; void main(){ vX = position.z; vA = aR.z; vec3 r = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0])); vec3 p = vec3(aR.x, 0., aR.y) + r * position.x * aR.w * (.5 + .5 * vA) + vec3(0., position.y * 15., 0.); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }', fragmentShader: 'varying float vX, vA; void main(){ float x = abs(vX); vec3 c = x < .45 ? vec3(1., 1., .9) : x < .75 ? vec3(1., .85, .2) : vec3(.2, .3, .9); gl_FragColor = vec4(c, min(1., vA * 2.)); \n#include <colorspace_fragment>\n }' }));
  const raios = por(gR, mR, 6); function raio(x, z) { if (LR.length >= NR) LR.shift(); LR.push({ x, z, v: 1, s: Math.random() < .5 ? 1 : -1 }); }
  // luz local das explosões (só clareia em volta, sem clarão de tela)
  const luzExp = new THREE.PointLight('#ffa04a', 0, 16, 1.6); cena.add(luzExp);
  let comSangue = true, tempo = 0;
  const mat4 = (x, y, z, rx, ry, rz, e) => Mx.compose(P1.set(x, y, z), Q.setFromEuler(new THREE.Euler(rx, ry, rz)), E1.setScalar(e));

  const fx = {
    sangueLigado(s) { comSangue = s; manchas.visible = s; },
    sangue(x, y, z, n, forca = 1) { const c = comSangue ? VERM : PO; for (let i = 0; i < n; i++) particula(x + R(.12), y + R(.15), z, R(1.8) * forca, .8 + Math.random() * 2.4 * forca, -Math.random() * 3.2 * forca, .35 + Math.random() * .3, .05 + Math.random() * .07, 0, c, 1, 9); },
    mancha(x, z, t) { const i = im; im = (im + 1) % NM; Q.setFromAxisAngle(EY, Math.random() * 6.28); Mx.compose(P1.set(x, .012 + i * .00008, z), Q, E1.set(t, 1, t)); manchas.setMatrixAt(i, Mx); manchas.count = Math.min(NM, Math.max(manchas.count, i + 1)); manchas.instanceMatrix.needsUpdate = true; },
    // impacto do tiro: estrela na cor da arma e lascas
    impacto(x, y, z, arma, forca = 1) { const c = COR_ARMA[arma]; particula(x + R(.08), y + R(.1), z, 0, .3, .3, .2 + forca * .06, .3 * forca, .34 * forca, c, 3); for (let i = 0; i < 3; i++) particula(x, y, z, R(3.2), 1 + Math.random() * 2.4, Math.random() * 3, .24 + Math.random() * .16, .06, -.02, c, 1, 8); },
    faisca(x, y, z, n, c = AMAR) { for (let i = 0; i < n; i++) particula(x, y, z, R(3.4), 1 + Math.random() * 3, Math.random() * 3.5, .22 + Math.random() * .25, .055 + Math.random() * .03, -.02, c, 1, 8); },
    nuvem(x, y, z, n, c, tam, forca = 1, vida = .8) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, f = (.3 + Math.random()) * forca; particula(x + Math.cos(a) * tam * .3, y + R(.2), z + Math.sin(a) * tam * .3, Math.cos(a) * f, .4 + Math.random() * 1.2 * forca, Math.sin(a) * f, vida * (.6 + Math.random() * .6), tam * (.6 + Math.random() * .6), tam * .5, c, 2, -.2); } },
    explosao(x, z, raio = 3, y = .6) {
      const e = raio / 3; anel(x, z, raio * 1.15, AMAR, .55);
      for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, f = .6 + Math.random() * 2.6; particula(x + R(.3), y + R(.4), z + R(.3), Math.cos(a) * f * e, .8 + Math.random() * 3 * e, Math.sin(a) * f * e, .38 + Math.random() * .3, (.8 + Math.random() * .7) * e, .7 * e, i % 3 ? FOGO : AMAR, 4, -1); }
      for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28, f = .4 + Math.random() * 1.8; particula(x + R(.5), y + .3, z + R(.5), Math.cos(a) * f * e, 1.2 + Math.random() * 2 * e, Math.sin(a) * f * e, .9 + Math.random() * .7, (.7 + Math.random() * .6) * e, .8 * e, i % 2 ? FUM2 : FUM, 2, -.4); }
      for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, f = 3 + Math.random() * 5; particula(x, y, z, Math.cos(a) * f * e, 2 + Math.random() * 5, Math.sin(a) * f * e, .5 + Math.random() * .4, .09 + Math.random() * .08, -.03, i % 2 ? AMAR : FUM2, 1, 11); }
      particula(x, y + .4, z, 0, .4, 0, .3, 1.5 * e, 1.6 * e, AMAR, 3);
      luzExp.position.set(x, 1.6, z); luzExp.intensity = 34 * Math.min(1.4, e);
    },
    anel,
    portal(x, z, larg, bom) { const c = bom === 2 ? AMAR : bom ? AZUL : [1, .12, .06]; for (let i = 0; i < 46; i++) particula(x + R(larg), .2 + Math.random() * 2.8, z + R(.1), R(.6), R(.6), -1 - Math.random() * 3, .45 + Math.random() * .4, .1 + Math.random() * .08, -.06, c, i % 4 ? 1 : 3, 0); },
    // golpe do chefe: levanta poeira e pedras na área marcada
    golpe(m, dt) {
      const pedra = [.42, .38, .42];
      if (m.som === 'grito') { const c = [.85, .45, 1]; for (let i = 0; i < 6; i++) { const k = i / 5; particula(m.x, 1.6, -(m.d1 + (m.d0 - m.d1) * k * .4), 0, 0, 16 + i * 2, .75, .9 + i * .25, 3.2, c, 5); } return; }
      if (m.som === 'gosma') { const c = [.45, .85, .08]; anel(m.x, -m.d, m.r * 1.2, c, .45); for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28; particula(m.x + R(.3), .25, -m.d + R(.3), Math.cos(a) * 2.4, 2 + Math.random() * 2.6, Math.sin(a) * 2.4, .6, .12 + Math.random() * .16, 0, c, 1, 10); } return; }
      if (m.som === 'gelo') { const c = [.55, .85, 1]; anel(m.x, -m.d, m.r * 1.2, c, .5); for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28; particula(m.x + Math.cos(a) * m.r * .5, .2, -m.d + Math.sin(a) * m.r * .5, Math.cos(a) * 2, 2.5 + Math.random() * 3.5, Math.sin(a) * 2, .7, .14 + Math.random() * .16, 0, i % 3 ? c : BRANCO, 1, 10); } return; }
      if (m.som === 'raio') { raio(m.x, -m.d); anel(m.x, -m.d, m.r * 1.2, [1, .85, .2], .45); for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, f = 2 + Math.random() * 3; particula(m.x, .2, -m.d, Math.cos(a) * f, 1.5 + Math.random() * 3, Math.sin(a) * f, .45, .1 + Math.random() * .07, -.04, i % 2 ? [1, .85, .2] : [.4, .7, 1], 1, 7); } return; }
      if (m.bola) { const n = 22; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, f = 1 + Math.random() * 4; particula(m.x + R(.8), .6, -(m.d0 + 1.5) + R(.8), Math.cos(a) * f, 2 + Math.random() * 3, Math.sin(a) * f, .8, .2 + Math.random() * .3, 0, i % 3 ? BRANCO : [.75, .87, 1], i % 4 ? 1 : 2, 9); } return; }
      if (m.som === 'agua') { const c = m.forma === 'circulo'; if (c) { fx.agua(m.x, -m.d, 1.6, 44); anel(m.x, -m.d, m.r * 1.25, [.5, .9, 1], .5); } else for (let i = 0; i < 9; i++) fx.agua(m.x + R(m.larg * .4), -(m.d1 + (m.d0 - m.d1) * i / 8), 1.1, 12); return; }
      if (m.som === 'fogo') { const n = m.forma === 'circulo' ? 10 : 34, L = m.forma === 'faixa'; if (!L) anel(m.x, -m.d, m.r * 1.2, FOGO, .45); for (let i = 0; i < n; i++) { const x = m.x + R(L ? m.larg * .45 : m.r * .7), z = L ? -(m.d0 + (m.d1 - m.d0) * Math.random()) : -m.d + R(m.r * .7); particula(x, .2, z, R(.5), 2.6 + Math.random() * 3.4, R(.5), .5 + Math.random() * .4, .7 + Math.random() * .6, .5, i % 3 ? FOGO : AMAR, 4, -1); if (i % 3 === 0) particula(x, 1, z, R(.4), 1.6, R(.4), .9, .6, .6, FUM2, 2, -.4); } return; }
      if (m.vao) { for (let i = 0; i < 46; i++) { const x = m.vao.x0 + Math.random() * (m.vao.x1 - m.vao.x0), d = m.vao.d0 + Math.random() * (m.vao.d1 - m.vao.d0); particula(x, .1, -d, R(1), 1 + Math.random() * 2.5, R(1), 1.1, .25 + Math.random() * .4, 0, i % 3 ? pedra : [.62, .56, .68], 1, 14); if (i % 2) particula(x, .2, -d, R(.8), .6 + Math.random(), R(.8), .9, .9, .7, PO, 2, -.1); } return; }
      if (m.forma === 'circulo') { anel(m.x, -m.d, m.r * 1.25, m.som === 'onda' ? [.85, .45, 1] : AMAR, .5); fx.nuvem(m.x, .3, -m.d, 9, PO, .9, 2.2); for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28; particula(m.x + Math.cos(a) * m.r * .5, .2, -m.d + Math.sin(a) * m.r * .5, Math.cos(a) * 3, 3 + Math.random() * 4, Math.sin(a) * 3, .7, .12 + Math.random() * .14, 0, pedra, 1, 12); } return; }
      const n = Math.min(26, Math.round((m.d1 - m.d0) * .9)); for (let i = 0; i < n; i++) { const d = m.d0 + (m.d1 - m.d0) * (i + .5) / n, x = m.x + R(m.larg * .4); particula(x, .3, -d, R(.8), .8 + Math.random(), R(.6), .6 + Math.random() * .4, .8 + Math.random() * .5, .5, i % 2 ? PO : FUM, 2, -.2); particula(m.x + R(m.larg * .45), .15, -d, R(2), 2.5 + Math.random() * 4.5, R(2), .8, .13 + Math.random() * .14, 0, pedra, 1, 11); }
      for (let i = 0; i < 4; i++) anel(m.x, -(m.d1 + (m.d0 - m.d1) * i / 3.4), Math.min(2.6, m.larg * .5), AMAR, .4, i * .05);
    },
    agua(x, z, forca, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, f = Math.random() * 1.7 * forca; particula(x + R(.4) * forca, .2, z + R(.4) * forca, Math.cos(a) * f, (2.5 + Math.random() * 5) * Math.min(1.6, forca), Math.sin(a) * f, .7 + Math.random() * .4, .13 + Math.random() * .2, 0, i % 3 ? [.2, .68, .95] : BRANCO, 1, 10); if (i % 5 === 0) particula(x + R(.6), .6, z + R(.6), R(1), 2, R(1), .6, .6 * forca, .6, [.8, .95, 1], 2, .4); } },
    brasa(x, y, z) { particula(x, y, z, R(.5), 1.6 + Math.random(), R(.5), .9, .34, .3, Math.random() < .5 ? FOGO : AMAR, 4, -.6); },
    pingo(x, y, z) { particula(x, y, z, R(.4), 0, R(.4), .8, .1, 0, [.2, .68, .95], 1, 9); },
    pouso(x, z, r) { anel(x, z, r * 2.6, BRANCO, .7); anel(x, z, r * 1.8, AMAR, .55, .08); fx.nuvem(x, .4, z, 22, PO, 1.6, 5, 1.1); for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28, f = 3 + Math.random() * 6; particula(x + Math.cos(a) * r, .2, z + Math.sin(a) * r, Math.cos(a) * f, 3 + Math.random() * 6, Math.sin(a) * f, .9, .14 + Math.random() * .2, 0, FUM, 1, 12); } },
    confete(x, y, z, n = 60) { const C = [AMAR, AZUL, [1, .15, .1], [.2, .85, .25], BRANCO]; for (let i = 0; i < n; i++) particula(x + R(4), y + Math.random() * 3, z + R(3), R(1.6), 2 + Math.random() * 3, R(1.6), 1.6 + Math.random() * 1.2, .13 + Math.random() * .07, -.03, C[i % 5], 1, 2.6); },
    chama(x, y, z, dx, forca) { const f = 8.5 + Math.random() * 2.5; particula(x, y, z, dx * f + R(.7), .25 + R(.5), -f, .62 + Math.random() * .22, .22, 1.25 * forca, Math.random() < .25 ? AMAR : Math.random() < .6 ? FOGO : FOGO2, 4, -.7); },
    altura(px) { mP.uniforms.uAlt.value = px / 2; },
    // S = simulação; pos = função que diz onde fica a boca do cano
    atualizar(dt, S) {
      tempo += dt; let n = 0;
      for (const t of S.tiros) { if (t.arma === 4) { const a = Math.atan2(t.vx, t.vel); foguetes.por(mat4(t.x, 1.15, -t.d, 0, -a, (t.nasceu * 7 + t.d * .5) % 6.28, 1.25)); if (dt) { particula(t.x + R(.05), 1.15 + R(.05), -t.d + .5, R(.3), .2, 1.5, .7, .3, .5, FUM, 2, -.2); particula(t.x, 1.15, -t.d + .42, 0, 0, 2, .16, .34, -.1, AMAR, 4); } continue; } if (n >= maxTiros) break; aT.array.set([t.x, -t.d, Math.atan2(t.vx, t.vel), Math.min(1, t.resta / 4)], n * 4); aK.array[n++] = t.arma; }
      gT.instanceCount = n; for (const [a, t] of [[aT, 4], [aK, 1]]) { a.clearUpdateRanges(); a.addUpdateRange(0, n * t); a.needsUpdate = true; }
      nb = 0; for (const s of S.soldados) { if (s.calor < .08) continue; const arma = s.arma || S.arma, pg = ARMAS[arma].pegada, p = PEGADAS[pg].pos, [bz, by] = BOCA[pg]; if (arma === 5) { if (dt && s.calor > .4) for (let i = 0; i < 2; i++) fx.chama(s.x - p[0], p[1] + by, -s.d - p[2] - bz, s.mira || 0, 1); continue; } if (nb < 110) { aB.array.set([s.x - p[0], p[1] + by, -s.d - p[2] - bz - .05, s.calor * (arma === 4 ? 1.8 : .9)], nb * 4); aBk.array[nb++] = arma; } }
      gB.instanceCount = nb; aB.needsUpdate = aBk.needsUpdate = true;
      for (const z of S.zumbis) if (z.fogo > 0 && dt && Math.random() < .25) particula(z.x + R(.2), .4 + Math.random() * .9, -z.d + .1, R(.3), 1.2, 0, .4, .32, .1, FOGO, 4, -1);
      // marcas, pedras que caem e porta arremessada
      let k = 0; for (const m of S.marcas) { if (k >= MARCAS) break; const q = Math.min(1, m.t / m.dur), w = m.forma === 'faixa' ? m.larg : m.r * 2, h = m.forma === 'faixa' ? m.d1 - m.d0 : m.r * 2, cd = m.forma === 'faixa' ? (m.d0 + m.d1) / 2 : m.d; Mx.compose(P1.set(m.x, .035, -cd), Q.identity(), E1.set(w, 1, h)); marcas.setMatrixAt(k, Mx); aM.array.set([m.forma === 'faixa' ? 0 : 1, q, w / 2, h / 2], k * 4); k++;
        const falta = m.dur - m.t; if (m.cai && falta < .65) (m.cai === 'brasa' ? brasas : pedras).por(mat4(m.x, falta * 18 + .5, -m.d, tempo * 6, tempo * 4, 0, 1.1)); if (m.cai === 'brasa' && falta < .65 && dt) particula(m.x, falta * 18 + .9, -m.d, R(.4), 1, R(.4), .3, .5, .2, FOGO, 4); if (m.bola && falta < .95) { const f = 1 - falta / .95, dd = m.d1 + (m.d0 + 1.5 - m.d1) * f; bolas.por(mat4(m.x, 1.25, -dd, tempo * 9, 0, .2, 1)); if (dt) particula(m.x + R(.9), .3, -dd - 1, R(1), 1 + Math.random(), -1, .5, .45, .3, [.92, .96, 1], 2, -.1); } if (m.cospe) { const f = q; gosmas.por(mat4(m.cospe.x + (m.x - m.cospe.x) * f, 1.3 + Math.sin(f * Math.PI) * 4.2 - f * 1.1, -(m.cospe.d + (m.d - m.cospe.d) * f), tempo * 5, 0, tempo * 4, 1)); if (dt && Math.random() < .4) particula(m.cospe.x + (m.x - m.cospe.x) * f, 1.2 + Math.sin(f * Math.PI) * 4.2 - f, -(m.cospe.d + (m.d - m.cospe.d) * f), 0, 0, 0, .35, .16, -.05, [.45, .85, .08], 1, 5); } if (m.lanca && falta < .6 && S.chefe) { const f = 1 - falta / .6; (S.chefe.id === 'tampa' ? tampas : portas).por(mat4(S.chefe.x + (m.x - S.chefe.x) * Math.min(1, f * 1.6), 3.4 * (1 - f) + .9, -(S.chefe.d - 1 + (S.d + S.frente - 2 - S.chefe.d) * f), Math.PI / 2 - .3, 0, tempo * 14, 1.25)); } }
      for (let i = LR.length - 1; i >= 0; i--) if ((LR[i].v -= dt * 2.4) <= 0) LR.splice(i, 1); LR.forEach((r, i) => aR.array.set([r.x, r.z, r.v, r.s], i * 4)); gR.instanceCount = LR.length; raios.visible = LR.length > 0; aR.needsUpdate = true;
      marcas.count = k; marcas.visible = k > 0; marcas.instanceMatrix.needsUpdate = aM.needsUpdate = true; foguetes.fechar(); pedras.fechar(); portas.fechar(); brasas.fechar(); gosmas.fechar(); tampas.fechar(); bolas.fechar();
      if (S.adrT > 0 && dt) for (let i = 0; i < 2; i++) { const s = S.soldados[Math.floor(Math.random() * S.soldados.length)]; if (s) particula(s.x + R(.25), .15, -s.d + .2, 0, 1.6 + Math.random(), 1.2, .5, .13, -.05, i ? AMAR : FOGO, 1, -.5); }
      k = 0; for (const b of S.buracos) { const e = b.r * Math.min(1, b.t * 5, Math.max(0, (b.dur - b.t) * 2)); Mx.compose(P1.set(b.x, .02, -b.d), Q.setFromAxisAngle(EY, b.x * 3), E1.set(e, 1, e)); buracos.setMatrixAt(k++, Mx); } buracos.count = k; buracos.visible = k > 0; buracos.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NA; i++) { const a = AN[i]; a.t += dt; const q = Math.min(1, Math.max(0, a.t / a.dur)), vivo = a.t > 0 && q < 1, e = vivo ? a.r * (.25 + .75 * (1 - (1 - q) ** 2)) : 0; Mx.compose(P1.set(a.x || 0, .05, a.z || 0), Q.identity(), E1.set(e, 1, e)); aneis.setMatrixAt(i, Mx); aA.array.set([...(a.c || BRANCO), vivo ? 1 - q : 0], i * 4); } aneis.instanceMatrix.needsUpdate = aA.needsUpdate = true;
      for (let i = 0; i < NP; i++) {
        const p = P[i], o = i * 4, e = i * 3; if (p.v <= 0) { if (ext[e]) { ext[e] = 0; cor[o + 3] = 0; pos[e + 1] = -99; } continue; }
        p.v -= dt; p.vy -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.tipo === 2 || p.tipo === 4) { const q = 1 - dt * (p.tipo === 2 ? 1.6 : .9); p.vx *= q; p.vz *= q; } if (p.y < .03 && p.grav > 0) { p.y = .03; p.vx = p.vz = p.vy = 0; }
        const q = Math.max(0, p.v / p.vt); pos[e] = p.x; pos[e + 1] = p.y; pos[e + 2] = p.z; cor[o] = p.c[0]; cor[o + 1] = p.c[1]; cor[o + 2] = p.c[2]; cor[o + 3] = q; ext[e] = Math.max(.001, p.tam + p.cresce * (p.tipo === 3 ? 1 - q * q : 1 - q)); ext[e + 1] = p.tipo; ext[e + 2] = p.s;
      }
      gP.attributes.position.needsUpdate = gP.attributes.aC.needsUpdate = gP.attributes.aE.needsUpdate = true;
      luzExp.intensity = Math.max(0, luzExp.intensity - dt * 80);
    },
    limpar() { LR.length = 0; for (const p of P) p.v = 0; for (const a of AN) a.t = 9; manchas.count = 0; im = 0; luzExp.intensity = 0; },
    dispose() { for (const o of lixo) o.dispose(); for (const o of [raios, tiros, bocas, pontos, manchas, aneis, marcas, buracos, luzExp, ...[foguetes, pedras, portas, brasas, gosmas, tampas, bolas].flatMap(q => [q.m, q.b])]) o.removeFromParent(); },
  };
  return fx;
}
