'use strict';
// Peças: joias, especiais (foguete, dinamite, bola arco-íris) e obstáculos (gelo, caixa, cofre, corrente).
const COR_HEX = [0xff2a4f, 0x2d7bff, 0x18cc66, 0xffc21a, 0xa94dff, 0xff6fb8];
const COR_NOME = ['rubis', 'safiras', 'esmeraldas', 'topázios', 'ametistas', 'corais'];

function retRedondo(w, h, r, s = new THREE.Shape()) {
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function estrelaShape(n, ro, ri) { const s = new THREE.Shape(); for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, r = i % 2 ? ri : ro; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; }
function coracaoShape() {
  const s = new THREE.Shape(); s.moveTo(0, -.36);
  s.bezierCurveTo(.1, -.25, .44, -.05, .41, .15); s.bezierCurveTo(.38, .37, .12, .41, 0, .21);
  s.bezierCurveTo(-.12, .41, -.38, .37, -.41, .15); s.bezierCurveTo(-.44, -.05, -.1, -.25, 0, -.36); return s;
}
const extrudar = (shape, prof, bev, seg = 2) => { const g = new THREE.ExtrudeGeometry(shape, { depth: prof, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: seg, curveSegments: 12 }); g.center(); return g; };

const GEO = {};
GEO.gema = [
  (() => { const V = THREE.Vector2; const g = new THREE.LatheGeometry([new V(0, -.34), new V(.37, .02), new V(.39, .08), new V(.27, .2), new V(0, .2)], 8); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 8); return g; })(),
  (() => { const g = new THREE.OctahedronGeometry(.42); g.scale(.78, 1.08, .62); return g; })(),
  (() => { const g = new THREE.CylinderGeometry(.27, .4, .26, 4); g.rotateY(Math.PI / 4); g.rotateX(Math.PI / 2); return g; })(),
  extrudar(estrelaShape(5, .45, .21), .12, .07),
  (() => { const g = new THREE.IcosahedronGeometry(.39, 0); g.scale(1, 1, .8); return g; })(),
  extrudar(coracaoShape(), .13, .08),
];
const MAT = {};
MAT.gema = COR_HEX.map((h, i) => i === 3
  ? new THREE.MeshStandardMaterial({ color: 0xffcc22, metalness: .65, roughness: .22, flatShading: true, envMapIntensity: 1.6, emissive: 0xc07800, emissiveIntensity: .45 })
  : new THREE.MeshPhysicalMaterial({ color: h, roughness: .1, metalness: .15, clearcoat: 1, clearcoatRoughness: .04, flatShading: true, envMapIntensity: 1.7, emissive: h, emissiveIntensity: .16 }));
MAT.ouro = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 1, roughness: .22, envMapIntensity: 1.5, emissive: 0x7a4a00, emissiveIntensity: .35 });
MAT.ouroEsc = new THREE.MeshStandardMaterial({ color: 0xd8941a, metalness: 1, roughness: .32 });
MAT.branco = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .25, clearcoat: 1 });
MAT.vermelho = new THREE.MeshPhysicalMaterial({ color: 0xff2440, roughness: .2, clearcoat: 1, emissive: 0x500010, emissiveIntensity: .5 });
MAT.escuro = new THREE.MeshStandardMaterial({ color: 0x2a2030, roughness: .6 });
MAT.faisca = new THREE.MeshBasicMaterial({ color: 0xfff1a0, toneMapped: false });
MAT.ferro = new THREE.MeshStandardMaterial({ color: 0x737b8a, metalness: 1, roughness: .32, envMapIntensity: 1.2 });

// ---------- especiais ----------
GEO.fogCorpo = new THREE.CylinderGeometry(.12, .12, .44, 16).rotateZ(Math.PI / 2);
GEO.fogListra = new THREE.CylinderGeometry(.127, .127, .06, 16).rotateZ(Math.PI / 2);
GEO.fogNariz = new THREE.ConeGeometry(.12, .2, 16);
GEO.fogAleta = new THREE.BoxGeometry(.14, .09, .03);
function meshFoguete() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(GEO.fogCorpo, MAT.branco));
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(GEO.fogListra, MAT.vermelho); l.position.x = s * .11; g.add(l);
    const n = new THREE.Mesh(GEO.fogNariz, MAT.vermelho); n.position.x = s * .32; n.rotation.z = -s * Math.PI / 2; g.add(n);
    const a = new THREE.Mesh(GEO.fogAleta, MAT.ouro); a.position.y = s * .14; g.add(a);
  }
  const z = new THREE.Mesh(GEO.fogAleta, MAT.ouro); z.rotation.x = Math.PI / 2; z.position.z = .14; g.add(z);
  return g;
}
function meshPontaFoguete() { // metade que sai voando
  const g = new THREE.Group();
  const c = new THREE.Mesh(GEO.fogCorpo, MAT.branco); c.scale.x = .55; c.position.x = -.06; g.add(c);
  const n = new THREE.Mesh(GEO.fogNariz, MAT.vermelho); n.position.x = .2; n.rotation.z = -Math.PI / 2; g.add(n);
  const a = new THREE.Mesh(GEO.fogAleta, MAT.ouro); a.position.set(-.12, .12, 0); g.add(a); const b = a.clone(); b.position.y = -.12; g.add(b);
  return g;
}
GEO.dinBastao = new THREE.CylinderGeometry(.1, .1, .52, 16);
GEO.dinTampa = new THREE.CylinderGeometry(.085, .085, .02, 16);
GEO.dinFita = new THREE.BoxGeometry(.5, .07, .27);
GEO.dinPavio = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, .25, .05), new THREE.Vector3(.04, .33, .07), new THREE.Vector3(.12, .37, .07), new THREE.Vector3(.17, .43, .06)]), 10, .018, 6);
GEO.faisca = new THREE.SphereGeometry(.045, 10, 8);
function meshDinamite() {
  const g = new THREE.Group();
  for (const [x, z] of [[-.13, -.03], [.13, -.03], [0, .07]]) {
    const b = new THREE.Mesh(GEO.dinBastao, MAT.vermelho); b.position.set(x, 0, z); g.add(b);
    const t = new THREE.Mesh(GEO.dinTampa, MAT.branco); t.position.set(x, .265, z); g.add(t);
  }
  for (const y of [.13, -.13]) { const f = new THREE.Mesh(GEO.dinFita, MAT.ouroEsc); f.position.set(0, y, .01); g.add(f); }
  g.add(new THREE.Mesh(GEO.dinPavio, MAT.escuro));
  const fa = new THREE.Mesh(GEO.faisca, MAT.faisca); fa.position.set(.17, .43, .06); g.add(fa); g.userData.faisca = fa;
  g.rotation.z = .18; return g;
}
GEO.disco = (() => {
  const g = new THREE.IcosahedronGeometry(.37, 2), p = g.attributes.position, n = p.count, cores = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const h = (Math.atan2(y, x) / (Math.PI * 2) + .5 + z * .3) % 1; c.setHSL(h, .9, .62 + (Math.random() * .15));
    for (let k = 0; k < 3; k++) cores.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cores, 3)); return g;
})();
MAT.disco = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .55, roughness: .12, flatShading: true, envMapIntensity: 2, emissive: 0xffffff, emissiveIntensity: .12 });
GEO.discoAro = new THREE.TorusGeometry(.43, .025, 8, 48);
function meshDisco() {
  const g = new THREE.Group(); g.add(new THREE.Mesh(GEO.disco, MAT.disco));
  const a = new THREE.Mesh(GEO.discoAro, MAT.ouro); a.rotation.x = 1.2; g.add(a); g.userData.aro = a; return g;
}

// envelope: externo (posição/escala) > interno (giro de enfeite)
function meshGema(cor, tipo) {
  const ext = new THREE.Group(); let int;
  if (tipo === 'n') int = new THREE.Mesh(GEO.gema[cor], MAT.gema[cor]);
  else if (tipo === 'fh' || tipo === 'fv') { int = new THREE.Group(); const f = meshFoguete(); if (tipo === 'fv') f.rotation.z = Math.PI / 2; int.add(f); }
  else if (tipo === 'din') int = meshDinamite();
  else int = meshDisco();
  ext.add(int); ext.userData.int = int; return ext;
}

// ---------- obstáculos ----------
const TEX_CAIXA = [1, 2].map(nv => texCanvas(128, 128, (g, w, h) => {
  for (let i = 0; i < 4; i++) { g.fillStyle = ['#c98a4b', '#d6995a', '#c4833f', '#d1924f'][i]; g.fillRect(i * 32, 0, 32, h); }
  g.strokeStyle = 'rgba(110,60,20,.35)'; g.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { const x = Math.random() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 40, x - 6, 80, x + 3, h); g.stroke(); }
  g.strokeStyle = '#8a5526'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); }
  g.strokeStyle = '#7a461c'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
  g.lineWidth = 13; g.beginPath(); g.moveTo(16, h - 16); g.lineTo(w - 16, 16); g.stroke();
  if (nv === 2) {
    for (const y of [26, 90]) { g.fillStyle = '#7d8796'; g.fillRect(0, y, w, 14); g.fillStyle = '#aeb8c6'; g.fillRect(0, y, w, 4); g.fillStyle = '#d9e0ea'; for (let x = 10; x < w; x += 27) { g.beginPath(); g.arc(x, y + 8, 3.2, 0, 7); g.fill(); } }
  }
  g.fillStyle = '#4e2f14'; for (const [x, y] of [[16, 16], [112, 16], [16, 112], [112, 112]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
}));
const TEX_COFRE = texCanvas(128, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#c4ccd8'); gr.addColorStop(.5, '#8d97a8'); gr.addColorStop(1, '#5e6878'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#4b5463'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.strokeRect(15, 15, w - 30, h - 30);
  g.fillStyle = '#e8edf4'; for (let i = 0; i < 4; i++) for (const [x, y] of [[6 + i * 38.6, 6], [6 + i * 38.6, 122], [6, 6 + i * 38.6], [122, 6 + i * 38.6]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
});
const TEX_GELO = texCanvas(128, 128, (g, w, h) => {
  g.fillStyle = '#cfe9fb'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) { let x = 64, y = 64; g.beginPath(); g.moveTo(x, y); const a = i / 7 * Math.PI * 2 + Math.random() * .4; for (let k = 0; k < 4; k++) { x += Math.cos(a + rnd(-.5, .5)) * 18; y += Math.sin(a + rnd(-.5, .5)) * 18; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${rnd(.2, .6)})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rnd(2, 7), 0, 7); g.fill(); }
});
GEO.caixa = new THREE.BoxGeometry(.9, .9, .52);
MAT.caixa = TEX_CAIXA.map(t => new THREE.MeshStandardMaterial({ map: t, roughness: .75 }));
function meshCaixa(hp) { const m = new THREE.Mesh(GEO.caixa, MAT.caixa[hp - 1]); const g = new THREE.Group(); g.add(m); g.userData.m = m; return g; }
function atualizarCaixa(o, hp) { o.userData.m.material = MAT.caixa[Math.max(0, hp - 1)]; }

GEO.cofre = new THREE.BoxGeometry(.9, .9, .56);
MAT.cofre = new THREE.MeshStandardMaterial({ map: TEX_COFRE, metalness: .75, roughness: .32, envMapIntensity: 1.3 });
GEO.disco3 = new THREE.CylinderGeometry(.19, .19, .07, 32).rotateX(Math.PI / 2);
GEO.raio3 = new THREE.BoxGeometry(.04, .3, .04);
GEO.luz = new THREE.SphereGeometry(.055, 12, 10);
MAT.luzOn = new THREE.MeshStandardMaterial({ color: 0x33ff77, emissive: 0x22ff66, emissiveIntensity: 1.4 });
MAT.luzOff = new THREE.MeshStandardMaterial({ color: 0x3a0d14, roughness: .4 });
function meshCofre(hp) {
  const g = new THREE.Group(); g.add(new THREE.Mesh(GEO.cofre, MAT.cofre));
  const d = new THREE.Group(); d.position.z = .3; g.add(d);
  d.add(new THREE.Mesh(GEO.disco3, MAT.ouro));
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(GEO.raio3, MAT.ouroEsc); r.rotation.z = i * Math.PI / 3; r.position.z = .05; d.add(r); }
  const luzes = []; for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(GEO.luz, i < hp ? MAT.luzOn : MAT.luzOff); l.position.set(-.24 + i * .24, .33, .29); g.add(l); luzes.push(l); }
  g.userData.dial = d; g.userData.luzes = luzes; return g;
}
function atualizarCofre(o, hp) { o.userData.luzes.forEach((l, i) => l.material = i < hp ? MAT.luzOn : MAT.luzOff); }

GEO.gelo = extrudar(retRedondo(.9, .9, .14), .08, .04);
MAT.gelo = [
  new THREE.MeshPhysicalMaterial({ color: 0xaee4ff, map: TEX_GELO, transparent: true, opacity: .72, roughness: .08, clearcoat: 1, emissive: 0x4aa0d8, emissiveIntensity: .55, depthWrite: false }),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: TEX_GELO, transparent: true, opacity: .95, roughness: .2, clearcoat: 1, emissive: 0x8cc8f0, emissiveIntensity: .7, depthWrite: false }),
];
function meshGelo(n) { const m = new THREE.Mesh(GEO.gelo, MAT.gelo[n - 1]); m.renderOrder = 2; return m; }

GEO.elo = new THREE.TorusGeometry(.075, .024, 8, 18); GEO.elo.scale(1.45, 1, 1);
function meshCorrente() {
  const g = new THREE.Group();
  for (const d of [1, -1]) for (let i = -3; i <= 3; i++) {
    const e = new THREE.Mesh(GEO.elo, MAT.ferro), t = i * .13;
    e.position.set(t * .7071, t * .7071 * d, .3 + (i % 2 ? .01 : 0)); e.rotation.z = d * Math.PI / 4; if (i % 2) e.rotation.x = Math.PI / 2;
    g.add(e);
  }
  const cad = new THREE.Mesh(new THREE.BoxGeometry(.16, .14, .07), MAT.ouro); cad.position.z = .35; g.add(cad);
  return g;
}

// cadeado do resgate: bloco de veludo com cadeado de ouro (1 ou 2 batidas)
GEO.cadCorpo = extrudar(retRedondo(.34, .27, .06), .1, .025);
GEO.cadAlca = new THREE.TorusGeometry(.12, .036, 10, 24, Math.PI);
GEO.cadFuro = new THREE.CylinderGeometry(.03, .03, .06, 10).rotateX(Math.PI / 2);
GEO.cadFuro2 = new THREE.BoxGeometry(.025, .06, .06);
MAT.prata = new THREE.MeshStandardMaterial({ color: 0xdfe6ef, metalness: 1, roughness: .2, envMapIntensity: 1.5, emissive: 0x303844, emissiveIntensity: .4 });
function meshCadeadoSo(mat = MAT.ouro) {
  const g = new THREE.Group(), c = new THREE.Mesh(GEO.cadCorpo, mat); g.add(c);
  const a = new THREE.Mesh(GEO.cadAlca, MAT.prata); a.position.y = .13; g.add(a);
  for (const geo of [GEO.cadFuro, GEO.cadFuro2]) { const f = new THREE.Mesh(geo, MAT.escuro); f.position.set(0, geo === GEO.cadFuro ? .02 : -.03, .07); g.add(f); }
  return g;
}
GEO.cadBloco = extrudar(retRedondo(.88, .88, .16), .42, .05);
MAT.cadBloco = [new THREE.MeshPhysicalMaterial({ color: 0xd8173c, roughness: .5, sheen: 1, sheenColor: new THREE.Color(0xff6a8a), emissive: 0x400010, emissiveIntensity: .4 }),
  new THREE.MeshPhysicalMaterial({ color: 0x7a0c28, roughness: .4, sheen: 1, sheenColor: new THREE.Color(0xff3a6a), emissive: 0x200008 })];
function meshCadeado(hp) {
  const g = new THREE.Group(), b = new THREE.Mesh(GEO.cadBloco, MAT.cadBloco[hp - 1]); g.add(b);
  const c = meshCadeadoSo(); c.scale.setScalar(1.45); c.position.set(0, -.05, .3); g.add(c);
  const tachas = []; if (hp > 1) for (const [x, y] of [[-.33, -.33], [.33, -.33], [-.33, .33], [.33, .33]]) { const t = new THREE.Mesh(GEO.luz, MAT.ouro); t.position.set(x, y, .25); g.add(t); tachas.push(t); }
  g.userData.b = b; g.userData.c = c; g.userData.tachas = tachas; return g;
}
function atualizarCadeado(o, hp) { o.userData.b.material = MAT.cadBloco[hp - 1]; o.userData.tachas.forEach(t => t.visible = hp > 1); }

// ícones (SVG) dos objetivos no painel
function svgMeta(m) {
  const S = (c) => `<svg viewBox="0 0 40 40">${c}</svg>`;
  if (m.t === 'cor') {
    const c = '#' + COR_HEX[m.cor].toString(16).padStart(6, '0'), brilho = '<ellipse cx="15" cy="13" rx="5" ry="3" fill="#fff" opacity=".75"/>';
    const forma = [
      `<polygon points="20,36 4,17 10,8 30,8 36,17" fill="${c}" stroke="#7a0016" stroke-width="2"/><polygon points="10,8 30,8 26,17 14,17" fill="#fff" opacity=".35"/>`,
      `<polygon points="20,3 33,20 20,37 7,20" fill="${c}" stroke="#0a2f8a" stroke-width="2"/><polygon points="20,3 33,20 20,20" fill="#fff" opacity=".3"/>`,
      `<rect x="6" y="6" width="28" height="28" rx="4" fill="${c}" stroke="#05602c" stroke-width="2"/><rect x="12" y="12" width="16" height="16" fill="#fff" opacity=".3"/>`,
      `<polygon points="20,3 24.7,14 37,15 27.5,23 30.5,35 20,28.5 9.5,35 12.5,23 3,15 15.3,14" fill="${c}" stroke="#9a5a00" stroke-width="2"/>`,
      `<polygon points="20,3 35,12 35,28 20,37 5,28 5,12" fill="${c}" stroke="#4a1080" stroke-width="2"/><polygon points="20,3 35,12 20,20 5,12" fill="#fff" opacity=".3"/>`,
      `<path d="M20 35 C14 29 4 23 5 14 C6 7 15 5 20 12 C25 5 34 7 35 14 C36 23 26 29 20 35Z" fill="${c}" stroke="#a0105a" stroke-width="2"/>`,
    ][m.cor];
    return S(forma + brilho);
  }
  if (m.t === 'gelo') return S('<rect x="4" y="4" width="32" height="32" rx="7" fill="#bfe9ff" stroke="#5fb4ea" stroke-width="2.5"/><path d="M20 20l-8-9M20 20l9-6M20 20l2 12M20 20l-10 5" stroke="#fff" stroke-width="2.4" fill="none"/>');
  if (m.t === 'caixa') return S('<rect x="4" y="4" width="32" height="32" rx="3" fill="#d6995a" stroke="#7a461c" stroke-width="3"/><path d="M8 32L32 8" stroke="#7a461c" stroke-width="4"/><path d="M13 4v32M20 4v32M27 4v32" stroke="#8a5526" stroke-width="1.2" opacity=".6"/>');
  if (m.t === 'cofre') return S('<rect x="4" y="4" width="32" height="32" rx="4" fill="#9aa4b4" stroke="#4b5463" stroke-width="3"/><circle cx="20" cy="21" r="8" fill="#ffc83a" stroke="#a46a00" stroke-width="2"/><path d="M20 15v12M14 21h12" stroke="#a46a00" stroke-width="2"/><circle cx="11" cy="9" r="2" fill="#33ff77"/><circle cx="20" cy="9" r="2" fill="#33ff77"/><circle cx="29" cy="9" r="2" fill="#33ff77"/>');
  if (m.t === 'tinta') return S('<path d="M20 4c3 6 12 9 12 18a12 12 0 0 1-24 0c0-9 9-12 12-18z" fill="#e04cd8" stroke="#7a1a80" stroke-width="2"/><circle cx="8" cy="34" r="3" fill="#2f7bff"/><circle cx="33" cy="33" r="2.5" fill="#1fcf6c"/><ellipse cx="15" cy="20" rx="3" ry="5" fill="#fff" opacity=".5"/>');
  if (m.t === 'lata') return S('<rect x="10" y="5" width="20" height="30" rx="4" fill="#e8203c" stroke="#7a0016" stroke-width="2"/><rect x="10" y="15" width="20" height="9" fill="#ffd34d"/><ellipse cx="20" cy="6" rx="10" ry="3" fill="#dfe6ef" stroke="#7a8696" stroke-width="1.5"/><rect x="13" y="9" width="3" height="22" fill="#fff" opacity=".35"/>');
  if (m.t === 'cristal') return S('<polygon points="20,2 32,17 20,38 8,17" fill="#b06bff" stroke="#5a1a9a" stroke-width="2"/><polygon points="20,2 32,17 20,20" fill="#fff" opacity=".35"/><polygon points="8,17 20,20 20,38" fill="#000" opacity=".15"/>');
  if (m.t === 'entulho') return S('<g stroke="#4a3424" stroke-width="1.5"><polygon points="4,34 9,24 17,26 15,35" fill="#9a7a5a"/><polygon points="14,35 17,22 27,20 30,33" fill="#b08d68"/><polygon points="28,34 30,24 37,26 36,35" fill="#7d6450"/><polygon points="10,24 14,13 23,12 25,21 17,23" fill="#c49a70"/><polygon points="22,13 26,5 33,9 31,19 25,20" fill="#8a6e55"/></g>');
  if (m.t === 'cadeado') return S('<rect x="3" y="3" width="34" height="34" rx="7" fill="#d8173c" stroke="#7a0c28" stroke-width="2"/><path d="M14 19v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#e8edf4" stroke-width="3.5"/><rect x="10" y="18" width="20" height="15" rx="3" fill="#ffc83a" stroke="#a46a00" stroke-width="2"/><circle cx="20" cy="24" r="2.5" fill="#3a2a10"/><rect x="19" y="25" width="2" height="5" fill="#3a2a10"/>');
  if (m.t === 'corrente') return S('<g fill="none" stroke="#5d6470" stroke-width="4"><rect x="3" y="14" width="14" height="10" rx="5"/><rect x="13" y="14" width="14" height="10" rx="5" stroke="#8a93a3"/><rect x="23" y="14" width="14" height="10" rx="5"/></g>');
  return S('');
}
