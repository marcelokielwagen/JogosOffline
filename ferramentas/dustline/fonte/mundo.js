/* Mundo: monta uma pista a partir da etapa (ETAPAS). Morros de poucos polígonos, estrada de terra de um lado
   ao outro, árvores do tipo da etapa (com batida), pedras, lago, montanhas, céu, largada, marcos e chegada.
   MUNDO é a pista atual: o carro pergunta a ele a altura do chão, se está na estrada e se bateu em algo. */
THREE.ColorManagement.enabled = false;
const cor = h => new THREE.Color(h), ale = (a, b) => a + Math.random() * (b - a);
const sorte2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function ruido(x, y) { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g); const a = sorte2(i, j), b = sorte2(i + 1, j), c = sorte2(i, j + 1), d = sorte2(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y, n = 4) => { let s = 0, a = .5; for (let k = 0; k < n; k++) { s += a * ruido(x, y); x = x * 2.03 + 7.1; y = y * 2.03 + 3.3; a *= .5; } return s; };
const suaveP = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const MAPA = 480, LARGURA = 8.8;
let MUNDO = null;
// sorteio que dá sempre o mesmo resultado para a mesma etapa (a pista não muda de uma vez para outra)
function sorteador(s) { let a = s * 9301 + 49297; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; }

function criarMundo(E) {
  const S = E.semente, rnd = sorteador(S), grupo = new THREE.Group(), passo = Som.pequeno ? 3 : 2.5;
  const morro = (x, z) => fbm(x * E.morro.freq + S, z * E.morro.freq + S * 2) * E.morro.amp + fbm(x * .03 + S, z * .03, 3) * E.morro.det - E.morro.amp * .4;

  /* ---------- estrada: pontos de controle de um lado ao outro, amostrados a cada metro ---------- */
  // a estrada nunca passa perto de si mesma (senão daria para cortar caminho): se passar, as curvas ficam mais suaves
  const sorteios = []; for (let k = 0; k < 60; k++) sorteios.push(rnd() - .5);
  let P = null;
  for (let fator = 1; !P; fator *= .85) {
    // três trechos de um lado ao outro do mapa, ligados por duas curvas em U (a estrada serpenteia)
    const ctrl = []; let k = 0;
    const trecho = (z0, sentido) => { for (let x = -180; x <= 180; x += 24) { const xx = x * sentido, aperta = 1 - Math.pow(Math.abs(xx) / 180, 4) * .75;
      ctrl.push(new THREE.Vector3(xx, 0, z0 + (Math.sin(xx * E.curva.freq + S + z0) * E.curva.amp + sorteios[k++ % 60] * E.curva.ruido * 2 + Math.sin(xx * .011 + S * 3 + z0) * E.curva.amp * .4) * fator * .5 * aperta)); } };
    const volta = (x, z0, z1) => { const s = Math.sign(x); ctrl.push(new THREE.Vector3(x + s * 16, 0, z0 + (z1 - z0) * .18), new THREE.Vector3(x + s * 26, 0, (z0 + z1) / 2), new THREE.Vector3(x + s * 16, 0, z0 + (z1 - z0) * .82)); };
    trecho(-112, 1); volta(194, -112, 0); trecho(0, -1); volta(-194, 0, 112); trecho(112, 1);
    ctrl[0].z = ctrl[1].z; ctrl[ctrl.length - 1].z = ctrl[ctrl.length - 2].z;   // pontas retas
    const curva = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal'), Q = curva.getSpacedPoints(Math.round(curva.getLength()));
    let bom = true; for (let i = 0; i < Q.length && bom; i += 3) for (let j = i + 30; j < Q.length; j += 3) if ((Q[i].x - Q[j].x) ** 2 + (Q[i].z - Q[j].z) ** 2 < 22 * 22) { bom = false; break; }
    if (bom || fator < .3) P = Q;
  }
  const L = P.length - 1;
  let alt = P.map(p => morro(p.x, p.z)); for (let k = 0; k < 45; k++) alt = alt.map((h, i) => (alt[Math.max(0, i - 1)] + h * 2 + alt[Math.min(alt.length - 1, i + 1)]) / 4);
  if (E.lago != null) alt = alt.map(h => Math.max(h, E.lago + 1.3));
  P.forEach((p, i) => p.y = alt[i]);
  const grade = new Map(), C = 8, ch = (x, z) => Math.floor(x / C) + ',' + Math.floor(z / C);
  P.forEach((p, i) => { const k = ch(p.x, p.z); if (!grade.has(k)) grade.set(k, []); grade.get(k).push(i); });
  function perto(x, z) {
    let m = -1, d = 1e9; const cx = Math.floor(x / C), cz = Math.floor(z / C);
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const i of grade.get((cx + a) + ',' + (cz + b)) || []) { const p = P[i], e = (p.x - x) ** 2 + (p.z - z) ** 2; if (e < d) { d = e; m = i; } }
    return m < 0 ? null : { i: m, d: Math.sqrt(d), y: P[m].y };
  }
  const altura = (x, z) => { const h = morro(x, z), e = perto(x, z); if (!e) return E.lago != null ? Math.max(h, E.lago - 3) : h; const k = suaveP(LARGURA / 2 + .6, 16, e.d); return e.y - .08 + (h - e.y) * k; };
  const molhado = (x, z) => E.lago != null && altura(x, z) < E.lago - .15;   // a margem do lago é uma barreira macia
  // ponto da estrada mais perto, de qualquer distância (para voltar quando se perde)
  const maisPerto = (x, z) => { let m = 0, d = 1e18; P.forEach((p, i) => { const e = (p.x - x) ** 2 + (p.z - z) ** 2; if (e < d) { d = e; m = i; } }); return m; };
  const naEstrada = (x, z) => { const e = perto(x, z); return e && e.d < LARGURA / 2 + .5 ? 1 - suaveP(LARGURA / 2 - 1, LARGURA / 2 + .5, e.d) * .4 : 0; };

  /* ---------- chão ---------- */
  {
    const n = Math.round(MAPA / passo), H = [], pos = [], cores = [], tmp = new THREE.Color(), grama = E.chao.map(cor), terra = cor(E.terra), pedra = cor(E.pedra), areia = cor('#d8c49a');
    for (let j = 0; j <= n; j++) { H[j] = []; for (let i = 0; i <= n; i++) H[j][i] = altura(-MAPA / 2 + i * passo, -MAPA / 2 + j * passo); }
    const tri = (a, b, c) => {
      const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[2] + b[2] + c[2]) / 3, cy = (a[1] + b[1] + c[1]) / 3, e1 = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), e2 = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), inc = 1 - e1.cross(e2).normalize().y;
      const e = perto(cx, cz), dE = e ? e.d : 99, v = fbm(cx * .05 + S, cz * .05, 2), k = v * 7;
      tmp.copy(grama[Math.floor(k) % 4]).lerp(grama[(Math.floor(k) + 1) % 4], k % 1).offsetHSL(0, 0, (sorte2(cx, cz) - .5) * .035 + cy * .0012);
      if (inc > .22) tmp.lerp(pedra, Math.min(1, (inc - .22) * 4));
      if (E.lago != null && cy < E.lago + 1) tmp.lerp(areia, suaveP(E.lago + 1, E.lago - .5, cy));
      if (dE < LARGURA / 2 + 3) tmp.lerp(terra, (1 - suaveP(LARGURA / 2, LARGURA / 2 + 3, dE)) * .85);
      for (const q of [a, b, c]) { pos.push(...q); cores.push(tmp.r, tmp.g, tmp.b); }
    };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x0 = -MAPA / 2 + i * passo, z0 = -MAPA / 2 + j * passo, A = [x0, H[j][i], z0], B = [x0 + passo, H[j][i + 1], z0], Cc = [x0, H[j + 1][i], z0 + passo], D = [x0 + passo, H[j + 1][i + 1], z0 + passo];
      if ((i + j) % 2) { tri(A, Cc, B); tri(B, Cc, D); } else { tri(A, Cc, D); tri(A, D, B); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; grupo.add(m);
  }
  if (E.lago != null) { const a = new THREE.Mesh(new THREE.PlaneGeometry(MAPA * 2.4, MAPA * 2.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#9fbfb2', transparent: true, opacity: .86 })); a.position.y = E.lago; a.receiveShadow = true; grupo.add(a); }

  /* ---------- faixa da estrada: bordas, terra clara e dois sulcos de pneu ---------- */
  {
    const w = LARGURA / 2, [cb, cl, cc, cs] = E.estrada, perfil = [[-w - .9, cb, -.1], [-w, cl, .02], [-2.2, cc, .04], [-1.35, cs, .045], [-.45, cc, .05], [.45, cc, .05], [1.35, cs, .045], [2.2, cc, .04], [w, cl, .02], [w + .9, cb, -.1]];
    const pos = [], cores = [], idx = [], K = perfil.length, N = P.length;
    for (let i = 0; i < N; i++) {
      const p = P[i], t = new THREE.Vector3().subVectors(P[Math.min(N - 1, i + 1)], P[Math.max(0, i - 1)]).setY(0).normalize(), l = new THREE.Vector3(-t.z, 0, t.x);
      for (const [o, c, dy] of perfil) { const x = p.x + l.x * o, z = p.z + l.z * o, k = cor(c).offsetHSL(0, 0, (sorte2(i, o) - .5) * .04); pos.push(x, (Math.abs(o) > w ? altura(x, z) : p.y) + dy + .04, z); cores.push(k.r, k.g, k.b); }
    }
    for (let i = 0; i < N - 1; i++) for (let k = 0; k < K - 1; k++) { const a = i * K + k, b = (i + 1) * K + k; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.receiveShadow = true; grupo.add(m);
  }

  /* ---------- árvores (instanciadas) e pedras, com o que se pode bater ---------- */
  const batidas = new Map(), CB = 6, kb = (x, z) => Math.floor(x / CB) + ',' + Math.floor(z / CB);
  const alvo = (x, z, r, tipo, i) => { const k = kb(x, z); if (!batidas.has(k)) batidas.set(k, []); batidas.get(k).push({ x, z, r, tipo, i }); };
  const arv = criarArvores(E, rnd, perto, altura, alvo); grupo.add(arv.malha);
  {
    const g = new THREE.IcosahedronGeometry(1, 0), lista = [];
    for (let t = 0; t < 3000 && lista.length < 140; t++) { const x = (rnd() - .5) * (MAPA - 20), z = (rnd() - .5) * (MAPA - 20), e = perto(x, z); if ((e && e.d < LARGURA / 2 + 3) || fbm(x * .04, z * .04 + 20, 2) < .52) continue; if (E.lago != null && altura(x, z) < E.lago) continue; lista.push([x, z, .35 + rnd() * 1.2]); }
    const m = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: E.pedra, flatShading: true }), lista.length), M = new THREE.Matrix4(), q = new THREE.Quaternion();
    lista.forEach(([x, z, s], i) => { q.setFromEuler(new THREE.Euler(rnd(), rnd() * 6, rnd())); M.compose(new THREE.Vector3(x, altura(x, z), z), q, new THREE.Vector3(s, s * (.45 + rnd() * .35), s * (.8 + rnd() * .5))); m.setMatrixAt(i, M); if (s > .7) alvo(x, z, s * .85, 'pedra', i); });
    m.castShadow = m.receiveShadow = true; grupo.add(m);
  }
  function bateu(x, z, r) {
    const cx = Math.floor(x / CB), cz = Math.floor(z / CB); let pior = null;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const o of batidas.get((cx + a) + ',' + (cz + b)) || []) { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), f = o.r + r - d; if (f > 0 && (!pior || f > pior.f)) pior = { ...o, f, nx: dx / (d || 1), nz: dz / (d || 1) }; }
    return pior;
  }

  /* ---------- largada, marcos e chegada ---------- */
  const ini = 16, fim = P.length - 16, marcos = [1, 2, 3, 4, 5, 6].map(f => f / 7).map(f => Math.round(ini + (fim - ini) * f));
  const portais = []; const lado = i => { const t = new THREE.Vector3().subVectors(P[Math.min(P.length - 1, i + 2)], P[Math.max(0, i - 2)]).setY(0).normalize(); return { t, l: new THREE.Vector3(-t.z, 0, t.x) }; };
  const poste = (x, z, h, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, h, 8), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, altura(x, z) + h / 2, z); m.castShadow = true; return m; };
  function portal(i, tipo) {
    const g = new THREE.Group(), { t, l } = lado(i), p = P[i], w = LARGURA / 2 + 1.1, ang = Math.atan2(t.x, t.z), pano = [];
    if (tipo === 'marco') {
      for (const s of [-1, 1]) { const x = p.x + l.x * w * s, z = p.z + l.z * w * s; g.add(poste(x, z, 2.2, '#e8dccb')); const b = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshLambertMaterial({ color: '#7fb3a4', side: THREE.DoubleSide })); b.position.set(x + t.x * .45, altura(x, z) + 1.9, z + t.z * .45); b.rotation.y = ang + Math.PI / 2; g.add(b); pano.push(b); }
    } else {
      for (const s of [-1, 1]) g.add(poste(p.x + l.x * w * s, p.z + l.z * w * s, 4.6, '#efe4d2'));
      const faixa = new THREE.Mesh(new THREE.BoxGeometry(w * 2 + .3, .7, .08), new THREE.MeshLambertMaterial({ color: tipo === 'chegada' ? '#e8c46a' : '#f0e6d6' })); faixa.position.set(p.x, p.y + 4.2, p.z); faixa.rotation.y = ang + Math.PI / 2; faixa.castShadow = true; g.add(faixa); pano.push(faixa);
      if (tipo === 'chegada') for (let k = 0; k < 6; k++) { const q = new THREE.Mesh(new THREE.BoxGeometry(.7, .34, .1), new THREE.MeshLambertMaterial({ color: k % 2 ? '#4a3c34' : '#f6efe4' })); q.position.set(p.x + l.x * (k - 2.5) * 1.2, p.y + 4.2, p.z + l.z * (k - 2.5) * 1.2); q.rotation.y = ang + Math.PI / 2; g.add(q); }
      const linha = new THREE.Mesh(new THREE.PlaneGeometry(LARGURA, .5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f6efe4', transparent: true, opacity: .7, polygonOffset: true, polygonOffsetFactor: -4 })); linha.position.set(p.x, p.y + .1, p.z); linha.rotation.y = ang; g.add(linha);
    }
    grupo.add(g); portais.push({ i, tipo, pano, grupo: g }); return portais.at(-1);
  }
  portal(ini, 'largada'); marcos.forEach(i => portal(i, 'marco')); portal(fim, 'chegada');

  /* ---------- zonas de drift: as curvas mais fechadas, marcadas por cones dos dois lados (pontos em dobro) ---------- */
  const curv = P.map((p, i) => { const a = P[Math.max(0, i - 7)], b = P[Math.min(P.length - 1, i + 7)]; let d = Math.atan2(b.x - p.x, b.z - p.z) - Math.atan2(p.x - a.x, p.z - a.z); d -= Math.round(d / 6.2832) * 6.2832; return Math.abs(d) / 14; });
  const zonas = [], emZona = new Uint8Array(P.length);
  for (let i = ini + 20; i < fim - 20; i++) {
    if (curv[i] < .017) continue; let j = i; while (j < fim - 12 && curv[j] >= .012) j++;
    if (j - i >= 18 && (!zonas.length || i - zonas.at(-1)[1] > 40)) { const z = [Math.max(ini + 8, i - 10), Math.min(fim - 6, j + 8)]; zonas.push(z); for (let k = z[0]; k <= z[1]; k++) emZona[k] = 1; }
    i = j;
  }
  {
    const lugares = []; for (const [a, b] of zonas) for (let i = a; i <= b; i += 4) { const { l } = lado(i), p = P[i]; for (const s of [-1, 1]) lugares.push([p.x + l.x * (LARGURA / 2 + .7) * s, p.z + l.z * (LARGURA / 2 + .7) * s, (i - a) / 4 % 2]); }
    if (lugares.length) {
      const g = new THREE.ConeGeometry(.26, .72, 8).translate(0, .36, 0), m = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: '#fff' }), lugares.length), M = new THREE.Matrix4(), c = new THREE.Color();
      lugares.forEach(([x, z, k], n) => { M.makeTranslation(x, altura(x, z) - .02, z); m.setMatrixAt(n, M); m.setColorAt(n, c.set(k ? '#f4ead8' : '#e3773a')); });
      m.castShadow = true; grupo.add(m);
    }
  }

  grupo.add(criarMontanhas(E), criarCeu());
  return { E, grupo, pontos: P, perto, altura, naEstrada, bateu, molhado, maisPerto, ini, fim, marcos, portais, arvores: arv, zonas, emZona,
    largada: () => { const i = ini - 9, p = P[i], s = P[i + 4]; return { x: p.x, z: p.z, rumo: Math.atan2(s.x - p.x, s.z - p.z) }; },
    descartar() { grupo.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } };
}

/* Árvores de cada etapa: um só modelo com cores por vértice, repetido por instâncias (rápido). */
function criarArvores(E, rnd, perto, altura, alvo) {
  const partes = [], junta = (g, c) => partes.push([g, cor(c)]);
  const tronco = c => junta(new THREE.CylinderGeometry(.2, .28, 1.6, 6).translate(0, .8, 0), c);
  if (E.arvore === 'pinheiro' || E.arvore === 'pinheiroNeve') {
    tronco('#7a5a42'); const verde = E.arvore === 'pinheiro' ? ['#4a7650', '#55805a', '#629064'] : ['#3e6650', '#456e58', '#4f7a60'];
    [[2.1, 3, 2.6], [1.6, 2.6, 4.1], [1.05, 2.2, 5.5]].forEach(([r, h, y], k) => { junta(new THREE.ConeGeometry(r, h, 7).translate(0, y, 0), verde[k]); if (E.arvore === 'pinheiroNeve') junta(new THREE.ConeGeometry(r * .62, h * .42, 7).translate(0, y + h * .3, 0), '#f6f4f0'); });
  } else if (E.arvore === 'cerejeira') {
    tronco('#6e4f42'); [[0, 2.8, 0, 1.5, '#f2b8c6'], [.9, 2.4, .4, 1.1, '#f6c9d3'], [-.8, 2.5, -.3, 1.15, '#eaa7b9'], [.1, 3.5, -.5, 1, '#f8d4dc']].forEach(([x, y, z, r, c]) => junta(new THREE.IcosahedronGeometry(r, 0).translate(x, y, z), c));
  } else {
    tronco('#e6ddd0'); [[0, 2.9, 0, 1.3, '#e08a3c'], [.7, 2.4, .5, 1, '#d4632f'], [-.6, 2.6, -.4, 1.05, '#e8b14a'], [0, 3.7, -.3, .85, '#e59a42']].forEach(([x, y, z, r, c]) => junta(new THREE.IcosahedronGeometry(r, 0).translate(x, y, z), c));
  }
  const pos = [], col = []; for (const [g, c] of partes) { const n = g.index ? g.toNonIndexed() : g; pos.push(...n.attributes.position.array); for (let i = 0; i < n.attributes.position.count; i++) col.push(c.r, c.g, c.b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const lugares = [];
  for (let t = 0; t < 14000 && lugares.length < (Som.pequeno ? 700 : 1000); t++) {
    const x = (rnd() - .5) * (MAPA - 10), z = (rnd() - .5) * (MAPA - 10), e = perto(x, z);
    if (e && e.d < LARGURA / 2 + 4 + sorte2(x, z) * 6) continue; if (fbm(x * .02 + 40 + E.semente, z * .02, 3) < E.densidade && rnd() > .06) continue;
    if (E.lago != null && altura(x, z) < E.lago + .6) continue; lugares.push([x, z, .6 + rnd() * .65]);
  }
  const m = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }), lugares.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), tint = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const mats = lugares.map(([x, z, s], i) => { q.setFromAxisAngle(up, rnd() * 6.28); const p = new THREE.Vector3(x, altura(x, z) - .2, z), sc = new THREE.Vector3(s * (.85 + rnd() * .25), s, s * (.85 + rnd() * .25)); M.compose(p, q, sc); m.setMatrixAt(i, M); tint.setHSL(rnd(), .12, .86 + rnd() * .2); m.setColorAt(i, tint); alvo(x, z, .45 * s + .15, 'arvore', i); return { p, q: q.clone(), sc }; });
  m.castShadow = m.receiveShadow = true;
  // árvore batida balança e volta
  const balanco = new Map(), e = new THREE.Euler(), qq = new THREE.Quaternion();
  return { malha: m, sacudir(i, forca, dx, dz) { balanco.set(i, { t: 0, f: Math.min(.35, forca * .03), dx, dz }); },
    quadro(dt) { for (const [i, b] of balanco) { b.t += dt; const a = Math.sin(b.t * 9) * Math.exp(-b.t * 2.6) * b.f, o = mats[i]; e.set(-b.dz * a, 0, b.dx * a); qq.setFromEuler(e).multiply(o.q); M.compose(o.p, qq, o.sc); m.setMatrixAt(i, M); m.instanceMatrix.needsUpdate = true; if (b.t > 2.2) balanco.delete(i); } } };
}
function criarMontanhas(E) {
  const N = 140, R = 520, pos = [], cores = [], c1 = cor(E.pedra).lerp(cor(E.nevoa), .35), neve = cor('#f6f3ee'), tmp = new THREE.Color();
  const alt = i => { const a = i / N; return 40 + fbm(a * 9 + E.semente, 2.2, 4) * 140 + Math.max(0, Math.sin(a * 6.28 * 3 + E.semente)) * 30; };
  for (let i = 0; i < N; i++) {
    const a0 = i / N * 6.28, a1 = (i + 1) / N * 6.28, h0 = alt(i), h1 = alt(i + 1), r0 = R + sorte2(i, E.semente) * 60, r1 = R + sorte2(i + 1, E.semente) * 60;
    const A = [Math.cos(a0) * r0, -30, Math.sin(a0) * r0], B = [Math.cos(a1) * r1, -30, Math.sin(a1) * r1], C = [Math.cos(a0) * r0, h0, Math.sin(a0) * r0], D = [Math.cos(a1) * r1, h1, Math.sin(a1) * r1];
    for (const [t, alto] of [[[A, C, B], h0], [[B, C, D], h1]]) { tmp.copy(c1).lerp(neve, suaveP(110, 145, alto) + (E.id === 'neve' ? .5 : 0)); for (const v of t) { pos.push(...v); cores.push(tmp.r, tmp.g, tmp.b); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3)); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
}
const CEU = { c: [new THREE.Color(), new THREE.Color(), new THREE.Color()], sol: new THREE.Color(), dir: new THREE.Vector3(), nevoa: new THREE.Color() };
function criarCeu() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1100, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { cT: { value: CEU.c[0] }, cM: { value: CEU.c[1] }, cH: { value: CEU.c[2] }, cS: { value: CEU.sol }, uS: { value: CEU.dir }, cN: { value: CEU.nevoa } },
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.99999;}',
    fragmentShader: `varying vec3 vD;uniform vec3 cT,cM,cH,cS,cN,uS;void main(){float y=vD.y;vec3 c=mix(cH,cM,smoothstep(.0,.18,y));c=mix(c,cT,smoothstep(.15,.7,y));
float s=max(0.,dot(vD,normalize(uS)));c=mix(c,cS,pow(s,10.)*.55+pow(s,500.)*.9);c=mix(cN,c,smoothstep(-.05,.08,y));gl_FragColor=vec4(c,1.);}` }));
  m.renderOrder = -1; m.frustumCulled = false; return m;
}
