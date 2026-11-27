/* Peças: ajudantes de geometria e os objetos que se escondem nos cenários.
   Medidas em metros. Os objetos escondidos usam materiais próprios (para poderem brilhar sozinhos quando achados). */
const P = (() => {
  const V3 = THREE.Vector3, cache = new Map();
  // material compartilhado (móveis) ou novo (novo = true, para objetos escondidos)
  function mat(cor, o = {}, novo = false) {
    const chave = novo ? null : JSON.stringify([cor, o.r, o.m, o.map && o.map.uuid, o.t, o.e, o.lado]);
    if (chave && cache.has(chave)) return cache.get(chave);
    const m = new THREE.MeshStandardMaterial({ color: cor, roughness: o.r ?? .72, metalness: o.m ?? 0, map: o.map || null, side: o.lado || THREE.FrontSide });
    if (o.t != null) { m.transparent = true; m.opacity = o.t; m.depthWrite = o.t > .6; }
    if (o.e) { m.emissive = new THREE.Color(o.e); m.emissiveIntensity = o.ei ?? 1; }
    if (chave) cache.set(chave, m);
    return m;
  }
  const malha = (geo, m) => { const x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x; };
  const caixa = (w, h, d, m) => malha(new THREE.BoxGeometry(w, h, d), m);
  const cil = (rt, rb, h, m, seg = 20, aberto = false) => malha(new THREE.CylinderGeometry(rt, rb, h, seg, 1, aberto), m);
  const esfera = (r, m, ws = 18, hs = 12) => malha(new THREE.SphereGeometry(r, ws, hs), m);
  const torno = (pts, m, seg = 28) => malha(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m);
  const toro = (r, t, m, arco = Math.PI * 2, rs = 10, ts = 32) => malha(new THREE.TorusGeometry(r, t, rs, ts, arco), m);
  const tubo = (pts, raio, m, seg = 40, rs = 6) => malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new V3(...p))), seg, raio, rs, false), m);
  const forma = (desenha, prof, m, bisel = 0) => { const s = new THREE.Shape(); desenha(s); const g = prof ? new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 2, curveSegments: 14 }) : new THREE.ShapeGeometry(s, 14); return malha(g, m); };
  function em(pai, filho, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) { filho.position.set(x, y, z); filho.rotation.set(rx, ry, rz); if (s !== 1) filho.scale.setScalar(s); pai.add(filho); return filho; }
  const grupo = () => new THREE.Group();

  /* ---------- os objetos escondidos (todos novos materiais) ---------- */
  const latao = () => mat('#b8913f', { r: .38, m: .85 }, true);
  const ouro = () => mat('#d8a738', { r: .3, m: .95 }, true);
  const aco = () => mat('#a7adb3', { r: .3, m: .9 }, true);

  function chave() { // deitada; argola, haste e dentes
    const g = grupo(), m = latao();
    em(g, toro(.017, .0045, m), 0, .0045, 0, Math.PI / 2);
    em(g, toro(.009, .003, m), 0, .0045, 0, Math.PI / 2);
    em(g, cil(.0035, .0035, .085, m, 10), .06, .0045, 0, 0, 0, Math.PI / 2);
    em(g, cil(.006, .006, .008, m, 12), .02, .0045, 0, 0, 0, Math.PI / 2);
    em(g, caixa(.008, .006, .02, m), .092, .0045, .01);
    em(g, caixa(.006, .006, .014, m), .08, .0045, .007);
    em(g, caixa(.004, .006, .008, m), .1, .0045, .004);
    return g;
  }
  function relogioBolso() {
    const g = grupo(), m = ouro();
    em(g, cil(.028, .028, .011, m, 32), 0, .0055, 0);
    const vidro = cil(.0245, .0245, .002, mat('#f3ead6', { r: .25, map: Tex.mostrador() }, true), 32);
    vidro.material.map.center.set(.5, .5); em(g, vidro, 0, .0112, 0, 0, Math.PI / 2);
    em(g, cil(.004, .004, .008, m, 10), 0, .0055, -.032, Math.PI / 2);
    em(g, toro(.006, .0015, m), 0, .0055, -.039, 0, Math.PI / 2);
    const elos = [[0, .004, -.045], [.02, .003, -.07], [.05, .002, -.075], [.075, .003, -.06], [.09, .002, -.035]];
    em(g, tubo(elos, .0016, m, 30), 0, 0, 0);
    // ponteiros
    const pt = mat('#1b120c', {}, true);
    em(g, caixa(.0015, .0008, .016, pt), .004, .0125, -.004, 0, .5);
    em(g, caixa(.0012, .0008, .012, pt), -.004, .0125, .003, 0, 2);
    return g;
  }
  function oculos() {
    const g = grupo(), arm = mat('#3b2412', { r: .35 }, true), lente = mat('#cfe2e8', { r: .05, m: .1, t: .28 }, true);
    for (const s of [-1, 1]) {
      em(g, toro(.022, .0026, arm, Math.PI * 2, 8, 30), s * .028, .022, 0);
      em(g, cil(.021, .021, .001, lente, 24), s * .028, .022, 0, Math.PI / 2);
      em(g, caixa(.003, .003, .09, arm), s * .05, .024, -.042, -.12);   // haste
      em(g, caixa(.003, .012, .003, arm), s * .05, .018, -.087);        // ponta dobrada
    }
    em(g, tubo([[-.007, .025, 0], [0, .03, .002], [.007, .025, 0]], .0022, arm, 8), 0, 0, 0);
    return g;
  }
  function pena() { // em pé, ~28 cm
    const g = grupo(), canhao = mat('#efe6d2', { r: .4 }, true);
    const vane = mat('#d9cfbd', { r: .9, lado: THREE.DoubleSide, map: penaTex() }, true);
    em(g, cil(.0014, .0024, .28, canhao, 8), 0, .14, 0);
    const v = forma(s => { s.moveTo(0, .06); s.bezierCurveTo(.03, .12, .034, .22, .006, .3); s.lineTo(0, .3); s.bezierCurveTo(-.016, .22, -.014, .12, 0, .06); }, 0, vane);
    // curva leve da pena
    const pos = v.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), x = pos.getX(i); pos.setZ(i, Math.sin(x * 60) * .004 + (y - .06) * (y - .06) * .25); }
    v.geometry.computeVertexNormals();
    const uv = v.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) * 10 + .5, pos.getY(i) * 3.3);
    em(g, v, 0, 0, 0);
    return g;
  }
  let _penaTex = null;
  function penaTex() {
    if (_penaTex) return _penaTex;
    const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#ece4d2'; x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 256; i += 3) { x.strokeStyle = `rgba(90,70,50,${.15 + Math.random() * .2})`; x.beginPath(); x.moveTo(64, 256 - i); x.lineTo(0, 256 - i - 30); x.moveTo(64, 256 - i); x.lineTo(128, 256 - i - 30); x.stroke(); }
    for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(110,80,50,.25)'; x.fillRect(0, 40 + k * 44, 128, 14); }
    x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 256); x.stroke();
    _penaTex = new THREE.CanvasTexture(c); _penaTex.colorSpace = THREE.SRGBColorSpace; return _penaTex;
  }
  function dado() {
    const g = grupo(), l = .03, m = mat('#efe6d0', { r: .35 }, true), p = mat('#201510', { r: .5 }, true);
    const corpo = malha(new THREE.BoxGeometry(l, l, l, 3, 3, 3), m);
    // cantos arredondados: empurra os vértices para uma esfera achatada
    const pos = corpo.geometry.attributes.position, v = new V3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const n = v.clone().normalize().multiplyScalar(l * .78); v.lerp(n, .22); pos.setXYZ(i, v.x, v.y, v.z); }
    corpo.geometry.computeVertexNormals(); em(g, corpo, 0, l / 2, 0, 0, .4, 0);
    const faces = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, 1], [-1, 1], [1, -1]], 5: [[-1, -1], [1, 1], [-1, 1], [1, -1], [0, 0]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
    const lados = [[1, [0, 1, 0]], [6, [0, -1, 0]], [2, [1, 0, 0]], [5, [-1, 0, 0]], [3, [0, 0, 1]], [4, [0, 0, -1]]];
    const piv = em(g, grupo(), 0, l / 2, 0, 0, .4, 0);
    for (const [n, d] of lados) for (const [a, b] of faces[n]) {
      const q = esfera(.0032, p, 8, 6), o = l / 2 - .0006, s = .0075;
      if (d[1]) q.position.set(a * s, d[1] * o, b * s); else if (d[0]) q.position.set(d[0] * o, a * s, b * s); else q.position.set(a * s, b * s, d[2] * o);
      piv.add(q);
    }
    return g;
  }
  function moeda(cor = 'ouro') {
    const g = grupo(), c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const base = cor === 'ouro' ? ['#f2cf6a', '#a57818'] : cor === 'prata' ? ['#e6e8ea', '#8a9096'] : ['#d8936a', '#7a3e20'];
    const gr = x.createRadialGradient(50, 45, 5, 64, 64, 64); gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = base[1]; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.stroke();
    x.fillStyle = base[1]; x.font = 'bold 54px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(cor === 'ouro' ? '♛' : '1', 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const lado = mat(base[0], { r: .3, m: .9 }, true), face = mat('#ffffff', { r: .3, m: .85, map: t }, true);
    const m = malha(new THREE.CylinderGeometry(.019, .019, .004, 32), [lado, face, face]);
    em(g, m, 0, .002, 0);
    return g;
  }
  function tesoura() {
    const g = grupo(), m = aco(), cabo = mat('#2b2b2e', { r: .4 }, true);
    for (const s of [-1, 1]) {
      const lamina = forma(sh => { sh.moveTo(0, -.004); sh.lineTo(.1, -.0005); sh.lineTo(.1, .002); sh.lineTo(0, .006); }, .002, m);
      em(g, lamina, 0, .002 + (s > 0 ? .002 : 0), 0, -Math.PI / 2, s * .14, 0);
      em(g, toro(.014, .0035, cabo, Math.PI * 2, 8, 22), -.03, .003, s * .02, Math.PI / 2);
    }
    em(g, cil(.003, .003, .008, m, 10), 0, .004, 0);
    return g;
  }
  function peao() { // peão de xadrez branco, ~5 cm
    const m = mat('#ece6da', { r: .4 }, true);
    const g = grupo();
    em(g, torno([[0, 0], [.016, 0], [.016, .004], [.012, .007], [.0085, .012], [.006, .028], [.01, .03], [.006, .033], [.0095, .041], [.009, .047], [.005, .052], [0, .053]], m, 28), 0, 0, 0);
    return g;
  }
  function concha() {
    const g = grupo(), segR = 14, segT = 36, pos = [], uv = [], idx = [];
    for (let i = 0; i <= segR; i++) for (let j = 0; j <= segT; j++) {
      const r = i / segR, t = j / segT * Math.PI, rib = Math.abs(Math.sin(t * 9)) * .004 * r;
      const R = r * .05; pos.push(Math.cos(t) * R, r * (1 - r) * .028 + rib + .002, -Math.sin(t) * R * .95); uv.push(j / segT, r);
    }
    for (let i = 0; i < segR; i++) for (let j = 0; j < segT; j++) { const a = i * (segT + 1) + j, b = a + segT + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#d88a6a'); gr.addColorStop(1, '#f6e2c8'); x.fillStyle = gr; x.fillRect(0, 0, 256, 64);
    for (let k = 0; k < 18; k++) { x.fillStyle = 'rgba(160,70,50,.25)'; x.fillRect(k * 14.2, 0, 4, 64); }
    for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(255,240,220,.25)'; x.fillRect(0, 10 + k * 11, 256, 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    em(g, malha(geo, mat('#ffffff', { r: .5, map: t, lado: THREE.DoubleSide }, true)), 0, 0, .02);
    em(g, caixa(.02, .006, .012, mat('#e9c0a0', { r: .5 }, true)), 0, .003, .024);
    return g;
  }
  function anel() {
    const g = grupo();
    em(g, toro(.011, .0028, ouro(), Math.PI * 2, 10, 32), 0, .011, 0, 0, .3);
    em(g, malha(new THREE.OctahedronGeometry(.0055, 0), mat('#b0182a', { r: .1, m: .2 }, true)), 0, .024, 0, 0, .5);
    em(g, cil(.004, .002, .004, ouro(), 8), 0, .0205, 0);
    return g;
  }
  function borboleta() {
    const g = grupo(), c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#c9752a'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#2a1608'; x.lineWidth = 10; x.strokeRect(0, 0, 256, 256);
    x.lineWidth = 4; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(256, 30 + k * 45); x.stroke(); }
    x.fillStyle = '#2a1608'; x.beginPath(); x.arc(190, 80, 30, 0, 7); x.fill(); x.fillStyle = '#e6c26a'; x.beginPath(); x.arc(190, 80, 16, 0, 7); x.fill(); x.fillStyle = '#2a1608'; x.beginPath(); x.arc(190, 80, 6, 0, 7); x.fill();
    for (let k = 0; k < 10; k++) { x.fillStyle = '#f2e6c8'; x.beginPath(); x.arc(240, 20 + k * 24, 4, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = mat('#ffffff', { r: .8, map: t, lado: THREE.DoubleSide }, true);
    const asa = (sup) => { const msh = forma(s => { if (sup) { s.moveTo(0, 0); s.bezierCurveTo(.02, .03, .05, .045, .055, .02); s.bezierCurveTo(.05, .005, .03, -.004, 0, 0); } else { s.moveTo(0, 0); s.bezierCurveTo(.03, -.004, .045, -.03, .03, -.04); s.bezierCurveTo(.015, -.042, .005, -.02, 0, 0); } }, 0, m); const uv = msh.geometry.attributes.uv, p = msh.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / .056, (p.getY(i) + .042) / .09); return msh; };
    g.userData.asas = [];
    for (const s of [-1, 1]) {
      const piv = em(g, grupo(), 0, .006, 0); piv.scale.x = s;
      em(piv, asa(true), 0, 0, 0, -Math.PI / 2); em(piv, asa(false), 0, 0, 0, -Math.PI / 2);
      piv.rotation.z = s * .5; g.userData.asas.push(piv);
    }
    em(g, cil(.0025, .0018, .036, mat('#2a1608', {}, true), 8), 0, .006, -.004, Math.PI / 2);
    for (const s of [-1, 1]) em(g, cil(.0005, .0005, .02, mat('#2a1608', {}, true), 4), s * .004, .01, -.03, Math.PI / 2 - .4, 0, s * .4);
    return g;
  }
  function ferradura() {
    const g = grupo(), m = mat('#5d4a3e', { r: .65, m: .55 }, true);
    const arco = malha(new THREE.TorusGeometry(.05, .009, 6, 30, Math.PI * 1.35), m); arco.scale.set(1, 1, .55);
    em(g, arco, 0, .005, 0, Math.PI / 2, 0, -Math.PI * .175 + Math.PI);
    const furo = mat('#2a1f18', {}, true);
    for (let a = 0; a < 6; a++) { const t = Math.PI * (.1 + a * .22) + Math.PI * .825; em(g, cil(.0022, .0022, .012, furo, 6), Math.cos(t) * .05, .005, -Math.sin(t) * .05); }
    return g;
  }

  return { mat, malha, caixa, cil, esfera, torno, toro, tubo, forma, em, grupo, chave, relogioBolso, oculos, pena, dado, moeda, tesoura, peao, concha, anel, borboleta, ferradura };
})();
