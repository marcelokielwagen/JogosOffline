'use strict';
// Modo 2: Resgate. Cena e tabuleiro numa coisa só: em cima do tabuleiro fica a sala do Rei Tico, que segura a porta
// contra um depósito cheio de entulho (pedras, bolinhas de metal ou cubos). O entulho desce por um canal que entra no
// tabuleiro: cada pedaço do canal quebrado (combinação ao lado ou explosão) faz a pilha inteira descer uma casa.
// Enquanto isso a armadilha da sala (parede de espinhos, teto de espinhos ou água) avança a cada jogada.
const Resgate = (() => {
  const G = new THREE.Group(); G.visible = false; cenaTab.add(G);
  const ALTO = 4.3, ex = Rei.extra;
  const st = { ativo: false, perigo: null, mat: 'pedras', p: 0, alvo: 0, total: 0, livre: false, fim: false, t: 0, aviso: 0, alivio: false, cols: [], y0: 0, xPorta: 0, xRei: 0, xEsq: 0, xDir: 0 };
  const tp = texCanvas(128, 128, (c, w, h) => {
    c.fillStyle = '#77728a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},.07)`; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    c.strokeStyle = '#4a4656'; c.lineWidth = 4; for (let y = 0; y <= h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < w; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } }
  });
  const mParede = new THREE.MeshStandardMaterial({ map: tp, color: 0xb0aac8, roughness: .85 });
  const mFundo = new THREE.MeshStandardMaterial({ map: tp, color: 0x7a7298, roughness: .9 });
  const mFundo2 = new THREE.MeshStandardMaterial({ map: tp, color: 0x4e4668, roughness: .9 });
  const mChao = new THREE.MeshStandardMaterial({ map: TEX_CAIXA[0], color: 0xd0a070, roughness: .8 });
  const mPorta = new THREE.MeshStandardMaterial({ map: TEX_CAIXA[0], roughness: .7 });
  const mFogo = new THREE.MeshBasicMaterial({ color: 0xffb030, toneMapped: false });
  const PECAS = {
    pedras: { geo: new THREE.DodecahedronGeometry(.25, 0), mat: new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true }), cores: [0x9a7a5a, 0x7d6450, 0xb08d68, 0x6e5c4e, 0xa89070], n: 11 },
    bolas: { geo: new THREE.SphereGeometry(.16, 14, 10), mat: new THREE.MeshStandardMaterial({ metalness: 1, roughness: .22, envMapIntensity: 1.5 }), cores: [0xdfe5ee, 0xb8c0cc, 0xeef1f6, 0xa8b0bc], n: 13 },
    cubos: { geo: extrudar(retRedondo(.3, .3, .07), .22, .03), mat: new THREE.MeshPhysicalMaterial({ roughness: .3, clearcoat: .8 }), cores: [0xff7ab8, 0x6aa8ff, 0xb48cff, 0x8fd6ff, 0xffa8d8], n: 9 },
  };
  let est = null, inst = null, portaG = null, perigoG = null, agua = null, luzTocha = null;
  const dummy = new THREE.Object3D(), corT = new THREE.Color();
  const FALAS = {
    espinhos: ['Uma parede de espinhos vem chegando!', 'Rápido, tire o entulho!', 'Socorro! Os espinhos estão nas minhas costas!'],
    teto: ['O teto de espinhos está descendo!', 'Abaixa a cabeça, Tico!', 'Socorro! Já está na minha coroa!'],
    agua: ['A sala está enchendo de água!', 'A água chegou na barriga!', 'Glub... glub... depressa!'],
  };
  const tamCanal = col => col.slots.filter(s => s.r !== null).length;
  const reserva = () => st.cols.reduce((a, col) => a + Math.max(0, col.units.length - tamCanal(col)), 0);
  const restante = () => st.cols.reduce((a, col) => a + col.units.length, 0);
  function novaUnidade(y) { const P = PECAS[st.mat]; return { y, vy: 0, p: Array.from({ length: P.n }, () => ({ x: rnd(-.4, .4), y: rnd(-.4, .4), z: rnd(-.3, .38), rx: rnd(0, 6), ry: rnd(0, 6), rz: rnd(0, 6), s: rnd(.8, 1.2), cor: pega(P.cores) })) }; }
  function aplicar(col) {
    col.slots.forEach((s, i) => {
      if (s.r === null) return; const k = T.cel[s.r][col.c];
      if (i < col.units.length) { if (!k.bloco) k.bloco = { tipo: 'entulho', hp: 1 }; }
      else if (k.bloco && k.bloco.tipo === 'entulho') k.bloco = null;
    });
  }
  function zerarExtra() { ex.y = 0; ex.sx = ex.sy = 1; ex.rz = 0; }
  const caixa = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); est.add(o); return o; };

  function construir() {
    if (est) { G.remove(est); est.traverse(o => { if (o.geometry && o.geometry !== PECAS[st.mat].geo) o.geometry.dispose(); }); }
    est = new THREE.Group(); G.add(est);
    const { xEsq: xE, xPorta: xP, xDir: xD, y0 } = st, wC = xP - xE, wR = xD - xP, hP = 2.75;
    const f1 = new THREE.Mesh(new THREE.PlaneGeometry(wC, ALTO), mFundo); f1.position.set((xE + xP) / 2, y0 + ALTO / 2, -.95); est.add(f1);
    const f2 = new THREE.Mesh(new THREE.PlaneGeometry(wR, ALTO + .6), mFundo2); f2.position.set((xP + xD) / 2, y0 + ALTO / 2 - .3, -.95); est.add(f2);
    caixa(wC + .2, .26, 1.9, mChao, (xE + xP) / 2, y0 - .1, 0);
    caixa(.36, ALTO + .4, 1.9, mParede, xE - .18, y0 + ALTO / 2, 0);
    caixa(.36, ALTO + .4, 1.9, mParede, xD + .18, y0 + ALTO / 2, 0);
    caixa(xD - xE + 1.1, .36, 1.9, mParede, (xE + xD) / 2, y0 + ALTO + .18, 0);
    caixa(.3, ALTO - hP, 1.9, mParede, xP, y0 + hP + (ALTO - hP) / 2, 0);
    // porta de madeira (o rei segura do lado de dentro)
    portaG = new THREE.Group(); portaG.position.set(xP, y0, .85); est.add(portaG);
    const pm = new THREE.Mesh(new THREE.BoxGeometry(.22, hP, 1.7), mPorta); pm.position.set(0, hP / 2, -.85); portaG.add(pm);
    for (const y of [.5, hP - .5]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .13, 1.72), MAT.ferro); b.position.set(0, y, -.85); portaG.add(b); }
    // tocha
    const tocha = new THREE.Group(); tocha.position.set(xE + .55, y0 + 2.4, -.8); est.add(tocha);
    const cabo = new THREE.Mesh(new THREE.CylinderGeometry(.05, .035, .45, 8), MAT.ferro); tocha.add(cabo);
    const chama = new THREE.Mesh(new THREE.ConeGeometry(.11, .3, 10), mFogo); chama.position.y = .35; tocha.add(chama); tocha.userData.chama = chama;
    luzTocha = new THREE.PointLight(0xffa040, 2.5, 5, 1.5); luzTocha.position.set(xE + .8, y0 + 2.3, .2); est.add(luzTocha); est.userData.tocha = tocha;
    // armadilha
    perigoG = new THREE.Group(); est.add(perigoG); agua = null;
    const geoE = new THREE.ConeGeometry(.11, .45, 8);
    if (st.perigo === 'espinhos') {
      perigoG.add(new THREE.Mesh(new THREE.BoxGeometry(.35, ALTO - .2, 1.6), mParede)); perigoG.position.y = y0 + ALTO / 2;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) { const e = new THREE.Mesh(geoE, MAT.prata); e.rotation.z = -Math.PI / 2; e.position.set(.4, -1.8 + r * .6, -.55 + c * .55); perigoG.add(e); }
    } else if (st.perigo === 'teto') {
      perigoG.add(new THREE.Mesh(new THREE.BoxGeometry(wC - .1, .35, 1.6), mParede)); perigoG.position.x = (xE + xP) / 2;
      const n = Math.floor((wC - .3) / .45); for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { const e = new THREE.Mesh(geoE, MAT.prata); e.rotation.z = Math.PI; e.position.set(-(n - 1) * .225 + i * .45, -.4, -.55 + c * .55); perigoG.add(e); }
    } else {
      const mA = new THREE.MeshPhysicalMaterial({ color: 0x1e9bff, transparent: true, opacity: .45, roughness: .1, emissive: 0x0a3a80, emissiveIntensity: .35, depthWrite: false });
      const corpo = new THREE.Mesh(new THREE.BoxGeometry(wC - .04, 1, 1.75).translate(0, .5, 0), mA); corpo.renderOrder = 5; corpo.position.set((xE + xP) / 2, y0 + .03, 0); perigoG.add(corpo);
      const sg = new THREE.PlaneGeometry(wC - .04, 1.75, 16, 10).rotateX(-Math.PI / 2), orig = sg.attributes.position.array.slice();
      const sup = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: 0x9fe4ff, transparent: true, opacity: .6, roughness: .05, clearcoat: 1, emissive: 0x2a7ac0, emissiveIntensity: .35, depthWrite: false, side: THREE.DoubleSide }));
      sup.renderOrder = 6; sup.position.x = (xE + xP) / 2; perigoG.add(sup); agua = { corpo, sup, sg, orig };
    }
    // entulho (peças instanciadas)
    const P = PECAS[st.mat]; inst = new THREE.InstancedMesh(P.geo, P.mat, Math.max(1, st.total * P.n));
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, st.total * P.n) * 3), 3); inst.frustumCulled = false; est.add(inst);
  }
  function tickPerigo(p, t, dt) {
    const { xEsq: xE, xRei, y0 } = st;
    if (st.perigo === 'espinhos') {
      const ini = xE + .7, fim = xRei - .48, tip = p <= 1 ? lerp(ini, fim, p) : lerp(fim, fim + .35, clamp((p - 1) / .12, 0, 1));
      perigoG.position.x = tip - .625; ex.sx = st.livre ? 1 : clamp(1 - Math.max(0, tip - fim) / .7, .55, 1);
    } else if (st.perigo === 'teto') {
      const ini = y0 + ALTO - .55, fim = y0 + 2.85, tip = p <= 1 ? lerp(ini, fim, p) : lerp(fim, fim - .9, clamp((p - 1) / .12, 0, 1));
      perigoG.position.y = tip + .625; ex.sy = st.livre ? 1 : clamp(1 - Math.max(0, fim - tip) / 1.8, .55, 1);
    } else if (agua) {
      const nivel = lerp(.02, ALTO - .45, clamp(p, 0, 1.1)); agua.corpo.scale.y = nivel; agua.corpo.visible = agua.sup.visible = nivel > .05; agua.sup.position.y = y0 + .03 + nivel;
      const a = agua.sg.attributes.position; for (let i = 0; i < a.count; i++) a.setY(i, Math.sin(agua.orig[i * 3] * 4 + t * 3) * .03 + Math.cos(agua.orig[i * 3 + 2] * 5 + t * 2.2) * .03); a.needsUpdate = true;
      if (nivel > .25 && Math.random() < dt * 10) { const yb = y0 + rnd(.1, nivel * .7), vy = rnd(.5, .9); fxTab.emitir(rnd(st.xEsq + .3, st.xPorta - .3), yb, rnd(-.5, .6), { vy, vida: (y0 + nivel - yb) / vy, tam: rnd(.08, .15), cor: [.55, .8, 1], arr: 0 }); }
      ex.y = st.livre ? 0 : clamp((nivel - 1.2) * .5, 0, .55) + (nivel > 1.2 ? Math.sin(t * 2.2) * .035 : 0);
    }
  }
  function tickEntulho(dt) {
    let n = 0, bateu = false;
    for (const col of st.cols) col.units.forEach((u, i) => {
      const alvo = col.slots[i].y;
      if (u.y > alvo + 1e-3) { u.vy += 32 * dt; u.y = Math.max(alvo, u.y - u.vy * dt); if (u.y === alvo) { u.vy = 0; bateu = true; } } else { u.y = alvo; u.vy = 0; }
      for (const q of u.p) { dummy.position.set(col.x + q.x, u.y + q.y, q.z); dummy.rotation.set(q.rx, q.ry, q.rz); dummy.scale.setScalar(q.s); dummy.updateMatrix(); inst.setMatrixAt(n, dummy.matrix); inst.setColorAt(n, corT.setHex(q.cor)); n++; }
    });
    inst.count = n; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    if (bateu) Som.queda();
  }
  return {
    get ativo() { return st.ativo; }, get p() { return st.alvo; }, get total() { return st.total; }, alturaTopo: ALTO + .6,
    preparar(nv) {
      if (!nv.resgate) { this.sair(); return; }
      const R = nv.resgate; Object.assign(st, { ativo: true, perigo: R.perigo, mat: R.material || 'pedras', p: 0, alvo: 0, livre: false, fim: false, aviso: 0, alivio: false });
      st.y0 = T.Nr / 2 + .42;
      const cs = []; for (let c = 0; c < T.Nc; c++) if (nv.mapa.some(l => l[c] === 'E')) cs.push(c);
      st.xPorta = posCel(0, cs[0]).x - .5; st.xDir = posCel(0, cs[cs.length - 1]).x + .5; st.xEsq = -T.Nc / 2; st.xRei = st.xPorta - .72;
      st.cols = cs.map(c => {
        const rows = []; for (let r = 0; r < T.Nr && nv.mapa[r][c] === 'E'; r++) rows.push(r);
        const slots = rows.slice().reverse().map(r => ({ r, y: posCel(r, c).y }));
        for (let v = 1; v <= R.reserva; v++) slots.push({ r: null, y: st.y0 + v - .5 });
        return { c, x: posCel(0, c).x, slots, units: slots.map(s => novaUnidade(s.y)) };
      });
      st.total = restante(); construir(); st.cols.forEach(aplicar); tickEntulho(0);
      Rei.moverPara(G, st.xRei, st.y0, .95); zerarExtra(); ex.ry = .75; Rei.palcoVisivel(false);
      G.visible = true; Som.ambiente(st.perigo === 'agua' ? 'agua' : 'espinhos');
    },
    sair() {
      if (!st.ativo) return; st.ativo = false; G.visible = false; Rei.moverPara(null, 0, 0, 1); Rei.palcoVisivel(true); zerarExtra(); ex.ry = 0; Som.ambiente(null);
    },
    fala(i) { return FALAS[st.perigo][i]; },
    jogada() {
      if (!st.ativo || st.livre) return;
      st.alvo = clamp(1 - T.jogadas / T.jogadasIni, 0, 1); Som.perigo(st.perigo === 'agua' ? 'agua' : 'espinhos');
      const nv = st.alvo >= .8 ? 2 : st.alvo >= .5 ? 1 : 0;
      if (nv > st.aviso) { st.aviso = nv; Jogo.balao(FALAS[st.perigo][nv], 2.6); if (nv === 2) Rei.reagir('susto'); }
    },
    atingirEntulho(k) {
      const col = st.cols.find(c => c.c === k.c), j = col ? col.slots.findIndex(s => s.r === k.r) : -1;
      if (!col || j < 0 || j >= col.units.length) { k.bloco = null; return; }
      const u = col.units.splice(j, 1)[0], P = PECAS[st.mat];
      fxCaco.explosao(col.x, u.y, .35, 12, { cor: corRGB(pega(P.cores)), tam: .24, tamF: .06, v0: 1.5, v1: 4.5, grav: 9, vida0: .4, vida1: .8 });
      fxBr.emitir(col.x, u.y, .5, { tam: .9, vida: .25, cor: [1, .9, .7] });
      Som.entulho(st.mat); contar('entulho'); pontuar(70); aplicar(col);
      if (!st.alivio && reserva() === 0 && restante() > 0) { st.alivio = true; Jogo.balao('Ufa! A porta não pesa mais!', 2); Rei.reagir('feliz'); }
    },
    cadeadoAberto() {},
    async libertar() {
      if (!st.ativo) return; st.livre = true; st.fim = false; st.alvo = 0; await espera(.3);
      Som.porta(); Rei.base('normal'); const r0 = ex.ry;
      Anim.add(.6, t => { portaG.rotation.y = -t * 1.5; ex.ry = r0 * (1 - t); }, Ease.out);
      zerarExtra(); Jogo.balao('Livre! Obrigado!', 2.5); Rei.reagir('combo'); await espera(1.1);
    },
    async final() {
      if (!st.ativo) return; st.fim = true; st.alvo = 1.12; Som.perigo(st.perigo === 'agua' ? 'agua' : 'espinhos'); Rei.reagir('susto');
      await espera(1.3); if (st.perigo === 'agua') Jogo.balao('Glub... me salve!', 3);
    },
    recuar() { if (!st.ativo) return; st.fim = false; zerarExtra(); st.alvo = clamp(1 - T.jogadas / T.jogadasIni, 0, 1); st.aviso = st.alvo >= .5 ? 1 : 0; },
    update(dt) {
      if (!st.ativo) return; st.t += dt; const t = st.t;
      const v = st.livre ? 1.2 : st.fim ? .9 : .55; st.p += clamp(st.alvo - st.p, -v * dt, v * dt);
      tickPerigo(st.p, t, dt); tickEntulho(dt);
      const pressao = reserva() > 0 && !st.livre;
      portaG.rotation.z = pressao ? Math.sin(t * 6) * .012 : 0; portaG.position.x = st.xPorta + (pressao ? Math.abs(Math.sin(t * 3)) * -.02 : 0);
      const ch = est.userData.tocha.userData.chama; ch.scale.set(1 + Math.sin(t * 17) * .1, 1 + Math.sin(t * 11) * .15, 1); luzTocha.intensity = 2.3 + Math.sin(t * 13) * .3;
      if (T.emNivel && !st.livre && !st.fim) Rei.base(st.alvo >= .65 ? 'panico' : pressao ? 'esforco' : 'normal');
      Som.ambienteNivel(st.livre ? 0 : st.p); Som.intensidade(st.livre ? 0 : st.p);
    },
  };
})();
