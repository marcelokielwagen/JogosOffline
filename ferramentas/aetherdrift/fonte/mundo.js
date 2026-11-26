/* =====================================================================
   MUNDO — ferramentas que toda fase usa:
   ruído, terreno de faces chapadas, céu em degradê, água, vegetação,
   nuvens, montanhas distantes e a "física de superfícies" (chão,
   plataformas, rampas e colisão lateral simples).
   ===================================================================== */
const TAU = Math.PI * 2;
const lim = (v, a, b) => v < a ? a : v > b ? b : v;
const suave = (a, b, x) => { const t = lim((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const angLerp = (a, b, t) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; };

// ---------- números "aleatórios" repetíveis (cada fase sempre igual) ----------
let semente = 1;
const semear = s => { semente = s % 2147483646 || 1; };
const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };
const entre = (a, b) => a + rnd() * (b - a);

// ---------- ruído de valor 2D e fbm ----------
function hash2(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function ruido(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, oit = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oit; i++) { s += a * ruido(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }

const MAT = (cor, extra) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true, ...extra });

// =====================================================================
// TERRENO: grade de alturas + malha de faces chapadas com cor por face
// =====================================================================
const NIVEL_AGUA = 0;
const TERRENO = { tam: 440, seg: 220, cel: 2, n: 221, h: null };

function gerarTerreno(altura, corDe) {
  const { tam, seg, cel } = TERRENO, n = seg + 1, h = new Float32Array(n * n), ini = -tam / 2;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = altura(ini + i * cel, ini + j * cel);
  TERRENO.h = h; TERRENO.n = n;

  // cada célula vira dois triângulos com a mesma diagonal usada em alturaTerreno()
  const pos = new Float32Array(seg * seg * 18), cor = new Float32Array(seg * seg * 18), c = new THREE.Color();
  let k = 0;
  const tri = (ax, ay, az, bx, by, bz, cx, cy, cz) => {
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1;
    corDe(c, (ay + by + cy) / 3, 1 - ny / nl, (ax + bx + cx) / 3, (az + bz + cz) / 3);
    for (const [x, y, z] of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) { pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; cor[k] = c.r; cor[k + 1] = c.g; cor[k + 2] = c.b; k += 3; }
  };
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const x0 = ini + i * cel, x1 = x0 + cel, z0 = ini + j * cel, z1 = z0 + cel;
    const h00 = h[j * n + i], h10 = h[j * n + i + 1], h01 = h[(j + 1) * n + i], h11 = h[(j + 1) * n + i + 1];
    tri(x0, h00, z0, x0, h01, z1, x1, h10, z0);
    tri(x1, h10, z0, x0, h01, z1, x1, h11, z1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  m.receiveShadow = true;
  return m;
}

// altura exata do chão desenhado (interpola no mesmo triângulo da malha)
function alturaTerreno(x, z) {
  const { tam, cel, n, h } = TERRENO; if (!h) return 0;
  let gx = (x + tam / 2) / cel, gz = (z + tam / 2) / cel;
  gx = lim(gx, 0, n - 1.001); gz = lim(gz, 0, n - 1.001);
  const i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
  const h00 = h[j * n + i], h10 = h[j * n + i + 1], h01 = h[(j + 1) * n + i], h11 = h[(j + 1) * n + i + 1];
  return fx + fz <= 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
}

// =====================================================================
// CÉU: esfera com degradê (topo azul-sereno → horizonte pêssego) e brilho do sol
// =====================================================================
function criarCeu() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { topo: { value: new THREE.Color() }, horiz: { value: new THREE.Color() }, baixo: { value: new THREE.Color() }, solDir: { value: new THREE.Vector3(0, 1, 0) }, solCor: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 topo, horiz, baixo, solDir, solCor; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = d.y;
        vec3 c = h > 0.0 ? mix(horiz, topo, pow(h, 0.55)) : mix(horiz, baixo, pow(min(-h * 3.0, 1.0), 0.6));
        float s = max(dot(d, solDir), 0.0);
        c += solCor * (pow(s, 900.0) * 1.4 + pow(s, 40.0) * 0.18 + pow(s, 5.0) * 0.07);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
  ceu.renderOrder = -10; ceu.frustumCulled = false;
  return ceu;
}

// =====================================================================
// SUPERFÍCIES: tudo em que se pode pisar além do terreno
//   tipo 'caixa' (retângulo girado), 'cil' (disco), 'rampa' (retângulo inclinado)
// =====================================================================
const SUP = [];
class Superficie {
  constructor(o) {
    Object.assign(this, { tipo: 'caixa', x: 0, z: 0, yaw: 0, hx: 1, hz: 1, r: 1, topo: 0, h0: 0, h1: 0, solido: false, baixo: -Infinity, dy: 0, ativa: true }, o);
    SUP.push(this);
  }
  local(x, z) { const dx = x - this.x, dz = z - this.z, c = Math.cos(this.yaw), s = Math.sin(this.yaw); return [dx * c - dz * s, dx * s + dz * c]; }
  topoEm(x, z) {
    if (!this.ativa) return null;
    if (this.tipo === 'cil') { const dx = x - this.x, dz = z - this.z; return dx * dx + dz * dz <= this.r * this.r ? this.topo : null; }
    const [lx, lz] = this.local(x, z);
    if (Math.abs(lx) > this.hx || Math.abs(lz) > this.hz) return null;
    return this.tipo === 'rampa' ? mix(this.h0, this.h1, (lz + this.hz) / (2 * this.hz)) : this.topo;
  }
  // empurra para fora quem bate de lado num bloco sólido (torres, pilares)
  empurrar(p, raio) {
    if (!this.solido || !this.ativa || p.y >= this.topo - 0.7 || p.y < this.baixo - 1.8) return;
    if (this.tipo === 'cil') {
      const dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz), R = this.r + raio;
      if (d < R && d > 1e-4) { p.x = this.x + dx / d * R; p.z = this.z + dz / d * R; }
      return;
    }
    const [lx, lz] = this.local(p.x, p.z), ex = this.hx + raio - Math.abs(lx), ez = this.hz + raio - Math.abs(lz);
    if (ex <= 0 || ez <= 0) return;
    let nx = lx, nz = lz;
    if (ex < ez) nx = Math.sign(lx || 1) * (this.hx + raio); else nz = Math.sign(lz || 1) * (this.hz + raio);
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    p.x = this.x + nx * c + nz * s; p.z = this.z - nx * s + nz * c;
  }
}

// chão sob (x,z) para quem está na altura y e consegue subir "passo" metros
function chao(x, z, y, passo) {
  let g = alturaTerreno(x, z), sup = null;
  for (const s of SUP) { const t = s.topoEm(x, z); if (t !== null && t <= y + passo && t > g) { g = t; sup = s; } }
  const agua = !sup && g < NIVEL_AGUA - 0.2;
  return { y: agua ? NIVEL_AGUA - 0.55 : g, sup, agua };
}

// =====================================================================
// DECORAÇÃO
// =====================================================================
// Árvores redondas e pinheiros (instanciados: centenas custam quase nada)
function plantarArvores(raiz, quantas, livre, paleta) {
  const pts = [];
  for (let t = 0; t < quantas * 6 && pts.length < quantas; t++) {
    const x = entre(-205, 205), z = entre(-205, 205);
    if (!livre(x, z)) continue;
    const h = alturaTerreno(x, z); if (h < 1.4 || h > 34) continue;
    // declive: árvores não nascem em barrancos
    if (Math.abs(alturaTerreno(x + 2, z) - h) + Math.abs(alturaTerreno(x, z + 2) - h) > 2.6) continue;
    // aglomerados: o ruído decide onde há bosque
    if (fbm(x * 0.03 + 11, z * 0.03 - 4, 2) < 0.42 && rnd() < 0.8) continue;
    pts.push([x, h, z]);
  }
  const redondas = pts.filter(() => rnd() < 0.62);
  const pinheiros = pts.filter(p => !redondas.includes(p));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), cima = new THREE.Vector3(0, 1, 0);
  const copa1 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), MAT('#ffffff'), redondas.length);
  const copa2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), MAT('#ffffff'), pinheiros.length);
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1, 5), MAT('#c89a78'), pts.length);
  let it = 0;
  redondas.forEach(([x, h, z], i) => {
    const r = entre(1.4, 2.6), th = entre(1.2, 2);
    q.setFromAxisAngle(cima, rnd() * TAU);
    copa1.setMatrixAt(i, m4.compose(p.set(x, h + th + r * 0.7, z), q, s.set(r, r * entre(1, 1.3), r)));
    copa1.setColorAt(i, c.set(paleta[Math.floor(rnd() * paleta.length)]).offsetHSL(0, 0, entre(-0.03, 0.03)));
    tronco.setMatrixAt(it++, m4.compose(p.set(x, h + th / 2, z), q, s.set(1, th, 1)));
  });
  pinheiros.forEach(([x, h, z], i) => {
    const r = entre(1.1, 1.8), alt = entre(3.6, 6.5), th = entre(0.6, 1.1);
    q.setFromAxisAngle(cima, rnd() * TAU);
    copa2.setMatrixAt(i, m4.compose(p.set(x, h + th + alt / 2, z), q, s.set(r, alt, r)));
    copa2.setColorAt(i, c.set(rnd() < 0.5 ? '#9fbf98' : '#b3cfa2').offsetHSL(0, 0, entre(-0.03, 0.03)));
    tronco.setMatrixAt(it++, m4.compose(p.set(x, h + th / 2, z), q, s.set(0.9, th, 0.9)));
  });
  tronco.count = it;
  for (const m of [copa1, copa2, tronco]) { m.castShadow = true; m.receiveShadow = true; raiz.add(m); }
  return pts;
}

// Pedras e florzinhas espalhadas
function espalharPedras(raiz, quantas, livre) {
  const geo = new THREE.DodecahedronGeometry(1, 0), m = new THREE.InstancedMesh(geo, MAT('#ffffff'), quantas);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), e = new THREE.Euler();
  let k = 0;
  for (let t = 0; t < quantas * 5 && k < quantas; t++) {
    const x = entre(-200, 200), z = entre(-200, 200); if (!livre(x, z)) continue;
    const h = alturaTerreno(x, z); if (h < 0.4) continue;
    const r = entre(0.5, 2.2);
    q.setFromEuler(e.set(rnd() * 3, rnd() * 3, rnd() * 3));
    m.setMatrixAt(k, m4.compose(p.set(x, h + r * 0.25, z), q, s.set(r * entre(0.8, 1.4), r * entre(0.5, 0.9), r)));
    m.setColorAt(k++, c.set(rnd() < 0.55 ? '#efdcc0' : '#e3b597').offsetHSL(0, 0, entre(-0.03, 0.04)));
  }
  m.count = k; m.castShadow = true; m.receiveShadow = true; raiz.add(m);
}
function espalharFlores(raiz, quantas, livre) {
  const m = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.12 }), quantas);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), c = new THREE.Color();
  const cores = ['#fffdf6', '#ffe9a8', '#ffc9b0', '#f7d6e8', '#ffffff'];
  let k = 0;
  for (let t = 0; t < quantas * 4 && k < quantas; t++) {
    const x = entre(-190, 190), z = entre(-190, 190); if (!livre(x, z)) continue;
    const h = alturaTerreno(x, z); if (h < 1.5 || h > 20) continue;
    if (fbm(x * 0.05 - 3, z * 0.05 + 8, 2) < 0.5) continue;   // canteiros, não poeira
    m.setMatrixAt(k, m4.compose(p.set(x, h + 0.22, z), q, s));
    m.setColorAt(k++, c.set(cores[Math.floor(rnd() * cores.length)]));
  }
  m.count = k; raiz.add(m);
}

// Nuvens fofas de faces chapadas, que derivam devagar
function criarNuvens(raiz, quantas) {
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#fff3e6', emissiveIntensity: 0.45, flatShading: true });
  const geo = new THREE.IcosahedronGeometry(1, 1), lista = [];
  for (let i = 0; i < quantas; i++) {
    const g = new THREE.Group(), n = 4 + Math.floor(rnd() * 4), larg = entre(10, 22);
    for (let k = 0; k < n; k++) {
      const b = new THREE.Mesh(geo, mat), r = entre(4, 8.5) * (1 - Math.abs(k / (n - 1) - 0.5) * 0.7);
      b.position.set((k / (n - 1) - 0.5) * larg * 2, entre(-1, 2), entre(-4, 4)); b.scale.set(r * 1.2, r * 0.8, r);
      g.add(b);
    }
    const a = rnd() * TAU, d = entre(60, 380);
    g.position.set(Math.cos(a) * d, entre(85, 140), Math.sin(a) * d); g.rotation.y = rnd() * TAU;
    g.userData.v = entre(0.6, 1.6); raiz.add(g); lista.push(g);
  }
  return lista;
}

// Cordilheira distante, azulada/rosada pela névoa
function criarMontanhasDistantes(raiz, cores) {
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * TAU + entre(-0.06, 0.06), d = entre(430, 560), h = entre(60, 150), r = entre(70, 130);
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5 + Math.floor(rnd() * 3), 1), MAT(cores[i % cores.length]));
    m.position.set(Math.cos(a) * d, h / 2 - 8, Math.sin(a) * d); m.rotation.y = rnd() * TAU;
    raiz.add(m);
  }
}

// Ilha flutuante: grama em cima, terra e pedra terracota afinando para baixo
function criarIlha(raiz, { x, y, z, r, arvore = true, flores = true, cor = '#bcd8a0' }) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const grama = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, 0.7, 10), MAT(cor)); grama.position.y = -0.35;
  const terra = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.82, 1.6, 10), MAT('#e9c39e')); terra.position.y = -1.5;
  const pedra = new THREE.Mesh(new THREE.ConeGeometry(r * 0.82, r * 1.5, 10), MAT('#dca386')); pedra.rotation.x = Math.PI; pedra.position.y = -2.3 - r * 0.75;
  for (const m of [grama, terra, pedra]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  if (arvore) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.8, 5), MAT('#c89a78')); t.position.set(r * 0.45, 0.9, -r * 0.3);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), MAT('#a9cf9a')); c.position.set(r * 0.45, 2.8, -r * 0.3);
    t.castShadow = c.castShadow = true; g.add(t, c);
  }
  if (flores) for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), MAT(['#fffdf6', '#ffe6a0', '#ffc8b0'][i % 3])); const a = rnd() * TAU, d = rnd() * r * 0.8;
    f.position.set(Math.cos(a) * d, 0.18, Math.sin(a) * d); g.add(f);
  }
  raiz.add(g);
  const sup = new Superficie({ tipo: 'cil', x, z, r, topo: y, solido: true, baixo: y - 3 });
  return { g, sup };
}

// Pólen e luz flutuando em volta da câmera
function criarPolen(cena) {
  const N = 520, pos = new Float32Array(N * 3), vel = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = entre(-40, 40); pos[i * 3 + 1] = entre(-12, 22); pos[i * 3 + 2] = entre(-40, 40); vel[i] = entre(0.2, 0.7); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d');
  const gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,248,225,.7)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({ size: 0.32, map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, color: '#fff6dc', opacity: 0.85 });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; cena.add(pts);
  const centro = new THREE.Vector3();
  return {
    pts,
    atualizar(dt, t, cam) {
      centro.copy(cam.position);
      for (let i = 0; i < N; i++) {
        let x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        x += Math.sin(t * 0.3 + i) * 0.25 * dt + 0.35 * dt; y += Math.sin(t * 0.5 + i * 1.7) * 0.2 * dt + vel[i] * 0.15 * dt; z += Math.cos(t * 0.27 + i * 0.5) * 0.25 * dt;
        // mantém as partículas numa caixa em volta da câmera
        if (x - centro.x > 40) x -= 80; if (x - centro.x < -40) x += 80;
        if (z - centro.z > 40) z -= 80; if (z - centro.z < -40) z += 80;
        if (y - centro.y > 22) y -= 34; if (y - centro.y < -12) y += 34;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// libera memória de tudo que estava numa fase
function descartar(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

// textura redonda e macia para partículas (sem ela, os pontos viram quadrados)
let _texBrilho = null;
function texturaBrilho() {
  if (_texBrilho) return _texBrilho;
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d');
  const gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);
  return (_texBrilho = new THREE.CanvasTexture(cv));
}
