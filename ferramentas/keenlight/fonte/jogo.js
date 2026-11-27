/* Motor do jogo. Cada nível tem uma "vista":
   - Vista 3D (Three.js): girar, aproximar onde se aponta, arrastar, gavetas e portas.
   - Vista 2D (Canvas): ilustração enorme pré-pintada em duas camadas (fundo e frente), com zoom e arrasto
     e animações por cima (ondas, gaivotas, velas).
   O resto é comum: lista de busca, lupa de dica, anti-chute, pontos, abertura e fim. */
const $ = id => document.getElementById(id);
const MOVEL = Tex.MOVEL, V3 = THREE.Vector3;
const CHAVE = 'keenlight.v1';
const ficha = (() => { try { return Object.assign({ moedas: 0, som: true, modo: 'nome', niveis: {} }, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch { return { moedas: 0, som: true, modo: 'nome', niveis: {} }; } })();
const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(ficha)); } catch { } };
const NIVEIS = [
  { nome: 'O Ateliê do Pintor', estilo: 'quarto em 3D', criar: () => criarAtelie(cena), som: 'quarto' },
  { nome: 'Praia Movimentada', estilo: 'ilustração com zoom', criar: () => criarPraia(), som: 'praia' },
  { nome: 'Galeria Camuflada', estilo: 'quadro artístico', criar: () => criarGaleria(), som: 'galeria' },
  { nome: 'Caso Noir', estilo: 'preto e branco', criar: () => criarNoir(), som: 'noir' },
  { nome: 'Biblioteca Secreta', estilo: '3D · só silhuetas', criar: () => criarBiblioteca(cena), som: 'biblioteca' },
  { nome: 'A Cozinha do Relojoeiro', estilo: 'só charadas', criar: () => criarCozinha(), som: 'cozinha' }
];
const MODOS = { nome: ['Nomes', 1], silhueta: ['Silhuetas', 1.3], charada: ['Charadas', 1.6] };
const PRECO_LUPA = 30, RECARGA = 45;
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const alturaLista = () => $('lista').hidden ? 0 : ($('lista').offsetHeight || 96);

/* ---------- renderizador 3D (o ateliê também é o fundo da abertura) ---------- */
const canvas = $('tela'), canvas2 = $('tela2d'), g2 = canvas2.getContext('2d');
let R;
try {
  R = new THREE.WebGLRenderer({ canvas, antialias: !MOVEL || devicePixelRatio < 2, powerPreference: 'high-performance' });
} catch (e) { $('semgl').hidden = false; $('abertura').hidden = true; throw e; }
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.3;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
Tex.aniso = Math.min(8, R.capabilities.getMaxAnisotropy());
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); $('semgl').hidden = false; });
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .03, 40); camera.layers.enable(1);

/* ======================================================================
   VISTA 3D
   ====================================================================== */
function criarVista3D(nivel) {
  const cfg = nivel.camera, cx = cfg.caixaAlvo, cc = cfg.caixaCam;
  const retrato = () => innerWidth < innerHeight * .8;
  const ini = () => ({ alvo: new V3(...cfg.alvo), az: cfg.az, el: cfg.el + (retrato() ? .06 : 0), dist: cfg.dist * (retrato() ? .84 : 1) });
  const A = ini(), atual = ini();
  const prender = p => { p.x = lim(p.x, cx[0][0], cx[1][0]); p.y = lim(p.y, cx[0][1], cx[1][1]); p.z = lim(p.z, cx[0][2], cx[1][2]); return p; };
  const dir = new V3(), dirDe = (az, el) => dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  let auto = 0; const raioCam = new THREE.Raycaster(); raioCam.layers.set(0);
  function camPasso(dt) {
    const k = 1 - Math.exp(-dt * 8);
    atual.alvo.lerp(A.alvo, k); atual.az += (A.az + auto - atual.az) * k; atual.el += (A.el - atual.el) * k; atual.dist += (A.dist - atual.dist) * k;
    dirDe(atual.az, atual.el);
    let tmax = atual.dist;   // não deixa a câmera sair da sala
    for (let i = 0; i < 3; i++) { const d = dir.getComponent(i), o = atual.alvo.getComponent(i); if (Math.abs(d) < 1e-6) continue; const t = ((d > 0 ? cc[1][i] : cc[0][i]) - o) / d; if (t > 0) tmax = Math.min(tmax, t); }
    raioCam.set(atual.alvo, dir); raioCam.near = .08; raioCam.far = tmax;
    const bate = raioCam.intersectObject(nivel.raiz, true).find(h => h.object.visible && !h.object.userData.semClique && !(h.object.material && h.object.material.transparent && h.object.material.opacity < .5));
    if (bate) tmax = Math.max(.05, bate.distance - .06);
    camera.position.copy(atual.alvo).addScaledVector(dir, Math.max(.05, tmax)); camera.lookAt(atual.alvo);
  }
  const dr = new V3(), du = new V3();
  function arrastar(dx, dy) {
    const esc = atual.dist * Math.tan(camera.fov * Math.PI / 360) * 2 / innerHeight;
    dr.setFromMatrixColumn(camera.matrixWorld, 0); du.setFromMatrixColumn(camera.matrixWorld, 1);
    A.alvo.addScaledVector(dr, -dx * esc).addScaledVector(du, dy * esc); prender(A.alvo);
  }
  function zoomPonto(fator, ponto) {
    const nova = lim(A.dist * fator, cfg.d0, cfg.d1), k = 1 - nova / A.dist;
    if (ponto && k > 0) A.alvo.lerp(ponto, k); else if (ponto && k < 0) A.alvo.lerp(new V3(...cfg.alvo), Math.min(1, -k * .5));
    prender(A.alvo); A.dist = nova;
  }
  // raio da tela até o cenário
  const ray = new THREE.Raycaster(); ray.layers.set(0); const ndc = new THREE.Vector2();
  function raioEm(x, y) { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObject(nivel.raiz, true).filter(h => h.object.visible && !h.object.userData.semClique); }
  const subir = (o, chave) => { while (o) { if (o.userData[chave]) return o.userData[chave]; o = o.parent; } return null; };
  const centroDe = (o, v = new V3()) => new THREE.Box3().setFromObject(o).getCenter(v);
  const raioDe = o => new THREE.Box3().setFromObject(o).getSize(new V3()).length() / 2;
  function visivel(it) {
    const c = centroDe(it.obj); const d = c.clone().sub(camera.position), dist = d.length(); ray.set(camera.position, d.normalize());
    const h = ray.intersectObject(nivel.raiz, true).find(h => h.object.visible && !h.object.userData.semClique);
    return !h || subir(h.object, 'item') === it || h.distance > dist - raioDe(it.obj) * .6;
  }
  const itens = nivel.itens;
  itens.forEach(it => { const o = it.obj; it.ini = { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() }; it.mats = []; o.traverse(m => { if (m.isMesh) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { if (x.emissive && !it.mats.includes(x)) it.mats.push(x); }); }); });

  /* efeitos: anel dourado, faíscas, pulso da dica */
  const efeitos = [], tAnel = Tex.anel(), tBrilho = Tex.bolinha('255,215,120');
  const sprite = (tex, cor = '#ffffff', op = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cor, transparent: true, opacity: op, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })); s.renderOrder = 10; s.layers.set(1); cena.add(s); return s; };
  let pulso = null;
  function explosao(p, raio) {
    for (let k = 0; k < 2; k++) { const s = sprite(tAnel, '#ffd27a'); s.position.copy(p); efeitos.push({ s, t: -k * .18, dur: 1.1, f(e, u) { const z = Math.max(raio * 3, .12) * (.4 + u * 3.2); e.s.scale.set(z, z, 1); e.s.material.opacity = (1 - u) * .95; } }); }
    const luz = sprite(tBrilho, '#ffe2a0', .6); luz.position.copy(p); efeitos.push({ s: luz, t: 0, dur: .9, f(e, u) { const z = Math.max(raio * 6, .25) * (1 + u); e.s.scale.set(z, z, 1); e.s.material.opacity = (1 - u) * .6; } });
    for (let i = 0; i < 26; i++) {
      const s = sprite(tBrilho, i % 3 ? '#ffd27a' : '#fff4d6'), v = new V3(Math.random() - .5, Math.random() * .9 + .2, Math.random() - .5).normalize().multiplyScalar(.4 + Math.random() * .8);
      s.position.copy(p); const z = .018 + Math.random() * .03; s.scale.set(z, z, 1);
      efeitos.push({ s, t: 0, dur: .9 + Math.random() * .5, v, f(e, u, dt) { e.v.y -= dt * 1.4; e.s.position.addScaledVector(e.v, dt); e.s.material.opacity = 1 - u; } });
    }
  }
  function passoEfeitos(dt) {
    for (let i = efeitos.length - 1; i >= 0; i--) {
      const e = efeitos[i]; e.t += dt; if (e.t < 0) { e.s.visible = false; continue; } e.s.visible = true;
      const u = Math.min(1, e.t / e.dur); e.f(e, u, dt);
      if (u >= 1) { cena.remove(e.s); e.s.material.dispose(); efeitos.splice(i, 1); }
    }
    if (pulso) {
      pulso.t += dt; const u = pulso.t / pulso.dur, b = (Math.sin(pulso.t * 5) + 1) / 2;
      const z = pulso.raio * (2 + b * .8); pulso.s.scale.set(z, z, 1); pulso.l.scale.set(z * 1.6, z * 1.6, 1);
      const fade = u < .1 ? u * 10 : u > .8 ? (1 - u) * 5 : 1; pulso.s.material.opacity = fade * .9; pulso.l.material.opacity = fade * .35 * b;
      if (u >= 1) { cena.remove(pulso.s, pulso.l); pulso = null; }
    }
    for (const it of itens) if (it.anim != null) {   // brilha dourado, sobe girando e some
      it.anim += dt; const a = it.anim, o = it.obj;
      const brilho = a < .25 ? a / .25 : Math.max(0, 1 - (a - .25) / 1.2);
      it.mats.forEach(m => { m.emissive.set('#ffb640'); m.emissiveIntensity = brilho * 2.2; });
      if (a > .5) { const u = Math.min(1, (a - .5) / .9); o.position.y = it.ini.p.y + u * .25; o.rotation.y = it.ini.r.y + u * 5; o.scale.copy(it.ini.s).multiplyScalar(1 + u * .6 - u * u * 1.55); }
      if (a > 1.4) { o.visible = false; it.anim = null; }
    }
  }
  return {
    tipo: '3d', nivel, itens,
    ativar() { canvas.hidden = false; canvas2.hidden = true; cena.background = new THREE.Color(nivel.fundo); for (const v of Object.values(criados)) if (v.tipo === '3d') v.nivel.raiz.visible = v === this; nivel.raiz.visible = true; },
    passo(dt, t, estado) {
      auto = estado === 'abertura' ? Math.sin(t * .12) * .35 : 0;
      for (const i of nivel.interativos) { const alvo = i.aberto ? 1 : 0; if (i.k !== alvo) { i.k = lim(i.k + Math.sign(alvo - i.k) * dt * 2.4, 0, 1); i.aplicar(i.k * i.k * (3 - 2 * i.k)); } }
      nivel.atualizar(t, dt); camPasso(dt); passoEfeitos(dt); R.render(cena, camera);
    },
    ajustar() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); camera.aspect = w / h; camera.fov = Math.min(70, Math.max(cfg.fov, 2 * Math.atan(Math.tan(31 * Math.PI / 180) / camera.aspect) * 180 / Math.PI)); camera.updateProjectionMatrix(); },
    orbitar(dx, dy) { A.az = lim(A.az - dx * .0052, cfg.az0, cfg.az1); A.el = lim(A.el + dy * .0042, cfg.el0, cfg.el1); },
    arrastar,
    zoom(f, x, y, cache) { let p; if (cache && 'p' in cache) p = cache.p; else { const h = raioEm(x, y)[0]; p = h ? h.point.clone() : null; if (cache) cache.p = p; } zoomPonto(f, p); },
    centro() { Object.assign(A, ini()); },
    hover(x, y) { const h = raioEm(x, y)[0]; return !!(h && subir(h.object, 'interativo') && !subir(h.object, 'item')); },
    // toque: devolve o item achado, 'abriu' ou null (erro)
    tocar(x, y, toque) {
      const h = raioEm(x, y)[0];
      if (h) {
        const it = subir(h.object, 'item'); if (it && !it.achado) return it;
        const inter = subir(h.object, 'interativo');
        if (inter && !it) { inter.aberto = !inter.aberto; Som.abrir(inter.tipo, inter.aberto); ultimoInter = inter; return 'abriu'; }
      }
      let melhor = null, md = 1e9; const v = new V3();
      for (const it of itens) {   // tolerância: perto do centro na tela e sem nada na frente
        if (it.achado) continue;
        centroDe(it.obj, v); const borda = v.clone().add(new V3(raioDe(it.obj), 0, 0).applyQuaternion(camera.quaternion));
        v.project(camera); borda.project(camera); if (v.z > 1) continue;
        const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight, rp = Math.hypot((borda.x - v.x) / 2 * innerWidth, (borda.y - v.y) / 2 * innerHeight);
        const d = Math.hypot(sx - x, sy - y), tol = Math.min(70, rp * .9 + (toque ? 26 : 16));
        if (d < tol && d < md && visivel(it)) { melhor = it; md = d; }
      }
      return melhor;
    },
    marcarAchado(it) { it.obj.visible = false; it.anim = null; },
    achou(it) { explosao(centroDe(it.obj), raioDe(it.obj)); it.anim = 0; if (pulso && pulso.it === it) pulso.t = Math.max(pulso.t, pulso.dur * .85); },
    dica(it) {
      const fechado = it.dentro && it.dentro.every(d => !d.aberto) ? it.dentro[0] : null;
      const p = fechado ? centroDe(fechado.raiz) : centroDe(it.obj);
      const regiao = p.clone().add(new V3(Math.random() - .5, (Math.random() - .5) * .6, Math.random() - .5).multiplyScalar(.28));
      if (pulso) cena.remove(pulso.s, pulso.l);
      const s = sprite(tAnel, '#ffe08a'), l = sprite(tBrilho, '#ffd27a', .5); s.position.copy(regiao); l.position.copy(regiao);
      pulso = { s, l, t: 0, dur: 5.5, raio: .3, it };
      A.alvo.copy(p.clone().lerp(A.alvo, .35)); prender(A.alvo); A.dist = Math.min(A.dist, 2.4);
      return !!fechado;
    },
    ondeEsta(it) { const v = centroDe(it.obj).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; },
    fotografar() {
      let r2; try { r2 = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); } catch { return; }
      r2.setSize(128, 128); r2.setPixelRatio(1); r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.ACESFilmicToneMapping;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e8', '#6a5040', 1.6)); const dl = new THREE.DirectionalLight('#ffffff', 2.2); dl.position.set(1, 3, 2); sc.add(dl);
      const cam = new THREE.PerspectiveCamera(30, 1, .001, 10), preto = new THREE.MeshBasicMaterial({ color: '#2a1f17' });
      const frente = { pena: [0, .25, 1], peao: [0, .45, 1], borboleta: [0, 1, .35] };
      for (const it of itens) {
        const ud = it.obj.userData; it.obj.userData = {}; const c = it.obj.clone(true); it.obj.userData = ud;
        c.position.set(0, 0, 0); c.rotation.set(0, it.id === 'peao' || it.id === 'pena' ? 0 : .5, 0); c.scale.setScalar(1); if (it.id === 'pena') c.rotation.z = -.5;
        sc.add(c); c.updateMatrixWorld(true);
        const caixa = new THREE.Box3().setFromObject(c), ctr = caixa.getCenter(new V3()), raio = caixa.getSize(new V3()).length() / 2;
        const d = new V3(...(it.vistaIcone || frente[it.id] || [0, 1, .75])).normalize();
        cam.position.copy(ctr).addScaledVector(d, raio / Math.sin(15 * Math.PI / 180) * 1.02); cam.lookAt(ctr); cam.near = raio * .1; cam.far = raio * 20; cam.updateProjectionMatrix();
        sc.overrideMaterial = null; r2.render(sc, cam); it.icone = r2.domElement.toDataURL();
        sc.overrideMaterial = preto; r2.render(sc, cam); it.silhueta = r2.domElement.toDataURL();
        sc.remove(c);
      }
      r2.dispose(); r2.forceContextLoss();
    },
    reiniciar() {
      for (const it of itens) { it.anim = null; it.obj.visible = true; it.obj.position.copy(it.ini.p); it.obj.rotation.copy(it.ini.r); it.obj.scale.copy(it.ini.s); it.mats.forEach(m => { m.emissiveIntensity = 0; }); }
      for (const i of nivel.interativos) i.aberto = false;
      Object.assign(A, ini());
    },
    focar(p, dist) { A.alvo.copy(p); prender(A.alvo); A.dist = Math.min(A.dist, dist); },
    raioEm, subir, A
  };
}

/* ======================================================================
   VISTA 2D — ilustração pré-pintada em duas camadas + animação por cima
   O nível entrega: largura, altura, fundo(g), frente(g), itens [{x, y, raio, escala, giro, desenho(g), depois(g)}],
   animarMeio(g, t, vis) e animarTopo(g, t, vis).
   ====================================================================== */
function criarVista2D(nivel) {
  const SW = nivel.largura, SH = nivel.altura, Q = MOVEL ? .8 : 1;
  const novaTela = () => { const c = document.createElement('canvas'); c.width = Math.round(SW * Q); c.height = Math.round(SH * Q); const g = c.getContext('2d'); g.scale(Q, Q); return [c, g]; };
  const [cA, gA] = novaTela(), [cB, gB] = novaTela();
  nivel.fundo(gA);
  const itens = nivel.itens;
  // guarda o pedacinho do fundo de cada item antes de pintá-lo, para apagar quando for achado
  const remendar = () => { for (const it of itens) {
    if (it.animado) continue;
    const r = it.raio * 1.7, x0 = Math.max(0, Math.floor((it.x - r) * Q)), y0 = Math.max(0, Math.floor((it.y - r) * Q));
    const w = Math.min(cA.width - x0, Math.ceil(2 * r * Q)), h = Math.min(cA.height - y0, Math.ceil(2 * r * Q));
    const p = document.createElement('canvas'); p.width = w; p.height = h; p.getContext('2d').drawImage(cA, x0, y0, w, h, 0, 0, w, h);
    it.remendo = { p, x0, y0 };
  } };
  const pintar = (g, it) => { g.save(); g.translate(it.x, it.y); g.rotate(it.giro || 0); g.scale(it.escala || 1, it.escala || 1); it.desenho(g); g.restore(); };
  const pintarItem = it => { pintar(gA, it); if (it.depois) { gA.save(); it.depois(gA); gA.restore(); } };
  if (!nivel.noir) remendar();
  for (const it of itens) if (!it.animado) pintarItem(it);
  nivel.frente(gB);
  if (nivel.noir) { gravura(cA, 0); gravura(cB, 1); remendar(); }   // no noir o remendo guarda o objeto já em cinza

  // vista: tela = cena * z + o
  const V = { z: 1, ox: 0, oy: 0 }, A = { z: 1, ox: 0, oy: 0 };
  let W = innerWidth, H = innerHeight;
  const capa = () => Math.max(W / SW, (H - 0) / SH), contem = () => Math.min(W / SW, (H - alturaLista() - 50) / SH);
  const zmin = () => Math.min(capa(), contem()) * .98, zmax = () => Math.max(1.5, capa() * 4);
  function prender(o = A) {
    o.z = lim(o.z, zmin(), zmax());
    const topo = 56, baixo = alturaLista();
    const w = SW * o.z, h = SH * o.z;
    o.ox = w <= W ? (W - w) / 2 : lim(o.ox, W - w, 0);
    o.oy = h <= H - topo - baixo ? topo + (H - topo - baixo - h) / 2 : lim(o.oy, H - baixo - h, topo * 0);
  }
  function inicio() { A.z = capa() * (W < H ? 1 : 1.05); A.ox = (W - SW * A.z) / 2; A.oy = (H - SH * A.z) / 2 - (W < H ? 0 : 10); if (nivel.foco && W < H) A.ox = W / 2 - nivel.foco[0] * A.z; prender(); }
  function zoomEm(f, x, y) { const nz = lim(A.z / f, zmin(), zmax()); A.ox = x - (x - A.ox) * nz / A.z; A.oy = y - (y - A.oy) * nz / A.z; A.z = nz; prender(); }
  const naCena = (x, y) => [(x - V.ox) / V.z, (y - V.oy) / V.z];

  // efeitos em coordenadas da cena
  const efeitos = []; let pulso = null;
  function sprite(it) { const r = it.raio * 1.8, c = document.createElement('canvas'), s = 2; c.width = c.height = Math.ceil(r * 2 * s); const g = c.getContext('2d'); g.scale(s, s); g.translate(r, r); g.rotate(it.giro || 0); g.scale(it.escala || 1, it.escala || 1); it.desenho(g); return { c, r }; }
  function desenharEfeitos(g, dt) {
    for (let i = efeitos.length - 1; i >= 0; i--) {
      const e = efeitos[i]; e.t += dt; if (e.t < 0) continue; const u = Math.min(1, e.t / e.dur);
      g.save();
      if (e.tipo === 'anel') { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,210,120,${(1 - u) * .9})`; g.lineWidth = (6 - 4 * u) / V.z * .6 + 2; g.shadowColor = '#ffc860'; g.shadowBlur = 18; g.beginPath(); g.arc(e.x, e.y, e.r * (.5 + u * 2.6), 0, 7); g.stroke(); }
      else if (e.tipo === 'faisca') { e.vy += dt * 500; e.x += e.vx * dt; e.y += e.vy * dt; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.s); gr.addColorStop(0, `rgba(255,240,200,${1 - u})`); gr.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = gr; g.fillRect(e.x - e.s, e.y - e.s, e.s * 2, e.s * 2); }
      else if (e.tipo === 'voo') { // o item sobe brilhando e some
        const k = 1 + u * .7 - u * u * 1.4, sobe = u * e.r * 1.6; g.globalAlpha = 1 - u * u;
        g.translate(e.x, e.y - sobe); g.rotate(u * 1.5); g.scale(k, k);
        g.shadowColor = '#ffcc55'; g.shadowBlur = 30 * (1 - u); g.drawImage(e.sp.c, -e.sp.r, -e.sp.r, e.sp.r * 2, e.sp.r * 2);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - u) * .45; g.drawImage(e.sp.c, -e.sp.r, -e.sp.r, e.sp.r * 2, e.sp.r * 2);
      }
      else if (e.tipo === 'colorir') {
        const rr = e.r * 2 * Math.min(1, u * 1.25);
        g.beginPath(); g.arc(e.x, e.y, rr, 0, 7); g.clip(); g.drawImage(e.sp.c, e.x - e.sp.r, e.y - e.sp.r, e.sp.r * 2, e.sp.r * 2);
        g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(e.x, e.y, rr * .6, e.x, e.y, rr); gr.addColorStop(0, 'rgba(255,200,90,0)'); gr.addColorStop(1, `rgba(255,210,110,${.7 * (1 - u)})`); g.fillStyle = gr; g.fillRect(e.x - rr, e.y - rr, rr * 2, rr * 2);
      }
      g.restore();
      if (u >= 1) { efeitos.splice(i, 1); if (e.fim) e.fim(); }
    }
    if (pulso) {
      pulso.t += dt; const u = pulso.t / pulso.dur, b = (Math.sin(pulso.t * 5) + 1) / 2, fade = u < .1 ? u * 10 : u > .8 ? (1 - u) * 5 : 1;
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(pulso.x, pulso.y, 0, pulso.x, pulso.y, pulso.r * 1.6); gr.addColorStop(0, `rgba(255,215,120,${.25 * fade * b})`); gr.addColorStop(1, 'rgba(255,215,120,0)'); g.fillStyle = gr; g.fillRect(pulso.x - pulso.r * 2, pulso.y - pulso.r * 2, pulso.r * 4, pulso.r * 4);
      g.strokeStyle = `rgba(255,224,138,${.9 * fade})`; g.lineWidth = 3 / V.z + 2; g.shadowColor = '#ffc860'; g.shadowBlur = 20; g.beginPath(); g.arc(pulso.x, pulso.y, pulso.r * (1 + b * .25), 0, 7); g.stroke();
      g.restore(); if (u >= 1) pulso = null;
    }
  }
  return {
    tipo: '2d', nivel, itens,
    ativar() { canvas.hidden = true; canvas2.hidden = false; this.ajustar(); inicio(); Object.assign(V, A); },
    ajustar() { W = innerWidth; H = innerHeight; const d = Math.min(devicePixelRatio, 2); canvas2.width = Math.round(W * d); canvas2.height = Math.round(H * d); prender(); },
    passo(dt, t) {
      const k = 1 - Math.exp(-dt * 10); V.z += (A.z - V.z) * k; V.ox += (A.ox - V.ox) * k; V.oy += (A.oy - V.oy) * k;
      const d = canvas2.width / W, g = g2;
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = nivel.cor || '#1d1712'; g.fillRect(0, 0, canvas2.width, canvas2.height);
      g.setTransform(d * V.z, 0, 0, d * V.z, d * V.ox, d * V.oy); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      const vis = { x0: -V.ox / V.z, y0: -V.oy / V.z, x1: (W - V.ox) / V.z, y1: (H - V.oy) / V.z, z: V.z };
      g.drawImage(cA, 0, 0, SW, SH);
      nivel.animarMeio && nivel.animarMeio(g, t, vis);
      g.drawImage(cB, 0, 0, SW, SH);
      nivel.animarTopo && nivel.animarTopo(g, t, vis);
      desenharEfeitos(g, dt);
    },
    orbitar(dx, dy) { A.ox += dx; A.oy += dy; prender(); },
    arrastar(dx, dy) { A.ox += dx; A.oy += dy; prender(); },
    zoom(f, x, y) { zoomEm(f, x, y); },
    centro() { inicio(); },
    hover() { return false; },
    tocar(x, y, toque) {
      const [sx, sy] = naCena(x, y); let melhor = null, md = 1e9;
      for (const it of itens) { if (it.achado) continue; const d = Math.hypot(sx - it.x, sy - it.y), tol = it.raio * (it.escala || 1) + (toque ? 22 : 12) / V.z; if (d < tol && d < md) { md = d; melhor = it; } }
      return melhor;
    },
    marcarAchado(it) { if (it.animado) return; if (nivel.noir) pintar(gA, it); else if (it.remendo) gA.drawImage(it.remendo.p, it.remendo.x0 / Q, it.remendo.y0 / Q, it.remendo.p.width / Q, it.remendo.p.height / Q); },
    achou(it) {
      if (nivel.noir) {   // ganha cor com uma onda de luz dourada e fica colorido
        const r = it.raio * (it.escala || 1);
        efeitos.push({ tipo: 'colorir', x: it.x, y: it.y, r, sp: sprite(it), t: 0, dur: 1.1, fim: () => pintar(gA, it) });
        for (let k = 0; k < 3; k++) efeitos.push({ tipo: 'anel', x: it.x, y: it.y, r: Math.max(r, 30), t: -k * .15, dur: 1.2 });
        for (let i = 0; i < 18; i++) { const a = Math.random() * 6.3, v = 220 + Math.random() * 260; efeitos.push({ tipo: 'faisca', x: it.x, y: it.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, s: 8 + Math.random() * 9, t: 0, dur: .8 + Math.random() * .5 }); }
        if (pulso && pulso.it === it) pulso.t = Math.max(pulso.t, pulso.dur * .85);
        return;
      }
      if (it.remendo) gA.drawImage(it.remendo.p, it.remendo.x0 / Q, it.remendo.y0 / Q, it.remendo.p.width / Q, it.remendo.p.height / Q);
      const r = it.raio * (it.escala || 1);
      efeitos.push({ tipo: 'voo', x: it.x, y: it.y, r, sp: sprite(it), t: 0, dur: 1.4 });
      for (let k = 0; k < 2; k++) efeitos.push({ tipo: 'anel', x: it.x, y: it.y, r: Math.max(r, 30), t: -k * .18, dur: 1.1 });
      for (let i = 0; i < 22; i++) { const a = Math.random() * 6.3, v = (200 + Math.random() * 300) * Math.max(.6, r / 40); efeitos.push({ tipo: 'faisca', x: it.x, y: it.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 250, s: 8 + Math.random() * 10, t: 0, dur: .8 + Math.random() * .5 }); }
      if (pulso && pulso.it === it) pulso.t = Math.max(pulso.t, pulso.dur * .85);
    },
    dica(it) {
      const r = 150 + it.raio, a = Math.random() * 6.3, dd = Math.random() * r * .5;
      pulso = { x: it.x + Math.cos(a) * dd, y: it.y + Math.sin(a) * dd, r, t: 0, dur: 5.5, it };
      const nz = Math.max(A.z, capa() * 1.8); A.z = lim(nz, zmin(), zmax()); A.ox = W / 2 - pulso.x * A.z; A.oy = (H - alturaLista()) / 2 - pulso.y * A.z; prender();
      return false;
    },
    ondeEsta(it) { return [it.x * V.z + V.ox, it.y * V.z + V.oy]; },
    fotografar() {
      for (const it of itens) {
        const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = it.raio;
        g.translate(64, 64); g.scale(52 / r, 52 / r); g.rotate(it.giroIcone || 0); (it.icone2d || it.desenho)(g); it.icone = c.toDataURL();
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2a1f17'; g.fillRect(0, 0, 128, 128); it.silhueta = c.toDataURL();
      }
    },
    reiniciar() {
      for (const it of itens) if (!it.animado && it.remendo) { gA.drawImage(it.remendo.p, it.remendo.x0 / Q, it.remendo.y0 / Q, it.remendo.p.width / Q, it.remendo.p.height / Q); if (!nivel.noir) pintarItem(it); }
      efeitos.length = 0; pulso = null; inicio();
    },
    liberar() { for (const c of [cA, cB]) { c.width = c.height = 1; } for (const it of itens) it.remendo = null; },
    focar(x, y, z) { A.z = lim(z, zmin(), zmax()); A.ox = W / 2 - x * A.z; A.oy = H / 2 - y * A.z; prender(); },
    V, A
  };
}

/* gravura noir: cinza com contraste, hachuras cruzadas nas sombras e grão de filme */
function gravura(c, transparente) {
  const g = c.getContext('2d'), w = c.width, h = c.height, im = g.getImageData(0, 0, w, h), d = im.data, p = 6;
  let semente = 99; const ale = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    if (transparente && d[i + 3] === 0) continue;
    let l = (.3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]) / 255;
    l = Math.min(1, Math.max(0, (l - .5) * 1.45 + .52));
    if (l < .72 && (x + y) % p === 0) l *= .55;
    if (l < .48 && (x - y + 99999) % p === 0) l *= .5;
    if (l < .26 && x % 4 === 0) l *= .55;
    l += (ale() - .5) * .07;
    const v = Math.max(0, Math.min(255, l * 255));
    d[i] = v; d[i + 1] = v * .985; d[i + 2] = v * .96;
  }
  g.putImageData(im, 0, 0);
}

/* ======================================================================
   JOGO (comum aos dois tipos)
   ====================================================================== */
let ultimoInter = null, erroPendente = null, inercia = null;
const vibrar = p => { if (MOVEL && navigator.vibrate) try { navigator.vibrate(p); } catch { } };
addEventListener('gesturestart', e => e.preventDefault());
const J = { estado: 'abertura', n: 0, tempo: 0, pontos: 0, moedas: 0, combo: 0, ultimoAchado: -99, erros: [], embacadoAte: 0, embacadas: 0, dicas: 0, carga: 1, alvo: null, modo: ficha.modo in MODOS ? ficha.modo : 'nome' };
const criados = {};
let vista = null, itens = [];
function carregar(n) {
  if (!criados[n]) {
    const nivel = NIVEIS[n].criar();
    const v = nivel.tipo === '2d' ? criarVista2D(nivel) : criarVista3D(nivel);
    v.fotografar(); criados[n] = v;
  }
  for (const k of Object.keys(criados)) if (+k !== n && criados[k].tipo === '2d') { criados[k].liberar(); delete criados[k]; }
  vista = criados[n]; itens = vista.itens; J.n = n; vista.ativar(); ajustarTela(); Som.ambiente(NIVEIS[n].som);
}
function ajustarTela() { if (vista) vista.ajustar(); document.documentElement.style.setProperty('--alturaLista', (alturaLista() || 96) + 'px'); }
addEventListener('resize', ajustarTela);

/* ---------- lista ---------- */
const modoAtual = () => (vista && vista.nivel.modo) || J.modo;
function montarLista() {
  const L = $('lista'); L.innerHTML = ''; const modo = modoAtual();
  for (const it of itens) {
    const b = document.createElement('button'); b.className = 'item' + (it.achado ? ' achado' : '') + (J.alvo === it ? ' alvo' : ''); b.setAttribute('role', 'listitem');
    if (it.achado) b.innerHTML = `<img src="${it.icone}" alt=""><span class="nome" style="position:absolute;bottom:4px;left:0;right:0;font-size:11px">${it.nome}</span>`;
    else if (modo === 'silhueta' && it.silhueta) b.innerHTML = `<img class="sil" src="${it.silhueta}" alt="Silhueta de um objeto">`;
    else if (modo === 'charada') b.innerHTML = `<span class="charada">${it.charada}</span>`;
    else b.innerHTML = `<span class="nome">${it.nome}</span>`;
    b.title = it.achado ? it.nome + ' (achado)' : modo === 'nome' ? it.nome : 'Toque para a lupa procurar este';
    b.setAttribute('aria-label', it.achado ? it.nome + ', achado' : modo === 'nome' ? it.nome : modo === 'charada' ? it.charada : 'silhueta de objeto');
    b.onclick = () => { if (it.achado) return; J.alvo = J.alvo === it ? null : it; Som.clique(); montarLista(); };
    it.el = b; L.appendChild(b);
  }
  const fixo = !!vista.nivel.modo; $('nomeModo').textContent = fixo ? 'Só ' + MODOS[modo][0].toLowerCase() : MODOS[modo][0]; $('bModo').disabled = fixo; $('bModo').title = fixo ? 'Neste nível a lista é fixa' : 'Forma da lista';
  ajustarTela();
}
$('bModo').onclick = () => { const k = Object.keys(MODOS); J.modo = k[(k.indexOf(J.modo) + 1) % k.length]; ficha.modo = J.modo; guardar(); Som.clique(); montarLista(); faixa(`Lista em ${MODOS[J.modo][0].toLowerCase()} · pontos ×${MODOS[J.modo][1]}`); };

/* ---------- placar e avisos ---------- */
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function placar() { $('tempo').textContent = fmt(J.tempo); $('pontos').textContent = J.pontos; $('moedas').textContent = ficha.moedas; lupa(); }
function lupa() {
  const b = $('bLupa'), pronta = J.carga >= 1;
  $('carga').style.strokeDashoffset = 182.2 * (1 - Math.min(1, J.carga));
  b.classList.toggle('pronta', pronta);
  $('precoLupa').textContent = pronta ? '' : ficha.moedas >= PRECO_LUPA ? PRECO_LUPA + ' moedas' : '';
}
function faixa(t) { const d = document.createElement('div'); d.className = 'faixa'; d.innerHTML = t; $('avisos').appendChild(d); setTimeout(() => d.remove(), 3300); }
function ganho(x, y, t, sub) { const d = document.createElement('div'); d.className = 'ganho'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); $('avisos').appendChild(d); setTimeout(() => d.remove(), 1500); }
const tremerLupa = () => { $('bLupa').classList.remove('tremendo'); void $('bLupa').offsetWidth; $('bLupa').classList.add('tremendo'); };

/* ---------- toque ---------- */
function tocar(x, y, toque) {
  if (J.estado !== 'jogando') return;
  if (performance.now() < J.embacadoAte) return tremerLupa();
  Som.iniciar();
  if (erroPendente && Math.hypot(x - erroPendente.x, y - erroPendente.y) < 40) {   // duplo toque: aproxima
    clearTimeout(erroPendente.t); erroPendente = null; vista.zoom(.5, x, y); return;
  }
  const r = vista.tocar(x, y, toque);
  if (r === 'abriu') { vibrar(10); ficha.stats.abriu++; if (ficha.stats.abriu >= 15) ganhar('curioso'); if (ultimoInter && ultimoInter.segredo && ultimoInter.aberto) ganhar('secreta'); guardar(); return; }
  if (r) return achar(r, x, y);
  if (erroPendente) { clearTimeout(erroPendente.t); errar(erroPendente.x, erroPendente.y); }
  erroPendente = { x, y, t: setTimeout(() => { erroPendente = null; errar(x, y); }, 280) };
}
function achar(it, x, y) {
  const agora = J.tempo; it.achado = true;
  J.combo = agora - J.ultimoAchado < 9 ? J.combo + 1 : 0; J.ultimoAchado = agora; J.erros = [];
  ficha.stats.achados++; if (J.combo >= 4) ganhar('sequencia');
  const base = Math.round((100 + J.combo * 40) * MODOS[modoAtual()][1]); J.pontos += base; ficha.moedas += 5; J.moedas += 5; guardar();
  vista.achou(it);
  if (J.alvo === it) J.alvo = null;
  ganho(x, y, '+' + base, J.combo ? `${it.nome} · sequência ×${J.combo + 1}` : it.nome);
  Som.achar(J.combo); Som.progresso(itens.filter(i => i.achado).length, itens.length); vibrar(18); montarLista(); it.el.classList.add('brilha'); it.el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  placar();
  if (ficha.moedas >= 300) ganhar('poupador');
  if (itens.every(i => i.achado)) setTimeout(terminar, 1900); else salvarJogo();
}
function errar(x, y) {
  const d = document.createElement('div'); d.className = 'erro'; d.style.left = x + 'px'; d.style.top = y + 'px'; $('avisos').appendChild(d); setTimeout(() => d.remove(), 520);
  Som.errar(); J.combo = 0;
  const agora = performance.now(); J.erros = J.erros.filter(t => agora - t < 6000); J.erros.push(agora);
  if (J.erros.length >= 4) {   // anti-chute
    J.erros = []; J.embacadoAte = agora + 3500; J.embacadas++; J.tempo += 10; J.pontos = Math.max(0, J.pontos - 50);
    $('embaco').classList.add('ver'); Som.embacar(); vibrar([40, 60, 40]); setTimeout(() => $('embaco').classList.remove('ver'), 3500);
    ganho(innerWidth / 2, innerHeight * .62, '−50 pontos', '+10 segundos no relógio'); placar();
  }
}

/* ---------- lupa de dica ---------- */
$('bLupa').onclick = () => {
  if (J.estado !== 'jogando') return; Som.iniciar();
  const faltam = itens.filter(i => !i.achado); if (!faltam.length) return;
  if (J.carga >= 1) J.carga = 0;
  else if (ficha.moedas >= PRECO_LUPA) { ficha.moedas -= PRECO_LUPA; guardar(); faixa(`Lupa usada antes da hora: −${PRECO_LUPA} moedas`); }
  else { tremerLupa(); faixa(`A lupa está recarregando… ou junte ${PRECO_LUPA} moedas`); return; }
  J.dicas++; ficha.stats.dicas++;
  const it = J.alvo && !J.alvo.achado ? J.alvo : faltam[Math.random() * faltam.length | 0];
  const guardado = vista.dica(it);
  if (it.el) { it.el.classList.remove('dica'); void it.el.offsetWidth; it.el.classList.add('dica'); }
  Som.dica(); placar();
  if (guardado) setTimeout(() => faixa('Está guardado… tente abrir alguma coisa por perto'), 600);
};

/* ---------- gestos (valem para as duas telas) ---------- */
let p0vel = { vx: 0, vy: 0, t: 0 };
const dedos = new Map(); let arrastou = false, t0 = 0, pinca = null, ultimoMov = 0;
function gestos(el) {
  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, botao: e.button, shift: e.shiftKey || e.ctrlKey });
    if (dedos.size === 1) { arrastou = false; t0 = performance.now(); inercia = null; p0vel = { vx: 0, vy: 0, t: performance.now() }; }
    if (dedos.size === 2) { arrastou = true; const [a, b] = [...dedos.values()]; pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cache: {} }; }
  });
  el.addEventListener('pointermove', e => {
    const p = dedos.get(e.pointerId);
    if (!p) { if (e.pointerType === 'mouse' && J.estado === 'jogando' && performance.now() - ultimoMov > 90) { ultimoMov = performance.now(); el.classList.toggle('mao', vista.hover(e.clientX, e.clientY)); } return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (dedos.size === 1) { const agora = performance.now(), dtm = Math.max(8, agora - p0vel.t) / 1000; p0vel.vx = p0vel.vx * .5 + dx / dtm * .5; p0vel.vy = p0vel.vy * .5 + dy / dtm * .5; p0vel.t = agora; p0vel.pan = p.botao === 2 || p.botao === 1 || p.shift; }
    if (Math.hypot(p.x - p.x0, p.y - p.y0) > (e.pointerType === 'touch' ? 10 : 5)) arrastou = true;
    if (!arrastou || J.estado !== 'jogando') return;
    el.classList.add('arrastando');
    if (dedos.size === 1) { if (p.botao === 2 || p.botao === 1 || p.shift) vista.arrastar(dx, dy); else vista.orbitar(dx, dy); }
    else if (dedos.size === 2 && pinca) {
      const [a, b] = [...dedos.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (d > 10) vista.zoom(pinca.d / d, mx, my, pinca.cache); vista.arrastar(mx - pinca.mx, my - pinca.my); pinca.d = d; pinca.mx = mx; pinca.my = my;
    }
  });
  const soltar = e => {
    const p = dedos.get(e.pointerId); if (!p) return; dedos.delete(e.pointerId);
    if (dedos.size < 2) pinca = null;
    if (!dedos.size && arrastou && J.estado === 'jogando' && performance.now() - p0vel.t < 80 && Math.hypot(p0vel.vx, p0vel.vy) > 250) inercia = { vx: p0vel.vx, vy: p0vel.vy, pan: p0vel.pan };
    if (!dedos.size) { el.classList.remove('arrastando'); if (!arrastou && performance.now() - t0 < 700 && e.type === 'pointerup' && p.botao === 0) tocar(e.clientX, e.clientY, e.pointerType !== 'mouse'); }
    if (dedos.size === 1) { const q = [...dedos.values()][0]; q.x0 = q.x; q.y0 = q.y; }
  };
  el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => { e.preventDefault(); if (J.estado !== 'jogando') return; vista.zoom(Math.exp(lim(e.deltaY * (e.deltaMode ? 30 : 1), -60, 60) * .0026), e.clientX, e.clientY); }, { passive: false });
}
gestos(canvas); gestos(canvas2);
const zoomCentro = f => vista.zoom(f, innerWidth / 2, (innerHeight - alturaLista()) / 2);
$('bMais').onclick = () => zoomCentro(.65); $('bMenos').onclick = () => zoomCentro(1.5); $('bCentro').onclick = () => vista.centro();
addEventListener('keydown', e => {
  if (J.estado !== 'jogando') return;
  const k = e.key.toLowerCase(), s = vista.tipo === '2d' ? -60 : 30;
  if (k === '+' || k === '=') zoomCentro(.8); else if (k === '-') zoomCentro(1.25); else if (k === '0') vista.centro();
  else if (k === 'arrowleft') vista.orbitar(-s, 0); else if (k === 'arrowright') vista.orbitar(s, 0); else if (k === 'arrowup') vista.orbitar(0, vista.tipo === '2d' ? -s : 25); else if (k === 'arrowdown') vista.orbitar(0, vista.tipo === '2d' ? s : -25);
  else if (k === 'h') $('bLupa').click(); else if (k === 'escape') $('bMenu').click(); else return;
  e.preventDefault();
});

/* ---------- mapa de casos, conquistas, salvamento ---------- */
const disponivel = i => !!NIVEIS[i].criar;
const PRECO_CASO = 120;
const ICONES = [
  '<rect x="7" y="5" width="10" height="7" rx=".5"/><path d="M12 3v2M8 21l2.5-9M16 21l-2.5-9M6 15h12"/>',
  '<path d="M3 12a9 9 0 0 1 18 0zM12 12v6.5a2 2 0 0 1-4 0"/>',
  '<rect x="3" y="4" width="18" height="16" rx="1"/><rect x="6" y="7" width="12" height="10"/><path d="m6 15 4-4 3 3 2-2 3 3"/>',
  '<path d="M2 16.5c4.5 2.3 15.5 2.3 20 0M5.5 15.5C5.5 10 7.5 6 12 6s6.5 4 6.5 9.5M6 12.5h12"/>',
  '<path d="M4 4.5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v14h-6a2 2 0 0 0-2 1 2 2 0 0 0-2-1H4zM12 5.5v14"/>',
  '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.8 1.8M9 3h6M12 3v2.5"/>'
];
const CORES_CASO = ['#7a5a3a', '#3a8aa0', '#7a2a2a', '#2a2a2a', '#3a4a2a', '#a8642a'];
const CONQUISTAS = [
  ['primeiro', 'Primeiro caso', 'Resolva qualquer caso.'],
  ['aguia', 'Olho de águia', 'Resolva um caso sem usar a lupa de dica.'],
  ['calmo', 'Mão firme', 'Resolva um caso sem a lupa embaçar.'],
  ['relampago', 'Relâmpago', 'Resolva um caso em menos de 3 minutos.'],
  ['sequencia', 'Faro afiado', 'Ache 5 objetos seguidos, um logo após o outro.'],
  ['tres', 'Caso perfeito', 'Ganhe 3 estrelas num caso.'],
  ['silhuetas', 'Leitor de sombras', 'Resolva um caso com a lista em silhuetas.'],
  ['charadas', 'Decifrador', 'Resolva um caso com a lista em charadas.'],
  ['noir', 'Detetive noir', 'Resolva o Caso Noir.'],
  ['secreta', 'Passagem secreta', 'Abra a estante secreta da biblioteca.'],
  ['curioso', 'Curioso', 'Abra 15 gavetas, portas, cortinas ou baús.'],
  ['poupador', 'Cofre cheio', 'Junte 300 moedas.'],
  ['todos', 'Arquivo completo', 'Resolva os 6 casos.'],
  ['mestre', 'Mestre detetive', 'Ganhe as 18 estrelas.']
];
const PATENTES = [[0, 'Aprendiz'], [3, 'Investigador'], [7, 'Inspetor'], [12, 'Detetive'], [18, 'Mestre detetive']];
ficha.conquistas = ficha.conquistas || {}; ficha.stats = Object.assign({ casos: 0, achados: 0, tempo: 0, dicas: 0, abriu: 0 }, ficha.stats || {}); ficha.abertos = ficha.abertos || [];
const totalEstrelas = () => Object.values(ficha.niveis).reduce((s, f) => s + (f.estrelas || 0), 0);
const patente = () => PATENTES.filter(([e]) => totalEstrelas() >= e).at(-1)[1];
const liberado = i => disponivel(i) && (i === 0 || !!ficha.niveis[i] || ficha.abertos.includes(i));
let novas = [];
function ganhar(id) {
  if (ficha.conquistas[id]) return;
  ficha.conquistas[id] = new Date().toISOString().slice(0, 10); guardar(); novas.push(id);
  const c = CONQUISTAS.find(c => c[0] === id), d = document.createElement('div'); d.className = 'trofeu';
  d.innerHTML = `${MEDALHA}<div><small>Conquista de detetive</small><b>${c[1]}</b><span>${c[2]}</span></div>`;
  $('trofeus').appendChild(d); setTimeout(() => d.remove(), 4200); Som.dica();
}
const MEDALHA = '<svg class="medalha" viewBox="0 0 40 40"><path d="M13 2h5l2 9-4 2zM27 2h-5l-2 9 4 2z" fill="#a8201a"/><circle cx="20" cy="25" r="12" fill="#e6b450" stroke="#8a5a10" stroke-width="2"/><path d="m20 18 2 4.3 4.7.6-3.4 3.2.9 4.6L20 28.5l-4.2 2.2.9-4.6-3.4-3.2 4.7-.6z" fill="#fff4cc"/></svg>';
// caso em andamento: salvo a cada objeto, a cada 5 s e ao sair
function salvarJogo() {
  if (J.estado !== 'jogando' && J.estado !== 'pausa') return;
  ficha.jogo = { n: J.n, achados: itens.filter(i => i.achado).map(i => i.id), tempo: Math.round(J.tempo), pontos: J.pontos, dicas: J.dicas, embacadas: J.embacadas, moedas: J.moedas,
    abertos: vista.tipo === '3d' ? vista.nivel.interativos.map((x, i) => x.aberto ? i : -1).filter(i => i >= 0) : [] };
  guardar();
}
function restaurarJogo(n) {
  const s = ficha.jogo; if (!s || s.n !== n) return false;
  Object.assign(J, { tempo: s.tempo, pontos: s.pontos, dicas: s.dicas, embacadas: s.embacadas, moedas: s.moedas });
  for (const it of itens) if (s.achados.includes(it.id)) { it.achado = true; vista.marcarAchado(it); }
  if (vista.tipo === '3d') (s.abertos || []).forEach(i => { const x = vista.nivel.interativos[i]; if (x) x.aberto = true; });
  return true;
}
addEventListener('visibilitychange', () => { if (document.hidden) salvarJogo(); });
addEventListener('pagehide', salvarJogo);

function montarAbertura() {
  const C = $('casos'); C.querySelectorAll('.caso').forEach(e => e.remove());
  NIVEIS.forEach((n, i) => {
    const f = ficha.niveis[i + 1], ok = liberado(i), emAndamento = ficha.jogo && ficha.jogo.n === i, b = document.createElement('div');
    b.className = 'caso' + (ok ? '' : ' trancado') + (f ? ' resolvido' : '') + (emAndamento ? ' andando' : '');
    b.style.setProperty('--giro', [-2.5, 1.8, -1.2, 2.2, -1.8, 1.4][i] + 'deg'); b.style.setProperty('--cor', CORES_CASO[i]);
    const estado = !disponivel(i) ? 'em breve' : !ok ? 'trancado' : emAndamento ? `em andamento · ${ficha.jogo.achados.length}/12` : f ? `resolvido · ${fmt(f.tempo)}` : 'novo caso';
    b.innerHTML = `<i class="tacha"></i><div class="foto"><span class="num">Caso ${i + 1}</span><svg viewBox="0 0 24 24">${ICONES[i]}</svg>${ok ? '' : '<svg class="cadeado" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'}</div>
      <b>${n.nome}</b><small>${n.estilo}</small><div class="est">${[0, 1, 2].map(k => `<span class="${f && k < f.estrelas ? 'on' : ''}">★</span>`).join('')}</div><em>${estado}</em>
      ${!ok && disponivel(i) ? `<button class="abrirCaso" ${ficha.moedas < PRECO_CASO ? 'disabled' : ''}>Abrir com ${PRECO_CASO} moedas</button>` : ''}`;
    if (ok) { b.tabIndex = 0; b.setAttribute('role', 'button'); b.onclick = () => jogarNivel(i); b.onkeydown = e => { if (e.key === 'Enter') jogarNivel(i); }; }
    const ab = b.querySelector('.abrirCaso'); if (ab) ab.onclick = e => { e.stopPropagation(); if (ficha.moedas < PRECO_CASO) return; ficha.moedas -= PRECO_CASO; ficha.abertos.push(i); guardar(); Som.dica(); montarAbertura(); };
    C.appendChild(b);
  });
  $('patente').textContent = patente(); $('totEstrelas').textContent = totalEstrelas(); $('totMoedas').textContent = ficha.moedas;
  $('nConq').textContent = `${Object.keys(ficha.conquistas).length}/${CONQUISTAS.length}`;
  const s = ficha.jogo;
  $('bJogar').textContent = J.estado === 'pausa' ? `Continuar: ${NIVEIS[J.n].nome}` : s ? `Continuar: ${NIVEIS[s.n].nome}` : totalEstrelas() ? 'Próximo caso' : 'Começar a investigação';
  requestAnimationFrame(barbantes);
}
function barbantes() { // barbante vermelho ligando os casos no quadro de cortiça
  const C = $('casos'), sv = $('barbantes'), base = C.getBoundingClientRect(), cs = [...C.querySelectorAll('.caso')];
  sv.setAttribute('viewBox', `0 0 ${base.width} ${C.scrollHeight}`); sv.style.height = C.scrollHeight + 'px';
  sv.innerHTML = cs.slice(0, -1).map((c, i) => { const a = c.querySelector('.tacha').getBoundingClientRect(), b = cs[i + 1].querySelector('.tacha').getBoundingClientRect(); const x1 = a.left + a.width / 2 - base.left, y1 = a.top + a.height / 2 - base.top + C.scrollTop, x2 = b.left + b.width / 2 - base.left, y2 = b.top + b.height / 2 - base.top + C.scrollTop; return `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.max(y1, y2) + 30} ${x2} ${y2}" class="${liberado(i + 1) ? '' : 'apagado'}"/>`; }).join('');
}
addEventListener('resize', () => { if (!$('abertura').hidden) barbantes(); });
function montarConquistas() {
  const st = ficha.stats;
  $('listaConq').innerHTML = CONQUISTAS.map(([id, nome, d]) => { const q = ficha.conquistas[id]; return `<li class="${q ? 'ganha' : ''}">${MEDALHA}<div><b>${nome}</b><span>${d}</span>${q ? `<small>ganha em ${q.split('-').reverse().join('/')}</small>` : ''}</div></li>`; }).join('');
  $('estat').innerHTML = `<dt>Patente</dt><dd>${patente()}</dd><dt>Casos resolvidos</dt><dd>${st.casos}</dd><dt>Objetos achados</dt><dd>${st.achados}</dd><dt>Tempo investigando</dt><dd>${fmt(st.tempo)}</dd><dt>Lupas usadas</dt><dd>${st.dicas}</dd><dt>Coisas abertas</dt><dd>${st.abriu}</dd>`;
}
$('bConquistas').onclick = () => { montarConquistas(); $('conquistas').hidden = false; Som.clique(); };
$('bComo').onclick = () => { $('como').hidden = false; Som.clique(); };
document.querySelectorAll('.fechar').forEach(b => b.onclick = () => { b.closest('section').hidden = true; });
function proximoNivel() { const i = NIVEIS.findIndex((n, k) => liberado(k) && !ficha.niveis[k + 1]); return i < 0 ? 0 : i; }
let escolhido = null;
function mostrar(sim) { ['topo', 'lateral', 'bLupa', 'lista'].forEach(id => $(id).hidden = !sim); }
function preparando(f) { // cenários 2D levam um instante para pintar
  if (criados[J.proxima] || J.proxima == null) return f();
  $('carregando').hidden = false; requestAnimationFrame(() => setTimeout(() => { f(); $('carregando').hidden = true; }, 30));
}
function jogarNivel(n) {
  Som.iniciar();
  if (!liberado(n)) return;
  if (J.estado === 'pausa' && n === J.n) return comecar();
  if (J.estado === 'pausa') salvarJogo();
  J.proxima = n;
  preparando(() => { if (vista) zerar(); carregar(n); zerar(); const volta = restaurarJogo(n); comecar(!volta); if (volta) faixa(`Caso retomado: ${itens.filter(i => i.achado).length} de ${itens.length} já achados`); });
}
function comecar(novo) {
  Som.iniciar(); $('abertura').classList.add('some'); setTimeout(() => $('abertura').hidden = true, 600);
  mostrar(true);
  if (novo) faixa(`${NIVEIS[J.n].nome}: ache os ${itens.length} objetos · ${vista.tipo === '3d' ? 'arraste para girar' : 'arraste para andar'} · aproxime para olhar de perto`);
  J.estado = 'jogando'; Som.progresso(itens.filter(i => i.achado).length, itens.length); montarLista(); placar(); salvarJogo();
}
function zerar() {
  for (const it of itens) it.achado = false;
  if (vista) vista.reiniciar();
  Object.assign(J, { tempo: 0, pontos: 0, moedas: 0, combo: 0, ultimoAchado: -99, erros: [], embacadoAte: 0, embacadas: 0, dicas: 0, carga: 1, alvo: null });
}
function terminar() {
  J.estado = 'fim'; Som.vitoria(); novas = [];
  const estrelas = 1 + (J.tempo < 600 && J.dicas <= 3 ? 1 : 0) + (J.tempo < 300 && J.dicas <= 1 && J.embacadas === 0 ? 1 : 0);
  const bonusTempo = Math.max(0, Math.round((600 - J.tempo) * 2)); J.pontos += bonusTempo;
  const moedasFim = 10 * estrelas; ficha.moedas += moedasFim; J.moedas += moedasFim;
  const k = J.n + 1, ant = ficha.niveis[k], recorde = !ant || J.pontos > ant.pontos, abriuProximo = !ant && J.n + 1 < NIVEIS.length && disponivel(J.n + 1) && !liberado(J.n + 1);
  ficha.niveis[k] = { estrelas: Math.max(estrelas, ant?.estrelas || 0), pontos: Math.max(J.pontos, ant?.pontos || 0), tempo: Math.min(J.tempo, ant?.tempo ?? 1e9) };
  ficha.stats.casos++; ficha.stats.tempo += J.tempo; delete ficha.jogo; guardar();
  const modo = modoAtual();
  ganhar('primeiro'); if (!J.dicas) ganhar('aguia'); if (!J.embacadas) ganhar('calmo'); if (J.tempo < 180) ganhar('relampago'); if (estrelas === 3) ganhar('tres');
  if (modo === 'silhueta') ganhar('silhuetas'); if (modo === 'charada') ganhar('charadas'); if (J.n === 3) ganhar('noir');
  if (NIVEIS.every((x, i) => ficha.niveis[i + 1])) ganhar('todos'); if (totalEstrelas() >= 18) ganhar('mestre'); if (ficha.moedas >= 300) ganhar('poupador');
  $('fimTitulo').textContent = NIVEIS[J.n].nome;
  $('estrelas').innerHTML = [0, 1, 2].map(i => `<span class="${i < estrelas ? 'on' : ''}" style="animation-delay:${.3 + i * .25}s">★</span>`).join('');
  $('resumo').innerHTML = `<dt>Tempo</dt><dd>${fmt(J.tempo)}</dd><dt>Bônus de rapidez</dt><dd>+${bonusTempo}</dd><dt>Pontos</dt><dd>${J.pontos}${recorde ? ' ✦' : ''}</dd><dt>Lupas usadas</dt><dd>${J.dicas}</dd><dt>Lupa embaçou</dt><dd>${J.embacadas}×</dd><dt>Moedas ganhas</dt><dd>+${J.moedas}</dd><dt>Patente</dt><dd>${patente()}</dd>`;
  $('novasConq').innerHTML = (abriuProximo ? `<p class="aviso">Novo caso liberado: <b>${NIVEIS[J.n + 1].nome}</b></p>` : '') + novas.map(id => { const c = CONQUISTAS.find(c => c[0] === id); return `<span class="selo2">${MEDALHA}${c[1]}</span>`; }).join('');
  const prox = J.n + 1 < NIVEIS.length && liberado(J.n + 1);
  $('bProximo').hidden = !prox; if (prox) $('bProximo').textContent = `Próximo: ${NIVEIS[J.n + 1].nome}`;
  ['lateral', 'bLupa', 'lista'].forEach(id => $(id).hidden = true);
  $('fim').hidden = false; placar();
}
function voltarInicio() {
  zerar(); J.estado = 'abertura'; mostrar(false);
  carregar(0); escolhido = null; montarAbertura(); $('abertura').hidden = false; requestAnimationFrame(() => $('abertura').classList.remove('some'));
}
$('bJogar').onclick = () => J.estado === 'pausa' ? comecar() : jogarNivel(ficha.jogo && liberado(ficha.jogo.n) ? ficha.jogo.n : proximoNivel());
$('bDeNovo').onclick = () => { $('fim').hidden = true; zerar(); comecar(true); };
$('bProximo').onclick = () => { $('fim').hidden = true; J.estado = 'abertura'; jogarNivel(J.n + 1); };
$('bInicio').onclick = () => { $('fim').hidden = true; voltarInicio(); };
$('bMenu').onclick = () => { J.estado = 'pausa'; salvarJogo(); ['lateral', 'bLupa', 'lista'].forEach(id => $(id).hidden = true); escolhido = J.n; montarAbertura(); $('abertura').hidden = false; requestAnimationFrame(() => $('abertura').classList.remove('some')); };
$('bSom').onclick = () => { const v = Som.alternar(); ficha.som = v; guardar(); $('bSom').dataset.v = v ? 1 : 0; };
Som.ligado = ficha.som !== false; $('bSom').dataset.v = Som.ligado ? 1 : 0;

/* ---------- laço ---------- */
let antes = performance.now(), relogioHud = 0, tempo = 0;
function quadro(agora) {
  requestAnimationFrame(quadro);
  const dt = Math.min(.05, (agora - antes) / 1000); antes = agora; tempo += dt;
  if (J.estado === 'jogando') {
    const t5 = Math.floor(J.tempo / 5); J.tempo += dt; if (Math.floor(J.tempo / 5) !== t5) salvarJogo(); if (J.carga < 1) J.carga = Math.min(1, J.carga + dt / RECARGA);
    relogioHud += dt; if (relogioHud > .25) { relogioHud = 0; placar(); }
  }
  if (inercia && J.estado === 'jogando') {   // o arrasto continua um pouco depois de soltar
    const k = vista.tipo === '3d' ? .6 : 1; if (inercia.pan || vista.tipo === '2d') vista.arrastar(inercia.vx * dt * k, inercia.vy * dt * k); else vista.orbitar(inercia.vx * dt * k, inercia.vy * dt * k);
    const f = Math.exp(-dt * 5.5); inercia.vx *= f; inercia.vy *= f; if (Math.hypot(inercia.vx, inercia.vy) < 20) inercia = null;
  }
  vista.passo(dt, tempo, J.estado);
}
carregar(0); montarAbertura(); requestAnimationFrame(quadro);

// para os testes automáticos
window.__keenlight = { THREE, R, cena, camera, J, tocar, ficha, Som, jogarNivel, criados, salvarJogo, montarAbertura, ganhar,
  get vista() { return vista; }, get itens() { return itens; },
  ondeEsta(id) { return vista.ondeEsta(itens.find(i => i.id === id)); } };
