// Cenário de desenho: ponte suspensa, carros abandonados, cidade em ruínas, rio e céu. Cada nível tem seu clima.
import * as THREE from 'three';
import { materialDesenho, contorno, LUZ } from './desenho.js';

export const PERIODO = 120;   // a ponte se repete a cada 120 m
const CABO_X = 9.4, LARG = 7.6;
export const SOL = new THREE.Vector3(.42, .2, -1).normalize();
// clima de cada nível: céu (alto, meio, horizonte), nuvens (luz e sombra), disco, névoa, asfalto, água, prédios e luzes
export const CLIMAS = {
  tarde: { alto: '#2f6fd0', meio: '#f58a5a', baixo: '#ffd07a', nuvem: '#fff0c8', nuvemS: '#e8736a', disco: '#fff6c0', tamDisco: .9965, nevoa: '#f7a766', asfalto: '#6a5a78', faixa: '#ffe9a8', agua: '#2f8fb0', predio: '#a8657a', aco: '#d9542f', conc: '#e8c9a6', chave: '#ffe2b0', forca: 3.2, ceu: '#b9d4ff', chao: '#b06a58', hemi: 1.55, cidade: '#c46a66' },
  manha: { alto: '#1f7fe0', meio: '#74c6f7', baixo: '#e9fbff', nuvem: '#ffffff', nuvemS: '#a8d4f0', disco: '#fffbe0', tamDisco: .9978, nevoa: '#bfe6f5', asfalto: '#5f6f86', faixa: '#fff3c0', agua: '#26b0c9', predio: '#7fa0b8', aco: '#f2a21d', conc: '#e6e2d4', chave: '#fff6dc', forca: 3.4, ceu: '#d4ecff', chao: '#8a9a80', hemi: 1.6, cidade: '#8fb6cc' },
  noite: { alto: '#1c1450', meio: '#5a2f9a', baixo: '#e0589a', nuvem: '#b46ad0', nuvemS: '#3d2478', disco: '#f5f0ff', tamDisco: .997, nevoa: '#7a3f98', asfalto: '#4c4580', faixa: '#ffe07a', agua: '#3a2f8c', predio: '#4a3a80', aco: '#8a3fc0', conc: '#b3a3d8', chave: '#dcd0ff', forca: 3.1, ceu: '#b49cff', chao: '#6a3f80', hemi: 1.7, cidade: '#5c3a92' },
  mare: { alto: '#0f6f9a', meio: '#2fc4c0', baixo: '#f4ffd8', nuvem: '#f2fff4', nuvemS: '#5fc9c4', disco: '#ffffff', tamDisco: .9975, nevoa: '#7fdcd0', asfalto: '#3f6478', faixa: '#fff0a0', agua: '#12b39a', predio: '#4f9aa0', aco: '#2d7bd0', conc: '#cfeee2', chave: '#fffbe6', forca: 3.2, ceu: '#c8fff4', chao: '#4a8a80', hemi: 1.6, cidade: '#5fb4b4' },
  aurora: { alto: '#5a3fc4', meio: '#ff7fb0', baixo: '#ffe3b0', nuvem: '#fff0f4', nuvemS: '#e87fc0', disco: '#fff4d0', tamDisco: .994, nevoa: '#ffb0b8', asfalto: '#6a5a88', faixa: '#fff0b8', agua: '#5f7fe0', predio: '#b87fb4', aco: '#1fa88a', conc: '#ffe0d4', chave: '#fff0e0', forca: 3.2, ceu: '#e4d0ff', chao: '#b87f8a', hemi: 1.6, cidade: '#c484c0' },
  brasa: { alto: '#3a1030', meio: '#c4302a', baixo: '#ffb43a', nuvem: '#ff8a4a', nuvemS: '#7a1f30', disco: '#fff0a0', tamDisco: .9955, nevoa: '#e8703a', asfalto: '#5f4a86', faixa: '#ffd24a', agua: '#ff6a1f', predio: '#7a3a4a', aco: '#4a5a78', conc: '#d8b09a', chave: '#ffe0b8', forca: 3.2, ceu: '#e0c0ff', chao: '#8a4a5a', hemi: 1.65, cidade: '#8a2f34' },
  eclipse: { alto: '#120a38', meio: '#4a1f8a', baixo: '#ff9a3a', nuvem: '#c45ab0', nuvemS: '#2f1460', disco: '#1a0a2e', tamDisco: .9935, nevoa: '#8a4a90', asfalto: '#4a3f70', faixa: '#ffe07a', agua: '#4a2fa0', predio: '#4f2f7a', aco: '#e8a21f', conc: '#c9b8e0', chave: '#ffe8d0', forca: 3.2, ceu: '#c4b0ff', chao: '#7a4a78', hemi: 1.7, cidade: '#6a2f78' },
  tempestade: { alto: '#0f3a4a', meio: '#2f8a80', baixo: '#c8f08a', nuvem: '#7cc8a0', nuvemS: '#1d4f58', disco: '#f0ffd0', tamDisco: .9985, nevoa: '#6fae92', asfalto: '#4f5f68', faixa: '#ffe680', agua: '#1f6f74', predio: '#4a7078', aco: '#c8452f', conc: '#bcc7b4', chave: '#eaffd8', forca: 3, ceu: '#b0e8d8', chao: '#5a6a4a', hemi: 1.65, cidade: '#4f8480' },
};

// ---------- junta peças por material, com textura em metros ----------
class Mescla {
  constructor() { this.p = []; this.n = []; this.u = []; this.i = []; this.c = []; }
  juntar(g, esc = .4, cor = 1) {
    const b = this.p.length / 3, p = g.attributes.position, n = g.attributes.normal;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k), nx = n.getX(k), ny = n.getY(k), nz = n.getZ(k), ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
      this.p.push(x, y, z); this.n.push(nx, ny, nz);
      if (ay > ax && ay > az) this.u.push(x * esc, z * esc); else if (ax > az) this.u.push(z * esc, y * esc); else this.u.push(x * esc, y * esc);
      const l = cor.isColor ? [cor.r, cor.g, cor.b] : [cor, cor, cor]; this.c.push(...l);
    }
    if (g.index) for (const x of g.index.array) this.i.push(b + x); else for (let k = 0; k < p.count; k++) this.i.push(b + k);
    g.dispose(); return this;
  }
  caixa(x, y, z, w, h, d, { rx = 0, ry = 0, rz = 0, cor = 1, esc } = {}) { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return this.juntar(g, esc, cor); }
  barra(a, b, r, lados = 5, cor = 1) { const d = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r, r, d.length(), lados, 1, true); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return this.juntar(g, .4, cor); }
  pronta() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
}
// normais contínuas por posição, para o contorno não abrir nas quinas
function suavizar(g) { const p = g.attributes.position, n = g.attributes.normal, m = new Map(), ch = i => Math.round(p.getX(i) * 200) + ',' + Math.round(p.getY(i) * 200) + ',' + Math.round(p.getZ(i) * 200); for (let i = 0; i < p.count; i++) { const k = ch(i), a = m.get(k) || [0, 0, 0]; a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); m.set(k, a); } for (let i = 0; i < p.count; i++) { const a = m.get(ch(i)), l = Math.hypot(...a) || 1; n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); } return g; }
const v = (x, y, z) => new THREE.Vector3(x, y, z);
function semente(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------- carro com carroceria de perfil ----------
function perfil(pts, larg, ch) { const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))), g = new THREE.ExtrudeGeometry(s, { depth: larg - ch * 2, bevelEnabled: true, bevelThickness: ch, bevelSize: ch * .7, bevelSegments: 2, curveSegments: 3 }); g.translate(0, 0, -(larg - ch * 2) / 2); g.rotateY(-Math.PI / 2); return g; }
function carro(M, x, z, ry, cor, tipo, queimado) {
  const por = (g, m, c) => { g.rotateY(ry); g.translate(x, 0, z); m.juntar(g, .4, c); };
  const alto = tipo === 'van' ? .42 : tipo === 'suv' ? .16 : 0, L = tipo === 'van' ? 2.45 : 2.2;
  const lata = queimado ? new THREE.Color(.09, .07, .1) : cor;
  por(perfil([[-L, .34], [-L, .72 + alto * .4], [-L + .12, .86 + alto * .6], [-1.1, .93 + alto * .6], [1.0, .9 + alto * .6], [L - .25, .78 + alto * .4], [L, .62], [L, .34], [1.75, .28], [-1.75, .28]], 1.78, .12), M.lata, lata);
  const teto = 1.42 + alto, tras = tipo === 'sedan' ? -1.55 : -L + .12;
  por(perfil([[tras, .88 + alto * .6], [tras + (tipo === 'sedan' ? .55 : .22), teto - .04], [tras + .9, teto], [.15, teto], [.5, teto - .07], [1.15, .88 + alto * .6]], 1.5, .13), M.lata, lata);
  // vidros
  const vid = queimado ? new THREE.Color(.03, .025, .04) : new THREE.Color('#8fd0ee');
  por(perfil([[tras + .22, .98 + alto * .6], [tras + (tipo === 'sedan' ? .6 : .36), teto - .1], [.12, teto - .1], [.42, teto - .14], [.98, .98 + alto * .6]], 1.565, .05), M.vidro, vid);
  por(perfil([[.5, teto - .1], [1.16, .95 + alto * .6], [1.2, .93 + alto * .6], [.56, teto - .12]], 1.3, .02), M.vidro, vid);
  for (const [wx, wz] of [[-.8, 1.35], [.8, 1.35], [-.8, -1.35], [.8, -1.35]]) { const g = new THREE.CylinderGeometry(.33, .33, .24, 14); g.rotateZ(Math.PI / 2); g.translate(wx, .33, wz); por(g, M.vidro, new THREE.Color('#2a2430')); const c = new THREE.CylinderGeometry(.19, .19, .26, 8); c.rotateZ(Math.PI / 2); c.translate(wx, .33, wz); por(c, M.lata, new THREE.Color('#b8b4c0')); }
  for (const s of [-.62, .62]) { const f = new THREE.BoxGeometry(.34, .12, .06); f.translate(s, .68, L + .02); por(f, M.vidro, new THREE.Color('#fff3c0')); const t = new THREE.BoxGeometry(.3, .13, .06); t.translate(s, .74, -L - .02); por(t, M.vidro, new THREE.Color('#e0352b')); }
}
function onibus(M, x, z, ry) {
  const por = (g, m, c) => { g.rotateY(ry); g.translate(x, 0, z); m.juntar(g, .4, c); };
  por(perfil([[-5, .4], [-5.05, 1.2], [-4.95, 3], [-4.7, 3.15], [4.6, 3.15], [4.95, 2.95], [5.1, 1.4], [5.05, .4]], 2.4, .12), M.lata, new THREE.Color('#ffb81f'));
  for (let k = 0; k < 7; k++) { const g = new THREE.BoxGeometry(2.46, .85, 1.05); g.translate(0, 2.2, -4.1 + k * 1.28); por(g, M.vidro, new THREE.Color('#8fd0ee')); }
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(2.1, 1.2, .1); g.translate(0, 2.1, s * 5.06); por(g, M.vidro, new THREE.Color('#8fd0ee')); }
  for (const [wx, wz] of [[-1.05, 3.2], [1.05, 3.2], [-1.05, -3], [1.05, -3]]) { const g = new THREE.CylinderGeometry(.48, .48, .34, 14); g.rotateZ(Math.PI / 2); g.translate(wx, .48, wz); por(g, M.vidro, new THREE.Color('#2a2430')); }
}

// ---------- céu ----------
const CEU_FRAG = /* glsl */`
  varying vec3 vDir; uniform sampler2D tRuido; uniform vec3 uSol, uAlto, uMeio, uBaixo, uNuvem, uNuvemS, uDiscoC, uCid; uniform float uTam;
  void main() {
    vec3 d = normalize(vDir); float h = d.y, s = max(0., dot(d, uSol));
    vec3 c = mix(uBaixo, uMeio, smoothstep(.0, .2, h)); c = mix(c, uAlto, smoothstep(.14, .55, h));
    // raios largos e parados em volta do sol
    float raio = step(.5, fract(atan(d.x - uSol.x, d.y - uSol.y) * 3.2 + .2)); c = mix(c, uBaixo, raio * .16 * smoothstep(.86, .99, s));
    c = mix(c, uDiscoC, smoothstep(.0, .0012, s - (uTam - .012)) * .28); c = mix(c, uDiscoC, smoothstep(.0, .0006, s - uTam));
    if (h > .02) {
      vec2 q = d.xz / (h + .16); float n = texture2D(tRuido, q * vec2(.07, .04)).r * .62 + texture2D(tRuido, q * vec2(.16, .09) + .3).r * .3 + texture2D(tRuido, q * .34).g * .1;
      float lim = .56, nu = smoothstep(lim, lim + .012, n) * smoothstep(.03, .1, h), so = smoothstep(lim + .05, lim + .062, n);
      c = mix(c, mix(uNuvem, uNuvemS, so * .75), nu * .92);
    }
    // cidade ao longe
    float a = atan(d.x, -d.z) * 34., b = floor(a), pr = fract(sin(b * 12.98) * 4375.5), pr2 = fract(sin(b * 4.1 + 2.) * 911.7);
    float topo = .012 + .06 * pr * pr2 + .02 * step(.75, pr); c = mix(c, uCid, (1. - smoothstep(topo - .001, topo + .001, h)) * .8);
    if (h < 0.) c = mix(c, uCid * .8, smoothstep(0., -.2, h));
    gl_FragColor = vec4(c, 1.);
    #include <colorspace_fragment>
  }`;
function ceu(ruido) {
  const C = () => ({ value: new THREE.Color() }), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: { tRuido: { value: ruido }, uSol: { value: SOL }, uAlto: C(), uMeio: C(), uBaixo: C(), uNuvem: C(), uNuvemS: C(), uDiscoC: C(), uCid: C(), uTam: { value: .996 } }, vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: CEU_FRAG });
  const o = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 20), m); o.frustumCulled = false; o.renderOrder = -10; return o;
}

// ---------- asfalto pintado ----------
const PISO = /* glsl */`
  vec2 w = vMundo.xz; float r1 = texture2D(tRuido, w * .021).r, r2 = texture2D(tRuido, w * .07 + .4).r, r3 = texture2D(tRuido, w * .33).r;
  diffuseColor.rgb *= mix(.86, 1.05, step(.5, r1 * .7 + r2 * .3)); diffuseColor.rgb *= 1. - .1 * exp(-pow(abs(abs(w.x) - 2.1) - .85, 2.) * 5.);
  float rem = step(.66, texture2D(tRuido, floor(w / vec2(2.4, 5.)) * .137).r) * step(.08, fract(w.x / 2.4)) * step(.04, fract(w.y / 5.)); diffuseColor.rgb *= 1. - .2 * rem;
  float rac = 1. - smoothstep(.0, .016, abs(texture2D(tRuido, w * .055 + .2).r + (r3 - .5) * .1 - .5)); diffuseColor.rgb *= 1. - .55 * rac * step(.52, r2);
  float gasto = step(.4, r3 * .6 + r2 * .4 + .1), lin = max(1. - smoothstep(.11, .13, abs(abs(w.x) - 5.35)), (1. - smoothstep(.1, .12, abs(abs(w.x) - 1.85))) * step(.45, fract(w.y / 6.)));
  diffuseColor.rgb = mix(diffuseColor.rgb, uFaixa, lin * gasto * .9);
  float jz = abs(fract(w.y / 30.) - .5) * 30.; diffuseColor.rgb *= 1. - .6 * step(14.85, jz);`;

export function criarCenario(cena, renderer, tx, ruido, qual) {
  const lixo = [], D = o => (lixo.push(o), o), rnd = semente(4242);
  // céu e luz do céu
  const domo = ceu(ruido); cena.add(domo); D(domo.geometry); D(domo.material);
  cena.fog = new THREE.Fog('#f7a766', 40, 250);
  const pinta = 'diffuseColor.rgb *= .9 + .2 * step(.5, texture2D(tRuido, vMundo.xz * .09 + vMundo.y * .13).r);';
  const mAsf = D(materialDesenho({ vertexColors: false }, { ruido, pinta: PISO })), mConc = D(materialDesenho({}, { ruido, pinta })), mAco = D(materialDesenho({}, { ruido, pinta: pinta + ' ' })), mLata = D(materialDesenho({}, { ruido, borda: 1 })), mVidro = D(materialDesenho({}, { ruido }));
  const uFaixa = { value: new THREE.Color() }, antes = mAsf.onBeforeCompile; mAsf.onBeforeCompile = sh => { antes(sh); sh.uniforms.uFaixa = uFaixa; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFaixa;'); };
  const mBorda = D(contorno({ esp: .02, cor: '#231530' }));

  // ---------- trecho de ponte de 120 m (z de 0 a -120) ----------
  const M = { conc: new Mescla(), aco: new Mescla(), lata: new Mescla(), vidro: new Mescla() };
  // muretas
  const pts = [[0, 0], [.6, 0], [.6, .08], [.42, .32], [.36, .95], [.24, .95], [.18, .32], [0, .08]];
  for (const s of [-1, 1]) for (let k = 0; k < 20; k++) {
    if ((s > 0 && (k === 7)) || (s < 0 && k === 14)) continue; // trecho derrubado
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a - .3, b))), { depth: 5.9, bevelEnabled: false });
    if (rnd() < .18) g.rotateY((rnd() - .5) * .09); g.translate(s * (LARG + .1), 0, -k * 6 - 6); M.conc.juntar(g, .35, .75 + rnd() * .3);
  }
  // calçada, bordas e vigas
  for (const s of [-1, 1]) {
    M.conc.caixa(s * (LARG + 1.1), -.02, -60, 1.7, .3, 120, { cor: .7 });
    M.aco.caixa(s * 9.5, -.5, -60, .35, 1.7, 120, { cor: .8 }); M.aco.caixa(s * 9.5, .38, -60, .7, .1, 120); M.aco.caixa(s * 9.5, -1.3, -60, .7, .1, 120);
    for (let k = 0; k < 40; k++) M.aco.caixa(s * 9.28, .9, -k * 3, .07, 1.1, .07);
    M.aco.caixa(s * 9.28, 1.42, -60, .1, .08, 120); M.aco.caixa(s * 9.28, .95, -60, .05, .05, 120);
    // treliça de baixo
    for (let k = 0; k < 20; k++) { M.aco.barra(v(s * 9.5, -1.3, -k * 6), v(s * 9.5, -6, -k * 6 - 3), .16); M.aco.barra(v(s * 9.5, -6, -k * 6 - 3), v(s * 9.5, -1.3, -k * 6 - 6), .16); }
    M.aco.caixa(s * 9.5, -6, -60, .4, .4, 120);
  }
  M.conc.caixa(0, -.75, -60, 19, 1.2, 120, { cor: .4 });
  // cabos e pendurais
  const yCabo = z => { const t = ((z % PERIODO) + PERIODO) % PERIODO / PERIODO - .5; return 4.2 + 31 * Math.pow(Math.abs(t - 0) * 2, 2); }; // baixo no meio (z=60), alto nas torres (z=0)
  for (const s of [-1, 1]) for (let k = 0; k < 40; k++) {
    const z = k * 3, a = v(s * CABO_X, yCabo(z), -z), b = v(s * CABO_X, yCabo(z + 2.999), -z - 3); M.aco.barra(a, b, .27, 7, .55);
    if (k % 2 === 0 && k && rnd() > .07) for (const o of [-.14, .14]) M.aco.barra(v(s * CABO_X, .4, -z + o), v(s * CABO_X, yCabo(z), -z + o), .035, 4, .5);
  }
  // torre em z=0
  for (const s of [-1, 1]) {
    for (const [y0, y1, w] of [[-60, 8, 2.2], [8, 22, 1.95], [22, 37, 1.7]]) { M.aco.caixa(s * CABO_X, (y0 + y1) / 2, 0, w, y1 - y0, w * 1.5); for (const q of [-1, 1]) M.aco.caixa(s * CABO_X + q * w * .5, (y0 + y1) / 2, 0, .12, y1 - y0, w * 1.1, { cor: .7 }); }
    for (const y of [8, 22]) M.aco.caixa(s * CABO_X, y, 0, 2.7, .5, 3.9, { cor: .8 }); M.aco.caixa(s * CABO_X, 37.2, 0, 2.6, .9, 3.6, { cor: .8 });
  }
  for (const [y, h] of [[20.5, 2], [29, 1.6], [36, 1.8]]) { M.aco.caixa(0, y, 0, CABO_X * 2, h, 1.6); M.aco.caixa(0, y + h / 2, 0, CABO_X * 2, .2, 2.1, { cor: .75 }); M.aco.caixa(0, y - h / 2, 0, CABO_X * 2, .2, 2.1, { cor: .75 }); }
  for (const s of [-1, 1]) { M.aco.barra(v(-CABO_X * s, 22, 0), v(CABO_X * s, 28.2, 0), .42, 6); M.aco.barra(v(-CABO_X * s, 30, 0), v(CABO_X * s, 35, 0), .38, 6); }
  // postes de luz
  for (let k = 0; k < 4; k++) { const s = k % 2 ? 1 : -1, z = -15 - k * 30, x = s * (LARG + .75), q = k === 2 ? .16 : 0; M.aco.barra(v(x, 0, z), v(x + s * q * 6, 7.4, z + q * 9), .09, 6, .45); M.aco.barra(v(x + s * q * 6, 7.4, z + q * 9), v(x + s * q * 6 - s * 1.7, 7.9, z + q * 9), .06, 5, .45); M.aco.caixa(x + s * q * 6 - s * 1.9, 7.9, z + q * 9, .7, .12, .28, { cor: .4 }); }
  // placas
  M.aco.barra(v(-LARG - .6, 0, -88), v(-LARG - .6, 4.4, -88), .08, 6, .5); M.lata.caixa(-LARG - .35, 3.6, -87.9, 2.1, 1.3, .06, { rz: -.12, cor: new THREE.Color('#1f8a5a') });
  // carros, ônibus, contêiner e entulho no acostamento
  const CORES = ['#d63a2c', '#2d7bd0', '#f2b51d', '#3fa34d', '#f5efe0', '#e8662a', '#7a4fc0'].map(c => new THREE.Color(c));
  const lista = [[6.45, -9, .06, 'sedan'], [-6.5, -22, 3.2, 'suv'], [6.4, -34, -.1, 'van'], [-6.35, -43, .22, 'sedan'], [6.5, -63, 3.1, 'sedan'], [-6.55, -78, -.04, 'van'], [6.35, -92, .3, 'suv'], [-6.45, -106, 3.0, 'sedan'], [6.6, -112, .04, 'sedan']];
  lista.forEach(([x, z, r, t], i) => carro(M, x, z, r, CORES[i % CORES.length], t, i % 4 === 2));
  onibus(M, -6.7, -59, .035);
  M.aco.caixa(6.55, 1.25, -78, 2.3, 2.5, 6, { ry: .05, esc: .28, cor: 1.25 }); M.lata.caixa(6.55, 2.52, -78, 2.36, .08, 6.1, { ry: .05, cor: new THREE.Color('#2d7bd0') });
  for (let k = 0; k < 70; k++) { const s = rnd() < .5 ? -1 : 1, t = .08 + rnd() * rnd() * .5; M.conc.caixa(s * (5.5 + rnd() * 1.8), t * .3, -rnd() * 120, t, t * .7, t * (.6 + rnd()), { rx: rnd(), ry: rnd() * 3, rz: rnd(), cor: .5 + rnd() * .5 }); }
  for (let k = 0; k < 9; k++) { const s = rnd() < .5 ? -1 : 1, z = -8 - rnd() * 105, x = s * 5.75; for (let a = 0; a < 5; a++) for (let l = 0; l < 2; l++) { const g = new THREE.SphereGeometry(.3, 8, 5); g.scale(1, .45, .62); g.translate(x + (l % 2) * .1, .14 + l * .23, z + a * .42 + l * .2); M.conc.juntar(g, .8, new THREE.Color('#e0c08a')); } }

  const geos = { conc: D(M.conc.pronta()), aco: D(M.aco.pronta()), lata: D(M.lata.pronta()), vidro: D(M.vidro.pronta()) };
  const gPista = new THREE.PlaneGeometry(LARG * 2 + .4, PERIODO); gPista.rotateX(-Math.PI / 2); gPista.translate(0, 0, -PERIODO / 2); { const u = gPista.attributes.uv, p = gPista.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / 4, p.getZ(i) / 4); } D(gPista);
  const gBordas = [geos.lata].map(g => { const b = g.clone(); b.deleteAttribute('color'); return D(suavizar(b)); });
  const trechos = [0, 1, 2].map(() => {
    const g = new THREE.Group();
    for (const [geo, mat, proj] of [[gPista, mAsf, false], [geos.conc, mConc, true], [geos.aco, mAco, true], [geos.lata, mLata, true], [geos.vidro, mVidro, false]]) { const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = proj && qual > 0; g.add(m); }
    if (qual > 0) for (const b of gBordas) { const m = new THREE.Mesh(b, mBorda); m.userData.borda = true; g.add(m); }
    cena.add(g); return g;
  });

  // ---------- rio ----------
  const uT = { value: 0 }, mAgua = D(new THREE.ShaderMaterial({ fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), tRuido: { value: ruido }, uT, uCor: { value: new THREE.Color() } }, vertexShader: 'varying vec3 vP;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n }', fragmentShader: 'uniform sampler2D tRuido; uniform float uT; uniform vec3 uCor; varying vec3 vP;\n#include <common>\n#include <fog_pars_fragment>\nvoid main(){ float n = texture2D(tRuido, vP.xz * vec2(.011, .03) + uT * .006).r * .6 + texture2D(tRuido, vP.xz * vec2(.03, .07) - uT * .008).r * .4; vec3 c = uCor * (n > .56 ? 1.5 : n > .47 ? 1.15 : 1.); gl_FragColor = vec4(c, 1.);\n#include <colorspace_fragment>\n#include <fog_fragment>\n }' }));
  const gAgua = D(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2));
  const agua = new THREE.Mesh(gAgua, mAgua); agua.position.y = -46; cena.add(agua);

  // ---------- cidade ----------
  const fach = document.createElement('canvas'); fach.width = fach.height = 256; { const c = fach.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const q = rnd(); c.fillStyle = q < .55 ? '#5b4a6a' : q < .8 ? '#7d6a8a' : q < .92 ? '#3d3150' : '#ffd98a'; c.fillRect(x * 32 + 6, y * 32 + 5, 20, 20); c.fillStyle = 'rgba(60,40,80,.35)'; c.fillRect(x * 32 + 4, y * 32 + 25, 24, 4); } }
  const tFach = D(new THREE.CanvasTexture(fach)); tFach.colorSpace = THREE.SRGBColorSpace; tFach.wrapS = tFach.wrapT = THREE.RepeatWrapping; tFach.anisotropy = 4;
  const MC = new Mescla();
  for (const s of [-1, 1]) for (let f = 0; f < 3; f++) for (let z = 0; z < 360;) {
    const w = 12 + rnd() * 16, dp = 12 + rnd() * 14, h = 26 + rnd() * 34 + f * 20 * rnd() + (rnd() < .12 ? 40 : 0), x = s * (42 + f * 36 + rnd() * 14), cor = .5 + rnd() * .55, rz = rnd() < .08 ? (rnd() - .5) * .16 : 0;
    MC.caixa(x, -47 + h / 2, -z - dp / 2, w, h, dp, { cor, rz, esc: 1 / 24 });
    for (let k = 0; k < 2 + rnd() * 3; k++) { const ww = w * (.2 + rnd() * .4); MC.caixa(x + (rnd() - .5) * (w - ww), -47 + h + rnd() * 2.5, -z - dp * rnd(), ww, 1 + rnd() * 7, dp * (.2 + rnd() * .3), { cor: cor * .85, rz: rz + (rnd() - .5) * .1, esc: 1 / 24 }); }
    z += dp + 3 + rnd() * 18;
  }
  const gCid = D(MC.pronta()), mCid = D(new THREE.MeshLambertMaterial({ map: tFach, vertexColors: true }));
  const cidades = [0, 1].map(() => { const m = new THREE.Mesh(gCid, mCid); m.frustumCulled = false; cena.add(m); return m; });

  // ---------- névoa no abismo e fumaça ----------
  const mNev = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, uniforms: { tRuido: { value: ruido }, uT: { value: 0 }, uF: { value: [.45, .32, .2][qual] }, uCor: { value: new THREE.Color(.75, .42, .25) } },
    vertexShader: 'varying vec2 vU; varying vec3 vP; void main(){ vU = uv; vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'varying vec2 vU; varying vec3 vP; uniform sampler2D tRuido; uniform float uT, uF; uniform vec3 uCor; void main(){ float n = texture2D(tRuido, vP.xz * .004 + uT * .004).r * .6 + texture2D(tRuido, vP.xz * .011 - uT * .003).r * .4; float b = 1. - smoothstep(.25, .5, distance(vU, vec2(.5))); gl_FragColor = vec4(uCor, smoothstep(.48, .54, n) * uF * b); \n#include <colorspace_fragment>\n }',
  }));
  const gNev = D(new THREE.PlaneGeometry(520, 520)); gNev.rotateX(-Math.PI / 2);
  const nevoas = [[-28], [-20, -28, -36], [-15, -20, -25, -30, -35, -40]][qual].map(y => { const m = new THREE.Mesh(gNev, mNev); m.position.y = y; m.frustumCulled = false; m.renderOrder = 1; cena.add(m); return m; });
  const mFum = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: { tRuido: { value: ruido }, uT: mNev.uniforms.uT, uCor: mNev.uniforms.uCor },
    vertexShader: 'varying vec2 vU; varying float vS; void main(){ vU = uv; vec4 c = modelMatrix * vec4(0., 0., 0., 1.); vS = c.x * .013; vec3 p = c.xyz + vec3(position.x + pow(uv.y, 1.6) * 26., position.y, 0.); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }',
    fragmentShader: 'varying vec2 vU; varying float vS; uniform sampler2D tRuido; uniform float uT; uniform vec3 uCor; void main(){ float n = texture2D(tRuido, vec2(vU.x * .5 + vS, vU.y * 1.1 - uT * .012)).r * .6 + texture2D(tRuido, vec2(vU.x * 1.4 + vS, vU.y * 2.6 - uT * .03)).g * .4; float l = mix(.16, .48, vU.y), m = 1. - smoothstep(l * .4, l, abs(vU.x - .5)); float a = smoothstep(.3, .62, n + m * .3 - .12) * m * (1. - smoothstep(.55, 1., vU.y)) * smoothstep(0., .05, vU.y); a = smoothstep(.3, .42, a); vec3 c = n > .5 ? uCor * .62 : uCor * .45; gl_FragColor = vec4(c, a * .6 * (1. - smoothstep(.3, .8, vU.y))); \n\n#include <colorspace_fragment>\n }',
  }));
  const gFum = D(new THREE.PlaneGeometry(46, 110, 1, 12)); gFum.translate(0, 55, 0);
  const fumos = [[-78, -120], [64, -210], [-120, -300], [104, -60]].map(([x, z]) => { const m = new THREE.Mesh(gFum, mFum); m.position.set(x, -10, z); m.userData.z = z; m.frustumCulled = false; m.renderOrder = 2; cena.add(m); return m; });

  let ligado = qual > 0;
  return {
    // d = distância percorrida; a câmera está em z = -d
    atualizar(d, t, cam) {
      const b = Math.floor((d - 24) / PERIODO) * PERIODO; trechos.forEach((g, i) => { g.position.z = -(b + i * PERIODO); g.visible = b + i * PERIODO < d + 228; });
      // só o trecho perto do pelotão faz sombra
      trechos.forEach((g, i) => { const z0 = b + i * PERIODO, sim = ligado && z0 < d + 40 && z0 + PERIODO > d - 14; if (g.userData.s !== sim) { g.userData.s = sim; for (const m of g.children) if (m.material !== mAsf && m.material !== mVidro && !m.userData.borda) m.castShadow = sim; } });
      const c = Math.floor((d - 60) / 360) * 360; cidades.forEach((m, i) => { m.position.z = -(c + i * 360); });
      for (const f of fumos) { let z = f.userData.z; while (z > -d + 20) z -= 360; f.position.z = z; }
      domo.position.copy(cam.position); agua.position.z = -d - 150; mNev.uniforms.uT.value = uT.value = t;
      for (const n of nevoas) n.position.z = -d - 120;
    },
    // muda as cores do lugar: cada nível tem seu clima
    clima(nome) {
      const c = CLIMAS[nome] || CLIMAS.tarde, u = domo.material.uniforms; u.uAlto.value.set(c.alto); u.uMeio.value.set(c.meio); u.uBaixo.value.set(c.baixo); u.uNuvem.value.set(c.nuvem); u.uNuvemS.value.set(c.nuvemS); u.uDiscoC.value.set(c.disco); u.uCid.value.set(c.cidade); u.uTam.value = c.tamDisco;
      cena.fog.color.set(c.nevoa); mAsf.color.set(c.asfalto); uFaixa.value.set(c.faixa); mAgua.uniforms.uCor.value.set(c.agua); mCid.color.set(c.predio); mAco.color.set(c.aco); mConc.color.set(c.conc); mNev.uniforms.uCor.value.set(c.nevoa); return c;
    },
    sombras(sim) { ligado = sim; },
    dispose() { for (const o of lixo) o.dispose(); cena.fog = null; },
  };
}
