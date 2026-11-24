// Multidões: cada tipo de personagem é desenhado de uma vez só (InstancedMesh), animado pela placa de vídeo.
import * as THREE from 'three';
import { gravarMovimentos, NB } from './animacoes.js';

const ESCALA = 1 / 16000;

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

// ruído usado para camuflagem, tecido, sujeira e sangue (R=manchas, G=médio, B=fio do tecido, A=respingos)
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

const PELE_VERT = /* glsl */`
  attribute vec4 aB; attribute vec4 aW; attribute vec4 aAnim;
  uniform highp sampler2D tOssos;
  mat4 ossoMat(int b, int q) { vec4 x = texelFetch(tOssos, ivec2(b * 3, q), 0), y = texelFetch(tOssos, ivec2(b * 3 + 1, q), 0), z = texelFetch(tOssos, ivec2(b * 3 + 2, q), 0);
    return mat4(x.x, y.x, z.x, 0., x.y, y.y, z.y, 0., x.z, y.z, z.z, 0., x.w, y.w, z.w, 1.); }
  mat4 pele() { int q = int(aAnim.x); return ossoMat(int(aB.x), q) * aW.x + ossoMat(int(aB.y), q) * aW.y + ossoMat(int(aB.z), q) * aW.z; }
`;
function ligarOssos(sh, tex) {
  sh.uniforms.tOssos = { value: tex };
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + PELE_VERT)
    .replace('#include <begin_vertex>', 'mat4 mPele = pele();\nvec3 transformed = (mPele * vec4(position, 1.)).xyz;');
}

// Cores por material. tipo 0 = soldado, 1 = zumbi.
const CORES = /* glsl */`
  vec4 n1 = texture2D(tRuido, vRep.xy * 2.3 + vRep.z * 1.7 + vAn.y * 7.31), n2 = texture2D(tRuido, vRep.zy * 2.1 + vRep.x * 1.3 + vAn.y * 3.7), fio = texture2D(tRuido, vRep.xy * 11. + vRep.z * 8.);
  float camo = mix(n1.r, n2.r, .5), grao = fio.b - .5, suj = n2.g;
  float s1 = fract(vAn.y * 13.17), s2 = fract(vAn.y * 37.71), s3 = fract(vAn.y * 91.3);
  vec3 c = vec3(.5); float ru = .85, me = 0.;
  int mt = int(vMat + .5);
  #if TIPO == 0
    vec3 camA = vec3(.15, .165, .105), camB = vec3(.085, .095, .06), camC = vec3(.235, .21, .145), camD = vec3(.035, .036, .03);
    vec3 cam = camo < .42 ? camB : camo < .56 ? camA : camC; cam = mix(cam, camD, smoothstep(.6, .63, n1.g) * .9);
    if (mt == 0) { c = mix(vec3(.46, .27, .19), vec3(.17, .09, .06), s1 * s1); c *= .9 + .2 * n1.g; ru = .55; }
    else if (mt == 1 || mt == 2) { c = cam * (mt == 2 ? .92 : 1.); }
    else if (mt == 3) { c = vec3(.036, .033, .03); ru = .58; }
    else if (mt == 4) { c = vec3(.115, .115, .085); c *= .85 + .3 * n1.g; c *= 1. - .25 * step(.82, fract(vRep.y * 26.)); ru = .8; }
    else if (mt == 5) { c = vArma > .5 ? vec3(.045, .046, .05) : mix(vec3(.1, .105, .075), vec3(.15, .145, .11), n1.r); ru = vArma > .5 ? .36 : .6; me = vArma > .5 ? .85 : 0.; }
    else if (mt == 7) { c = vec3(.02, .016, .012); ru = .07; me = .6; }
    else { c = vec3(.14, .125, .085) * (.8 + .4 * n1.g); c *= 1. - .3 * step(.86, fract(vRep.y * 19. + .3)); }
    c *= 1. + grao * (ru > .7 ? .5 : .12); c = mix(c, vec3(.16, .13, .1), .28 * smoothstep(.55, .0, vRep.y) * suj * (1. - vArma));
    if (vArma > .5) c = mix(c, vec3(.14), smoothstep(.62, .75, n1.g) * .35);
  #else
    vec3 pel = mix(vec3(.21, .235, .17), vec3(.25, .2, .165), s1); pel = mix(pel, vec3(.14, .16, .155), s3 * .6);
    if (mt == 0) { c = pel * (.65 + .6 * n1.g); c = mix(c, vec3(.1, .045, .06), smoothstep(.5, .68, camo) * .75); ru = .48; }
    else if (mt == 1) { c = s2 < .25 ? vec3(.24, .2, .16) : s2 < .5 ? vec3(.07, .1, .15) : s2 < .75 ? vec3(.2, .07, .06) : vec3(.11, .12, .1); if (s3 > .55) c *= .7 + .6 * step(.5, fract((vRep.x + vRep.z * .6) * 14.)) * step(.5, fract(vRep.y * 12.)); }
    else if (mt == 2) { c = s3 < .4 ? vec3(.06, .08, .12) : s3 < .7 ? vec3(.13, .11, .085) : vec3(.05, .05, .05); }
    else if (mt == 3) { c = vec3(.04, .032, .026); ru = .7; }
    else if (mt == 6) { c = mix(vec3(.025, .02, .015), vec3(.2, .17, .14), s2 * s2); c *= .6 + .8 * n1.g; }
    else if (mt == 8) { c = vec3(.78, .74, .6); ru = .2; }
    else { c = mix(vec3(.09, .012, .01), vec3(.03, .006, .006), n1.g); ru = .35; }
    if (mt == 1 || mt == 2) { c *= 1. + grao * .6; float rasgo = smoothstep(.6, .66, mix(n1.r, n2.g, .45) + s2 * .06); c = mix(c, pel * .75, rasgo * .85); c *= 1. - .6 * smoothstep(.54, .6, mix(n1.r, n2.g, .45)) * (1. - rasgo); }
    if (vAn.w > .5 && (mt == 1 || mt == 6)) { c = vec3(.055, .06, .068) * (.8 + .4 * n1.g); c *= 1. - .35 * step(.9, fract(vRep.y * 9.)); ru = .5; me = .25; }
    float sang = smoothstep(.5, .95, n1.a * (.5 + s1 * .45) + (mt == 0 && vRep.y > 1.4 && vRep.z > .05 ? .22 : 0.)) * uSangue;
    if (mt != 8 && mt != 6) { c = mix(c, vec3(.075, .009, .007), sang * .85); ru = mix(ru, .3, sang); }
    c = mix(c, vec3(.1, .08, .06), .5 * suj * smoothstep(.9, .0, vRep.y));
  #endif
  diffuseColor.rgb = c * mix(.35, 1., vAO) * uClaro;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.75, .2, .12), vAn.z * .55);
`;

function material(tipo, mov, ruido, qual, armas) {
  const m = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
  m.userData.u = { uSangue: { value: 1 }, uClaro: { value: 1.25 } };
  m.defines = { ...m.defines, TIPO: tipo };
  m.onBeforeCompile = sh => {
    ligarOssos(sh, mov.tex); sh.uniforms.tRuido = { value: ruido }; Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRep; varying vec4 vAn; flat varying float vMat; varying float vAO; flat varying float vArma;')
      .replace('#include <beginnormal_vertex>', 'mat4 mN = pele();\nvec3 objectNormal = mat3(mN) * normal;\nvRep = position; vAn = aAnim; vMat = aB.w; vAO = aW.w; vArma = float(aB.x > 15.5);')
      .replace('mat4 mPele = pele();', 'mat4 mPele = mN;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; uniform float uSangue, uClaro; varying vec3 vRep; varying vec4 vAn; flat varying float vMat; varying float vAO; flat varying float vArma;')
      .replace('#include <color_fragment>', CORES)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = ru;').replace('#include <metalnessmap_fragment>', 'float metalnessFactor = me;')
      .replace('#include <normal_fragment_maps>', qual >= 1 ? `#include <normal_fragment_maps>
        { float hh = (fio.b * .5 + n1.g * 1.6) * .0035 * (1. - vArma); vec3 dx = dFdx(-vViewPosition), dy = dFdy(-vViewPosition); vec3 r1 = cross(dy, normal), r2 = cross(normal, dx); float det = dot(dx, r1); vec3 gr = sign(det) * (dFdx(hh) * r1 + dFdy(hh) * r2); normal = normalize(abs(det) * normal - gr); }` : '#include <normal_fragment_maps>')
      .replace('#include <aomap_fragment>', 'reflectedLight.indirectDiffuse *= vAO; reflectedLight.indirectSpecular *= vAO * .8;');
  };
  m.customProgramCacheKey = () => 'pz' + tipo + qual;
  return m;
}

// Uma multidão com vários níveis de detalhe. A cada quadro: limpar(), por(...) para cada personagem, fechar().
export class Multidao {
  constructor(cena, modelo, nome, { max, tipo, ruido, qual, lods = [0, 1, 2], sombra = true, limites = [14, 30] }) {
    this.mov = gravarMovimentos(nome, modelo.juntas); this.max = max; this.limites = limites; this.grupo = new THREE.Group(); cena.add(this.grupo);
    this.mat = material(tipo, this.mov, ruido, qual);
    this.malhas = lods.map(l => this.#malha(modelo.lods[l], this.mat, max));
    // sombra: usa o modelo mais simples
    this.sombra = null;
    if (sombra) {
      const invis = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
      invis.onBeforeCompile = sh => ligarOssos(sh, this.mov.tex); invis.customProgramCacheKey = () => 'pzInvis';
      const prof = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
      prof.onBeforeCompile = sh => ligarOssos(sh, this.mov.tex); prof.customProgramCacheKey = () => 'pzProf';
      this.sombra = this.#malha(modelo.lods[3], invis, max); this.sombra.castShadow = true; this.sombra.customDepthMaterial = prof; this.sombra.renderOrder = -1; this.extras = [invis, prof];
    }
    this.acessorios = [];
    this.n = [];
    this.M = new THREE.Matrix4();
  }
  #malha(geo, mat, max) {
    const g = new THREE.BufferGeometry(); for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]); g.setIndex(geo.index);
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aAnim', a);
    const m = new THREE.InstancedMesh(g, mat, max); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.receiveShadow = true; m.count = 0; this.grupo.add(m); return m;
  }
  // arma na mão: usa as mesmas posições da malha principal
  acessorio(geo) {
    const r = this.malhas.map((b, i) => { const g = new THREE.BufferGeometry(); for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]); g.setIndex(geo.index); g.setAttribute('aAnim', b.geometry.attributes.aAnim); const m = new THREE.InstancedMesh(g, this.mat, 1); m.instanceMatrix = b.instanceMatrix; m.frustumCulled = false; m.visible = false; m.userData.base = b; this.grupo.add(m); return m; });
    this.acessorios.push({ malhas: r, geo }); return this.acessorios.length - 1;
  }
  usar(k) { this.acessorios.forEach((a, i) => a.malhas.forEach(m => { m.visible = i === k; })); }
  quadro(clipe, fase, volta = true) { const c = this.mov.clipes[clipe]; return c.ini + Math.min(c.n - 1, Math.floor(volta ? (((fase % 1) + 1) % 1) * c.n : fase * c.n)); }
  limpar() { this.n = this.malhas.map(() => 0); this.ns = 0; }
  por(x, y, z, ang, escX, escY, quadro, semente, dano, dist, extra = 0, sombra = true) {
    let l = 0; while (l < this.limites.length && l < this.malhas.length - 1 && dist > this.limites[l]) l++;
    const m = this.malhas[l], i = this.n[l]; if (i >= this.max) return;
    const c = Math.cos(ang), s = Math.sin(ang), e = this.M.elements;
    e[0] = c * escX; e[2] = -s * escX; e[5] = escY; e[8] = s * escX; e[10] = c * escX; e[12] = x; e[13] = y; e[14] = z;
    m.instanceMatrix.array.set(e, i * 16); m.geometry.attributes.aAnim.array.set([quadro, semente, dano, extra], i * 4); this.n[l]++;
    if (this.sombra && sombra && this.ns < this.max) { const k = this.ns++; this.sombra.instanceMatrix.array.set(e, k * 16); this.sombra.geometry.attributes.aAnim.array.set([quadro, semente, 0, 0], k * 4); }
  }
  fechar() {
    const envia = (m, n) => { m.count = n; m.visible = n > 0; if (!n) return; for (const [at, t] of [[m.instanceMatrix, 16], [m.geometry.attributes.aAnim, 4]]) { at.clearUpdateRanges(); at.addUpdateRange(0, n * t); at.needsUpdate = true; } };
    this.malhas.forEach((m, i) => envia(m, this.n[i]));
    if (this.sombra) envia(this.sombra, this.ns);
    for (const a of this.acessorios) for (const m of a.malhas) m.count = m.visible ? m.userData.base.count : 0;
  }
  dispose() {
    this.mov.tex.dispose(); this.mat.dispose(); for (const x of this.extras || []) x.dispose();
    for (const m of [...this.malhas, ...(this.sombra ? [this.sombra] : []), ...this.acessorios.flatMap(a => a.malhas)]) { m.geometry.dispose(); m.dispose(); }
    for (const a of this.acessorios) a.geo.dispose();
    this.grupo.removeFromParent();
  }
}
