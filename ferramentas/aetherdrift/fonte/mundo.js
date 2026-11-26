/* =====================================================================
   MUNDO — o vale onde se voa:
   relevo grande (2 km) com montanhas, cumes e um rio em degraus que
   vira lagos e cachoeiras; água animada; árvores, flores e pedras;
   neblina que mora no fundo dos vales; nuvens macias; cordilheiras
   ao longe; pássaros e pólen.
   ===================================================================== */
const TAU = Math.PI * 2;
const lim = (v, a, b) => v < a ? a : v > b ? b : v;
const suave = (a, b, x) => { const t = lim((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const angDif = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };

// ---------- números "aleatórios" repetíveis (cada voo sempre igual) ----------
let semente = 1;
const semear = s => { semente = s % 2147483646 || 1; };
const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };
const entre = (a, b) => a + rnd() * (b - a);

// ---------- ruído ----------
function hash2(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function perlin(x, z) {   // ruído de gradiente, -1..1
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = zf * zf * zf * (zf * (zf * 6 - 15) + 10);
  const g = (ix, iz, dx, dz) => { const a = hash2(ix, iz) * TAU; return Math.cos(a) * dx + Math.sin(a) * dz; };
  const n00 = g(xi, zi, xf, zf), n10 = g(xi + 1, zi, xf - 1, zf), n01 = g(xi, zi + 1, xf, zf - 1), n11 = g(xi + 1, zi + 1, xf - 1, zf - 1);
  return (n00 + (n10 - n00) * u + (n01 - n00) * v + (n00 - n10 - n01 + n11) * u * v) * 1.41;
}
function fbm(x, z, oit = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oit; i++) { s += a * perlin(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
// cristas: montanhas com arestas (multifractal "ridged"), 0..1
function cristas(x, z, oit = 5) {
  let s = 0, a = 1, f = 1, w = 1, n0 = 0;
  for (let i = 0; i < oit; i++) { let n = 1 - Math.abs(perlin(x * f, z * f)); n *= n; s += n * a * w; n0 += a; w = lim(n * 1.3, 0, 1); f *= 2.07; a *= 0.48; }
  return s / n0;
}

// ---------- uniformes que vários materiais dividem (tempo, névoa do vale) ----------
const U = {
  uTempo: { value: 0 },
  uNevCor: { value: new THREE.Color('#fff') }, uNevTopo: { value: 60 }, uNevEsp: { value: 50 }, uNevForca: { value: 0.5 },
  uFogCor: { value: new THREE.Color('#fff') }, uFogPerto: { value: 300 }, uFogLonge: { value: 2400 },
};
const GLSL_RUIDO = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), u.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), u.x), u.y); }`;
const GLSL_NEVOA = `
uniform float uTempo, uNevTopo, uNevEsp, uNevForca, uFogPerto, uFogLonge; uniform vec3 uNevCor, uFogCor;
vec3 neblinaVale(vec3 c, vec3 pm){
  float dc = distance(pm, cameraPosition);
  float alt = smoothstep(uNevTopo, uNevTopo - uNevEsp, pm.y);
  float ond = .55 + .45 * vnoise(pm.xz * .0045 + vec2(uTempo * .012, -uTempo * .007));
  return mix(c, uNevCor, alt * ond * smoothstep(30., 380., dc) * uNevForca);
}
vec3 nevoaLonge(vec3 c, vec3 pm){ return mix(c, uFogCor, smoothstep(uFogPerto, uFogLonge, distance(pm, cameraPosition))); }`;

// injeta a névoa do vale (e, se pedido, variação fina de cor) num material Lambert
function comNeblina(mat, variar = 0) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 pmw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          pmw = instanceMatrix * pmw;
        #endif
        vMundo = (modelMatrix * pmw).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;' + GLSL_RUIDO + GLSL_NEVOA)
      .replace('#include <color_fragment>', variar ? `#include <color_fragment>
        diffuseColor.rgb *= .9 + .13 * vnoise(vMundo.xz * .07) + .07 * vnoise(vMundo.xz * .9);` : '#include <color_fragment>')
      .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb = neblinaVale(gl_FragColor.rgb, vMundo);');
  };
  return mat;
}

// =====================================================================
// RELEVO: grade de alturas (2 km × 2 km) com rio, vales e cumes
// =====================================================================
const TER = { tam: 2000, seg: 400, cel: 5, n: 401, ini: -1000, h: null, dist: null, idx: null, rio: null, def: null, compRio: 0 };

// trecho de descida de cada degrau: curto (cachoeira) ou longo (corredeira, marcada com 'c')
const compDegrau = g => g[2] === 'c' ? 150 : 11;
function nivelRio(def, t, comp) {   // nível da água ao longo do rio
  const d = def.rio.degraus;
  for (let k = d.length - 1; k > 0; k--) {
    const dq = compDegrau(d[k]) / comp;
    if (t >= d[k][0]) return d[k][1];
    if (t >= d[k][0] - dq) { const u = (t - (d[k][0] - dq)) / dq; return mix(d[k - 1][1], d[k][1], d[k][2] === 'c' ? u : Math.pow(u, 1.6)); }
  }
  return d[0][1];
}
function emCorredeira(def, t, comp) { return def.rio.degraus.some(g => g[2] === 'c' && t <= g[0] + 4 / comp && t >= g[0] - compDegrau(g) / comp - 4 / comp); }
function larguraRio(def, t) {
  let w = def.rio.largura;
  for (const [a, b, W] of def.rio.lagos || []) w = Math.max(w, W * suave(a, a + 0.025, t) * (1 - suave(b - 0.012, b, t)));
  return w;
}

function construirRelevo(def, seg) {
  const tam = TER.tam, cel = tam / seg, n = seg + 1, ini = -tam / 2;
  Object.assign(TER, { seg, cel, n, ini, def });
  // --- rio: curva suave amostrada a cada 4 m ---
  const curva = new THREE.CatmullRomCurve3(def.rio.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const comp = curva.getLength(), N = Math.ceil(comp / 4), pts = curva.getSpacedPoints(N);
  TER.compRio = comp;
  const rio = pts.map((p, i) => { const t = i / N, tg = curva.getTangentAt(t); return { x: p.x, z: p.z, t, L: nivelRio(def, t, comp), w: larguraRio(def, t), tx: tg.x, tz: tg.z }; });
  for (let i = 0; i < rio.length; i++) { const a = rio[Math.max(i - 2, 0)], b = rio[Math.min(i + 2, rio.length - 1)]; rio[i].corr = emCorredeira(def, rio[i].t, comp); rio[i].queda = Math.max(Math.abs(a.L - b.L) / 16, rio[i].corr ? 0.5 : 0); }
  // nível do chão longe do rio: desce em rampa depois de cada degrau (o paredão fica só junto da água)
  for (let i = 0; i < rio.length; i++) { let m = rio[i].L; for (let j = Math.max(0, i - 45); j < i; j++) m = Math.max(m, rio[j].L - (i - j) * 0.8); rio[i].Lp = m; }
  TER.rio = rio;
  // --- distância de cada ponto da grade até o rio (carimbo em volta de cada ponto do rio) ---
  const R = def.vale.raio, R2 = R * R, dist2 = new Float32Array(n * n).fill(R2), idx = new Int32Array(n * n);
  for (let k = 0; k < rio.length; k++) {
    const p = rio[k], ci = Math.round((p.x - ini) / cel), cj = Math.round((p.z - ini) / cel), rc = Math.ceil(R / cel);
    for (let j = Math.max(cj - rc, 0); j <= Math.min(cj + rc, n - 1); j++) {
      const dz = ini + j * cel - p.z, dz2 = dz * dz; if (dz2 >= R2) continue;
      for (let i = Math.max(ci - rc, 0); i <= Math.min(ci + rc, n - 1); i++) {
        const dx = ini + i * cel - p.x, d2 = dx * dx + dz2, c = j * n + i;
        if (d2 < dist2[c]) { dist2[c] = d2; idx[c] = k; }
      }
    }
  }
  // pontos longe do rio herdam o ponto do rio mais próximo pela direção (só para nível de base)
  const dist = new Float32Array(n * n); for (let c = 0; c < n * n; c++) dist[c] = Math.sqrt(dist2[c]);
  for (let c = 0; c < n * n; c++) if (dist2[c] >= R2) { const i = c % n, j = (c - i) / n; idx[c] = rioMaisPerto(ini + i * cel, ini + j * cel); }
  // --- alturas ---
  const h = new Float32Array(n * n), rel = def.relevo, vale = def.vale;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const c = j * n + i, x = ini + i * cel, z = ini + j * cel, d = dist[c], r = rio[idx[c]], w = r.w, L = mix(r.L, r.Lp, suave(w + 3, w + 34, d));
    let m = rel.base + rel.amp * cristas(x / rel.escala + 3.1, z / rel.escala - 7.3, 5) * (0.6 + 0.5 * fbm(x / 900 + 9, z / 900, 2));
    if (rel.plato) { const p = rel.plato, q = m / p, f = q - Math.floor(q); m = (Math.floor(q) + suave(0.62, 0.9, f)) * p; }
    const e = Math.max(Math.abs(x), Math.abs(z)); m += suave(640, 960, e) * rel.borda;
    for (const cu of def.cumes) {   // cone largo, de topo arredondado, com arestas
      const dx = x - cu.x, dz = z - cu.z, rr = Math.sqrt(dx * dx + dz * dz), inc = cu.inc || 0.8; if (rr > cu.h / inc + 60) continue;
      const f = rr < 34 ? rr * rr / 68 : rr - 17, pk = cu.h - f * inc * (0.8 + 0.4 * cristas(x / 110 + cu.x * 0.01, z / 110, 3));
      m = smax(m, pk, 30);
    }
    const chao = w + vale.chao, v = suave(chao, chao + vale.largo, d), alto = Math.max(m, L + 8);
    let y = L + 1.4 + (alto - L - 1.4) * Math.pow(v, 1.35) + (1 - v) * 2.2 * fbm(x / 60, z / 60, 2);
    if (d < w + 6) { const prof = w > 18 ? 6.5 : 2.8; y = mix(r.L - prof, y, suave(w * 0.45, w + 6, d)); }
    // detalhe fino (menos no fundo do vale, nada na água)
    y += (perlin(x / 26, z / 26) * 1.8 + perlin(x / 9, z / 9) * 0.5) * (0.25 + v) * suave(w + 2, w + 12, d);
    h[c] = y;
  }
  // topo dos cumes bem plano (o mirante fica ali)
  for (const cu of def.cumes) {
    const ci = Math.round((cu.x - ini) / cel), cj = Math.round((cu.z - ini) / cel), rc = Math.ceil(16 / cel);
    for (let j = cj - rc; j <= cj + rc; j++) for (let i = ci - rc; i <= ci + rc; i++) {
      if (i < 0 || j < 0 || i >= n || j >= n) continue;
      const dd = Math.hypot(ini + i * cel - cu.x, ini + j * cel - cu.z); h[j * n + i] = mix(cu.h, h[j * n + i], suave(9, 16, dd));
    }
  }
  Object.assign(TER, { h, dist, idx });
  return TER;
}
function rioMaisPerto(x, z) {
  let m = 1e18, k = 0; const rio = TER.rio;
  for (let i = 0; i < rio.length; i += 3) { const dx = rio[i].x - x, dz = rio[i].z - z, d = dx * dx + dz * dz; if (d < m) { m = d; k = i; } }
  return k;
}

// altura exata do chão desenhado (interpola no mesmo triângulo da malha)
function alturaTerreno(x, z) {
  const { cel, n, h, ini } = TER; if (!h) return 0;
  let gx = (x - ini) / cel, gz = (z - ini) / cel;
  gx = lim(gx, 0, n - 1.001); gz = lim(gz, 0, n - 1.001);
  const i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
  const h00 = h[j * n + i], h10 = h[j * n + i + 1], h01 = h[(j + 1) * n + i], h11 = h[(j + 1) * n + i + 1];
  return fx + fz <= 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
}
function celula(x, z) { const { cel, n, ini } = TER; const i = lim(Math.round((x - ini) / cel), 0, n - 1), j = lim(Math.round((z - ini) / cel), 0, n - 1); return j * n + i; }
// nível da água sob (x,z), ou -Infinity se não há água ali
function nivelAgua(x, z) { const c = celula(x, z), r = TER.rio[TER.idx[c]]; return TER.dist[c] < r.w + 1 ? r.L - 0.35 : -Infinity; }
// o que está embaixo do planador: chão ou água
function piso(x, z) { return Math.max(alturaTerreno(x, z), nivelAgua(x, z)); }
function declive(x, z) { const a = alturaTerreno(x, z); return Math.hypot(alturaTerreno(x + 3, z) - a, alturaTerreno(x, z + 3) - a) / 3; }

// ---------- malha do terreno, com cor por vértice ----------
function malhaTerreno(def) {
  const { n, cel, ini, h, dist, idx, rio } = TER, cor = def.cores;
  const pos = new Float32Array(n * n * 3);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const c = j * n + i; pos[c * 3] = ini + i * cel; pos[c * 3 + 1] = h[c]; pos[c * 3 + 2] = ini + j * cel; }
  const ind = new Uint32Array((n - 1) * (n - 1) * 6); let k = 0;
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i, b = (j + 1) * n + i, c = a + 1, d = b + 1;
    ind[k++] = a; ind[k++] = b; ind[k++] = c; ind[k++] = c; ind[k++] = b; ind[k++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(ind, 1));
  geo.computeVertexNormals();
  const nor = geo.attributes.normal.array, cols = new Float32Array(n * n * 3);
  const C = k => new THREE.Color(k), g1 = C(cor.grama[0]), g2 = C(cor.grama[1]), g3 = C(cor.prado), seco = C(cor.seco), ro1 = C(cor.rocha[0]), ro2 = C(cor.rocha[1]),
    neve = C(cor.neve), areia = C(cor.areia), alpino = C(cor.alpino), tmp = new THREE.Color(), ro = new THREE.Color(), c = new THREE.Color();
  for (let v = 0; v < n * n; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], ny = nor[v * 3 + 1], incl = 1 - ny, d = dist[v], r = rio[idx[v]];
    // grama: duas cores em manchas grandes + clareiras de prado e capim seco
    const m1 = 0.5 + 0.5 * perlin(x / 240 + 4, z / 240), m2 = 0.5 + 0.5 * perlin(x / 90 - 2, z / 90 + 5);
    c.copy(g1).lerp(g2, suave(0.3, 0.75, m1)).lerp(g3, suave(0.62, 0.85, m2) * 0.8).lerp(seco, suave(0.55, 0.85, 0.5 + 0.5 * perlin(x / 150 + 11, z / 150 - 3)) * cor.secoQto);
    if (cor.aridez) {   // terra clara longe da água, verde só nas margens (como no Nascente)
      tmp.set(cor.arido[0]).lerp(ro.set(cor.arido[1]), 0.5 + 0.5 * perlin(x / 110 - 5, z / 110 + 2));
      c.lerp(tmp, suave(r.w + 30, r.w + 150, d + perlin(x / 60, z / 60) * 40) * cor.aridez);
    }
    // acima da linha das árvores a grama fica clara e rala
    c.lerp(alpino, suave(cor.linhaArvore, cor.linhaArvore + 70, y + perlin(x / 70, z / 70) * 20));
    // pedra nas encostas íngremes, com faixas (estratos)
    ro.copy(ro1).lerp(ro2, 0.5 + 0.5 * Math.sin(y * 0.19 + perlin(x / 50, z / 50) * 2.2));
    c.lerp(ro, suave(cor.pedraDe, cor.pedraDe + 0.2, incl + perlin(x / 30, z / 30) * 0.06));
    // neve no alto (menos onde é muito íngreme)
    const lnv = cor.linhaNeve + perlin(x / 80 + 7, z / 80) * 26;
    c.lerp(neve, suave(lnv, lnv + 26, y) * (1 - suave(0.55, 0.8, incl) * 0.75));
    if (TER.ocupado && TER.ocupado[v]) c.lerp(tmp.copy(g1).offsetHSL(0.01, 0.06, -0.03), 0.75);
    // margens de areia e seixos
    c.lerp(areia, (1 - suave(r.w + 1, r.w + 7 + 3 * perlin(x / 20, z / 20), d)) * (y < r.L + 3.5 ? 1 : 0.3));
    cols[v * 3] = c.r; cols[v * 3 + 1] = c.g; cols[v * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(geo, comNeblina(new THREE.MeshLambertMaterial({ vertexColors: true }), 1));
  m.receiveShadow = true;
  return m;
}

// ---------- água: rio, lagos e cachoeiras numa malha só ----------
function malhaAgua(def) {
  const { n, cel, ini, h, dist, idx, rio } = TER, perto = c => dist[c] < rio[idx[c]].w + 7;
  const mapa = new Int32Array(n * n).fill(-1), pos = [], flu = [], que = [], pro = [], ind = [];
  const vert = c => {
    if (mapa[c] >= 0) return mapa[c];
    const i = c % n, j = (c - i) / n, r = rio[idx[c]], y = r.L - 0.35;
    pos.push(ini + i * cel, y, ini + j * cel); flu.push(r.tx, r.tz); que.push(lim(r.queda, 0, 1.5)); pro.push(lim(y - h[c], 0, 10));
    return (mapa[c] = pos.length / 3 - 1);
  };
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i, b = (j + 1) * n + i, c = a + 1, d = b + 1;
    if (!(perto(a) || perto(b) || perto(c) || perto(d))) continue;
    const va = vert(a), vb = vert(b), vc = vert(c), vd = vert(d);
    ind.push(va, vb, vc, vc, vb, vd);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aFlux', new THREE.Float32BufferAttribute(flu, 2));
  geo.setAttribute('aQueda', new THREE.Float32BufferAttribute(que, 1));
  geo.setAttribute('aProf', new THREE.Float32BufferAttribute(pro, 1));
  geo.setIndex(ind);
  const cor = def.cores;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { ...U, uRaso: { value: new THREE.Color(cor.aguaRasa) }, uFundo: { value: new THREE.Color(cor.aguaFunda) }, uCeu: { value: new THREE.Color(cor.aguaCeu) },
      uSolDir: { value: new THREE.Vector3(0, 1, 0) }, uSolCor: { value: new THREE.Color('#fff4dc') } },
    vertexShader: `attribute vec2 aFlux; attribute float aQueda, aProf; varying vec2 vFlux; varying float vQueda, vProf; varying vec3 vMundo;
      void main(){ vFlux = aFlux; vQueda = aQueda; vProf = aProf; vec4 w = modelMatrix * vec4(position, 1.0); vMundo = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uRaso, uFundo, uCeu, uSolDir, uSolCor; varying vec2 vFlux; varying float vQueda, vProf; varying vec3 vMundo;
      ${GLSL_RUIDO}${GLSL_NEVOA}
      void main(){
        vec2 fl = normalize(vFlux + 1e-4), pe = vec2(-fl.y, fl.x), p = vMundo.xz;
        float vel = 1.2 + vQueda * 16.;
        vec2 q = vec2(dot(p, pe), dot(p, fl) - uTempo * vel);
        float e = .6;
        float a0 = vnoise(q * .22) + .5 * vnoise(q * .61 + 7.);
        float ax = vnoise((q + vec2(e, 0.)) * .22) + .5 * vnoise((q + vec2(e, 0.)) * .61 + 7.);
        float az = vnoise((q + vec2(0., e)) * .22) + .5 * vnoise((q + vec2(0., e)) * .61 + 7.);
        vec3 N = normalize(vec3((a0 - ax) * 1.3, 1., (a0 - az) * 1.3));
        vec3 V = normalize(cameraPosition - vMundo);
        float fres = pow(1. - max(dot(N, V), 0.), 3.);
        vec3 c = mix(uRaso, uFundo, smoothstep(.4, 6.5, vProf));
        c = mix(c, uCeu, .1 + fres * .55);
        c += uSolCor * pow(max(dot(reflect(-uSolDir, N), V), 0.), 140.) * 1.6;
        float faixa = vnoise(vec2(dot(p, pe) * .7, dot(p, fl) * .09 - uTempo * vel * .1));
        float espuma = smoothstep(.22, .7, vQueda) * (.6 + .4 * smoothstep(.35, .75, faixa));
        espuma += (1. - smoothstep(0., .9, vProf)) * .35 * vnoise(p * .8 + uTempo * .3);
        c = mix(c, vec3(1., .995, .97), clamp(espuma, 0., 1.));
        c = neblinaVale(c, vMundo); c = nevoaLonge(c, vMundo);
        gl_FragColor = vec4(c, mix(.55, .96, smoothstep(0., 1.2, vProf)) );
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 1;
  return m;
}

// =====================================================================
// CÉU: esfera com degradê e brilho do sol
// =====================================================================
function criarCeu() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { topo: { value: new THREE.Color() }, horiz: { value: new THREE.Color() }, baixo: { value: new THREE.Color() }, solDir: { value: new THREE.Vector3(0, 1, 0) }, solCor: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 topo, horiz, baixo, solDir, solCor; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = d.y;
        vec3 c = h > 0.0 ? mix(horiz, topo, pow(min(h * 1.15, 1.), 0.6)) : mix(horiz, baixo, pow(min(-h * 4.0, 1.0), 0.7));
        float s = max(dot(d, solDir), 0.0);
        c += solCor * (smoothstep(.9994, .9997, s) * 1.2 + pow(s, 60.0) * 0.22 + pow(s, 6.0) * 0.1);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(5000, 40, 20), mat);
  ceu.renderOrder = -10; ceu.frustumCulled = false;
  return ceu;
}

// =====================================================================
// CASCATAS NAS ENCOSTAS (estilo vale suíço) e VILAREJO — só o traçado aqui;
// as malhas são feitas em voos.js. Os lugares ocupados ficam sem árvores.
// =====================================================================
function marcarOcupado(x, z, raio) {
  const { cel, ini, n } = TER, ci = Math.round((x - ini) / cel), cj = Math.round((z - ini) / cel), rc = Math.ceil(raio / cel);
  for (let j = cj - rc; j <= cj + rc; j++) for (let i = ci - rc; i <= ci + rc; i++) if (i >= 0 && j >= 0 && i < n && j < n) TER.ocupado[j * n + i] = 1;
}
function tracarCascatas(def) {
  TER.ocupado = new Uint8Array(TER.n * TER.n); TER.cascatas = []; TER.chales = []; TER.rebanho = [];
  const qtd = (def.cascatas && def.cascatas.qtd) || 0, V = def.vale, lista = TER.cascatas;
  for (let tent = 0; tent < 12000 && lista.length < qtd; tent++) {
    const x0 = entre(-830, 830), z0 = entre(-830, 830), c0 = celula(x0, z0), r0 = TER.rio[TER.idx[c0]], d0 = TER.dist[c0];
    if (d0 < r0.w + V.chao + V.largo * 0.4 || d0 > r0.w + V.chao + V.largo + 110) continue;
    const y0 = alturaTerreno(x0, z0); if (y0 - r0.L < 70 || y0 > def.cores.linhaNeve + 60) continue;
    if (def.cumes.some(cu => Math.hypot(x0 - cu.x, z0 - cu.z) < 120)) continue;
    if (lista.some(o => Math.hypot(o.pts[0].x - x0, o.pts[0].z - z0) < 85 || Math.hypot(o.fim.x - x0, o.fim.z - z0) < 55)) continue;
    // a água desce pela linha de maior declive; no plano, segue para o rio
    const pts = []; let x = x0, z = z0, ok = false, queda = 0;
    for (let k = 0; k < 520; k++) {
      const y = alturaTerreno(x, z), c = celula(x, z), r = TER.rio[TER.idx[c]];
      pts.push({ x, y, z });
      if (TER.dist[c] < r.w + 0.5) { ok = true; break; }
      if (k > 1 && pts[k - 1].y - y > 2.4) queda += pts[k - 1].y - y;
      const gx = (alturaTerreno(x + 2, z) - alturaTerreno(x - 2, z)) / 4, gz = (alturaTerreno(x, z + 2) - alturaTerreno(x, z - 2)) / 4, g = Math.hypot(gx, gz) || 1e-6;
      const rx = r.x - x, rz = r.z - z, rl = Math.hypot(rx, rz) || 1, w = 1 - suave(0.06, 0.3, g);
      let dx = mix(-gx / g, rx / rl, w), dz = mix(-gz / g, rz / rl, w); const l = Math.hypot(dx, dz) || 1;
      x += dx / l * 3; z += dz / l * 3;
    }
    if (!ok || queda < 40) continue;
    if (lista.some(o => o.pts.some(p => Math.hypot(p.x - pts[pts.length - 1].x, p.z - pts[pts.length - 1].z) < 24))) continue;
    for (let k = 0; k < pts.length; k++) {   // declive (queda por metro andado), suavizado
      const a = pts[Math.max(k - 2, 0)], b = pts[Math.min(k + 2, pts.length - 1)], hd = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      pts[k].s = (a.y - b.y) / hd;
    }
    for (const p of pts) marcarOcupado(p.x, p.z, 8);
    lista.push({ pts, fim: pts[pts.length - 1], queda });
  }
  escolherVilarejo(def);
}
function escolherVilarejo(def) {
  const vila = def.vilarejo; if (!vila) return;
  const V = def.vale, livre = (x, z) => !TER.ocupado[celula(x, z)];
  const plano = (x, z) => {
    const c = celula(x, z), r = TER.rio[TER.idx[c]], d = TER.dist[c], y = alturaTerreno(x, z);
    return d > r.w + 16 && d < r.w + V.chao + 50 && y > r.L + 1.5 && declive(x, z) < 0.16 && livre(x, z) && !def.cumes.some(cu => Math.hypot(x - cu.x, z - cu.z) < 60);
  };
  const quintalOk = (x, z) => { const c = celula(x, z), r = TER.rio[TER.idx[c]]; return TER.dist[c] > r.w + 8 && alturaTerreno(x, z) > r.L + 1 && declive(x, z) < 0.3 && livre(x, z); };
  const centros = [];
  for (let tent = 0; tent < 3000 && centros.length < vila.grupos; tent++) {
    const x = entre(-860, 860), z = entre(-860, 860);
    if (plano(x, z) && !centros.some(c => Math.hypot(c.x - x, c.z - z) < 200)) centros.push({ x, z });
  }
  for (const c of centros) {
    const n = 4 + Math.floor(rnd() * 5);
    for (let k = 0, t = 0; k < n && t < 250; t++) {
      const x = c.x + entre(-75, 75), z = c.z + entre(-75, 75), rot = rnd() * TAU;
      if (TER.chales.some(o => Math.hypot(o.x - x, o.z - z) < 30)) continue;
      // o quintal inteiro (cerca 18 x 17 m, na frente da casa) precisa caber no plano
      const canto = (lx, lz) => [x + lx * Math.cos(rot) + lz * Math.sin(rot), z - lx * Math.sin(rot) + lz * Math.cos(rot)];
      if (!plano(x, z) || ![[-9, -6], [9, -6], [-9, 11], [9, 11]].every(([a, b]) => quintalOk(...canto(a, b)))) continue;
      TER.chales.push({ x, z, y: alturaTerreno(x, z), rot, esc: entre(0.9, 1.15) });
      for (const [a, b] of [[0, 0], [0, 7], [-6, 4], [6, 4]]) marcarOcupado(...canto(a, b), 9);
      k++;
    }
    // um rebanho pastando perto de cada grupo de casas
    const ang = rnd() * TAU, bx = c.x + Math.cos(ang) * 80, bz = c.z + Math.sin(ang) * 80;
    for (let k = 0, t = 0; k < vila.bichos && t < 80; t++) {
      const x = bx + entre(-30, 30), z = bz + entre(-30, 30), cl = celula(x, z), r = TER.rio[TER.idx[cl]];
      if (TER.dist[cl] < r.w + 6 || declive(x, z) > 0.3) continue;
      TER.rebanho.push({ x, z, y: alturaTerreno(x, z), rot: rnd() * TAU, tipo: k < 3 ? 'cavalo' : 'vaca' }); k++;
    }
  }
}

// =====================================================================
// VEGETAÇÃO E PEDRAS (instanciadas e em blocos, para o celular aguentar)
// =====================================================================
function juntarGeos(lista) {
  const gs = lista.map(g => g.index ? g.toNonIndexed() : g);
  const tot = gs.reduce((s, g) => s + g.attributes.position.count, 0), pos = new Float32Array(tot * 3), nor = new Float32Array(tot * 3);
  let o = 0; for (const g of gs) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return r;
}
function geoPinheiro() {
  const a = new THREE.ConeGeometry(1, 0.55, 8).translate(0, 0.28, 0), b = new THREE.ConeGeometry(0.78, 0.48, 8).translate(0, 0.56, 0), c = new THREE.ConeGeometry(0.52, 0.42, 8).translate(0, 0.8, 0);
  return juntarGeos([a, b, c]);
}
function geoCopa() {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.14 * Math.sin(x * 5.1 + y * 3.3) * Math.cos(z * 4.7); p.setXYZ(i, x * k, y * k * 0.85, z * k); }
  g.computeVertexNormals(); return g;
}

function plantarVegetacao(raiz, def, qtd) {
  const v = def.vegetacao, cor = def.cores, BL = 334, nb = Math.ceil(TER.tam / BL);
  const blocos = Array.from({ length: nb * nb }, () => ({ pin: [], fol: [], arb: [] })), ocup = TER.ocupado;
  const geoP = geoPinheiro(), geoF = geoCopa(), geoT = new THREE.CylinderGeometry(0.12, 0.2, 1, 5).translate(0, 0.5, 0);
  const tenta = qtd * 9;
  for (let t = 0; t < tenta; t++) {
    const x = entre(-930, 930), z = entre(-930, 930), y = alturaTerreno(x, z), c = celula(x, z), r = TER.rio[TER.idx[c]];
    if (TER.dist[c] < r.w + 9 || y < r.L + 1.5 || (ocup && ocup[c])) continue;
    if (y > cor.linhaArvore + perlin(x / 60, z / 60) * 30) continue;
    const dcl = declive(x, z); if (dcl > (v.encosta || 0.62)) continue;
    let dens = 0.5 + 0.5 * perlin(x / 160 + 21, z / 160 - 8) + 0.25 * perlin(x / 40, z / 40);
    if (cor.aridez) dens += 0.45 * (1 - suave(r.w + 10, r.w + 110, TER.dist[c])) - 0.3 * suave(r.w + 80, r.w + 220, TER.dist[c]);
    if (dens < v.mata && rnd() < 0.93) continue;
    if (def.cumes.some(cu => Math.hypot(x - cu.x, z - cu.z) < 26)) continue;
    const b = blocos[Math.floor((z + 1000) / BL) * nb + Math.floor((x + 1000) / BL)]; if (!b) continue;
    const pinheiro = y > v.pinheiroAcima + perlin(x / 90, z / 90) * 40 || rnd() < v.pinheiroQto;
    (pinheiro ? b.pin : b.fol).push([x, y, z]);
  }
  // arbustos e moitas ao longo das margens do rio
  for (let t = 0; t < qtd * 0.5; t++) {
    const r = TER.rio[Math.floor(rnd() * TER.rio.length)], o = (r.w + entre(3, 26)) * (rnd() < 0.5 ? -1 : 1), x = r.x - r.tz * o, z = r.z + r.tx * o;
    const c = celula(x, z), y = alturaTerreno(x, z); if (TER.dist[c] < TER.rio[TER.idx[c]].w + 2.5 || y < r.L + 0.6 || (ocup && ocup[c]) || declive(x, z) > 0.8) continue;
    if (r.L > cor.linhaArvore + 40) continue;
    const b = blocos[Math.floor((z + 1000) / BL) * nb + Math.floor((x + 1000) / BL)]; if (b) b.arb.push([x, y, z]);
  }
  const mP = comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), mF = comNeblina(new THREE.MeshLambertMaterial({ color: '#fff' })), mT = comNeblina(new THREE.MeshLambertMaterial({ color: cor.tronco }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color(), cima = new THREE.Vector3(0, 1, 0);
  let total = 0;
  for (const b of blocos) {
    if (b.arb.length) {
      const im = new THREE.InstancedMesh(geoF, mF, b.arb.length);
      b.arb.forEach(([x, y, z], i) => {
        const r = entre(1.1, 2.6) * v.escala; q.setFromAxisAngle(cima, rnd() * TAU);
        im.setMatrixAt(i, m4.compose(p.set(x, y + r * 0.35, z), q, s.set(r * entre(1, 1.5), r * entre(0.6, 0.9), r)));
        im.setColorAt(i, cc.set(v.folhas[Math.floor(rnd() * v.folhas.length)]).offsetHSL(0, entre(-0.02, 0.04), entre(-0.07, 0)));
      });
      im.receiveShadow = true; raiz.add(im); total += b.arb.length;
    }
    const nt = b.pin.length + b.fol.length; if (!nt) continue;
    const troncos = new THREE.InstancedMesh(geoT, mT, nt); let it = 0;
    if (b.pin.length) {
      const im = new THREE.InstancedMesh(geoP, mP, b.pin.length);
      b.pin.forEach(([x, y, z], i) => {
        const alt = entre(7, 15) * v.escala, r = alt * (v.estreito ? entre(0.11, 0.15) : entre(0.24, 0.32)), tr = alt * 0.14;
        q.setFromAxisAngle(cima, rnd() * TAU);
        im.setMatrixAt(i, m4.compose(p.set(x, y + tr * 0.8, z), q, s.set(r, alt, r)));
        im.setColorAt(i, cc.set(v.pinheiros[Math.floor(rnd() * v.pinheiros.length)]).offsetHSL(0, entre(-0.03, 0.03), entre(-0.04, 0.04)));
        troncos.setMatrixAt(it++, m4.compose(p.set(x, y - 0.3, z), q, s.set(r * 0.5, tr + 0.6, r * 0.5)));
      });
      im.castShadow = true; im.receiveShadow = true; raiz.add(im);
    }
    if (b.fol.length) {
      const im = new THREE.InstancedMesh(geoF, mF, b.fol.length);
      b.fol.forEach(([x, y, z], i) => {
        const r = entre(2.6, 4.6) * v.escala, tr = entre(2.2, 3.6) * v.escala;
        q.setFromAxisAngle(cima, rnd() * TAU);
        im.setMatrixAt(i, m4.compose(p.set(x, y + tr + r * 0.6, z), q, s.set(r, r * entre(0.9, 1.15), r)));
        im.setColorAt(i, cc.set(v.folhas[Math.floor(rnd() * v.folhas.length)]).offsetHSL(0, entre(-0.03, 0.03), entre(-0.04, 0.04)));
        troncos.setMatrixAt(it++, m4.compose(p.set(x, y - 0.3, z), q, s.set(1.2, tr + 0.8, 1.2)));
      });
      im.castShadow = true; im.receiveShadow = true; raiz.add(im);
    }
    troncos.count = it; troncos.castShadow = true; raiz.add(troncos);
    total += nt;
  }
  return total;
}

function espalharPedras(raiz, def, qtd) {
  const geo = new THREE.DodecahedronGeometry(1, 0), m = new THREE.InstancedMesh(geo, comNeblina(new THREE.MeshLambertMaterial({ color: '#fff', flatShading: true })), qtd);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), p0 = new THREE.Vector3(), c = new THREE.Color(), e = new THREE.Euler();
  let k = 0;
  for (let t = 0; t < qtd * 6 && k < qtd * 0.7; t++) {
    const x = entre(-940, 940), z = entre(-940, 940), cl = celula(x, z), r = TER.rio[TER.idx[cl]], d = TER.dist[cl], y = alturaTerreno(x, z);
    const margem = d > r.w + 1 && d < r.w + 14, encosta = declive(x, z) > 0.35, seco = def.cores.aridez && d > r.w + 60 && rnd() < 0.012, prado = !encosta && rnd() < 0.01;
    if (!margem && !seco && !prado && !(encosta && rnd() < 0.12)) continue;
    if (def.cumes.some(cu => Math.hypot(x - cu.x, z - cu.z) < 30)) continue;
    const tam = margem ? entre(0.6, 2.2) : entre(1.5, 5.5);
    q.setFromEuler(e.set(rnd() * 3, rnd() * 3, rnd() * 3));
    m.setMatrixAt(k, m4.compose(p.set(x, y - tam * 0.15, z), q, s.set(tam * entre(0.9, 1.5), tam * entre(0.5, 0.9), tam)));
    m.setColorAt(k++, c.set(def.cores.rocha[0]).offsetHSL(0, -0.03, entre(0.02, 0.1)));
  }
  // pedras ao lado das cascatas e dos riachos que descem das montanhas
  for (const cs of TER.cascatas || []) for (let i = 2; i < cs.pts.length && k < qtd; i += 3) {
    const p = cs.pts[i], b = cs.pts[Math.min(i + 1, cs.pts.length - 1)], tl = Math.hypot(b.x - p.x, b.z - p.z) || 1, lado = rnd() < 0.5 ? -1 : 1, o = lado * entre(3.5, 7);
    const x = p.x - (b.z - p.z) / tl * o, z = p.z + (b.x - p.x) / tl * o, tam = entre(0.9, 3);
    q.setFromEuler(e.set(rnd() * 3, rnd() * 3, rnd() * 3));
    m.setMatrixAt(k, m4.compose(p0.set(x, alturaTerreno(x, z) - tam * 0.2, z), q, s.set(tam * entre(1, 1.5), tam * entre(0.6, 0.9), tam)));
    m.setColorAt(k++, c.set(def.cores.rocha[rnd() < 0.5 ? 0 : 1]).offsetHSL(0, -0.02, entre(-0.02, 0.08)));
  }
  // pedras redondas no meio das corredeiras (a água espuma em volta)
  for (let i = 0; i < TER.rio.length && k < qtd; i += 2) {
    const r = TER.rio[i]; if (!r.corr) continue;
    for (let n = 0; n < 2 && k < qtd; n++) {
      const o = entre(-0.85, 0.85) * r.w, x = r.x - r.tz * o, z = r.z + r.tx * o, tam = entre(0.8, 2.4);
      q.setFromEuler(e.set(rnd() * 3, rnd() * 3, rnd() * 3));
      m.setMatrixAt(k, m4.compose(p.set(x, r.L - 0.6, z), q, s.set(tam * 1.3, tam * 0.8, tam)));
      m.setColorAt(k++, c.set(def.cores.rocha[1]).offsetHSL(0, -0.03, entre(-0.02, 0.06)));
    }
  }
  m.count = k; m.castShadow = true; m.receiveShadow = true; raiz.add(m);
}

// flores: pontinhos coloridos nos prados (de longe, um tapete pontilhado)
function espalharFlores(raiz, def, qtd) {
  const pos = [], cor = [], cs = def.vegetacao.flores.map(k => new THREE.Color(k));
  for (let t = 0; t < qtd * 5 && pos.length < qtd * 3; t++) {
    const x = entre(-940, 940), z = entre(-940, 940), cl = celula(x, z), r = TER.rio[TER.idx[cl]], y = alturaTerreno(x, z);
    if (TER.dist[cl] < r.w + 4 || y > def.cores.linhaArvore + 40 || declive(x, z) > 0.3) continue;
    if (0.5 + 0.5 * perlin(x / 70 + 3, z / 70 - 9) < 0.58) continue;
    const c = cs[Math.floor(rnd() * cs.length)];
    pos.push(x, y + 0.5, z); cor.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, map: texturaBrilho(), vertexColors: true, transparent: true, alphaTest: 0.25, depthWrite: false }));
  raiz.add(pts);
}

// =====================================================================
// NUVENS: muitas "bolas" de algodão num desenho só, sempre de frente
// =====================================================================
function texturaNuvem() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const cx = cv.getContext('2d');
  semear(4242);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU, d = rnd() * 30, x = 64 + Math.cos(a) * d, y = 70 + Math.sin(a) * d * 0.6, r = entre(18, 34);
    const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(cv);
}
function criarNuvens(raiz, def) {
  const nv = def.nuvens, lista = [];
  for (let i = 0; i < nv.qtd; i++) {
    const baixa = rnd() < nv.baixas, x = entre(-1100, 1100), z = entre(-1100, 1100);
    const y = baixa ? entre(nv.altBaixa[0], nv.altBaixa[1]) : entre(nv.alt[0], nv.alt[1]);
    const larg = baixa ? entre(60, 140) : entre(70, 190), np = baixa ? 6 : 9;
    for (let k = 0; k < np; k++) {
      const u = k / (np - 1) - 0.5, r = (baixa ? entre(26, 46) : entre(34, 70)) * (1 - Math.abs(u) * 0.8);
      lista.push([x + u * larg + entre(-12, 12), y + entre(-4, 8) + (1 - Math.abs(u) * 2) * r * 0.25, z + entre(-20, 20), r * 2.2, baixa ? 0.55 : 0.85, entre(0.85, 1)]);
    }
  }
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...U, mapa: { value: texturaNuvem() }, uLuz: { value: new THREE.Color(nv.luz) }, uSombra: { value: new THREE.Color(nv.sombra) } },
    vertexShader: `varying vec2 vUv; varying vec3 vMundo; varying float vA, vTom, vDist;
      void main(){ vUv = uv; vec4 c = instanceMatrix * vec4(0., 0., 0., 1.); vMundo = (modelMatrix * c).xyz;
        float esc = length(instanceMatrix[0].xyz); vec4 mv = viewMatrix * vec4(vMundo, 1.);
        mv.xy += position.xy * esc; vDist = -mv.z; vA = instanceColor.r; vTom = instanceColor.g; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D mapa; uniform vec3 uLuz, uSombra; varying vec2 vUv; varying vec3 vMundo; varying float vA, vTom, vDist;
      ${GLSL_RUIDO}${GLSL_NEVOA}
      void main(){ vec4 t = texture2D(mapa, vUv); vec3 c = mix(uSombra, uLuz, smoothstep(.15, .85, vUv.y) * vTom);
        c = nevoaLonge(c, vMundo); float a = t.a * vA * smoothstep(8., 70., vDist) * (1. - smoothstep(uFogLonge * .9, uFogLonge * 1.4, vDist));
        if (a < .004) discard; gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  }), lista.length);
  const m4 = new THREE.Matrix4(), cc = new THREE.Color();
  lista.forEach(([x, y, z, s, a, tom], i) => { im.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(x, y, z)); im.setColorAt(i, cc.setRGB(a, tom, 0)); });
  im.frustumCulled = false; im.renderOrder = 3; raiz.add(im);
  im.userData.vel = nv.vento;
  return im;
}

// =====================================================================
// CORDILHEIRAS AO LONGE: faixas em volta do mundo, cada vez mais claras
// =====================================================================
function criarCordilheiras(raiz, def) {
  const cam = def.longe;
  cam.forEach(([R, hmin, hmax, cor, neve], li) => {
    const N = 220, pos = [], cols = [], ind = [], base = new THREE.Color(def.ceu.horiz), cc = new THREE.Color(cor), cn = new THREE.Color(neve || cor);
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU, x = Math.cos(a), z = Math.sin(a);
      const hh = hmin + (hmax - hmin) * cristas(Math.cos(a) * 2.2 + li * 9, Math.sin(a) * 2.2 + li * 4, 4) * (0.7 + 0.3 * Math.sin(a * 3 + li));
      pos.push(x * R, -60, z * R, x * R, hh * 0.62, z * R, x * R, hh, z * R);
      const c1 = base, c2 = cc.clone().lerp(base, 0.35), c3 = hh > hmin + (hmax - hmin) * 0.6 ? cn : cc;
      cols.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b, c3.r, c3.g, c3.b);
      if (i < N) { const o = i * 3; ind.push(o, o + 3, o + 1, o + 1, o + 3, o + 4, o + 1, o + 4, o + 2, o + 2, o + 4, o + 5); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.setIndex(ind);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
    m.renderOrder = -5 + li; m.frustumCulled = false; raiz.add(m);
  });
}

// =====================================================================
// PÁSSAROS: bandos pequenos que circulam devagar
// =====================================================================
function criarPassaros(raiz, def) {
  const asa = (lado, l) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.45, 0, 0, 0.5, l * lado, 0, 0.15], 3)); return g; };
  const gE = asa(-1, 1.7), gD = asa(1, 1.7), gAE = asa(-1, 2.8), gAD = asa(1, 2.8);
  const mat = new THREE.MeshBasicMaterial({ color: def.passaros.cor, side: THREE.DoubleSide });
  const matA = new THREE.MeshBasicMaterial({ color: def.passaros.aguia || '#d8b894', side: THREE.DoubleSide });
  const novaAve = (esc, grande) => {
    const ave = new THREE.Group(), e = new THREE.Mesh(grande ? gAE : gE, grande ? matA : mat), d = new THREE.Mesh(grande ? gAD : gD, grande ? matA : mat);
    ave.add(e, d); ave.scale.setScalar(esc); ave.userData = { o: new THREE.Vector3(), f: entre(2.6, 3.6), fase: rnd() * TAU, e, d }; return ave;
  };
  const bater = (a, t, forca = 0.6) => { const u = a.userData, b = Math.sin(t * u.f + u.fase); u.e.rotation.z = -b * forca; u.d.rotation.z = b * forca; };
  const rio = TER.rio, bandos = [], rasantes = [], aguias = [];
  // bandos que circulam devagar (os do vale e mais alguns sobre o rio)
  const defs = def.passaros.bandos.slice();
  for (let k = 0; k < 1; k++) { const r = rio[Math.floor(entre(0.2, 0.8) * rio.length)]; defs.push([r.x, r.L + entre(55, 110), r.z, entre(70, 130)]); }
  for (const [x, y, z, raio] of defs) {
    const g = new THREE.Group(), aves = [];
    for (let i = 0; i < 5; i++) { const a = novaAve(entre(1.6, 2.2)); a.userData.o.set(entre(-16, 16), entre(-5, 5), entre(-16, 16)); g.add(a); aves.push(a); }
    raiz.add(g); bandos.push({ g, aves, x, y, z, raio, a: rnd() * TAU, v: entre(0.04, 0.08) * (rnd() < 0.5 ? -1 : 1) });
  }
  // andorinhas: sobem e descem o rio, rente à água
  for (let k = 0; k < 2; k++) {
    const g = new THREE.Group(), aves = [];
    for (let i = 0; i < 3; i++) { const a = novaAve(entre(0.8, 1.1)); a.userData.f = entre(6, 8); a.userData.o.set(entre(-5, 5), entre(-1.5, 1.5), entre(-6, 6)); g.add(a); aves.push(a); }
    raiz.add(g); rasantes.push({ g, aves, i: entre(0.05, 0.95) * (rio.length - 1), v: entre(13, 19), dir: rnd() < 0.5 ? -1 : 1, fase: rnd() * TAU });
  }
  // águias: planam em círculos largos sobre as encostas, quase sem bater asa
  // (as águias são postas depois, girando dentro das espirais de vento do caminho)
  // de vez em quando um bando vem voar ao lado do planador
  const comp = { g: new THREE.Group(), aves: [], espera: entre(30, 50), t: -1, lado: 1 };
  for (let i = 0; i < 5; i++) { const a = novaAve(entre(1.3, 1.7)); a.userData.o.set((i % 2 ? 1 : -1) * Math.ceil(i / 2) * 3.2, entre(-1, 1), -Math.ceil(i / 2) * 3.4); comp.g.add(a); comp.aves.push(a); }
  comp.g.visible = false; raiz.add(comp.g);
  const fr = new THREE.Vector3(), di = new THREE.Vector3();
  return {
    // duas águias girando em cada espiral de vento: mostram onde o ar sobe
    nasTermicas(lista) {
      for (const T of lista) for (let k = 0; k < 2; k++) {
        const a = novaAve(entre(2.3, 2.8), true); raiz.add(a);
        aguias.push({ a, x: T.x, z: T.z, y: mix(T.base, T.topo, 0.35 + k * 0.3), raio: T.r * entre(0.35, 0.55), ang: rnd() * TAU, v: 0.22 * (k ? 1 : 1.15) });
      }
    },
    atualizar(dt, t, plan, voando) {
      for (const b of bandos) {
        b.a += b.v * dt;
        b.g.position.set(b.x + Math.cos(b.a) * b.raio, b.y + Math.sin(t * 0.3 + b.x) * 6, b.z + Math.sin(b.a) * b.raio);
        b.g.rotation.y = b.v > 0 ? -b.a : Math.PI - b.a;
        for (const a of b.aves) { const u = a.userData; a.position.set(u.o.x + Math.sin(t * 0.4 + u.fase) * 3, u.o.y + Math.sin(t * 0.7 + u.fase) * 1.5, u.o.z); bater(a, t); }
      }
      for (const r of rasantes) {
        r.i += r.dir * r.v * dt / 4;
        if (r.i < 2 || r.i > rio.length - 3) { r.dir *= -1; r.i = lim(r.i, 2, rio.length - 3); }
        const p = rio[Math.floor(r.i)], s = Math.sin(t * 0.9 + r.fase), o = s * p.w * 0.6;
        r.g.position.set(p.x - p.tz * o, p.L + 4 + 2.5 * Math.sin(t * 1.3 + r.fase), p.z + p.tx * o);
        r.g.rotation.y = Math.atan2(p.tx * r.dir, p.tz * r.dir) + Math.cos(t * 0.9 + r.fase) * 0.5 * r.dir;
        for (const a of r.aves) { const u = a.userData; a.position.set(u.o.x + Math.sin(t * 2 + u.fase) * 1.5, u.o.y, u.o.z); bater(a, t, 0.8); }
      }
      for (const g of aguias) {
        g.ang += g.v * dt;
        g.a.position.set(g.x + Math.cos(g.ang) * g.raio, g.y + Math.sin(t * 0.2 + g.x) * 8, g.z + Math.sin(g.ang) * g.raio);
        g.a.rotation.set(0, g.v > 0 ? -g.ang : Math.PI - g.ang, 0); g.a.rotateZ(g.v > 0 ? 0.32 : -0.32);
        const u = g.a.userData, b = Math.sin(t * 0.8 + u.fase) * 0.08 + 0.12; u.e.rotation.z = -b; u.d.rotation.z = b;
      }
      // bando companheiro: chega por trás, voa junto um pouco e vai embora subindo
      if (comp.t < 0) {
        if (voando) comp.espera -= dt;
        if (comp.espera <= 0 && voando && plan.v > 6) { comp.t = 0; comp.lado = rnd() < 0.5 ? -1 : 1; comp.g.visible = true; }
      }
      if (comp.t >= 0) {
        comp.t += dt; const T = comp.t;
        fr.set(plan.vel.x, 0, plan.vel.z); if (fr.lengthSq() < 0.01) fr.set(0, 0, 1); fr.normalize();
        di.set(fr.z, 0, -fr.x).multiplyScalar(comp.lado);
        const chega = suave(0, 5, T), sai = suave(13, 20, T);
        const tras = mix(-45, 2, chega) + sai * 25, lado = mix(30, 16, chega) + sai * 50, cima = mix(10, 3, chega) + sai * 30;
        comp.g.position.copy(plan.pos).addScaledVector(fr, tras).addScaledVector(di, lado); comp.g.position.y += cima;
        comp.g.rotation.y = Math.atan2(fr.x, fr.z) + comp.lado * -sai * 0.6;
        for (const a of comp.aves) { const u = a.userData; a.position.set(u.o.x, u.o.y + Math.sin(t * 0.8 + u.fase) * 0.8, u.o.z); bater(a, t); }
        if (T > 21) { comp.t = -1; comp.g.visible = false; comp.espera = entre(70, 120); }
      }
    },
  };
}

// libera memória de tudo que estava num voo
function descartar(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map && m.map !== _texBrilho) m.map.dispose(); m.dispose(); });
  });
}

// textura redonda e macia para partículas
let _texBrilho = null;
function texturaBrilho() {
  if (_texBrilho) return _texBrilho;
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d');
  const gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);
  return (_texBrilho = new THREE.CanvasTexture(cv));
}
