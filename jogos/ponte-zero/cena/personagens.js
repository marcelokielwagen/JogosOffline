// Multidões: cada tipo de personagem é desenhado de uma vez só (InstancedMesh), animado pela placa de vídeo.
import * as THREE from 'three';
import { gravarMovimentos, NB } from './animacoes.js';
import { MAT, LUZ, RECORTE, paleta, contorno } from './desenho.js';

const ESCALA = 1 / 14000;

export async function carregarModelos(url) {
  const r = await fetch(url); if (!r.ok) throw new Error('modelos: ' + r.status);
  const buf = await r.arrayBuffer(), n = new DataView(buf).getUint32(0, true), cab = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, n))), ini = 4 + n;
  const le = (T, [o, c]) => new T(buf.slice(ini + o, ini + o + c * T.BYTES_PER_ELEMENT)), out = {};
  for (const nome in cab.modelos) {
    const m = cab.modelos[nome];
    out[nome] = {
      juntas: m.juntas,
      lods: m.lods.map(l => {
        const g = new THREE.BufferGeometry(), q = le(Int16Array, l.p), p = new Float32Array(q.length);
        for (let i = 0; i < q.length; i++) p[i] = q[i] * ESCALA;
        g.setAttribute('position', new THREE.BufferAttribute(p, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(tres(le(Int8Array, l.n)), 3, true));
        g.setAttribute('aB', new THREE.BufferAttribute(le(Uint8Array, l.b), 4)); g.setAttribute('aW', new THREE.BufferAttribute(le(Uint8Array, l.w), 4, true));
        g.setIndex(new THREE.BufferAttribute(le(Uint16Array, l.i), 1));
        return g;
      }),
    };
  }
  return out;
}
function tres(a) { const n = a.length / 4, r = new Int8Array(n * 3); for (let i = 0; i < n; i++) { r[i * 3] = a[i * 4]; r[i * 3 + 1] = a[i * 4 + 1]; r[i * 3 + 2] = a[i * 4 + 2]; } return r; }

// ruído usado para manchas de tinta, sujeira, nuvens e sangue (R=manchas, G=médio, B=fio, A=respingos)
export function texturaRuido() {
  const N = 256, d = new Uint8Array(N * N * 4);
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const camada = per => { const g = Float32Array.from({ length: per * per }, rnd); return (x, y) => { const u = x / N * per, v = y / N * per, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, f = t => t * t * (3 - 2 * t), q = (m, n) => g[((n + per) % per) * per + (m + per) % per]; return (q(i, j) * (1 - f(a)) + q(i + 1, j) * f(a)) * (1 - f(b)) + (q(i, j + 1) * (1 - f(a)) + q(i + 1, j + 1) * f(a)) * f(b); }; };
  const A = [4, 8, 16, 32, 64].map(camada), B = [16, 32, 64, 128].map(camada), C = [8, 16, 32].map(camada), D = camada(5);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const o = (y * N + x) * 4;
    d[o] = 255 * (A[0](x, y) * .4 + A[1](x, y) * .3 + A[2](x, y) * .18 + A[3](x, y) * .08 + A[4](x, y) * .04);
    d[o + 1] = 255 * (B[0](x, y) * .4 + B[1](x, y) * .3 + B[2](x, y) * .2 + B[3](x, y) * .1);
    d[o + 2] = 255 * (.5 + .25 * Math.sin(x * Math.PI / 2) * Math.sin(y * Math.PI / 2) + (rnd() - .5) * .4);
    d[o + 3] = 255 * Math.min(1, Math.max(0, (C[0](x, y) * .5 + C[1](x, y) * .3 + C[2](x, y) * .2 - .5) * 5 + .35) * (.4 + D(x, y)));
  }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

const OSSOS = /* glsl */`
  attribute vec4 aB; attribute vec4 aW; attribute vec4 aAnim;
  uniform highp sampler2D tOssos;
  mat4 ossoMat(int b, int q) { vec4 x = texelFetch(tOssos, ivec2(b * 3, q), 0), y = texelFetch(tOssos, ivec2(b * 3 + 1, q), 0), z = texelFetch(tOssos, ivec2(b * 3 + 2, q), 0);
    return mat4(x.x, y.x, z.x, 0., x.y, y.y, z.y, 0., x.z, y.z, z.z, 0., x.w, y.w, z.w, 1.); }
  mat4 pele() { int q = int(aAnim.x); return ossoMat(int(aB.x), q) * aW.x + ossoMat(int(aB.y), q) * aW.y + ossoMat(int(aB.z), q) * aW.z; }
`;
// canos da metralhadora giram em volta do próprio eixo (altura .02)
const GIRA = `if (aB.w > 23.5 && aB.w < 24.5) { float cg = cos(uGiro), sg = sin(uGiro); posO.y -= .02; posO.xy = mat2(cg, sg, -sg, cg) * posO.xy; posO.y += .02; nO.xy = mat2(cg, sg, -sg, cg) * nO.xy; }`;
function ligarOssos(sh, tex) {
  sh.uniforms.tOssos = { value: tex };
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + OSSOS).replace('#include <begin_vertex>', 'mat4 mPele = pele();\nvec3 transformed = (mPele * vec4(position, 1.)).xyz;');
}

// Cores por material. TIPO 0 = soldado, 1 = zumbi, 2 = chefe. vAn.y = semente, vAn.w = variação
const CORES = /* glsl */`
  vec4 n1 = texture2D(tRuido, vRep.xy * 1.15 + vRep.z * .9 + vAn.y * 7.31);
  float s1 = fract(vAn.y * 13.17), s2 = fract(vAn.y * 37.71), s3 = fract(vAn.y * 91.3);
  int mt = int(vMat + .5); vec3 c = uPal[mt]; int va = int(vAn.w + .05); float luz = 0.;
  #if TIPO == 0
    vec3 K = va == 1 ? vec3(.9, .52, .03) : va == 2 ? vec3(.72, .05, .035) : va == 3 ? vec3(.2, .07, .33) : uPal[5];
    if (mt == 0) c = s1 < .34 ? uPal[0] : s1 < .62 ? vec3(.62, .33, .17) : s1 < .84 ? vec3(.3, .14, .07) : vec3(.9, .56, .4);
    else if (mt == 6) c = s2 < .4 ? uPal[6] : s2 < .65 ? vec3(.02, .015, .02) : s2 < .85 ? vec3(.45, .2, .05) : vec3(.5, .1, .03);
    else if (mt == 5) { c = K; float fx = abs(vRep.x); c = mix(c, vec3(1., .93, .78), step(fx, .034) * step(1.2, vRep.y) * (1. - step(.0455, fx))); if (fx > .034 && fx < .046) c *= .55; }
    else if (mt == 4) c = mix(uPal[4], K * .62, va > 0 ? .85 : .25);
    else if (mt == 1 || mt == 2) { float m = step(.53, n1.r); c = mix(c, c * .68, m); }
    else if (mt == 10) c = va == 0 ? c : mix(c, K, .35);
    else if (mt == 11 && va > 0) c = vec3(1., .93, .78);
  #elif TIPO == 1
    bool corre = va == 1, fogo = fract(vAn.w + .1) > .4;
    if (mt == 0) { c = s1 < .4 ? vec3(.24, .46, .13) : s1 < .72 ? vec3(.13, .4, .24) : vec3(.38, .44, .1); if (corre) c = vec3(.55, .33, .1); c = mix(c, c * .72, step(.56, n1.r)); }
    else if (mt == 1) { c = s2 < .22 ? vec3(.33, .1, .42) : s2 < .45 ? vec3(.5, .09, .16) : s2 < .68 ? vec3(.12, .17, .42) : s2 < .86 ? vec3(.5, .42, .28) : vec3(.07, .3, .34); if (corre) c = vec3(.62, .07, .04); if (s3 > .6 && !corre) c *= .62 + .38 * step(.5, fract(vRep.y * 9.)); }
    else if (mt == 2) c = s3 < .4 ? vec3(.07, .09, .2) : s3 < .7 ? vec3(.2, .13, .08) : vec3(.1, .08, .12);
    else if (mt == 6) c = s2 < .3 ? vec3(.02, .015, .02) : s2 < .6 ? vec3(.25, .1, .03) : s2 < .85 ? vec3(.42, .4, .4) : vec3(.5, .12, .02);
    else if (mt == 8) { c = vec3(1., .93, .4); luz = .25; }
    else if (mt == 11) c = s1 < .5 ? vec3(.6, .06, .05) : vec3(.05, .2, .5);
    if (mt <= 2) { float sang = smoothstep(.7, .75, n1.a * (.55 + s1 * .4)) * uSangue; c = mix(c, vec3(.3, .012, .02), sang); }
    if (fogo) c = mix(c, vec3(.13, .06, .04), .55);
  #else
    if (mt == 0) c = mix(c, c * .74, step(.55, n1.r));
    else if (mt == 1 || mt == 2) c = mix(c, c * .78, step(.56, n1.g));
    else if (mt == 21) c = fract(vRep.z * 2.6 + vRep.y * 1.2) < .5 ? uPal[16] : uPal[17];
    else if (mt == 8) luz = .35;
  #endif
  if (mt == 25) luz = 1.; if (mt == 7) luz = .25;
  if (vArma > .5 && mt == 15) c = mix(c, c * .8, step(.6, n1.r));
  diffuseColor.rgb = c * mix(.5, 1., vAO);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1., .5, .3), vAn.z * (TIPO == 2 ? .16 : .5));
`;

// "pal" é a paleta; tex é a textura com as poses
export function materialPersonagem(tipo, tex, ruido, pal) {
  const m = new THREE.MeshToonMaterial();
  m.userData.u = { uSangue: { value: 1 }, uPal: { value: pal }, uGiro: { value: 0 }, uBorda: { value: 1 } };
  m.defines = { ...m.defines, TIPO: tipo };
  m.onBeforeCompile = sh => {
    ligarOssos(sh, tex); sh.uniforms.tRuido = { value: ruido }; Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGiro; varying vec3 vRep; varying vec4 vAn; flat varying float vMat; varying float vAO; flat varying float vArma;')
      .replace('#include <beginnormal_vertex>', `vec3 posO = position, nO = normal; ${GIRA}\nmat4 mN = pele();\nvec3 objectNormal = mat3(mN) * nO;\nvRep = position; vAn = aAnim; vMat = aB.w; vAO = aW.w; vArma = float(aB.x > 15.5);`)
      .replace('mat4 mPele = pele();\nvec3 transformed = (mPele * vec4(position, 1.)).xyz;', 'vec3 transformed = (mN * vec4(posO, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform sampler2D tRuido; uniform vec3 uPal[${MAT.NUM}]; uniform float uSangue, uBorda; varying vec3 vRep; varying vec4 vAn; flat varying float vMat; varying float vAO; flat varying float vArma;`)
      .replace('#include <gradientmap_pars_fragment>', LUZ).replace('#include <color_fragment>', CORES)
      .replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, c, luz);\n' + RECORTE);
  };
  m.customProgramCacheKey = () => 'ss' + tipo;
  return m;
}
export function contornoPersonagem(tex, uGiro, esp) { return contorno({ esp, osso: OSSOS + 'uniform float uGiro;', matriz: 'pele()', antes: GIRA, uniforms: { tOssos: { value: tex }, uGiro } }); }
export function sombraPersonagem(tex) {
  const invis = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); invis.onBeforeCompile = sh => ligarOssos(sh, tex); invis.customProgramCacheKey = () => 'ssInvis';
  const prof = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); prof.onBeforeCompile = sh => ligarOssos(sh, tex); prof.customProgramCacheKey = () => 'ssProf';
  return [invis, prof];
}

// Uma multidão com vários níveis de detalhe. A cada quadro: limpar(), por(...) para cada personagem, fechar().
export class Multidao {
  constructor(cena, modelo, nome, { max, tipo, ruido, pal = {}, lods = [0, 1, 2], limites = [14, 30], comContorno = 1, esp = .022 }) {
    this.mov = gravarMovimentos(nome, modelo.juntas); this.max = max; this.limites = limites; this.grupo = new THREE.Group(); cena.add(this.grupo);
    this.mat = materialPersonagem(tipo, this.mov.tex, ruido, paleta(pal)); this.matC = contornoPersonagem(this.mov.tex, this.mat.userData.u.uGiro, esp);
    this.malhas = lods.map(l => this.#malha(modelo.lods[l], this.mat, max));
    // contorno só nos modelos de perto
    this.bordas = this.malhas.slice(0, comContorno).map(b => this.#irma(b, this.matC));
    // sombra: usa o modelo mais simples
    const [invis, prof] = sombraPersonagem(this.mov.tex);
    this.sombra = this.#malha(modelo.lods.at(-1), invis, max); this.sombra.castShadow = true; this.sombra.customDepthMaterial = prof; this.sombra.renderOrder = -1; this.extras = [invis, prof];
    this.acessorios = []; this.n = []; this.M = new THREE.Matrix4();
  }
  #malha(geo, mat, max) {
    const g = new THREE.BufferGeometry(); for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]); g.setIndex(geo.index);
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aAnim', a);
    const m = new THREE.InstancedMesh(g, mat, max); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.receiveShadow = true; m.count = 0; this.grupo.add(m); return m;
  }
  // mesma malha e mesmas posições, outro material
  #irma(b, mat) { const m = new THREE.InstancedMesh(b.geometry, mat, 1); m.instanceMatrix = b.instanceMatrix; m.frustumCulled = false; m.count = 0; m.userData.base = b; this.grupo.add(m); return m; }
  // arma na mão (cada arma tem a própria lista, então cada soldado pode levar uma diferente)
  acessorio(geo, borda = true) { const m = this.#malha(geo, this.mat, this.max); m.receiveShadow = false; const a = { m, geo, n: 0, b: borda ? this.#irma(m, this.matC) : null }; this.acessorios.push(a); return this.acessorios.length - 1; }
  quadro(clipe, fase, volta = true) { const c = this.mov.clipes[clipe]; return c.ini + Math.min(c.n - 1, Math.floor(volta ? (((fase % 1) + 1) % 1) * c.n : fase * c.n)); }
  limpar() { this.n = this.malhas.map(() => 0); this.ns = 0; for (const a of this.acessorios) a.n = 0; }
  por(x, y, z, ang, escX, escY, quadro, semente, dano, dist, extra = 0, sombra = true, arma = -1) {
    let l = 0; while (l < this.limites.length && l < this.malhas.length - 1 && dist > this.limites[l]) l++;
    const m = this.malhas[l], i = this.n[l]; if (i >= this.max) return;
    const c = Math.cos(ang), s = Math.sin(ang), e = this.M.elements;
    e[0] = c * escX; e[2] = -s * escX; e[5] = escY; e[8] = s * escX; e[10] = c * escX; e[12] = x; e[13] = y; e[14] = z;
    const grava = (q, k) => { q.instanceMatrix.array.set(e, k * 16); const a = q.geometry.attributes.aAnim.array, o = k * 4; a[o] = quadro; a[o + 1] = semente; a[o + 2] = dano; a[o + 3] = extra; };
    grava(m, i); this.n[l]++;
    if (sombra && this.ns < this.max) grava(this.sombra, this.ns++);
    if (arma >= 0) { const a = this.acessorios[arma]; if (a.n < this.max) grava(a.m, a.n++); }
  }
  fechar() {
    const envia = (m, n) => { m.count = n; m.visible = n > 0; if (!n) return; for (const [at, t] of [[m.instanceMatrix, 16], [m.geometry.attributes.aAnim, 4]]) { at.clearUpdateRanges(); at.addUpdateRange(0, n * t); at.needsUpdate = true; } };
    this.malhas.forEach((m, i) => envia(m, this.n[i])); envia(this.sombra, this.ns);
    for (const a of this.acessorios) { envia(a.m, a.n); if (a.b) { a.b.count = a.n; a.b.visible = a.n > 0; } }
    for (const b of this.bordas) { b.count = b.userData.base.count; b.visible = b.count > 0; }
  }
  dispose() {
    this.mov.tex.dispose(); this.mat.dispose(); this.matC.dispose(); for (const x of this.extras) x.dispose();
    for (const m of [...this.malhas, ...this.bordas, this.sombra, ...this.acessorios.flatMap(a => a.b ? [a.m, a.b] : [a.m])]) { m.geometry.dispose(); m.dispose(); }
    for (const a of this.acessorios) a.geo.dispose();
    this.grupo.removeFromParent();
  }
}
export { NB };
