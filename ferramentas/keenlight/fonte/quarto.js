/* Nível 1 — O Ateliê do Pintor: um quarto em 3D cheio de coisas, com gavetas, portas, baú e cortina que abrem.
   Sala: x de -3.5 a 3.5, z de -2.5 (parede do fundo) a 2.5 (lado da câmera, sem parede), altura 3.2. */
function criarAtelie(cena) {
  const { mat, caixa, cil, esfera, torno, toro, tubo, forma, em, grupo, malha } = P;
  const r = Tex.r, ent = Tex.ent; Tex.sorte(321);
  const raiz = grupo(); cena.add(raiz);
  const itens = [], interativos = [], animados = [];
  const W = 3.5, D = 2.5, H = 3.2, PI = Math.PI;

  // ---------- materiais da sala ----------
  const tPiso = Tex.piso(), tParede = Tex.papelParede(), tTeto = Tex.reboco();
  const nogueira = mat('#ffffff', { map: Tex.madeira(22, 22, [1, 1], 4), r: .55 });
  const carvalho = mat('#ffffff', { map: Tex.madeira(30, 38, [1, 1], 8), r: .6 });
  const pinho = mat('#ffffff', { map: Tex.madeira(34, 50, [1, 1], 12), r: .7 });
  const lambri = mat('#ffffff', { map: Tex.madeira(20, 24, [3, 1], 16), r: .5 });
  const dourado = mat('#b8893a', { r: .35, m: .8 }), ferro = mat('#2a2522', { r: .5, m: .7 }), latao = mat('#b39048', { r: .35, m: .85 });
  const gesso = mat('#ece6da', { r: .85 }), creme = mat('#efe5cc', { r: .8 }), terracota = mat('#b5653e', { r: .85 });
  const vidro = mat('#dde9e6', { r: .05, m: .1, t: .25 }), tela = mat('#cfc2a4', { r: .95 });

  /* =========== sala =========== */
  const chao = em(raiz, malha(new THREE.PlaneGeometry(2 * W, 2 * D), mat('#ffffff', { map: tPiso, r: .62 })), 0, 0, 0, -PI / 2);
  chao.castShadow = false;
  const pParede = mat('#ffffff', { map: tParede, r: .92 });
  const parede = (w, h, x, y, z, ry, rep) => { const m = rep ? mat('#ffffff', { map: (() => { const t = tParede.clone(); t.repeat.set(rep[0], rep[1]); t.needsUpdate = true; return t; })(), r: .92 }) : pParede; const p = em(raiz, malha(new THREE.PlaneGeometry(w, h), m), x, y, z, 0, ry); return p; };
  parede(2 * W, H, 0, H / 2, -D, 0);
  parede(2 * D, H, W, H / 2, 0, -PI / 2);
  // parede esquerda com a janela (vão: z de -1.35 a 0.15, y de 0.95 a 2.45)
  const jz0 = -1.35, jz1 = .15, jy0 = .95, jy1 = 2.45;
  parede(D + jz0, H, -W, H / 2, (-D + jz0) / 2, PI / 2, [5 * (D + jz0) / 7, 2.2]);
  parede(D - jz1, H, -W, H / 2, (D + jz1) / 2, PI / 2, [5 * (D - jz1) / 7, 2.2]);
  parede(jz1 - jz0, jy0, -W, jy0 / 2, (jz0 + jz1) / 2, PI / 2, [1, .7]);
  parede(jz1 - jz0, H - jy1, -W, (H + jy1) / 2, (jz0 + jz1) / 2, PI / 2, [1, .55]);
  // paredes grossas por fora, para a sombra do sol só entrar pela janela
  const casca = mat('#3a2c20', { r: 1 });
  em(raiz, caixa(.2, H, D + jz0, casca), -W - .1, H / 2, (-D + jz0) / 2); em(raiz, caixa(.2, H, D - jz1 + .4, casca), -W - .1, H / 2, (D + jz1) / 2 + .2);
  em(raiz, caixa(.2, jy0, jz1 - jz0, casca), -W - .1, jy0 / 2, (jz0 + jz1) / 2); em(raiz, caixa(.2, H - jy1, jz1 - jz0, casca), -W - .1, (H + jy1) / 2, (jz0 + jz1) / 2);
  em(raiz, caixa(2 * W + .4, .2, 2 * D + .4, casca), 0, H + .1, 0);
  // teto e vigas
  const teto = em(raiz, malha(new THREE.PlaneGeometry(2 * W, 2 * D), mat('#ffffff', { map: tTeto, r: 1 })), 0, H, 0, PI / 2);
  for (let i = 0; i < 5; i++) em(raiz, caixa(2 * W, .18, .16, nogueira), 0, H - .09, -2 + i * 1.05);
  // lambri, rodapé e moldura
  const lamb = (comp, x, z, ry) => {
    const g = em(raiz, grupo(), x, 0, z, 0, ry);
    em(g, caixa(comp, .92, .03, lambri), 0, .46, .015);
    const n = Math.max(1, Math.round(comp / .62));
    for (let i = 0; i < n; i++) { const pw = comp / n - .12; em(g, caixa(pw, .52, .018, lambri), -comp / 2 + (i + .5) * comp / n, .5, .035); }
    em(g, caixa(comp, .14, .05, nogueira), 0, .07, .025); em(g, caixa(comp, .05, .06, nogueira), 0, .94, .03);
    em(g, caixa(comp, .1, .07, creme), 0, H - .05, .035);
  };
  lamb(2 * W, 0, -D, 0); lamb(2 * D, W, 0, -PI / 2);
  lamb(D + jz0, -W, (-D + jz0) / 2, PI / 2); lamb(D - jz1, -W, (D + jz1) / 2, PI / 2);
  { const g = em(raiz, grupo(), -W, 0, (jz0 + jz1) / 2, 0, PI / 2); em(g, caixa(jz1 - jz0, .9, .03, lambri), 0, .45, .015); em(g, caixa(jz1 - jz0, .14, .05, nogueira), 0, .07, .025); em(g, caixa(jz1 - jz0, .1, .07, creme), 0, H - .05, .035); }

  /* =========== janela, céu e cortinas =========== */
  const ceu = em(raiz, new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ map: Tex.ceu() })), -W - 1.4, 1.7, (jz0 + jz1) / 2, 0, PI / 2);
  ceu.userData.semClique = true;
  const jan = em(raiz, grupo(), -W + .02, 0, (jz0 + jz1) / 2, 0, PI / 2);
  const jw = jz1 - jz0, jh = jy1 - jy0;
  em(jan, caixa(jw + .12, .07, .14, pinho), 0, jy1 + .035, 0); em(jan, caixa(jw + .12, .06, .1, pinho), 0, jy0 - .03, 0);
  for (const s of [-1, 1]) em(jan, caixa(.07, jh + .1, .14, pinho), s * (jw / 2 + .03), (jy0 + jy1) / 2, 0);
  em(jan, caixa(.05, jh, .07, pinho), 0, (jy0 + jy1) / 2, -.04); em(jan, caixa(jw, .04, .07, pinho), 0, jy0 + jh * .62, -.04);
  for (const s of [-1, 1]) em(jan, caixa(.03, jh * .62, .05, pinho), s * jw / 4, jy0 + jh * .31, -.04);
  em(jan, malha(new THREE.PlaneGeometry(jw, jh), vidro), 0, (jy0 + jy1) / 2, -.05).castShadow = false;
  // peitoril
  const peit = em(raiz, caixa(.3, .05, jw + .3, pinho), -W + .15, jy0 - .02, (jz0 + jz1) / 2);
  // coisas no peitoril
  const ps = jy0 + .005;
  { const v = em(raiz, torno([[0, 0], [.05, 0], [.06, .07], [.045, .09], [.05, .1]], terracota), -W + .16, ps, -1.05); em(raiz, esfera(.045, mat('#5d7a3a', { r: .9 }), 10, 8), -W + .16, ps + .12, -1.05).scale.set(1, 1.3, 1);
    for (let i = 0; i < 8; i++) em(raiz, cil(.002, .001, .02, mat('#e8e0c0'), 4), -W + .16 + Math.cos(i) * .045, ps + .12 + Math.sin(i * 2) * .04, -1.05 + Math.sin(i) * .045, 0, 0, Math.cos(i) * 1.4); }
  em(raiz, torno([[0, 0], [.035, 0], [.035, .14], [.012, .17], [.012, .21], [.016, .22], [0, .22]], mat('#4c6a4a', { r: .1, t: .55 })), -W + .14, ps, -.72);
  em(raiz, torno([[0, 0], [.04, 0], [.042, .12], [.04, .125], [0, .125]], mat('#c8dcd8', { r: .05, t: .3 })), -W + .17, ps, -.45);
  em(raiz, caixa(.12, .02, .09, mat('#7a5a3a', { r: .8 })), -W + .15, ps + .01, -.2, 0, .3);
  // cortinas (uma aberta, uma fechada escondendo a concha)
  const pano = mat('#ffffff', { map: Tex.tecido('#7a3a2a', '#8f4a36', 'listra', [3, 1]), r: .95, lado: THREE.DoubleSide });
  em(raiz, cil(.015, .015, jw + 1.1, latao, 10), -W + .2, jy1 + .22, (jz0 + jz1) / 2, PI / 2);
  for (const s of [-1, 1]) em(raiz, esfera(.03, latao, 10, 8), -W + .2, jy1 + .22, (jz0 + jz1) / 2 + s * (jw + 1.1) / 2);
  function cortina(z, larg, alt, sentido, aberta) {
    const geo = new THREE.PlaneGeometry(larg, alt, 40, 12); const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setX(i, x + larg / 2); pos.setZ(i, Math.sin((x + larg / 2) * 22) * .035 + Math.sin(x * 7) * .01 + (alt / 2 - y) * .02 * Math.sin(x * 5)); }
    geo.computeVertexNormals();
    const g = em(raiz, grupo(), -W + .2, jy1 + .2 - alt / 2, z, 0, sentido > 0 ? PI / 2 : -PI / 2);
    const m = em(g, malha(geo, pano), 0, 0, 0); m.scale.x = aberta ? .3 : 1;
    for (let i = 0; i < 6; i++) em(g, toro(.022, .004, latao, PI * 2, 6, 14), (i + .3) * larg / 6 * (aberta ? .3 : 1), alt / 2 + .02, 0);
    return { g, m };
  }
  const cortA = cortina(.42, 1.05, 2.3, 1, false);   // fechada, da frente até o meio da janela (vai de z .42 a -.63)
  const cortB = cortina(-1.95, 1.0, 2.3, -1, true);  // aberta, encostada atrás
  interativo(cortA.g, 'cortina', k => { cortA.m.scale.x = 1 - .72 * k; cortA.g.children.forEach((c, i) => { if (i) c.position.x = (i - 1 + .3) * 1.05 / 6 * (1 - .72 * k); }); });
  item('concha', 'Concha', 'Guarda o som do mar.', P.concha(), raiz, -W + .17, ps, -.08, 0, .9, 0, 1.2, interativos.at(-1));

  /* =========== estante de livros (fundo, à esquerda) =========== */
  const est = em(raiz, grupo(), -2.35, 0, -D + .2);
  const ew = 1.55, eh = 2.55, ed = .38;
  em(est, caixa(.05, eh, ed, nogueira), -ew / 2, eh / 2, 0); em(est, caixa(.05, eh, ed, nogueira), ew / 2, eh / 2, 0);
  em(est, caixa(ew + .12, .07, ed + .06, nogueira), 0, eh + .035, .01); em(est, caixa(ew, .02, ed, mat('#3a2818')), 0, eh / 2, -ed / 2 + .01);
  em(est, caixa(ew, .1, ed, nogueira), 0, .05, 0);
  const prat = [.1, .52, .94, 1.34, 1.72, 2.12];
  prat.forEach(y => em(est, caixa(ew - .05, .035, ed - .02, nogueira), 0, y, 0));
  // livros instanciados
  const livros = [];
  const cores = ['#6e1f1a', '#2f4a32', '#5a3a1e', '#8a6a2a', '#3a2a24', '#7a4a2a', '#4a2a3a', '#26352e', '#9a7a4a', '#5e2a22', '#c9b48a'];
  const reserva = { 3: [[.18, .48]], 1: [[-.7, -.45]], 4: [[-.25, .05]], 2: [[.45, .7]] }; // vãos para enfeites
  prat.slice(0, 5).forEach((y, iy) => {
    let x = -ew / 2 + .04; const vaos = reserva[iy] || [];
    while (x < ew / 2 - .06) {
      const vao = vaos.find(([a, b]) => x + ew / 2 * 0 >= a - .001 && x <= b); if (vao) { x = vao[1] + .01; continue; }
      if (r() < .05) { x += ent(.03, .08); continue; }
      const w = ent(.025, .065), h = ent(.2, .33), d = ent(.2, .27), incl = r() < .08 ? ent(.1, .25) : 0;
      if (x + w > ew / 2 - .03) break;
      livros.push({ x: est.position.x + x + w / 2, y: y + .018 + h / 2, z: est.position.z + ed / 2 - d / 2 - .02, w, h, d, rz: -incl, cor: cores[(r() * cores.length) | 0], tipo: (r() * 3) | 0 });
      x += w + (incl ? .03 : .002);
    }
  });
  // pilha deitada na prateleira 2
  for (let i = 0; i < 5; i++) livros.push({ x: est.position.x + .57, y: prat[2] + .02 + i * .045 + .02, z: est.position.z + .03, w: .24, h: .04, d: .2, ry: ent(-.1, .1), cor: cores[i * 2 % cores.length], tipo: 2 });
  // enfeites da estante
  const ey = (i) => prat[i] + .018;
  em(raiz, torno([[0, 0], [.06, 0], [.04, .04], [.07, .14], [.03, .2], [.035, .22], [0, .22]], mat('#3f5a5a', { r: .2, m: .1 })), est.position.x + .3, ey(3), est.position.z + .02); // vaso
  // globo
  { const gl = em(raiz, grupo(), est.position.x - .58, ey(1), est.position.z + .02); em(gl, cil(.06, .07, .02, nogueira), 0, .01, 0); em(gl, cil(.008, .008, .12, latao, 8), 0, .07, 0); const mapaT = Tex.mapa(); em(gl, esfera(.1, mat('#ffffff', { map: mapaT, r: .5 }), 24, 16), 0, .2, 0, .4, 0, .4); em(gl, toro(.112, .004, latao, PI * 1.2), 0, .2, 0, 0, PI / 2, .4); }
  // bússola de latão (parece o relógio: atrapalha)
  { const b = em(raiz, grupo(), est.position.x + .27, ey(4) + .03, est.position.z + .1, 1.15, 0, .1); em(b, cil(.03, .03, .012, latao, 28), 0, 0, 0); em(b, cil(.026, .026, .002, mat('#f0e6cc'), 24), 0, .0065, 0); em(b, caixa(.004, .002, .04, mat('#8a2010')), 0, .008, 0, 0, .6); }
  // relógio de bolso encostado nos livros da prateleira 4
  item('relogio', 'Relógio de bolso', 'Marca o tempo e cabe no colete.', P.relogioBolso(), raiz, est.position.x - .12, ey(4) + .028, est.position.z + .09, 1.2, .2, 0, 1.1);
  // vela no castiçal, caveira de gesso pequena e caixinha
  { const c = em(raiz, grupo(), est.position.x - .62, ey(4), est.position.z + .05); em(c, torno([[0, 0], [.04, 0], [.012, .02], [.01, .1], [.025, .11], [0, .11]], latao), 0, 0, 0); em(c, cil(.012, .012, .1, creme, 12), 0, .16, 0); }
  { const k = em(raiz, grupo(), est.position.x + .62, ey(2) + .25, est.position.z + .03); em(k, caixa(.12, .07, .08, mat('#5a2a1a', { r: .5 })), 0, .035, 0); em(k, caixa(.124, .015, .084, latao), 0, .07, 0); }
  { const s = em(raiz, grupo(), est.position.x - .1, ey(0), est.position.z + .02); em(s, caixa(.3, .2, .22, mat('#8a6a42', { r: .9 })), 0, .1, 0); em(s, caixa(.31, .03, .23, mat('#7a5a38', { r: .9 })), 0, .2, 0); }

  // pilha de livros no chão com os óculos em cima
  { let y = 0; const px = -1.2, pz = -2.0; [[.36, .07, .28, '#5e2a22'], [.32, .06, .26, '#2f4a32'], [.34, .08, .25, '#3a2a24'], [.28, .05, .22, '#8a6a2a'], [.3, .06, .23, '#4a2a3a']].forEach(([w, h, d, c], i) => { livros.push({ x: px + ent(-.02, .02), y: y + h / 2, z: pz, w, h, d, ry: ent(-.25, .25), cor: c, tipo: 2 }); y += h; });
    em(raiz, malha(new THREE.PlaneGeometry(.21, .28), mat('#efe5cc', { r: .9, lado: THREE.DoubleSide })), px + .05, y + .002, pz + .02, -PI / 2, 0, .4);
    item('oculos', 'Óculos', 'Duas janelas para quem lê de perto.', P.oculos(), raiz, px - .02, y + .003, pz + .01, 0, 2.6, 0, 1);
    // um livro aberto encostado tapa parte
    const lv = em(raiz, grupo(), px + .2, 0, pz + .14, 0, -.5, 0); em(lv, caixa(.03, .3, .22, mat('#6e1f1a', { r: .6 })), 0, .15, 0, 0, 0, -.35);
  }
  instanciarLivros(livros);

  /* =========== aparador com portas (fundo, meio) =========== */
  const apa = em(raiz, grupo(), .25, 0, -D + .26);
  const aw = 1.3, ah = .95, ad = .48;
  em(apa, caixa(aw, .06, ad, nogueira), 0, .08, 0); em(apa, caixa(aw + .06, .05, ad + .05, nogueira), 0, ah - .025, .01);
  for (const s of [-1, 1]) em(apa, caixa(.04, ah - .1, ad, nogueira), s * (aw / 2 - .02), ah / 2, 0);
  em(apa, caixa(aw, ah - .1, .02, mat('#2a1c12')), 0, ah / 2, -ad / 2 + .01);
  em(apa, caixa(aw - .08, .025, ad - .05, nogueira), 0, .48, -.01);
  for (const s of [-1, 1]) for (const x of [-.55, .55]) em(apa, cil(.025, .02, .06, nogueira, 10), x, .03, s * .18);
  // dentro: potes, latas, rolos de papel e a ferradura
  em(apa, cil(.06, .06, .14, mat('#7a3a20', { r: .4, m: .6 }), 16), -.38, .58, -.05);
  em(apa, cil(.05, .05, .16, mat('#4a5a3a', { r: .4, m: .6 }), 16), -.24, .59, -.08);
  em(apa, torno([[0, 0], [.05, 0], [.055, .1], [.03, .13], [.03, .16], [0, .16]], mat('#5a7a6a', { r: .1, t: .6 })), .1, .505, -.06);
  for (let i = 0; i < 4; i++) em(apa, cil(.025, .025, .5, mat(['#e8dcc0', '#d8c8a8', '#c9b48a', '#efe5cc'][i], { r: .9 }), 12), .3 + i * .02, .55 + (i % 2) * .05, -.05 + i * .04, 0, 0, PI / 2 + ent(-.1, .1));
  em(apa, caixa(.3, .12, .25, mat('#8a6a42', { r: .9 })), .38, .17, -.06);
  em(apa, cil(.07, .07, .2, mat('#6a5040', { r: .8 }), 16), -.42, .21, -.04);
  item('ferradura', 'Ferradura', 'Dizem que traz sorte pendurada.', P.ferradura(), apa, -.05, .17, .02, 1.2, .1, 0, 1);
  apa.children.at(-1).position.y = .14;
  // portas
  const porta = (lado) => {
    const piv = em(apa, grupo(), lado * (aw / 2 - .04), .11, ad / 2 + .012);
    const pw = aw / 2 - .05, pz = .022;
    const fol = em(piv, grupo(), -lado * pw / 2, 0, 0);
    em(fol, caixa(pw, ah - .17, pz, nogueira), 0, (ah - .17) / 2, 0);
    em(fol, caixa(pw - .12, ah - .32, .012, lambri), 0, (ah - .17) / 2, .015);
    em(fol, esfera(.018, latao, 12, 8), -lado * (pw / 2 - .06), (ah - .17) / 2, .03);
    em(fol, caixa(.035, .05, .006, latao), -lado * (pw / 2 - .06), (ah - .17) / 2 + .05, .016);
    return interativo(piv, 'porta', k => { piv.rotation.y = (lado < 0 ? -1 : 1) * 1.85 * k; });
  };
  const portaE = porta(-1); porta(1);
  itens.at(-1).dentro = [portaE, interativos.at(-1)];
  // em cima do aparador
  const topo = ah;
  { const v = em(apa, grupo(), -.45, topo, -.08); em(v, torno([[0, 0], [.05, 0], [.08, .08], [.06, .2], [.035, .26], [.045, .3], [0, .3]], mat('#a8714a', { r: .4 })), 0, 0, 0);
    for (let i = 0; i < 9; i++) { const a = i * .7, h = ent(.25, .45); em(v, cil(.003, .003, h, mat('#6a5a30'), 4), Math.cos(a) * .02, .3 + h / 2, Math.sin(a) * .02, Math.sin(a) * .25, 0, Math.cos(a) * .25); em(v, esfera(.018, mat(['#c9a24a', '#a85a3a', '#d8c8a0'][i % 3], { r: .9 }), 8, 6), Math.cos(a) * .02 + Math.cos(a) * .25 * h * .9, .3 + h * .95, Math.sin(a) * .02 - Math.sin(a) * .25 * h * .9 * 0); } }
  for (const x of [-.12, .52]) { const c = em(apa, grupo(), x, topo, -.12); em(c, torno([[0, 0], [.045, 0], [.015, .03], [.012, .18], [.03, .2], [0, .2]], latao), 0, 0, 0); em(c, cil(.011, .011, .12, creme, 12), 0, .26, 0); }
  { const b = em(apa, grupo(), .2, topo, .02); for (let i = 0; i < 4; i++) em(b, caixa(.26 - i * .02, .025, .19, mat(['#2f2a26', '#6a4a2a', '#8a2a1a', '#3a4a3a'][i], { r: .8 })), 0, .0125 + i * .025, 0, 0, ent(-.15, .15)); }
  { const bule = em(apa, grupo(), .45, topo, .08); em(bule, torno([[0, 0], [.05, 0], [.07, .04], [.065, .09], [.03, .12], [.012, .13], [0, .14]], mat('#e8e0d4', { r: .25 })), 0, 0, 0); em(bule, tubo([[.06, .05, 0], [.1, .08, 0], [.12, .12, 0]], .008, mat('#e8e0d4', { r: .25 }), 10), 0, 0, 0); em(bule, toro(.03, .006, mat('#e8e0d4', { r: .25 }), PI), -.07, .07, 0, 0, 0, PI / 2); }

  /* =========== quadros, relógio e mapa nas paredes =========== */
  function moldura(pai, w, h, tex, x, y, z, ry = 0, prof = .04) {
    const g = em(pai, grupo(), x, y, z, 0, ry);
    em(g, malha(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex, r: .7 })), 0, 0, prof / 2 + .002);
    const b = .07;
    em(g, caixa(w + 2 * b, b, prof, dourado), 0, h / 2 + b / 2, 0); em(g, caixa(w + 2 * b, b, prof, dourado), 0, -h / 2 - b / 2, 0);
    em(g, caixa(b, h, prof, dourado), -w / 2 - b / 2, 0, 0); em(g, caixa(b, h, prof, dourado), w / 2 + b / 2, 0, 0);
    em(g, caixa(w + .02, .015, .012, mat('#5a3a1a', { r: .5 })), 0, h / 2 + .005, prof / 2); em(g, caixa(w + .02, .015, .012, mat('#5a3a1a', { r: .5 })), 0, -h / 2 - .005, prof / 2);
    return g;
  }
  moldura(raiz, 1.05, .75, Tex.quadro('paisagem', 1), .25, 1.85, -D + .025);
  moldura(raiz, .38, .5, Tex.quadro('retrato', 2, 384, 512), -1.1, 1.7, -D + .025);
  moldura(raiz, .5, .36, Tex.quadro('mar', 3, 512, 384), 1.45, 1.42, -D + .025);
  moldura(raiz, .78, .58, Tex.quadro('natureza', 4), W - .025, 1.78, .1, -PI / 2);
  { const m = em(raiz, malha(new THREE.PlaneGeometry(.55, .41), mat('#ffffff', { map: Tex.mapa(), r: .9 })), W - .012, 1.55, -1.05, 0, -PI / 2); for (const [dy, dz] of [[.19, .25], [.19, -.25]]) em(raiz, esfera(.008, mat('#8a2010'), 6, 4), W - .015, 1.55 + dy, -1.05 + dz); }
  em(raiz, malha(new THREE.PlaneGeometry(.22, .29), mat('#ffffff', { map: Tex.partitura(), r: .9 })), -W + .012, 1.55, 1.2, 0, PI / 2, .05);
  moldura(raiz, .26, .2, Tex.quadro('paisagem', 7, 512, 384), -W + .025, 1.92, 1.75, PI / 2, .03);
  // relógio de parede
  const rel = em(raiz, grupo(), 1.35, 2.3, -D + .03);
  em(rel, cil(.2, .2, .06, nogueira, 40), 0, 0, 0, PI / 2); em(rel, toro(.2, .018, dourado, PI * 2, 8, 40), 0, 0, .03);
  { const f = em(rel, cil(.178, .178, .01, mat('#ffffff', { map: Tex.mostrador(), r: .6 }), 40), 0, 0, .031, PI / 2, PI / 2); }
  const ptr = (c, l, w) => { const p = em(rel, grupo(), 0, 0, .042); em(p, caixa(w, l, .004, mat(c)), 0, l / 2 - .02, 0); return p; };
  const ptH = ptr('#1b120c', .1, .012), ptM = ptr('#1b120c', .145, .008), ptS = ptr('#8a2010', .155, .003);
  animados.push(() => { const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = d.getHours() % 12 + m / 60; ptS.rotation.z = -s / 60 * PI * 2; ptM.rotation.z = -m / 60 * PI * 2; ptH.rotation.z = -h / 12 * PI * 2; });

  /* =========== telas encostadas, busto e planta (canto direito) =========== */
  [[1.55, .62, .8, .16, 'frente', 'mar'], [1.68, .7, .9, .12, 'costas'], [1.78, .5, .66, .2, 'frente', 'natureza'], [1.95, .9, 1.1, .1, 'costas']].forEach(([x, w, h, incl, lado, tipo], i) => {
    const g = em(raiz, grupo(), x, 0, -D + .14 + i * .045, -incl, lado === 'costas' ? PI : 0);
    em(g, caixa(w, h, .02, tela), 0, h / 2, 0);
    if (lado === 'frente') em(g, malha(new THREE.PlaneGeometry(w - .02, h - .02), mat('#ffffff', { map: Tex.quadro(tipo, 10 + i, 512, 512), r: .8 })), 0, h / 2, .011);
    else { for (const s of [-1, 1]) em(g, caixa(.04, h, .025, pinho), s * (w / 2 - .02), h / 2, .015); em(g, caixa(w, .04, .025, pinho), 0, .02, .015); em(g, caixa(w, .04, .025, pinho), 0, h - .02, .015); em(g, caixa(.03, h, .02, pinho), 0, h / 2, .015); }
  });
  // pedestal com busto de gesso, peão branco escondido ao lado, ovo e giz que confundem
  const ped = em(raiz, grupo(), 2.5, 0, -1.75);
  em(ped, torno([[0, 0], [.2, 0], [.2, .06], [.16, .09], [.13, .12], [.13, .95], [.17, .98], [.19, 1.03], [.19, 1.06], [0, 1.06]], gesso, 32), 0, 0, 0);
  { const b = em(ped, grupo(), -.03, 1.06, -.02, 0, -.6); em(b, torno([[0, 0], [.11, 0], [.12, .04], [.13, .1], [.11, .16], [.06, .2], [.045, .25], [0, .26]], gesso, 30), 0, 0, 0); em(b, esfera(.085, gesso, 24, 18), 0, .33, .01).scale.set(.9, 1.15, 1); em(b, caixa(.02, .04, .03, gesso), 0, .33, .085); em(b, esfera(.07, gesso, 16, 10), 0, .39, -.02).scale.set(1, .7, 1.1); }
  em(ped, esfera(.022, gesso, 14, 10), .13, 1.083, .06).scale.set(1, 1.3, 1);
  em(ped, cil(.006, .006, .07, gesso, 8), .1, 1.066, .12, 0, .5, PI / 2); em(ped, cil(.006, .006, .05, mat('#d8c8b0'), 8), .05, 1.066, .14, 0, -.3, PI / 2);
  item('peao', 'Peão de xadrez', 'O menor soldado do tabuleiro.', P.peao(), ped, .085, 1.06, -.1, 0, 0, 0, 1.15);
  // planta grande no canto com a borboleta numa folha
  const pl = em(raiz, grupo(), 3.05, 0, -2.05);
  em(pl, torno([[0, 0], [.18, 0], [.24, .36], [.27, .4], [.26, .44], [0, .44]], terracota, 28), 0, 0, 0);
  em(pl, cil(.24, .24, .02, mat('#3a2a1a', { r: 1 }), 24), 0, .42, 0);
  const folhaT = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#2f4f22'); g.addColorStop(.5, '#4f7a34'); g.addColorStop(1, '#2f4f22'); x.fillStyle = g; x.fillRect(0, 0, 64, 128); x.strokeStyle = '#8aa860'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 0); x.lineTo(32, 128); x.stroke(); for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(32, 10 + i * 12); x.lineTo(4, i * 12); x.moveTo(32, 10 + i * 12); x.lineTo(60, i * 12); x.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const mFolha = mat('#ffffff', { map: folhaT, r: .7, lado: THREE.DoubleSide }), mSeca = mat('#c07a34', { map: folhaT, r: .8, lado: THREE.DoubleSide });
  const geoFolha = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(.07, .08, .06, .24, 0, .32); s.bezierCurveTo(-.06, .24, -.07, .08, 0, 0); const g = new THREE.ShapeGeometry(s, 10); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { p.setZ(i, Math.abs(p.getX(i)) * .6 - p.getY(i) * p.getY(i) * .5); uv.setXY(i, p.getX(i) / .14 + .5, p.getY(i) / .32); } g.computeVertexNormals(); return g; })();
  const folhas = [];
  for (let i = 0; i < 46; i++) {
    const a = i * 2.39996, h = .5 + (i / 46) * 1.15 + ent(-.05, .05), rr = ent(.05, .28);
    const caule = em(pl, cil(.006, .008, h - .4, mat('#4a5a2a'), 5), Math.cos(a) * rr * .3, .42 + (h - .4) / 2, Math.sin(a) * rr * .3, Math.sin(a) * .2, 0, -Math.cos(a) * .2);
    const f = em(pl, malha(geoFolha, i === 30 || i === 12 ? mSeca : mFolha), Math.cos(a) * rr, h, Math.sin(a) * rr, -.6 - ent(0, .6), -a + PI / 2, 0);
    f.scale.setScalar(ent(.8, 1.25)); folhas.push(f);
  }
  // a borboleta pousa numa folha de altura média, virada para a sala
  em(pl, malha(geoFolha, mFolha), -.14, 1.14, .05, 1.72, 0, 0).scale.setScalar(1.1);
  item('borboleta', 'Borboleta', 'Já foi lagarta.', P.borboleta(), pl, -.15, 1.135, .2, .1, -.7, 0, 1.25);
  { const b = itens.at(-1).obj; let fase = r() * 9; animados.push((t) => { const k = Math.sin(t * 1.3 + fase); const ab = k > .8 ? (k - .8) * 4 : 0; b.userData.asas.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (.5 + ab * .9 + Math.sin(t * 2) * .05); }); }); }

  /* =========== mesa de trabalho com gavetas (centro) =========== */
  const tapete = em(raiz, malha(new THREE.PlaneGeometry(3.3, 2.4), mat('#ffffff', { map: Tex.tapete(), r: .95 })), -.25, .006, .45, -PI / 2);
  tapete.castShadow = false;
  const mesa = em(raiz, grupo(), -.3, 0, .45);
  const mw = 2.0, md = .92, mh = .78;
  em(mesa, caixa(mw, .05, md, carvalho), 0, mh - .025, 0);
  em(mesa, caixa(mw - .14, .12, .03, carvalho), 0, mh - .11, -md / 2 + .06);
  for (const s of [-1, 1]) em(mesa, caixa(.03, .12, md - .12, carvalho), s * (mw / 2 - .07), mh - .11, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) em(mesa, torno([[.03, 0], [.035, .05], [.025, .1], [.03, .35], [.04, .4], [.028, .45], [.032, .66], [.04, .7], [0, .7]], carvalho, 14), sx * (mw / 2 - .07), 0, sz * (md / 2 - .07));
  em(mesa, caixa(mw - .14, .03, .03, carvalho), 0, .14, md / 2 - .07); em(mesa, caixa(mw - .14, .03, .03, carvalho), 0, .14, -md / 2 + .07);
  // gavetas: frente + caixa interna, deslizam para a câmera
  function gaveta(x, conteudo) {
    const g = em(mesa, grupo(), x, mh - .11, md / 2 - .01);
    const gw = .62, gh = .1, gd = .7;
    em(g, caixa(gw + .04, gh + .02, .025, carvalho), 0, 0, 0);
    em(g, caixa(gw - .04, gh - .03, .01, lambri), 0, 0, .014);
    em(g, esfera(.016, latao, 10, 8), 0, 0, .03); em(g, caixa(.07, .02, .005, latao), 0, .03, .016);
    em(g, caixa(gw, .01, gd, pinho), 0, -gh / 2 + .01, -gd / 2);
    for (const s of [-1, 1]) em(g, caixa(.012, gh - .02, gd, pinho), s * gw / 2, 0, -gd / 2);
    em(g, caixa(gw, gh - .02, .012, pinho), 0, 0, -gd);
    conteudo(g, -gh / 2 + .015);
    return interativo(g, 'gaveta', k => { g.position.z = md / 2 - .01 + .42 * k; });
  }
  // a frente da mesa (onde estão as gavetas) tem uma travessa com dois vãos
  em(mesa, caixa(.12, .12, .03, carvalho), -.03, mh - .11, md / 2 - .06);
  const gavE = gaveta(-.5, (g, y) => {
    for (let i = 0; i < 6; i++) em(g, cil(.004, .004, .18, mat(['#c9a24a', '#2f4a32', '#7a2a1a', '#e8dcc0'][i % 4]), 6), -.2 + i * .02, y + .005, -.2 - i * .04, PI / 2, 0, ent(-.2, .2) + PI / 2);
    em(g, cil(.03, .03, .025, mat('#c9a878', { r: .9 }), 14), .18, y + .012, -.45);
    em(g, malha(new THREE.PlaneGeometry(.2, .26), mat('#efe5cc', { r: .9, lado: THREE.DoubleSide })), .05, y + .003, -.3, -PI / 2, 0, .3);
    item('chave', 'Chave antiga', 'Abre o que está trancado.', P.chave(), g, -.08, y + .004, -.38, 0, .7, 0, 1.25);
  });
  itens.at(-1).dentro = [gavE];
  gaveta(.44, (g, y) => {
    for (let i = 0; i < 9; i++) em(g, cil(.008, .008, .004, mat(['#d8c8a0', '#2a1f17', '#8a5a2a'][i % 3], { r: .4 }), 10), ent(-.22, .22), y + .003, -ent(.1, .6));
    em(g, caixa(.12, .02, .06, mat('#efe6d8')), -.1, y + .01, -.2, 0, .3);
    em(g, caixa(.12, .02, .06, mat('#e0d6c4')), .1, y + .01, -.45, 0, -.4);
  });
  // tampo: bagunça
  const T = mh;
  const tubos = ['#c8402a', '#d8a12a', '#2a5a8a', '#3a7a3a', '#e8e0d0', '#7a2a5a', '#c86a2a', '#1f1f1f'];
  for (let i = 0; i < 14; i++) { const tb = em(mesa, grupo(), ent(-.85, .1), T + .012, ent(-.05, .38), 0, ent(0, PI * 2), 0); em(tb, cil(.012, .012, .09, mat('#d8dcdf', { r: .35, m: .7 }), 10), 0, 0, 0, 0, 0, PI / 2); em(tb, cil(.0122, .0122, .05, mat(tubos[i % 8], { r: .5 }), 10), .01, 0, 0, 0, 0, PI / 2); em(tb, cil(.007, .007, .02, mat('#1a1a1a'), 8), -.055, 0, 0, 0, 0, PI / 2); }
  // caderno de esboços aberto
  { const c = em(mesa, grupo(), -.45, T, -.15, 0, .25); em(c, caixa(.5, .015, .34, mat('#3a2a1a', { r: .7 })), 0, .008, 0); em(c, malha(new THREE.PlaneGeometry(.24, .32), mat('#ffffff', { map: Tex.quadro('esboco', 5, 384, 512), r: .9 })), -.12, .017, 0, -PI / 2); em(c, malha(new THREE.PlaneGeometry(.24, .32), mat('#ffffff', { map: Tex.partitura(), r: .9 })), .12, .017, 0, -PI / 2); }
  // fruteira (natureza-morta para pintar)
  { const f = em(mesa, grupo(), .35, T, -.05); em(f, torno([[0, 0], [.06, 0], [.04, .02], [.04, .05], [.16, .08], [.17, .1], [0, .05]], mat('#c8c0b0', { r: .3, m: .2 })), 0, 0, 0);
    [['#b8302a', .05, 0, .12, 0], ['#c89a2a', .045, .07, .11, .05], ['#7a9a2a', .04, -.06, .11, .04], ['#9a2a1a', .042, .02, .12, -.07], ['#d8b040', .038, -.03, .17, -.01]].forEach(([c, rr, x, y, z]) => em(f, esfera(rr, mat(c, { r: .4 }), 16, 12), x, y, z));
    for (let i = 0; i < 9; i++) em(f, esfera(.013, mat('#4a2a5a', { r: .3 }), 8, 6), .08 + (i % 3) * .022, .1 + (i / 3 | 0) * .018, .06 - (i / 3 | 0) * .01); }
  // jarro de pincéis (com a pena no meio) atrás da fruteira
  { const j = em(mesa, grupo(), .62, T, -.28); em(j, torno([[0, 0], [.05, 0], [.055, .14], [.06, .15], [0, .15]], mat('#6a7a8a', { r: .3, m: .1 }), 20), 0, 0, 0);
    for (let i = 0; i < 9; i++) { const a = i * 1.9, inc = ent(.08, .3); const p = em(j, grupo(), Math.cos(a) * .025, .02, Math.sin(a) * .025, Math.sin(a) * inc, 0, -Math.cos(a) * inc); em(p, cil(.004, .006, .26, mat(['#8a2a1a', '#2a2a2a', '#c9a878', '#3a5a3a'][i % 4], { r: .4 }), 8), 0, .13, 0); em(p, cil(.006, .006, .03, mat('#c8ccd0', { m: .8, r: .3 }), 8), 0, .275, 0); em(p, cil(.001, .006, .04, mat(['#2a1a10', '#c8a060', '#1a1a1a'][i % 3], { r: .9 }), 8), 0, .31, 0); }
    item('pena', 'Pena de escrever', 'Já voou; hoje escreve cartas.', P.pena(), j, -.01, .02, .01, .12, 1.2, -.15, 1); }
  // tinteiro, garrafa de terebintina, xícara, vela, régua, pano sujo
  em(mesa, torno([[0, 0], [.035, 0], [.035, .04], [.015, .05], [.015, .06], [0, .06]], mat('#1a2a3a', { r: .1, t: .8 })), .82, T, .05);
  em(mesa, torno([[0, 0], [.04, 0], [.042, .16], [.015, .2], [.015, .24], [0, .24]], mat('#a08a3a', { r: .1, t: .6 })), -.78, T, -.3);
  em(mesa, caixa(.03, .03, .026, mat('#2a1a10')), -.78, T + .255, -.3);
  { const x = em(mesa, grupo(), .8, T, .3); em(x, cil(.07, .05, .012, mat('#f0ebe0', { r: .3 }), 24), 0, .006, 0); em(x, torno([[0, 0], [.025, 0], [.04, .05], [.042, .06], [0, .01]], mat('#f0ebe0', { r: .3, lado: THREE.DoubleSide }), 20), 0, .012, 0); em(x, toro(.015, .004, mat('#f0ebe0', { r: .3 }), PI), .045, .045, 0, 0, 0, -PI / 2); em(x, cil(.038, .038, .002, mat('#4a2a14', { r: .1 }), 20), 0, .055, 0); }
  { const c = em(mesa, grupo(), -.9, T, .3); em(c, torno([[0, 0], [.06, 0], [.06, .01], [.015, .02], [.012, .03], [.02, .04], [0, .04]], latao), 0, 0, 0); em(c, cil(.014, .014, .14, creme, 12), 0, .11, 0); const ch = em(c, malha(new THREE.ConeGeometry(.008, .03, 8), new THREE.MeshBasicMaterial({ color: '#ffcf70' })), 0, .2, 0); ch.castShadow = false; animados.push(t => { ch.scale.y = 1 + Math.sin(t * 13) * .12 + Math.sin(t * 7.3) * .08; }); }
  em(mesa, caixa(.5, .004, .03, mat('#c8a060', { r: .5 })), .05, T + .002, .36, 0, -.1);
  { const pg = new THREE.PlaneGeometry(.3, .3, 10, 10), pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 30) * .015 + Math.cos(pp.getY(i) * 25) * .012 + .015); pg.computeVertexNormals(); em(mesa, malha(pg, mat('#ffffff', { map: Tex.tecido('#d8ccb0', '#8a3a2a', 'xadrez'), r: 1, lado: THREE.DoubleSide })), -.15, T + .002, .28, -PI / 2, 0, .7); }
  // espátula e almofariz
  em(mesa, caixa(.12, .003, .02, mat('#b8bcc0', { m: .9, r: .3 })), .15, T + .02, .2, 0, .8, .12);
  { const a = em(mesa, grupo(), .05, T, -.35); em(a, torno([[0, 0], [.05, 0], [.06, .06], [.055, .07], [.045, .03], [0, .03]], mat('#9a9088', { r: .8 }), 20), 0, 0, 0); em(a, cil(.012, .016, .12, mat('#9a9088', { r: .8 }), 10), .02, .09, 0, 0, 0, .4); }
  // embaixo da mesa: cesta com rolos de pano, bolas de papel e o dado
  { const c = em(mesa, grupo(), -.55, 0, -.1); em(c, torno([[0, 0], [.2, 0], [.24, .25], [.23, .26], [.19, .03], [0, .03]], mat('#b08a52', { r: 1, map: Tex.tecido('#b08a52', '#8a6a3a', 'xadrez', [6, 3]), lado: THREE.DoubleSide }), 20), 0, 0, 0);
    for (let i = 0; i < 3; i++) em(c, cil(.06, .06, .5, mat(['#7a3a2a', '#e8dcc0', '#3a4a3a'][i], { r: 1 }), 14), -.08 + i * .08, .3, 0, .2, 0, PI / 2 - .5 + i * .3); }
  for (let i = 0; i < 4; i++) em(mesa, malha(new THREE.IcosahedronGeometry(.035, 1), mat('#efe6d2', { r: 1 })), ent(-.2, .5), .03, ent(-.3, .3), r(), r(), r());
  em(mesa, caixa(.32, .22, .3, mat('#8a6a42', { r: .9 })), .55, .11, -.15, 0, .2);
  em(mesa, caixa(.25, .15, .25, mat('#7a5a38', { r: .9 })), .58, .3, -.12, 0, -.1);
  item('dado', 'Dado', 'Seis faces, nenhuma mentira.', P.dado(), mesa, -.8, 0, -.32, 0, .5, 0, 1.25);

  /* =========== cavalete, banquinho e paleta (esquerda, frente) =========== */
  const cav = em(raiz, grupo(), -2.25, 0, .85, 0, .55);
  em(cav, caixa(.05, 1.9, .04, pinho), -.32, .93, 0, -.12, 0, -.12); em(cav, caixa(.05, 1.9, .04, pinho), .32, .93, 0, -.12, 0, .12);
  em(cav, caixa(.05, 1.8, .04, pinho), 0, .88, -.35, .35, 0, 0);
  em(cav, caixa(.8, .05, .1, pinho), 0, .86, .07); em(cav, caixa(.8, .03, .03, pinho), 0, .89, .12);
  em(cav, caixa(.05, .05, .08, pinho), 0, 1.78, .0);
  { const t = em(cav, grupo(), 0, 1.22, .06, -.12); em(t, caixa(.86, .64, .025, tela), 0, 0, 0); em(t, malha(new THREE.PlaneGeometry(.84, .62), mat('#ffffff', { map: Tex.quadro('esboco', 6), r: .8 })), 0, 0, .0135); }
  for (let i = 0; i < 4; i++) em(cav, cil(.004, .005, .2, mat(['#8a2a1a', '#2a2a2a', '#c9a878'][i % 3]), 6), -.25 + i * .08, .905, .08, 0, 0, PI / 2 + ent(-.2, .2));
  const banq = em(raiz, grupo(), -1.6, 0, 1.55);
  em(banq, cil(.2, .2, .04, pinho, 24), 0, .62, 0);
  for (let i = 0; i < 3; i++) { const a = i * 2.094; em(banq, cil(.018, .022, .64, pinho, 8), Math.cos(a) * .13, .31, Math.sin(a) * .13, Math.sin(a) * .15, 0, -Math.cos(a) * .15); }
  em(banq, toro(.13, .01, pinho, PI * 2, 6, 24), 0, .25, 0, PI / 2);
  // paleta com montinhos de tinta e o anel
  const pal = em(banq, grupo(), 0, .64, 0, 0, .4);
  em(pal, forma(s => { s.moveTo(-.18, 0); s.bezierCurveTo(-.2, .14, .05, .17, .18, .1); s.bezierCurveTo(.24, .02, .2, -.1, .1, -.12); s.bezierCurveTo(.02, -.08, .05, -.02, -.02, -.04); s.bezierCurveTo(-.06, -.12, -.17, -.1, -.18, 0); const f = new THREE.Path(); f.absellipse(-.1, -.02, .025, .02, 0, PI * 2, true); s.holes.push(f); }, .008, mat('#ffffff', { map: Tex.madeira(30, 45, [6, 6], 21), r: .5 })), 0, .008, 0, PI / 2, 0, 0);
  const montes = ['#c8402a', '#a8201a', '#d8a12a', '#e8e0d0', '#2a5a3a', '#7a4a2a', '#d06a2a', '#b8302a', '#efc84a', '#5a2a1a'];
  montes.forEach((c, i) => { const a = -2.4 + i * .5, rr = .135; em(pal, esfera(ent(.014, .02), mat(c, { r: .25 }), 10, 8), Math.cos(a) * rr + .02, .012, Math.sin(a) * rr * .7 - .01).scale.set(1.2, .45, 1); });
  for (let i = 0; i < 5; i++) em(pal, esfera(.03, mat(montes[i * 2], { r: .3 }), 10, 8), ent(-.02, .12), .01, ent(-.02, .06)).scale.set(1.3, .12, 1);
  item('anel', 'Anel com rubi', 'Gira no dedo e brilha vermelho.', P.anel(), pal, .1, .009, .05, 0, 0, 0, 1);
  for (let i = 0; i < 2; i++) em(pal, cil(.004, .005, .24, mat(['#2a2a2a', '#8a2a1a'][i]), 6), -.02 + i * .03, .025, .02, 0, .6 + i * .3, PI / 2);

  /* =========== cadeira com pano e chapéu (frente, direita) =========== */
  const cad = em(raiz, grupo(), 1.1, 0, 1.55, 0, -.7);
  em(cad, caixa(.44, .04, .42, nogueira), 0, .46, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) em(cad, caixa(.035, .46, .035, nogueira), sx * .19, .23, sz * .18);
  for (const sx of [-1, 1]) em(cad, caixa(.035, .5, .035, nogueira), sx * .19, .72, -.18);
  for (let i = 0; i < 3; i++) em(cad, caixa(.36, .04, .02, nogueira), 0, .62 + i * .12, -.18);
  { const pg = new THREE.PlaneGeometry(.62, .9, 20, 24), pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i) - .2, cai = y < -.22; pp.setXYZ(i, x * (cai ? 1 + (-.22 - y) * .25 : 1), cai ? -.22 - .01 : y, (cai ? -(-.22 - y) : 0) + Math.sin(x * 20 + y * 6) * .008 + .004); } pg.computeVertexNormals(); em(cad, malha(pg, mat('#ffffff', { map: Tex.tecido('#6a5a3a', '#8a7a52', 'flor', [2, 2]), r: 1, lado: THREE.DoubleSide })), 0, .48, 0, -PI / 2, 0, 0); }
  { const ch = em(cad, grupo(), .02, .48, .02, .1, 0, .1); em(ch, cil(.17, .17, .008, mat('#2a2420', { r: .9 }), 28), 0, 0, 0); em(ch, cil(.095, .1, .11, mat('#2a2420', { r: .9 }), 24), 0, .06, 0); em(ch, cil(.101, .101, .025, mat('#6a1a14', { r: .8 }), 24), 0, .02, 0); }

  /* =========== poltrona, mesinha com abajur e baú (direita) =========== */
  const pol = em(raiz, grupo(), 2.75, 0, .15, 0, -PI / 2 + .35);
  const estofo = mat('#ffffff', { map: Tex.tecido('#6a2a22', '#8a4a2a', 'flor', [2, 2]), r: .95 });
  em(pol, caixa(.8, .2, .7, estofo), 0, .32, 0); em(pol, caixa(.72, .14, .62, estofo), 0, .48, .03);
  em(pol, caixa(.8, .62, .18, estofo), 0, .66, -.29, -.12);
  for (const s of [-1, 1]) { em(pol, caixa(.14, .3, .7, estofo), s * .4, .5, 0); em(pol, cil(.08, .08, .7, estofo, 14), s * .4, .65, 0, PI / 2); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) em(pol, cil(.025, .018, .22, nogueira, 8), sx * .35, .11, sz * .3);
  em(pol, caixa(.42, .3, .1, mat('#ffffff', { map: Tex.tecido('#c9a24a', '#a8803a', 'listra'), r: 1 })), .1, .66, -.16, -.3, .2, .1);
  const mesinha = em(raiz, grupo(), 3.0, 0, -.95);
  em(mesinha, cil(.3, .3, .035, nogueira, 32), 0, .66, 0);
  em(mesinha, torno([[.18, 0], [.16, .03], [.04, .06], [.035, .3], [.05, .4], [.03, .5], [.04, .62], [.08, .64], [0, .64]], nogueira, 18), 0, 0, 0);
  // abajur
  const abj = em(mesinha, grupo(), .02, .68, .05);
  em(abj, torno([[0, 0], [.08, 0], [.07, .02], [.03, .05], [.06, .14], [.05, .2], [.015, .25], [.015, .34], [0, .34]], mat('#5a7a6a', { r: .25, m: .2 }), 24), 0, 0, 0);
  const cup = em(abj, malha(new THREE.CylinderGeometry(.1, .2, .22, 28, 1, true), mat('#efdcb0', { r: .9, lado: THREE.DoubleSide, e: '#ffb860', ei: .55 })), 0, .42, 0);
  cup.castShadow = false;
  const lampada = em(abj, malha(new THREE.SphereGeometry(.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c8' })), 0, .37, 0); lampada.castShadow = false;
  item('tesoura', 'Tesoura', 'Duas lâminas que trabalham juntas.', P.tesoura(), mesinha, -.05, .678, -.13, 0, 2.6, 0, 1.15);
  { const l = em(mesinha, grupo(), -.12, .678, .12, 0, .5); em(l, caixa(.18, .04, .24, mat('#2f4a32', { r: .7 })), 0, .02, 0); em(l, caixa(.17, .035, .23, creme), .005, .02, 0); }
  { const x = em(mesinha, grupo(), .16, .678, -.1); em(x, cil(.06, .045, .01, mat('#f0ebe0', { r: .3 }), 20), 0, .005, 0); em(x, torno([[0, 0], [.02, 0], [.035, .045], [.037, .05], [0, .01]], mat('#f0ebe0', { r: .3, lado: THREE.DoubleSide }), 18), 0, .01, 0); }
  // baú (encostado na parede direita, frente para a sala)
  const bau = em(raiz, grupo(), 3.05, 0, 1.55, 0, -PI / 2);
  const bw = .9, bh = .42, bd = .5;
  const madBau = mat('#ffffff', { map: Tex.madeira(18, 26, [2, 1], 33), r: .6 });
  em(bau, caixa(bw, .03, bd, madBau), 0, .05, 0);
  em(bau, caixa(bw, bh - .04, .03, madBau), 0, bh / 2 + .02, bd / 2 - .015); em(bau, caixa(bw, bh - .04, .03, madBau), 0, bh / 2 + .02, -bd / 2 + .015);
  for (const s of [-1, 1]) em(bau, caixa(.03, bh - .04, bd, madBau), s * (bw / 2 - .015), bh / 2 + .02, 0);
  for (const x of [-.3, .3]) for (const s of [-1, 1]) em(bau, caixa(.05, bh - .02, .008, ferro), x, bh / 2 + .02, s * (bd / 2 + .004));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) em(bau, caixa(.06, .04, .06, ferro), sx * (bw / 2 - .02), .02, sz * (bd / 2 - .02));
  // dentro do baú: pano, cartas, moedas de prata e cobre e a moeda de ouro
  { const pg = new THREE.PlaneGeometry(bw - .08, bd - .08, 16, 10), pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 14) * .02 + Math.cos(pp.getY(i) * 18) * .015); pg.computeVertexNormals(); em(bau, malha(pg, mat('#9a3a3a', { r: .9, lado: THREE.DoubleSide })), 0, .2, 0, -PI / 2); }
  { const l = new THREE.PointLight('#ffd9a8', 0, 1.2, 2); l.position.set(0, .38, 0); bau.add(l); animados.push(() => { l.intensity = iBau ? iBau.k * .5 : 0; }); }
  for (let i = 0; i < 5; i++) em(bau, malha(new THREE.PlaneGeometry(.16, .1), mat(['#e8dcbc', '#efe5cc', '#d8c8a0'][i % 3], { r: .9, lado: THREE.DoubleSide })), -.25 + i * .06, .235 + i * .004, -.08 + (i % 2) * .05, -PI / 2, 0, ent(-.5, .5));
  for (let i = 0; i < 9; i++) { const m = P.moeda(i % 2 ? 'prata' : 'cobre'); em(bau, m, ent(-.05, .3), .228 + i * .003, ent(-.12, .14), ent(-.3, .3), r() * 6, ent(-.3, .3)); }
  item('moeda', 'Moeda de ouro', 'Tem cara, tem coroa e brilha.', P.moeda('ouro'), bau, .1, .257, .0, .15, .4, .08, 1);
  const tampa = em(bau, grupo(), 0, bh, -bd / 2);
  em(tampa, caixa(bw + .02, .05, bd + .02, madBau), 0, .025, bd / 2);
  for (const x of [-.3, .3]) em(tampa, caixa(.05, .012, bd + .03, ferro), x, .135, bd / 2);
  em(tampa, caixa(.07, .09, .015, latao), 0, -.01, bd + .015);
  const iBau = interativo(tampa, 'tampa', k => { tampa.rotation.x = -1.75 * k; });
  itens.at(-1).dentro = [iBau];
  // tampa abaulada: meio cilindro deitado no comprimento
  { const c = malha(new THREE.CylinderGeometry(1, 1, bw + .02, 24, 1, false, 0, PI), madBau); c.rotation.z = PI / 2; c.scale.set(.08, 1, bd / 2 + .01); c.position.set(0, .05, bd / 2); tampa.add(c); }

  /* =========== luz =========== */
  const MOVEL = Tex.MOVEL;
  const hemi = new THREE.HemisphereLight('#ffe9cc', '#5a3a26', 1.05); raiz.add(hemi);
  const sol = new THREE.DirectionalLight('#ffd9a0', 4.2);
  sol.position.set(-7, 6, -2.4); sol.target.position.set(-1.6, 0, 0); raiz.add(sol, sol.target);
  sol.castShadow = true; sol.shadow.mapSize.set(MOVEL ? 1024 : 2048, MOVEL ? 1024 : 2048);
  Object.assign(sol.shadow.camera, { left: -5, right: 5, top: 4.5, bottom: -4.5, near: 2, far: 18 }); sol.shadow.bias = -.0004; sol.shadow.normalBias = .02;
  const frente = new THREE.DirectionalLight('#ffe2c0', .9); frente.position.set(1, 3, 8); raiz.add(frente);
  const luzAbajur = new THREE.PointLight('#ffb35c', 2.6, 4.5, 1.6); luzAbajur.position.set(3.02, 1.07, -.9); raiz.add(luzAbajur);
  const vela = new THREE.PointLight('#ffb050', .6, 2, 2); vela.position.set(-1.2, 1.0, .75); raiz.add(vela);
  animados.push(t => { vela.intensity = .55 + Math.sin(t * 11) * .08 + Math.sin(t * 17) * .05; luzAbajur.intensity = 2.6 + Math.sin(t * 40) * .02; });
  // fachos de sol entrando pela janela (planos que somam luz, sem clique)
  const tRaio = Tex.raio(), dir = new THREE.Vector3().subVectors(sol.target.position, sol.position).normalize();
  const fachos = grupo(); raiz.add(fachos);
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.7, 4.2), new THREE.MeshBasicMaterial({ map: tRaio, transparent: true, opacity: .085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: '#ffd9a0' }));
    const z = jz0 + .2 + i * (jw - .4) / 4, y = 1.45 + (i % 2) * .5;
    m.position.set(-W + .1, y, z).addScaledVector(dir, 2.1); m.lookAt(m.position.clone().add(new THREE.Vector3(0, 0, 1)));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); m.rotateY(i * .6);
    m.userData.semClique = true; m.layers.set(1); fachos.add(m);
  }
  // poeira dançando na luz
  const NP = MOVEL ? 160 : 320, pts = new Float32Array(NP * 3), vel = [];
  for (let i = 0; i < NP; i++) { const k = r(); const p = new THREE.Vector3(-W + .3, ent(1, 2.4), ent(jz0, jz1)).addScaledVector(dir, k * 3.6); pts.set([p.x + ent(-.3, .3), p.y + ent(-.3, .3), p.z + ent(-.4, .4)], i * 3); vel.push(ent(0, 9)); }
  const gp = new THREE.BufferGeometry(); gp.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const poeira = new THREE.Points(gp, new THREE.PointsMaterial({ size: .022, map: Tex.bolinha(), transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe2b0' }));
  poeira.layers.set(1); poeira.userData.semClique = true; raiz.add(poeira);
  const base = pts.slice();
  animados.push(t => { for (let i = 0; i < NP; i++) { const f = vel[i]; pts[i * 3] = base[i * 3] + Math.sin(t * .13 + f) * .08; pts[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * .09 + f * 2) * .12; pts[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * .11 + f) * .08; } gp.attributes.position.needsUpdate = true; });
  // cortina respira com a brisa
  animados.push(t => { cortB.m.rotation.y = Math.sin(t * .7) * .03; if (!cortA.g.userData.interativo.aberto) cortA.m.rotation.y = Math.sin(t * .6 + 1) * .025; });

  // sombras: tudo projeta e recebe, menos o que pediu para não projetar
  raiz.traverse(o => { if (o.isMesh && o.castShadow !== false && !o.userData.semClique) { o.receiveShadow = true; } });

  /* ---------- funções internas ---------- */
  function item(id, nome, charada, obj, pai, x, y, z, rx, ry, rz, s = 1, dentro = null) {
    em(pai, obj, x, y, z, rx, ry, rz, s);
    const it = { id, nome, charada, obj, achado: false, dentro: dentro ? [dentro] : null };
    obj.userData.item = it; itens.push(it); return it;
  }
  function interativo(raizI, tipo, aplicar) {
    const it = { raiz: raizI, tipo, aberto: false, k: 0, aplicar };
    raizI.userData.interativo = it; interativos.push(it); return it;
  }
  function instanciarLivros(lista) {
    for (let tipo = 0; tipo < 3; tipo++) {
      const sel = lista.filter(l => l.tipo === tipo); if (!sel.length) continue;
      const geo = new THREE.BoxGeometry(1, 1, 1), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) if (i < 16 || i >= 20) uv.setXY(i, .015, .995);   // só a face +z (lombada) usa o desenho
      const m = new THREE.MeshStandardMaterial({ map: Tex.lombada(tipo), roughness: .62 });
      const inst = new THREE.InstancedMesh(geo, m, sel.length); inst.castShadow = inst.receiveShadow = true;
      const o = new THREE.Object3D(), c = new THREE.Color();
      sel.forEach((l, i) => { o.position.set(l.x, l.y, l.z); o.rotation.set(0, l.ry || 0, l.rz || 0); o.scale.set(l.w, l.h, l.d); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); inst.setColorAt(i, c.set(l.cor)); });
      raiz.add(inst);
    }
  }

  return {
    nome: 'O Ateliê do Pintor', raiz, itens, interativos,
    camera: { alvo: [-.15, 1.0, -.35], dist: 4.75, az: 0, el: .2, fov: 50, az0: -.8, az1: .8, el0: -.14, el1: .9, d0: .32, d1: 5.3,
      caixaAlvo: [[-3.36, .08, -2.36], [3.36, 2.7, 2.2]], caixaCam: [[-3.38, .1, -2.38], [3.38, 3.05, 6.5]] },
    fundo: '#1d1712',
    atualizar(t, dt) { animados.forEach(f => f(t, dt)); }
  };
}
