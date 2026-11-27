'use strict';
// Modo 3: Arremesso. Sem tabuleiro: o Rei Tico fica ao lado de um canhão de ouro; arraste para mirar (aparece a
// trajetória) e solte para atirar contra pilhas de latas, pedras, cristais e barris explosivos em plataformas (algumas se
// mexem). Física própria e leve: cada peça é uma esfera de colisão com giro; as pilhas ficam "dormindo" paradas até
// serem atingidas, e quem perde o apoio acorda e cai (desmoronamento em cadeia).
const Arremesso = (() => {
  const cena = new THREE.Scene(); cena.environment = ENV;
  const cam = new THREE.PerspectiveCamera(50, 1, .1, 300);
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  cena.add(new THREE.HemisphereLight(0xfff4e0, 0x5a8a4a, 1.15));
  { const s = new THREE.DirectionalLight(0xfff0d8, 2.3); s.position.set(5, 10, 6); cena.add(s); const c = new THREE.DirectionalLight(0xb0c8ff, .7); c.position.set(-6, 4, -8); cena.add(c); }
  // céu, chão e castelo ao fundo
  {
    const g = new THREE.SphereGeometry(150, 32, 16), cor = [], a = g.attributes.position, c = new THREE.Color(), cTop = new THREE.Color(0x4aa8ff), cHor = new THREE.Color(0xffe6c0);
    for (let i = 0; i < a.count; i++) { const k = clamp(a.getY(i) / 150, 0, 1); c.copy(cHor).lerp(cTop, Math.pow(k, .6)); cor.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    cena.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));
    const tg = texCanvas(128, 128, (x, w, h) => { x.fillStyle = '#6cc24a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '40,110,30' : '160,220,110'},.25)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 4); } });
    tg.wrapS = tg.wrapT = THREE.RepeatWrapping; tg.repeat.set(40, 40);
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(300, 300).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tg, roughness: .95 })); cena.add(chao);
    const caminho = new THREE.Mesh(new THREE.PlaneGeometry(3, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8d2a0, roughness: .9 })); caminho.position.set(0, .01, -5); cena.add(caminho);
    const mT = new THREE.MeshStandardMaterial({ color: 0xc8b8e8, roughness: .8 }), mTe = new THREE.MeshStandardMaterial({ color: 0xe03050, roughness: .6 });
    for (const [x, z, h, r] of [[-14, -42, 9, 2.2], [-6, -46, 13, 2.6], [5, -45, 11, 2.4], [14, -40, 8, 2], [0, -50, 16, 3]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 16), mT); t.position.set(x, h / 2, z); cena.add(t);
      const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, r * 2, 16), mTe); c.position.set(x, h + r, z); cena.add(c);
    }
    const muro = new THREE.Mesh(new THREE.BoxGeometry(40, 5, 2), mT); muro.position.set(0, 2.5, -44); cena.add(muro);
    const mM = new THREE.MeshStandardMaterial({ color: 0x5aa83c, roughness: 1 });
    for (const [x, z, s] of [[-30, -60, 14], [26, -58, 12], [-8, -70, 16], [40, -70, 18], [-45, -50, 12]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 24, 12), mM); m.scale.y = .45; m.position.set(x, 0, z); cena.add(m); }
  }
  const G = new THREE.Group(); cena.add(G);
  const fx = new Particulas(cena, 1600, TEX_PONTO), fxC = new Particulas(cena, 800, TEX_CACO, false), fxB = new Particulas(cena, 300, TEX_BRILHO);

  // ---------- canhão, rei e prateleira de bolas ----------
  const canhao = new THREE.Group(); canhao.position.set(0, .0, -2.3); cena.add(canhao);
  const mMad = new THREE.MeshStandardMaterial({ map: TEX_CAIXA[0], roughness: .8 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(.9, .45, 1.1), mMad); base.position.y = .45; canhao.add(base);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .12, 20).rotateZ(Math.PI / 2), mMad); r.position.set(s * .5, .34, 0); canhao.add(r); const e = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .14, 10).rotateZ(Math.PI / 2), MAT.ouro); e.position.copy(r.position); canhao.add(e); }
  const giro = new THREE.Group(); giro.position.y = .8; canhao.add(giro);
  const tubo = new THREE.Group(); giro.add(tubo);
  const cano = new THREE.Mesh(new THREE.CylinderGeometry(.19, .27, 1.2, 24).rotateX(-Math.PI / 2), MAT.ouro); cano.position.z = -.35; tubo.add(cano);
  for (const z of [-.05, -.55, -.92]) { const a = new THREE.Mesh(new THREE.TorusGeometry(z < -.9 ? .22 : .27, .045, 10, 28), MAT.ouroEsc); a.position.z = z; tubo.add(a); }
  const fundoC = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 12), MAT.ouro); fundoC.position.z = .25; tubo.add(fundoC);
  const prateleira = new THREE.Group(); prateleira.position.set(.9, 0, -2.2); cena.add(prateleira);
  { const p = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, 1.6), mMad); p.position.set(0, .25, -.4); prateleira.add(p); }

  // ---------- peças ----------
  const texLata = cores => texCanvas(128, 64, (x, w, h) => {
    x.fillStyle = cores[0]; x.fillRect(0, 0, w, h); x.fillStyle = cores[1]; x.fillRect(0, h * .3, w, h * .4);
    x.fillStyle = cores[2]; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(16 + i * 32, h / 2, 7, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 4, w, 3); x.fillRect(0, h - 7, w, 3);
  });
  const MAT_LATA = [['#e8203c', '#ffd34d', '#fff'], ['#2a6bff', '#fff', '#ffd34d'], ['#18b860', '#ffd34d', '#fff'], ['#a64dff', '#ffd0f0', '#ffd34d']].map(c => [new THREE.MeshStandardMaterial({ map: texLata(c), metalness: .55, roughness: .3, envMapIntensity: 1.3 }), MAT.prata, MAT.prata]);
  const texPedra = texCanvas(64, 64, (x, w, h) => { x.fillStyle = '#9c96a8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '40,30,60'},.12)`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); } x.strokeStyle = '#6a6478'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, w - 3, h - 3); });
  const MAT_PEDRA = new THREE.MeshStandardMaterial({ map: texPedra, roughness: .9 });
  const MAT_CRISTAL = [0xb06bff, 0x4fd8ff, 0xff6fb8].map(c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .05, clearcoat: 1, flatShading: true, emissive: c, emissiveIntensity: .35, transparent: true, opacity: .9, envMapIntensity: 2 }));
  const texBarril = texCanvas(128, 64, (x, w, h) => { x.fillStyle = '#d42020'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd34d'; for (let i = -1; i < 9; i++) { x.beginPath(); x.moveTo(i * 16, h * .35); x.lineTo(i * 16 + 8, h * .35); x.lineTo(i * 16 + 16, h * .65); x.lineTo(i * 16 + 8, h * .65); x.fill(); } x.fillStyle = '#222'; x.fillRect(0, h * .32, w, 2); x.fillRect(0, h * .66, w, 2); });
  const MAT_BARRIL = [new THREE.MeshStandardMaterial({ map: texBarril, roughness: .5, emissive: 0x400000, emissiveIntensity: .5 }), MAT.ouroEsc, MAT.ouroEsc];
  const TIPOS = {
    lata: { r: .27, h: .62, w: .52, m: .5, alvo: true, geo: new THREE.CylinderGeometry(.26, .26, .62, 22) },
    pedra: { r: .3, h: .5, w: .7, m: 4, geo: new THREE.BoxGeometry(.7, .5, .5) },
    cristal: { r: .28, h: .72, w: .5, m: .7, alvo: true, geo: (() => { const g = new THREE.OctahedronGeometry(.33, 0); g.scale(.85, 1.1, .85); return g; })() },
    barril: { r: .33, h: .74, w: .62, m: 1.6, geo: new THREE.CylinderGeometry(.31, .31, .74, 20) },
  };
  function meshPeca(t) {
    if (t === 'lata') return new THREE.Mesh(TIPOS.lata.geo, pega(MAT_LATA));
    if (t === 'pedra') return new THREE.Mesh(TIPOS.pedra.geo, MAT_PEDRA);
    if (t === 'cristal') return new THREE.Mesh(TIPOS.cristal.geo, pega(MAT_CRISTAL));
    return new THREE.Mesh(TIPOS.barril.geo, MAT_BARRIL);
  }
  const BOLAS = {
    bola: { r: .3, m: 8, mat: new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 1, roughness: .3, envMapIntensity: 1.4 }), nome: 'Bola de ferro' },
    fogo: { r: .3, m: 4, mat: new THREE.MeshStandardMaterial({ color: 0xff6a00, emissive: 0xff5a00, emissiveIntensity: 1.6, roughness: .5 }), nome: 'Bola de fogo' },
    bomba: { r: .32, m: 4, mat: new THREE.MeshStandardMaterial({ color: 0x1a1a24, metalness: .4, roughness: .35 }), nome: 'Bomba' },
  };
  const geoBola = new THREE.SphereGeometry(1, 24, 16);
  function meshBola(t) {
    const g = new THREE.Group(), b = BOLAS[t], m = new THREE.Mesh(geoBola, b.mat); m.scale.setScalar(b.r); g.add(m);
    if (t === 'bomba') { const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .18, 8), MAT.escuro); p.position.y = b.r + .06; g.add(p); const f = new THREE.Mesh(GEO.faisca, MAT.faisca); f.position.y = b.r + .17; g.add(f); g.userData.faisca = f; }
    if (t === 'bola') { const a = new THREE.Mesh(new THREE.TorusGeometry(b.r * 1.0, .025, 8, 32), MAT.ouro); g.add(a); }
    return g;
  }

  // ---------- estado ----------
  const st = { ativo: false, plats: [], corpos: [], bolas: [], fila: [], carregada: null, mira: null, mirando: false, voando: false, vooT: 0, derrubados: 0, t: 0, alvoTotal: 0, explosoes: [], prontoT: 0 };
  const pontos = new THREE.InstancedMesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: .85 }), 26);
  pontos.count = 0; pontos.frustumCulled = false; cena.add(pontos);
  const anelMira = new THREE.Mesh(new THREE.RingGeometry(.22, .3, 32), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: .9, side: THREE.DoubleSide, depthTest: false, toneMapped: false }));
  anelMira.visible = false; anelMira.renderOrder = 30; cena.add(anelMira);
  const dummy = new THREE.Object3D(), GRAV = 14;
  const boca = () => tubo.localToWorld(V(0, 0, -1.0));

  function limpar() { for (const o of [...G.children]) G.remove(o); for (const b of st.bolas) cena.remove(b.mesh); for (const o of [...prateleira.children].slice(1)) prateleira.remove(o); st.plats = []; st.corpos = []; st.bolas = []; st.explosoes = []; }
  function carregar(nv) {
    limpar(); st.ativo = true; st.voando = false; st.mirando = false; st.derrubados = 0; st.fila = [...nv.bolas]; st.t = 0;
    for (const p of nv.plataformas) {
      const P = { x0: p.x, x: p.x, y: p.y, z: p.z, w: p.w, d: p.d, h: .4, amp: p.mov ? p.mov[0] : 0, vel: p.mov ? p.mov[1] : 0, fase: Math.random() * 6, vx: 0 };
      const g = new THREE.Group(); P.mesh = g; G.add(g);
      const topo = new THREE.Mesh(new THREE.BoxGeometry(p.w, .4, p.d), new THREE.MeshStandardMaterial({ color: 0x2f4fd8, roughness: .5, metalness: .2 })); topo.position.y = -.2; g.add(topo);
      for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(p.w + .08, .1, .1), MAT.ouro); b.position.set(0, -.04, s * p.d / 2); g.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, p.d + .08), MAT.ouro); c.position.set(s * p.w / 2, -.04, 0); g.add(c); }
      if (!p.mov) { const col = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, p.y - .4, 12), MAT_PEDRA); col.position.y = -.4 - (p.y - .4) / 2; g.add(col); }
      else { const a = new THREE.Mesh(new THREE.TorusGeometry(Math.min(p.w, p.d) * .4, .06, 8, 32), new THREE.MeshBasicMaterial({ color: 0x7fe0ff, toneMapped: false })); a.rotation.x = Math.PI / 2; a.position.y = -.5; g.add(a); P.aro = a; }
      g.position.set(p.x, p.y, p.z); st.plats.push(P);
    }
    for (const pl of nv.pilhas) {
      const P = st.plats[pl.p]; let y = P.y, ant = [];
      for (const linha of pl.linhas) {
        const hRow = Math.max(...linha.map(([t]) => TIPOS[t].h)), atual = [];
        for (const [t, dx] of linha) {
          const T0 = TIPOS[t], m = meshPeca(t), x = P.x + (pl.x || 0) + dx, z = P.z + (pl.z || 0), cy = y + T0.h / 2;
          const c = { tipo: t, r: T0.r, m: T0.m, alvo: !!T0.alvo, mesh: m, p: V(x, cy, z), v: V(), w: V(), dorme: true, plat: P, local: V(x - P.x, cy - P.y, z - P.z), suportes: [], repouso: V(x, cy, z), platY: P.y, caiu: false, morto: false, calmo: 0, sumir: 0, dx };
          c.suportes = ant.filter(o => Math.abs((o.dx) - dx) < (TIPOS[o.tipo].w + T0.w) / 2 * .92);
          m.position.copy(c.p); m.rotation.y = rnd(-.3, .3); G.add(m); st.corpos.push(c); atual.push(c);
        }
        y += hRow; ant = atual;
      }
    }
    st.alvoTotal = st.corpos.filter(c => c.alvo).length;
    const conta = { lata: st.corpos.filter(c => c.tipo === 'lata').length, cristal: st.corpos.filter(c => c.tipo === 'cristal').length };
    T.metas = ['lata', 'cristal'].filter(t => conta[t]).map(t => ({ t, n: conta[t], falta: conta[t] }));
    T.jogadas = T.jogadasIni = st.fila.length; T.pontos = 0; T.modo = 'arr';
    carregarBola(); montarPrateleira(); apontar(V(0, 2, -8));
  }
  function sair() { if (!st.ativo) return; st.ativo = false; limpar(); if (st.carregada) { tubo.remove(st.carregada.mesh); st.carregada = null; } pontos.count = 0; anelMira.visible = false; }
  function carregarBola() {
    if (st.carregada) tubo.remove(st.carregada.mesh); st.carregada = null;
    if (!st.fila.length) return;
    const t = st.fila[0], m = meshBola(t); m.position.z = -.75; m.scale.setScalar(.85); tubo.add(m); st.carregada = { tipo: t, mesh: m };
  }
  function montarPrateleira() { for (const o of [...prateleira.children].slice(1)) prateleira.remove(o); st.fila.slice(1).forEach((t, i) => { const m = meshBola(t); m.scale.setScalar(.7); m.position.set(0, .72, -1.0 + i * .5); prateleira.add(m); }); }
  function trajetoria(alvo) {
    const O = boca(), d = alvo.clone().sub(O), dist = d.length(), Tt = clamp(dist / 17, .32, .8);
    const v = d.divideScalar(Tt); v.y += .5 * GRAV * Tt; return { O, v, Tt };
  }
  function apontar(alvo) {
    st.mira = alvo; const { O, v, Tt } = trajetoria(alvo);
    const dir = alvo.clone().sub(canhao.position); giro.rotation.y = Math.atan2(-dir.x, -dir.z); tubo.rotation.x = clamp(Math.atan2(v.y, Math.hypot(v.x, v.z)), -.2, 1.1);
    if (st.mirando) {
      let n = 0; for (let i = 1; i <= 26; i++) { const t = i / 26 * Tt * 1.05; dummy.position.set(O.x + v.x * t, O.y + v.y * t - .5 * GRAV * t * t, O.z + v.z * t); dummy.scale.setScalar(1 - i / 40); dummy.updateMatrix(); pontos.setMatrixAt(n++, dummy.matrix); }
      pontos.count = n; pontos.instanceMatrix.needsUpdate = true; anelMira.visible = true; anelMira.position.copy(alvo); anelMira.lookAt(cam.position);
    } else { pontos.count = 0; anelMira.visible = false; }
  }
  const ray = new THREE.Raycaster(), plano = new THREE.Plane(V(0, 0, 1), 8.5), tmp = V();
  function pontoNaTela(cx, cy) {
    const r = L.tab; ray.setFromCamera({ x: (cx - r.x) / r.w * 2 - 1, y: -((cy - r.y) / r.h) * 2 + 1 }, cam);
    const hit = ray.intersectObjects(G.children, true)[0]; if (hit) return hit.point.clone();
    return ray.ray.intersectPlane(plano, tmp) ? tmp.clone() : null;
  }
  function atirar() {
    if (!st.carregada || !st.mira) return;
    const t = st.carregada.tipo, { O, v } = trajetoria(st.mira), B = BOLAS[t];
    tubo.remove(st.carregada.mesh); st.carregada = null; st.fila.shift();
    const m = meshBola(t); m.position.copy(O); cena.add(m);
    st.bolas.push({ bola: true, tipo: t, r: B.r, m: B.m, mesh: m, p: O.clone(), v: v.clone(), w: V(rnd(-5, 5), 0, rnd(-5, 5)), morto: false, t: 0, calmo: 0 });
    T.jogadas--; HUD.jogadas(); Som.canhao(); st.voando = true; st.vooT = 0; st.derrubados = 0; T.ocupado = true; st.mirando = false; apontar(st.mira);
    Anim.add(.35, k => { tubo.position.z = Math.sin(k * Math.PI) * .25; }, Ease.out);
    for (let i = 0; i < 18; i++) fx.emitir(O.x, O.y, O.z, { vx: v.x * .08 + rnd(-1, 1), vy: v.y * .08 + rnd(-.5, 1), vz: v.z * .08 + rnd(-1, 1), tam: rnd(.3, .6), tamF: .1, vida: rnd(.3, .6), cor: pega([[1, .8, .4], [1, .95, .8], [.8, .8, .8]]) });
    Rei.reagir('aceno'); if (T.jogadas === 0) Rei.base('panico');
    setTimeout(() => { carregarBola(); montarPrateleira(); }, 450 / VEL.v);
  }

  // ---------- física ----------
  function acordar(c) { if (!c.dorme || c.morto) return; c.dorme = false; c.calmo = 0; c.v.set(c.plat ? c.plat.vx : 0, 0, 0); }
  function contarCaida(c) {
    if (c.caiu || !c.alvo) return; c.caiu = true; st.derrubados++; contar(c.tipo); T.pontos += 300; HUD.pontos();
    fxB.emitir(c.p.x, c.p.y, c.p.z, { tam: 1.1, vida: .35, cor: [1, .9, .5] });
  }
  function quebrarCristal(c) {
    if (c.morto) return; c.morto = true; G.remove(c.mesh); contarCaida(c); Som.cristal();
    const cor = corRGB(c.mesh.material.color.getHex());
    fxC.explosao(c.p.x, c.p.y, c.p.z, 18, { cor, tam: .22, tamF: .05, v0: 2, v1: 6, grav: 10, vida0: .5, vida1: 1 });
    fxB.emitir(c.p.x, c.p.y, c.p.z, { tam: 1.6, vida: .3, cor });
  }
  function explodir(pos, raio = 2.6) {
    Som.explosao(true); st.explosoes.push(.5);
    fx.explosao(pos.x, pos.y, pos.z, 60, { cor: [1, .6, .2], tam: .9, tamF: .2, v0: 2, v1: 9, vida0: .3, vida1: .8 });
    fx.explosao(pos.x, pos.y, pos.z, 25, { cor: [.5, .45, .45], tam: 1.2, tamF: .4, v0: .5, v1: 2.5, vida0: .8, vida1: 1.4, sobe: 1 });
    fxB.emitir(pos.x, pos.y, pos.z, { tam: 5, tamF: .5, vida: .4, cor: [1, .9, .7] });
    for (const c of st.corpos) {
      if (c.morto) continue; const d = c.p.distanceTo(pos); if (d > raio) continue;
      if (c.tipo === 'cristal' && d < raio * .7) { quebrarCristal(c); continue; }
      if (c.tipo === 'barril' && !c.explodindo) { c.explodindo = true; setTimeout(() => { if (!c.morto) { c.morto = true; G.remove(c.mesh); explodir(c.p.clone()); } }, 160 / VEL.v); continue; }
      acordar(c); const dir = c.p.clone().sub(pos); dir.y += .4; dir.normalize(); const f = 13 * (1 - d / raio) / Math.sqrt(c.m);
      c.v.addScaledVector(dir, f); c.w.set(rnd(-12, 12), rnd(-12, 12), rnd(-12, 12));
    }
  }
  function impacto(c, vel, outro) {
    if (c.bola) {
      if (c.tipo === 'bomba' && !c.morto) { c.morto = true; cena.remove(c.mesh); explodir(c.p.clone(), 2.4); return; }
      if (outro && !outro.bola && outro.tipo === 'barril' && (c.tipo === 'fogo' || vel > 6)) { detonar(outro); }
      if (outro && outro.tipo === 'cristal' && (c.tipo === 'fogo' || vel > 2.5)) quebrarCristal(outro);
      return;
    }
    if (vel > 1.5) { if (c.tipo === 'lata') Som.lata(vel); else if (c.tipo === 'pedra') Som.pancada(vel); }
    if (c.tipo === 'cristal' && vel > 4.5) quebrarCristal(c);
    if (c.tipo === 'barril' && vel > 7.5) detonar(c);
  }
  function detonar(c) { if (c.morto || c.explodindo) return; c.explodindo = true; c.morto = true; G.remove(c.mesh); explodir(c.p.clone()); }
  const dV = V(), nV = V(), cp = V();
  function colidirPlat(c, P) {
    cp.set(clamp(c.p.x, P.x - P.w / 2, P.x + P.w / 2), clamp(c.p.y, P.y - P.h, P.y), clamp(c.p.z, P.z - P.d / 2, P.z + P.d / 2));
    dV.copy(c.p).sub(cp); const dist = dV.length(); if (dist >= c.r) return;
    if (dist > 1e-5) nV.copy(dV).divideScalar(dist); else nV.set(0, 1, 0);
    c.p.addScaledVector(nV, c.r - dist);
    const vx = c.v.x - P.vx, vn = vx * nV.x + c.v.y * nV.y + c.v.z * nV.z;
    if (vn < 0) { impacto(c, -vn, null); c.v.addScaledVector(nV, -vn * 1.25); c.v.x = P.vx + (c.v.x - P.vx) * .985; c.v.z *= .985; if (nV.y > .7) { c.w.set(c.v.z / c.r * .5, c.w.y * .9, -(c.v.x - P.vx) / c.r * .5); } }
  }
  function par(a, b, bEstatico) {
    dV.copy(b.p).sub(a.p); const dist = dV.length(), rr = a.r + b.r; if (dist >= rr || dist < 1e-6) return;
    nV.copy(dV).divideScalar(dist); const pen = rr - dist;
    const vn = (b.v.x - a.v.x) * nV.x + (b.v.y - a.v.y) * nV.y + (b.v.z - a.v.z) * nV.z;
    if (bEstatico) {
      if (a.bola || -vn > 1.1) { acordar(b); bEstatico = false; }
      else { a.p.addScaledVector(nV, -pen); if (vn < 0) a.v.addScaledVector(nV, vn * 1.2); return; }
    }
    const ia = 1 / a.m, ib = 1 / b.m, s = pen / (ia + ib); a.p.addScaledVector(nV, -s * ia); b.p.addScaledVector(nV, s * ib);
    if (vn < 0) {
      const j = -(a.bola || b.bola ? 1.55 : 1.3) * vn / (ia + ib); a.v.addScaledVector(nV, -j * ia); b.v.addScaledVector(nV, j * ib);
      const forca = -vn; impacto(a, forca, b); impacto(b, forca, a);
      a.w.addScaledVector(V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)), forca * 2); b.w.addScaledVector(V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)), forca * 3);
    }
  }
  const qT = new THREE.Quaternion(), eixo = V();
  function passo(h) {
    for (const P of st.plats) { const x = P.amp ? P.x0 + Math.sin(st.t * P.vel + P.fase) * P.amp : P.x0; P.vx = (x - P.x) / Math.max(h, 1e-4); P.x = x; P.mesh.position.x = x; }
    const vivos = st.corpos.filter(c => !c.morto), acordados = vivos.filter(c => !c.dorme), dormindo = vivos.filter(c => c.dorme), bolas = st.bolas.filter(b => !b.morto);
    for (const c of dormindo) if (c.plat) c.p.set(c.plat.x + c.local.x, c.plat.y + c.local.y, c.plat.z + c.local.z);
    const mov = acordados.concat(bolas);
    for (const c of mov) { c.v.y -= GRAV * h; c.v.multiplyScalar(Math.exp(-.08 * h)); c.p.addScaledVector(c.v, h); }
    for (const c of mov) {
      if (c.p.y < c.r) { c.p.y = c.r; if (c.v.y < 0) { if (c.v.y < -1.5) impacto(c, -c.v.y, null); c.v.y *= -.3; } c.v.x *= .97; c.v.z *= .97; c.w.set(c.v.z / c.r, c.w.y * .95, -c.v.x / c.r); }
      for (const P of st.plats) colidirPlat(c, P);
    }
    for (let i = 0; i < mov.length; i++) { for (let j = i + 1; j < mov.length; j++) if (!mov[i].morto && !mov[j].morto) par(mov[i], mov[j]); for (const d of dormindo) if (!mov[i].morto && !d.morto && d.dorme) par(mov[i], d, true); }
    for (const c of mov) { const wl = c.w.length(); if (wl > 1e-3) { eixo.copy(c.w).divideScalar(wl); qT.setFromAxisAngle(eixo, wl * h); c.mesh.quaternion.premultiply(qT); } c.w.multiplyScalar(Math.exp(-1.2 * h)); c.mesh.position.copy(c.p); }
    for (const c of dormindo) c.mesh.position.copy(c.p);
  }
  function tickFisica(dt) {
    const n = 4, h = dt / n; for (let i = 0; i < n; i++) { st.t += h; passo(h); }
    for (const c of st.corpos) {
      if (c.morto) continue;
      if (c.dorme && c.suportes.some(s => s.morto || (!s.dorme && s.p.distanceTo(s.repouso) > .07))) acordar(c);
      if (!c.dorme) {
        if (c.p.y < c.platY - .75 || Math.abs(c.p.x) > 30) contarCaida(c);
        const rapido = c.v.length() > .3;
        c.calmo = rapido ? 0 : c.calmo + dt;
        if (c.calmo > .7) { // volta a dormir onde parou
          c.dorme = true; c.repouso.copy(c.p); c.v.set(0, 0, 0); c.w.set(0, 0, 0);
          const P = st.plats.find(P => Math.abs(c.p.x - P.x) < P.w / 2 + .05 && Math.abs(c.p.z - P.z) < P.d / 2 + .05 && c.p.y > P.y && c.p.y < P.y + 3);
          c.plat = P || null; if (P) c.local.set(c.p.x - P.x, c.p.y - P.y, c.p.z - P.z);
          c.suportes = st.corpos.filter(o => o !== c && !o.morto && o.p.y < c.p.y - .1 && o.p.distanceTo(c.p) < o.r + c.r + .08);
        }
        if (c.caiu && c.p.y < .5 && c.calmo > .3) { c.sumir += dt; if (c.sumir > 1.2) { c.morto = true; G.remove(c.mesh); } }
      }
    }
    for (const b of st.bolas) {
      if (b.morto) continue; b.t += dt;
      if (b.tipo === 'fogo') for (let i = 0; i < 3; i++) fx.emitir(b.p.x + rnd(-.1, .1), b.p.y + rnd(-.1, .1), b.p.z + rnd(-.1, .1), { vy: rnd(.3, 1), tam: rnd(.3, .5), tamF: 0, vida: rnd(.2, .45), cor: pega([[1, .5, .1], [1, .8, .2], [1, .3, .05]]) });
      else if (b.t < 1.2) fx.emitir(b.p.x, b.p.y, b.p.z, { tam: .25, tamF: 0, vida: .3, cor: [1, 1, 1] });
      if (b.mesh.userData.faisca) b.mesh.userData.faisca.scale.setScalar(.6 + Math.random());
      b.calmo = b.v.length() < .6 ? b.calmo + dt : 0;
      if (b.calmo > .6 || b.t > 5 || Math.abs(b.p.x) > 40 || b.p.z < -40) { if (b.tipo === 'bomba') { b.morto = true; cena.remove(b.mesh); explodir(b.p.clone(), 2.4); } else { b.morto = true; Anim.add(.4, k => b.mesh.scale.setScalar(1 - k)).then(() => cena.remove(b.mesh)); } }
    }
    st.explosoes = st.explosoes.map(t => t - dt).filter(t => t > 0);
  }
  function avaliar() {
    st.voando = false; const n = st.derrubados;
    if (n >= 4) { Rei.reagir('combo'); Jogo.grito(pega(['Que estrago!', 'Strike real!', 'Majestoso!'])); Som.uau(); Jogo.balao(pega(['Derrubou tudo!', 'Isso é que é mira!', 'Viva!']), 2); }
    else if (n >= 1) { Rei.reagir('feliz'); Jogo.balao(pega(['Boa!', 'Acertou!', 'Mais um pouco!']), 1.6); }
    else { Rei.reagir('susto'); Jogo.balao(pega(['Errou! Mire nos de baixo.', 'Quase!', 'Tente o ponto fraco da pilha!']), 2); }
    if (metasFeitas()) { Jogo.vencer(); return; }
    if (T.jogadas <= 0) { Jogo.perder(); return; }
    Rei.base(T.jogadas === 1 ? 'panico' : 'normal'); if (T.jogadas === 1) Jogo.balao('Última bola! Capricha!', 2.2);
    T.ocupado = false;
  }
  return {
    cena, cam, fx: [fx, fxC, fxB], get ativo() { return st.ativo; }, carregar, sair,
    tela(x, y, z) { tmp.set(x, y, z).project(cam); return [L.tab.x + (tmp.x + 1) / 2 * L.tab.w, L.tab.y + (1 - tmp.y) / 2 * L.tab.h]; },
    enquadrar() {
      const a = L.tab.w / L.tab.h; cam.aspect = a; cam.fov = Math.max(48, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) / a) * 180 / Math.PI);
      cam.position.set(0, 3.5, 2.6); cam.lookAt(0, 1.75, -7.5); cam.updateProjectionMatrix();
    },
    async entrada() { const p0 = cam.position.clone(); await Anim.add(1, k => { cam.position.set(0, lerp(6.5, 3.5, k), lerp(-4, 2.6, k)); cam.lookAt(0, 1.75, -7.5); }, Ease.inOut); cam.position.copy(p0); this.enquadrar(); },
    toque(tipo, e) {
      if (!st.ativo || !T.ativo || T.ocupado) { if (tipo === 'up') { st.mirando = false; apontar(st.mira || V(0, 2, -8)); } return; }
      const oy = e.pointerType === 'touch' ? 70 : 0, p = pontoNaTela(e.clientX, e.clientY - oy);
      if (tipo === 'down') { st.mirando = true; Som.init(); }
      if (p && st.mirando) apontar(p);
      if (tipo === 'up' && st.mirando) { st.mirando = false; atirar(); }
    },
    recarregar(n) { for (let i = 0; i < n; i++) st.fila.push('bola'); carregarBola(); montarPrateleira(); },
    mirarEAtirar(x, y, z) { if (!T.ativo || T.ocupado) return false; st.mirando = true; apontar(V(x, y, z)); st.mirando = false; atirar(); return true; },
    alvos() { return st.corpos.filter(c => c.alvo && !c.caiu && !c.morto).map(c => [c.p.x, c.p.y, c.p.z, c.tipo]); },
    get proxima() { return st.carregada ? BOLAS[st.carregada.tipo].nome : ''; },
    async festa() {
      while (T.jogadas > 0) {
        T.jogadas--; HUD.jogadas(); T.pontos += 1000; HUD.pontos(); Som.canhao();
        const O = boca(), alvo = V(rnd(-3, 3), rnd(6, 9), rnd(-12, -8));
        await Anim.add(.6, k => { fx.emitir(lerp(O.x, alvo.x, k), lerp(O.y, alvo.y, k), lerp(O.z, alvo.z, k), { tam: .4, vida: .3, cor: [1, .9, .5] }); });
        Som.estrela(Math.floor(Math.random() * 3)); const c = corRGB(pega(COR_HEX));
        fx.explosao(alvo.x, alvo.y, alvo.z, 60, { cor: c, tam: .5, tamF: .1, v0: 2, v1: 6, grav: 2, vida0: .8, vida1: 1.4 });
        fxB.emitir(alvo.x, alvo.y, alvo.z, { tam: 3, vida: .4, cor: c });
      }
      if (st.carregada) { tubo.remove(st.carregada.mesh); st.carregada = null; } montarPrateleira();
    },
    update(dt) {
      if (!st.ativo) return; tickFisica(dt);
      for (const P of st.plats) if (P.aro) P.aro.rotation.z += dt * 2;
      if (st.carregada && st.carregada.mesh.userData.faisca) st.carregada.mesh.userData.faisca.scale.setScalar(.6 + Math.random());
      if (st.voando) {
        st.vooT += dt;
        const calmo = st.bolas.every(b => b.morto) && st.corpos.every(c => c.morto || c.dorme || c.v.length() < .5) && !st.explosoes.length;
        if ((calmo && st.vooT > 1) || st.vooT > 6) avaliar();
      }
      anelMira.material.opacity = .6 + Math.sin(st.t * 8) * .3;
      fx.tick(dt); fxC.tick(dt); fxB.tick(dt);
    },
  };
})();
