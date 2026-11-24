// Cenário: ponte suspensa, carros abandonados, cidade em ruínas, rio e céu do pôr do sol.
import * as THREE from 'three';

export const PERIODO = 120;   // a ponte se repete a cada 120 m
const CABO_X = 9.4, LARG = 7.6;
export const SOL = new THREE.Vector3(.42, .2, -1).normalize();

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
const v = (x, y, z) => new THREE.Vector3(x, y, z);
function semente(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------- carro com carroceria de perfil ----------
function perfil(pts, larg, ch) { const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))), g = new THREE.ExtrudeGeometry(s, { depth: larg - ch * 2, bevelEnabled: true, bevelThickness: ch, bevelSize: ch * .7, bevelSegments: 2, curveSegments: 3 }); g.translate(0, 0, -(larg - ch * 2) / 2); g.rotateY(-Math.PI / 2); return g; }
function carro(M, x, z, ry, cor, tipo, queimado) {
  const por = (g, m, c) => { g.rotateY(ry); g.translate(x, 0, z); m.juntar(g, .4, c); };
  const alto = tipo === 'van' ? .42 : tipo === 'suv' ? .16 : 0, L = tipo === 'van' ? 2.45 : 2.2;
  const lata = queimado ? new THREE.Color(.1, .075, .06) : cor;
  por(perfil([[-L, .34], [-L, .72 + alto * .4], [-L + .12, .86 + alto * .6], [-1.1, .93 + alto * .6], [1.0, .9 + alto * .6], [L - .25, .78 + alto * .4], [L, .62], [L, .34], [1.75, .28], [-1.75, .28]], 1.78, .12), M.lata, lata);
  const teto = 1.42 + alto, tras = tipo === 'sedan' ? -1.55 : -L + .12;
  por(perfil([[tras, .88 + alto * .6], [tras + (tipo === 'sedan' ? .55 : .22), teto - .04], [tras + .9, teto], [.15, teto], [.5, teto - .07], [1.15, .88 + alto * .6]], 1.5, .13), M.lata, lata);
  // vidros
  const vid = new THREE.Color(queimado ? .01 : .02, queimado ? .01 : .028, queimado ? .01 : .034);
  por(perfil([[tras + .22, .98 + alto * .6], [tras + (tipo === 'sedan' ? .6 : .36), teto - .1], [.12, teto - .1], [.42, teto - .14], [.98, .98 + alto * .6]], 1.565, .05), M.vidro, vid);
  por(perfil([[.5, teto - .1], [1.16, .95 + alto * .6], [1.2, .93 + alto * .6], [.56, teto - .12]], 1.3, .02), M.vidro, vid);
  for (const [wx, wz] of [[-.8, 1.35], [.8, 1.35], [-.8, -1.35], [.8, -1.35]]) { const g = new THREE.CylinderGeometry(.33, .33, .24, 14); g.rotateZ(Math.PI / 2); g.translate(wx, .33, wz); por(g, M.vidro, new THREE.Color(.018, .018, .018)); const c = new THREE.CylinderGeometry(.19, .19, .26, 8); c.rotateZ(Math.PI / 2); c.translate(wx, .33, wz); por(c, M.lata, new THREE.Color(.16, .15, .14)); }
  for (const s of [-.62, .62]) { const f = new THREE.BoxGeometry(.34, .12, .06); f.translate(s, .68, L + .02); por(f, M.vidro, new THREE.Color(.25, .23, .2)); const t = new THREE.BoxGeometry(.3, .13, .06); t.translate(s, .74, -L - .02); por(t, M.vidro, new THREE.Color(.16, .012, .01)); }
}
function onibus(M, x, z, ry) {
  const por = (g, m, c) => { g.rotateY(ry); g.translate(x, 0, z); m.juntar(g, .4, c); };
  por(perfil([[-5, .4], [-5.05, 1.2], [-4.95, 3], [-4.7, 3.15], [4.6, 3.15], [4.95, 2.95], [5.1, 1.4], [5.05, .4]], 2.4, .12), M.lata, new THREE.Color(.34, .25, .07));
  for (let k = 0; k < 7; k++) { const g = new THREE.BoxGeometry(2.46, .85, 1.05); g.translate(0, 2.2, -4.1 + k * 1.28); por(g, M.vidro, new THREE.Color(.02, .025, .03)); }
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(2.1, 1.2, .1); g.translate(0, 2.1, s * 5.06); por(g, M.vidro, new THREE.Color(.02, .025, .03)); }
  for (const [wx, wz] of [[-1.05, 3.2], [1.05, 3.2], [-1.05, -3], [1.05, -3]]) { const g = new THREE.CylinderGeometry(.48, .48, .34, 14); g.rotateZ(Math.PI / 2); g.translate(wx, .48, wz); por(g, M.vidro, new THREE.Color(.018, .018, .018)); }
}

// ---------- céu ----------
const CEU_FRAG = /* glsl */`
  varying vec3 vDir; uniform sampler2D tRuido; uniform vec3 uSol; uniform float uDisco;
  void main() {
    vec3 d = normalize(vDir); float h = d.y, s = max(0., dot(d, uSol));
    vec3 alto = vec3(.10, .16, .30), meio = vec3(.46, .30, .30), baixo = vec3(1.05, .50, .20);
    vec3 c = mix(baixo, meio, smoothstep(-.02, .24, h)); c = mix(c, alto, smoothstep(.12, .62, h));
    c = mix(c * vec3(.62, .66, .86), c, .25 + .75 * smoothstep(-.3, .9, dot(normalize(d.xz + 1e-4), normalize(uSol.xz))));
    c += vec3(1., .5, .18) * (pow(s, 7.) * .55 + pow(s, 48.) * 1.1);
    if (h > .015) {
      vec2 q = d.xz / (h + .12); float n = texture2D(tRuido, q * vec2(.075, .03)).r * .6 + texture2D(tRuido, q * vec2(.2, .075) + .3).r * .3 + texture2D(tRuido, q * .45).g * .12;
      float nu = smoothstep(.48, .74, n) * smoothstep(.015, .16, h);
      vec3 cn = mix(vec3(.20, .16, .22), vec3(1.7, .78, .38), pow(s, 2.2) * .75 + .22 * (1. - smoothstep(.1, .5, h)));
      c = mix(c, cn, nu * .82);
    }
    float disco = smoothstep(.9987, .9992, dot(d, uSol)); c += vec3(14., 8., 3.4) * disco * uDisco;
    // silhueta distante da cidade
    float a = atan(d.x, -d.z) * 40., b = floor(a), pr = fract(sin(b * 12.98) * 4375.5), pr2 = fract(sin(b * 4.1 + 2.) * 911.7);
    float topo = .005 + .05 * pr * pr2 + .02 * step(.75, pr) + .012 * fract(sin(floor(a * 3.) * 7.7) * 99.3);
    c = mix(c, mix(vec3(.5, .28, .17), vec3(.95, .48, .22), pow(s, 6.)) * .8, (1. - smoothstep(topo - .0012, topo + .0012, h)) * .75);
    if (h < 0.) c = mix(c, vec3(.34, .22, .16), smoothstep(0., -.25, h));
    gl_FragColor = vec4(c, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
function ceu(ruido, disco) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false, uniforms: { tRuido: { value: ruido }, uSol: { value: SOL }, uDisco: { value: disco } }, vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: CEU_FRAG });
  const o = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 20), m); o.frustumCulled = false; o.renderOrder = -10; return o;
}

// ---------- asfalto molhado ----------
function asfalto(tx, ruido) {
  const m = new THREE.MeshStandardMaterial({ map: tx.asfalto_cor, normalMap: tx.asfalto_relevo, roughness: .8, metalness: 0, normalScale: new THREE.Vector2(.7, .7), envMapIntensity: 2.2 });
  m.onBeforeCompile = sh => {
    sh.uniforms.tRuido = { value: ruido };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;').replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; varying vec3 vMundo;')
      .replace('#include <map_fragment>', /* glsl */`#include <map_fragment>
        vec2 w = vMundo.xz; float r1 = texture2D(tRuido, w * .021).r, r2 = texture2D(tRuido, w * .09 + .4).g, r3 = texture2D(tRuido, w * .33).r;
        float poca = smoothstep(.535, .565, r1 * .9 + r2 * .13 - .01), umido = smoothstep(.3, .62, r1 * .7 + r3 * .3);
        float trilha = exp(-pow(abs(abs(w.x) - 2.1) - .85, 2.) * 5.);
        diffuseColor.rgb *= vec3(.62, .6, .6) * mix(1., .72, trilha * .5) * (.8 + .4 * r2);
        // remendos e rachaduras
        float rem = step(.66, texture2D(tRuido, floor(w / vec2(2.4, 5.)) * .137).r) * step(.12, fract(w.x / 2.4)) ; diffuseColor.rgb *= 1. - .22 * rem;
        float rac = 1. - smoothstep(.0, .022, abs(texture2D(tRuido, w * .055 + .2).r + (r3 - .5) * .12 - .5)); diffuseColor.rgb *= 1. - .55 * rac * smoothstep(.45, .6, r2);
        // faixas pintadas, gastas
        float z = w.y, gasto = smoothstep(.36, .6, r3 * .6 + r2 * .4 + .06), lin = 0.;
        lin = max(lin, 1. - smoothstep(.065, .085, abs(abs(w.x) - 5.35)));
        lin = max(lin, (1. - smoothstep(.06, .08, abs(abs(w.x) - 1.85))) * step(.5, fract(z / 6.)));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .58, .5) * (.7 + .3 * r3), lin * gasto * .8);
        // junta de dilatação
        float jz = abs(fract(z / 30.) - .5) * 30.; diffuseColor.rgb *= 1. - .8 * (1. - smoothstep(14.86, 14.9, 15. - (15. - jz)) ) * step(14.82, jz) ;
        float molhado = max(poca, umido * .45); diffuseColor.rgb *= mix(1., .34, molhado);`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(.82, .5, umido); roughnessFactor = mix(roughnessFactor, .045, poca);')
      .replace('#include <normal_fragment_maps>', 'vec3 nLiso = normal;\n#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nLiso, max(poca * .97, umido * .3)));');
  };
  return m;
}

export function criarCenario(cena, renderer, tx, ruido, qual) {
  const lixo = [], D = o => (lixo.push(o), o), rnd = semente(4242);
  // céu e luz do céu
  const domo = ceu(ruido, 1); cena.add(domo); D(domo.geometry); D(domo.material);
  const pm = new THREE.PMREMGenerator(renderer), cs = new THREE.Scene(), domo2 = ceu(ruido, .12); domo2.scale.setScalar(.1); cs.add(domo2);
  const env = D(pm.fromScene(cs, .01, .1, 200)); pm.dispose(); domo2.geometry.dispose(); domo2.material.dispose();
  cena.environment = env.texture; cena.environmentIntensity = .85;
  cena.fog = new THREE.Fog('#b9764c', 34, 290);

  for (const n of ['asfalto_cor', 'asfalto_relevo']) tx[n].repeat.set(1, 1);
  const mAsf = D(asfalto(tx, ruido));
  const mConc = D(new THREE.MeshStandardMaterial({ map: tx.concreto_cor, normalMap: tx.concreto_relevo, roughness: .88, vertexColors: true, color: '#b7aea3' }));
  const mAco = D(new THREE.MeshStandardMaterial({ map: tx.ferrugem_cor, normalMap: tx.ferrugem_relevo, roughness: .62, metalness: .35, vertexColors: true, color: '#a8887a' }));
  const mLata = D(new THREE.MeshStandardMaterial({ roughness: .5, metalness: .25, vertexColors: true }));
  const mVidro = D(new THREE.MeshStandardMaterial({ roughness: .14, metalness: .2, vertexColors: true }));
  // ferrugem e sujeira por cima da lataria
  mLata.onBeforeCompile = sh => {
    sh.uniforms.tRuido = { value: ruido };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;').replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = transformed;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; varying vec3 vMundo;')
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat fe = texture2D(tRuido, vMundo.xz * .31 + vMundo.y * .37).r * .6 + texture2D(tRuido, vMundo.zy * .8).g * .4; float fer = smoothstep(.5, .62, fe + (1. - smoothstep(.2, .8, vMundo.y)) * .1); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.12, .05, .025) * (.6 + .8 * texture2D(tRuido, vMundo.zy * 1.7).g), fer); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2, .16, .12), .3 * texture2D(tRuido, vMundo.xz * .7).g);')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(roughness, .9, fer);');
  };

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
  M.aco.barra(v(-LARG - .6, 0, -88), v(-LARG - .6, 4.4, -88), .08, 6, .5); M.lata.caixa(-LARG - .35, 3.6, -87.9, 2.1, 1.3, .06, { rz: -.12, cor: new THREE.Color(.03, .14, .08) });
  // carros, ônibus, contêiner e entulho no acostamento
  const CORES = ['#5a1d18', '#1f3246', '#6d6a64', '#26282a', '#73603a', '#35412f', '#7d7c78'].map(c => new THREE.Color(c));
  const lista = [[6.45, -9, .06, 'sedan'], [-6.5, -22, 3.2, 'suv'], [6.4, -34, -.1, 'van'], [-6.35, -43, .22, 'sedan'], [6.5, -63, 3.1, 'sedan'], [-6.55, -78, -.04, 'van'], [6.35, -92, .3, 'suv'], [-6.45, -106, 3.0, 'sedan'], [6.6, -112, .04, 'sedan']];
  lista.forEach(([x, z, r, t], i) => carro(M, x, z, r, CORES[i % CORES.length], t, i % 4 === 2));
  onibus(M, -6.7, -59, .035);
  M.aco.caixa(6.55, 1.25, -78, 2.3, 2.5, 6, { ry: .05, esc: .28, cor: 1.25 }); M.lata.caixa(6.55, 2.52, -78, 2.36, .08, 6.1, { ry: .05, cor: new THREE.Color(.2, .12, .1) });
  for (let k = 0; k < 70; k++) { const s = rnd() < .5 ? -1 : 1, t = .08 + rnd() * rnd() * .5; M.conc.caixa(s * (5.5 + rnd() * 1.8), t * .3, -rnd() * 120, t, t * .7, t * (.6 + rnd()), { rx: rnd(), ry: rnd() * 3, rz: rnd(), cor: .5 + rnd() * .5 }); }
  for (let k = 0; k < 9; k++) { const s = rnd() < .5 ? -1 : 1, z = -8 - rnd() * 105, x = s * 5.75; for (let a = 0; a < 5; a++) for (let l = 0; l < 2; l++) { const g = new THREE.SphereGeometry(.3, 8, 5); g.scale(1, .45, .62); g.translate(x + (l % 2) * .1, .14 + l * .23, z + a * .42 + l * .2); M.conc.juntar(g, .8, new THREE.Color(.62, .5, .36)); } }

  const geos = { conc: D(M.conc.pronta()), aco: D(M.aco.pronta()), lata: D(M.lata.pronta()), vidro: D(M.vidro.pronta()) };
  const gPista = new THREE.PlaneGeometry(LARG * 2 + .4, PERIODO); gPista.rotateX(-Math.PI / 2); gPista.translate(0, 0, -PERIODO / 2); { const u = gPista.attributes.uv, p = gPista.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / 4, p.getZ(i) / 4); } D(gPista);
  const trechos = [0, 1, 2].map(() => {
    const g = new THREE.Group();
    for (const [geo, mat, proj] of [[gPista, mAsf, false], [geos.conc, mConc, true], [geos.aco, mAco, true], [geos.lata, mLata, true], [geos.vidro, mVidro, false]]) { const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = proj && qual > 0; g.add(m); }
    cena.add(g); return g;
  });

  // ---------- rio ----------
  const mAgua = D(new THREE.MeshStandardMaterial({ color: '#1d2a2e', roughness: .16, metalness: .1, normalMap: tx.asfalto_relevo, normalScale: new THREE.Vector2(.35, .35) }));
  const gAgua = D(new THREE.PlaneGeometry(700, 700)); gAgua.rotateX(-Math.PI / 2); { const u = gAgua.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 22, u.getY(i) * 22); }
  const agua = new THREE.Mesh(gAgua, mAgua); agua.position.y = -46; cena.add(agua);

  // ---------- cidade ----------
  const fach = document.createElement('canvas'); fach.width = fach.height = 256; { const c = fach.getContext('2d'); c.fillStyle = '#6f675e'; c.fillRect(0, 0, 256, 256); for (let k = 0; k < 900; k++) { c.fillStyle = `rgba(${rnd() * 60 | 0},${rnd() * 50 | 0},${rnd() * 40 | 0},.12)`; c.fillRect(rnd() * 256, rnd() * 256, 3 + rnd() * 14, 8 + rnd() * 50); } for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const q = rnd(); c.fillStyle = q < .62 ? '#15171a' : q < .8 ? '#2c2f33' : q < .93 ? '#0a0a0a' : '#4b4238'; c.fillRect(x * 32 + 6, y * 32 + 5, 20, 20); if (q > .5) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x * 32 + 4, y * 32 + 25, 24, 4 + rnd() * 18); } c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x * 32 + 4, y * 32 + 2, 24, 2); } }
  const tFach = D(new THREE.CanvasTexture(fach)); tFach.colorSpace = THREE.SRGBColorSpace; tFach.wrapS = tFach.wrapT = THREE.RepeatWrapping; tFach.anisotropy = 4;
  const MC = new Mescla();
  for (const s of [-1, 1]) for (let f = 0; f < 3; f++) for (let z = 0; z < 360;) {
    const w = 12 + rnd() * 16, dp = 12 + rnd() * 14, h = 26 + rnd() * 34 + f * 20 * rnd() + (rnd() < .12 ? 40 : 0), x = s * (42 + f * 36 + rnd() * 14), cor = .5 + rnd() * .55, rz = rnd() < .08 ? (rnd() - .5) * .16 : 0;
    MC.caixa(x, -47 + h / 2, -z - dp / 2, w, h, dp, { cor, rz, esc: 1 / 24 });
    for (let k = 0; k < 2 + rnd() * 3; k++) { const ww = w * (.2 + rnd() * .4); MC.caixa(x + (rnd() - .5) * (w - ww), -47 + h + rnd() * 2.5, -z - dp * rnd(), ww, 1 + rnd() * 7, dp * (.2 + rnd() * .3), { cor: cor * .85, rz: rz + (rnd() - .5) * .1, esc: 1 / 24 }); }
    z += dp + 3 + rnd() * 18;
  }
  const gCid = D(MC.pronta()), mCid = D(new THREE.MeshStandardMaterial({ map: tFach, roughness: .95, vertexColors: true, envMapIntensity: .5 }));
  const cidades = [0, 1].map(() => { const m = new THREE.Mesh(gCid, mCid); m.frustumCulled = false; cena.add(m); return m; });

  // ---------- névoa no abismo e fumaça ----------
  const mNev = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, uniforms: { tRuido: { value: ruido }, uT: { value: 0 }, uF: { value: [.5, .36, .24][qual] }, uCor: { value: new THREE.Color(.75, .42, .25) } },
    vertexShader: 'varying vec2 vU; varying vec3 vP; void main(){ vU = uv; vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'varying vec2 vU; varying vec3 vP; uniform sampler2D tRuido; uniform float uT, uF; uniform vec3 uCor; void main(){ float n = texture2D(tRuido, vP.xz * .004 + uT * .004).r * .6 + texture2D(tRuido, vP.xz * .011 - uT * .003).r * .4; float b = 1. - smoothstep(.25, .5, distance(vU, vec2(.5))); gl_FragColor = vec4(uCor, smoothstep(.35, .75, n) * uF * b); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }',
  }));
  const gNev = D(new THREE.PlaneGeometry(520, 520)); gNev.rotateX(-Math.PI / 2);
  const nevoas = [[-28], [-20, -28, -36], [-15, -20, -25, -30, -35, -40]][qual].map(y => { const m = new THREE.Mesh(gNev, mNev); m.position.y = y; m.frustumCulled = false; m.renderOrder = 1; cena.add(m); return m; });
  const mFum = D(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: { tRuido: { value: ruido }, uT: mNev.uniforms.uT },
    vertexShader: 'varying vec2 vU; varying float vS; void main(){ vU = uv; vec4 c = modelMatrix * vec4(0., 0., 0., 1.); vS = c.x * .013; vec3 p = c.xyz + vec3(position.x + pow(uv.y, 1.6) * 26., position.y, 0.); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }',
    fragmentShader: 'varying vec2 vU; varying float vS; uniform sampler2D tRuido; uniform float uT; void main(){ float n = texture2D(tRuido, vec2(vU.x * .5 + vS, vU.y * 1.1 - uT * .012)).r * .6 + texture2D(tRuido, vec2(vU.x * 1.4 + vS, vU.y * 2.6 - uT * .03)).g * .4; float l = mix(.16, .48, vU.y), m = 1. - smoothstep(l * .4, l, abs(vU.x - .5)); float a = smoothstep(.3, .62, n + m * .3 - .12) * m * (1. - smoothstep(.55, 1., vU.y)) * smoothstep(0., .05, vU.y); vec3 c = mix(vec3(.06, .045, .04), vec3(.5, .27, .16), smoothstep(.3, .8, n) * .5 + vU.y * .3); c += vec3(1.3, .4, .06) * (1. - smoothstep(0., .12, vU.y)) * m; gl_FragColor = vec4(c, a * .82); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }',
  }));
  const gFum = D(new THREE.PlaneGeometry(46, 110, 1, 12)); gFum.translate(0, 55, 0);
  const fumos = [[-78, -120], [64, -210], [-120, -300], [104, -60]].map(([x, z]) => { const m = new THREE.Mesh(gFum, mFum); m.position.set(x, -10, z); m.userData.z = z; m.frustumCulled = false; m.renderOrder = 2; cena.add(m); return m; });

  let ligado = qual > 0;
  return {
    // d = distância percorrida; a câmera está em z = -d
    atualizar(d, t, cam) {
      const b = Math.floor((d - 24) / PERIODO) * PERIODO; trechos.forEach((g, i) => { g.position.z = -(b + i * PERIODO); });
      // só o trecho perto do pelotão faz sombra
      trechos.forEach((g, i) => { const z0 = b + i * PERIODO, sim = ligado && z0 < d + 46 && z0 + PERIODO > d - 14; if (g.userData.s !== sim) { g.userData.s = sim; for (const m of g.children) if (m.material !== mAsf && m.material !== mVidro) m.castShadow = sim; } });
      const c = Math.floor((d - 60) / 360) * 360; cidades.forEach((m, i) => { m.position.z = -(c + i * 360); });
      for (const f of fumos) { let z = f.userData.z; while (z > -d + 20) z -= 360; f.position.z = z; }
      domo.position.copy(cam.position); agua.position.z = -d - 150; mNev.uniforms.uT.value = t;
      for (const n of nevoas) n.position.z = -d - 120;
    },
    sombras(sim) { ligado = sim; },
    dispose() { for (const o of lixo) o.dispose(); cena.environment = null; },
  };
}
