// Estilo de desenho animado: luz em faixas, contorno escuro e cores vivas, usado por personagens, armas e cenário.
import * as THREE from 'three';

// materiais gravados nos modelos (o mesmo número em ferramentas/ponte-zero/personagens.js)
export const MAT = { pele: 0, roupa: 1, calca: 2, couro: 3, colete: 4, capacete: 5, cabelo: 6, visor: 7, olho: 8, boca: 9, mochila: 10, lenco: 11, preto: 12, osso: 13, amarelo: 14, metal: 15, vermelho: 16, branco: 17, laranja: 18, borracha: 19, madeira: 20, listra: 21, unha: 22, azul: 23, gira: 24, brilho: 25, cano: 26, NUM: 28 };
const BASE = { pele: '#e8a878', roupa: '#1f86a0', calca: '#c79a5c', couro: '#6b3b22', colete: '#1c3f5e', capacete: '#1f8fa8', cabelo: '#4a2a18', visor: '#7be0ff', olho: '#fffdf2', boca: '#7a1f2c', mochila: '#d8932a', lenco: '#ff6a2b', preto: '#1d1822', osso: '#f5e9c8', amarelo: '#ffc62e', metal: '#8d97a6', vermelho: '#e0352b', branco: '#fbf6ea', laranja: '#ff7a1f', borracha: '#2c2a33', madeira: '#a8703c', listra: '#fbf6ea', unha: '#e8dcae', azul: '#2d5bd0', gira: '#5d6675', brilho: '#ffe27a', cano: '#4a525f' };
// paleta: cores por material; "troca" muda só algumas
export function paleta(troca = {}) { const r = Array.from({ length: MAT.NUM }, () => new THREE.Vector3(.5, .5, .5)), c = new THREE.Color(), t = { ...BASE, ...troca }; for (const n in t) { c.set(t[n]); r[MAT[n]].set(c.r, c.g, c.b); } return r; }

// luz em três faixas, com borda suave o bastante para não serrilhar
export const LUZ = /* glsl */`
  vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
    float d = dot( normal, lightDirection ), w = max( fwidth( d ), .012 );
    return vec3( smoothstep( -w, w, d + .06 ) * .62 + smoothstep( -w, w, d - .42 ) * .38 );
  }`;
// brilho de recorte no alto e borda escura em quem está longe (faz o papel do contorno sem custar nada)
export const RECORTE = /* glsl */`
  { float fr = 1. - saturate( dot( normal, normalize( vViewPosition ) ) ); vec3 nM = inverseTransformDirection( normal, viewMatrix );
    outgoingLight += diffuseColor.rgb * smoothstep( .58, .66, fr ) * smoothstep( .0, .5, nM.y ) * .42;
    outgoingLight *= 1. - .72 * smoothstep( .6, .78, fr ) * smoothstep( 13., 24., vViewPosition.z ) * uBorda; }
  #include <opaque_fragment>`;

// material de objeto de cenário, com cores por vértice
export function materialDesenho(op = {}, { ruido = null, pinta = '', borda = 0 } = {}) {
  const m = new THREE.MeshToonMaterial({ vertexColors: true, ...op });
  m.onBeforeCompile = sh => {
    sh.uniforms.tRuido = { value: ruido }; sh.uniforms.uBorda = { value: borda };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;').replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; uniform float uBorda; varying vec3 vMundo;').replace('#include <gradientmap_pars_fragment>', LUZ).replace('#include <color_fragment>', '#include <color_fragment>\n' + pinta).replace('#include <opaque_fragment>', borda ? RECORTE : '#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'des' + pinta.length + pinta.slice(0, 40) + borda;
  return m;
}

// contorno: a mesma malha, engrossada e vista por dentro. osso = trecho de shader que anima (personagens)
export function contorno({ esp = .022, cor = '#1a1220', osso = '', matriz = 'mat4(1.)', uniforms = {}, antes = '' } = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uEsp: { value: esp }, uCor: { value: new THREE.Color(cor) }, ...uniforms },
    vertexShader: `${osso}\nuniform float uEsp;\n#include <fog_pars_vertex>\nvoid main() {\n vec3 posO = position, nO = normal;\n ${antes}\n mat4 m = ${matriz};\n #ifdef USE_INSTANCING\n m = instanceMatrix * m;\n #endif\n m = modelMatrix * m; vec4 mvPosition = viewMatrix * m * vec4(posO, 1.); vec3 n = normalize(mat3(viewMatrix) * mat3(m) * nO);\n mvPosition.xyz += n * uEsp * (.3 + min(40., -mvPosition.z) * .055); gl_Position = projectionMatrix * mvPosition;\n #include <fog_vertex>\n }`,
    fragmentShader: 'uniform vec3 uCor;\n#include <common>\n#include <fog_pars_fragment>\nvoid main() { gl_FragColor = vec4(uCor, 1.);\n#include <colorspace_fragment>\n#include <fog_fragment>\n}',
  });
}

// junta várias peças numa geometria só, com cor por vértice (cenário, portões, chefes)
export class Pecas {
  constructor() { this.p = []; this.n = []; this.c = []; this.i = []; }
  por(g, cor, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1 } = {}) {
    const M = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), Array.isArray(s) ? new THREE.Vector3(...s) : new THREE.Vector3(s, s, s)); g.applyMatrix4(M);
    const b = this.p.length / 3, p = g.attributes.position, n = g.attributes.normal, k = new THREE.Color(cor);
    for (let q = 0; q < p.count; q++) { this.p.push(p.getX(q), p.getY(q), p.getZ(q)); this.n.push(n.getX(q), n.getY(q), n.getZ(q)); this.c.push(k.r, k.g, k.b); }
    if (g.index) for (const x of g.index.array) this.i.push(b + x); else for (let q = 0; q < p.count; q++) this.i.push(b + q); g.dispose(); return this;
  }
  pronta() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); return g; }
}
// caixa de cantos redondos (boa para contorno: as normais são contínuas)
export function caixaRedonda(w, h, d, r = .05, seg = 2) {
  const g = new THREE.BoxGeometry(1, 1, 1, seg * 2 + 1, seg * 2 + 1, seg * 2 + 1), p = g.attributes.position, n = g.attributes.normal, H = [w / 2, h / 2, d / 2], v = new THREE.Vector3(), o = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const t = [p.getX(i), p.getY(i), p.getZ(i)].map((x, k) => { const q = Math.round((x + .5) * (seg * 2 + 1)), m = seg * 2 + 1, f = q <= seg ? q / seg : (m - q) / seg, l = q <= seg ? -1 : 1; return [l * (H[k] - r), l * r * (1 - f)]; });
    o.set(t[0][0], t[1][0], t[2][0]); v.set(t[0][1], t[1][1], t[2][1]); const L = v.length() || 1; v.multiplyScalar(1 / L); p.setXYZ(i, o.x + v.x * r, o.y + v.y * r, o.z + v.z * r); n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
// caixa chanfrada barata (44 triângulos), com normais contínuas
export function caixaChanfro(w, h, d, r) {
  const H = [w / 2, h / 2, d / 2], p = [], n = [], id = {}, idx = [], S = [-1, 1];
  for (const x of S) for (const y of S) for (const z of S) for (let k = 0; k < 3; k++) { const s = [x, y, z]; id[s + ',' + k] = p.length / 3; p.push(...s.map((q, e) => q * (e === k ? H[e] : H[e] - r))); const v = s.map((q, e) => q * (e === k ? 1 : .3)), L = Math.hypot(...v); n.push(...v.map(q => q / L)); }
  const P = i => p.slice(i * 3, i * 3 + 3), tri = (a, b, c) => { const [A, B, C] = [P(a), P(b), P(c)], u = B.map((q, e) => q - A[e]), v = C.map((q, e) => q - A[e]), m = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; idx.push(...(m[0] * (A[0] + B[0] + C[0]) + m[1] * (A[1] + B[1] + C[1]) + m[2] * (A[2] + B[2] + C[2]) > 0 ? [a, b, c] : [a, c, b])); }, quad = (a, b, c, e) => { tri(a, b, c); tri(a, c, e); };
  for (let k = 0; k < 3; k++) { const [l, m] = [0, 1, 2].filter(e => e !== k), v = (sk, sl, sm, q) => { const s = []; s[k] = sk; s[l] = sl; s[m] = sm; return id[s + ',' + q]; }; for (const sk of S) quad(v(sk, -1, -1, k), v(sk, 1, -1, k), v(sk, 1, 1, k), v(sk, -1, 1, k)); for (const sl of S) for (const sm of S) quad(v(-1, sl, sm, l), v(1, sl, sm, l), v(1, sl, sm, m), v(-1, sl, sm, m)); }
  for (const x of S) for (const y of S) for (const z of S) { const s = [x, y, z] + ','; tri(id[s + 0], id[s + 1], id[s + 2]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setIndex(idx); return g;
}
