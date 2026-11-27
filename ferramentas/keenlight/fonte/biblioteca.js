/* Nível 5 — Biblioteca Secreta (3D, lista só com silhuetas).
   Estantes do chão ao teto, lareira acesa, escada de rodinhas, mesa de xadrez, telescópio na janela
   e uma estante que gira e revela um nicho escondido. Sala: x -3.5..3.5, z -2.5..2.5, altura 3.4. */
function criarBiblioteca(cena) {
  const { mat, caixa, cil, esfera, torno, toro, tubo, forma, em, grupo, malha } = P;
  const r = Tex.r, ent = Tex.ent; Tex.sorte(777);
  const raiz = grupo(); cena.add(raiz);
  const itens = [], interativos = [], animados = [];
  const W = 3.5, D = 2.5, H = 3.4, PI = Math.PI, MOVEL = Tex.MOVEL;

  // ---------- materiais ----------
  const mogno = mat('#ffffff', { map: Tex.madeira(14, 20, [1, 1], 51), r: .5 });
  const mognoEsc = mat('#ffffff', { map: Tex.madeira(12, 13, [1, 1], 52), r: .55 });
  const pedra = mat('#ffffff', { map: (() => { Tex.sorte(9); const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#8a8070'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { x.fillStyle = `hsl(35,${10 + Tex.r() * 8}%,${42 + Tex.r() * 12}%)`; x.fillRect((j % 2 ? 32 : 0) + i * 64 + 2, j * 32 + 2, 60, 28); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })(), r: .9 });
  const latao = mat('#b39048', { r: .35, m: .85 }), ferro = mat('#2a2522', { r: .5, m: .7 }), couro = mat('#5a2a1a', { r: .55 }), veludo = mat('#2f4a32', { r: .9 });
  const parede = mat('#ffffff', { map: (() => { const t = Tex.papelParede(); t.repeat.set(4, 2); return t; })(), r: .9 });

  /* =========== sala =========== */
  em(raiz, malha(new THREE.PlaneGeometry(2 * W, 2 * D), mat('#ffffff', { map: (() => { const t = Tex.piso(); t.repeat.set(3, 2.2); return t; })(), r: .55 })), 0, 0, 0, -PI / 2).castShadow = false;
  // parede do fundo com um vão (x 2.0 a 2.84, até 3.1 m) para o nicho secreto
  em(raiz, malha(new THREE.PlaneGeometry(W + 2.0, H), parede), (-W + 2.0) / 2, H / 2, -D);
  em(raiz, malha(new THREE.PlaneGeometry(W - 2.84, H), parede), (W + 2.84) / 2, H / 2, -D);
  em(raiz, malha(new THREE.PlaneGeometry(.84, H - 3.1), parede), 2.42, (H + 3.1) / 2, -D);
  em(raiz, malha(new THREE.PlaneGeometry(2 * D, H), parede), W, H / 2, 0, 0, -PI / 2);
  // parede esquerda com janela alta (z -.9 a .5, y 1.0 a 2.9)
  const jz0 = -.9, jz1 = .5, jy0 = 1.0, jy1 = 2.9;
  const pe = (w, h, y, z) => em(raiz, malha(new THREE.PlaneGeometry(w, h), parede), -W, y, z, 0, PI / 2);
  pe(D + jz0, H, H / 2, (-D + jz0) / 2); pe(D - jz1, H, H / 2, (D + jz1) / 2); pe(jz1 - jz0, jy0, jy0 / 2, (jz0 + jz1) / 2); pe(jz1 - jz0, H - jy1, (H + jy1) / 2, (jz0 + jz1) / 2);
  const casca = mat('#2a201a', { r: 1 });
  em(raiz, caixa(.2, H, D + jz0, casca), -W - .1, H / 2, (-D + jz0) / 2); em(raiz, caixa(.2, H, D - jz1 + .4, casca), -W - .1, H / 2, (D + jz1) / 2 + .2);
  em(raiz, caixa(.2, jy0, jz1 - jz0, casca), -W - .1, jy0 / 2, (jz0 + jz1) / 2); em(raiz, caixa(.2, H - jy1, jz1 - jz0, casca), -W - .1, (H + jy1) / 2, (jz0 + jz1) / 2);
  em(raiz, caixa(2 * W + .4, .2, 2 * D + .4, casca), 0, H + .1, 0);
  // teto em caixotões
  em(raiz, malha(new THREE.PlaneGeometry(2 * W, 2 * D), mat('#3a2a1e', { r: .8 })), 0, H, 0, PI / 2);
  for (let i = -3; i <= 3; i++) em(raiz, caixa(.1, .14, 2 * D, mogno), i, H - .07, 0);
  for (let j = -2; j <= 2; j++) em(raiz, caixa(2 * W, .14, .1, mogno), 0, H - .07, j);
  // céu noturno lá fora
  const ceuT = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#2a3040'); gr.addColorStop(1, '#6a6a7a'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 80; i++) { x.fillStyle = 'rgba(255,255,240,.8)'; x.fillRect(Math.random() * 256, Math.random() * 160, 1.5, 1.5); } x.fillStyle = '#f0ecd8'; x.beginPath(); x.arc(190, 60, 18, 0, 7); x.fill(); x.fillStyle = '#1a1e24'; x.beginPath(); x.moveTo(0, 256); for (let i = 0; i <= 256; i += 16) x.lineTo(i, 200 + Math.sin(i * .05) * 20); x.lineTo(256, 256); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  em(raiz, new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: ceuT })), -W - 1.2, 2, (jz0 + jz1) / 2, 0, PI / 2).userData.semClique = true;
  const jan = em(raiz, grupo(), -W + .03, 0, (jz0 + jz1) / 2, 0, PI / 2), jw = jz1 - jz0, jh = jy1 - jy0;
  for (const s of [-1, 1]) em(jan, caixa(.08, jh + .1, .14, mognoEsc), s * (jw / 2 + .04), (jy0 + jy1) / 2, 0);
  em(jan, caixa(jw + .16, .08, .14, mognoEsc), 0, jy1 + .04, 0); em(jan, caixa(jw + .3, .06, .3, mognoEsc), 0, jy0 - .03, .08);
  em(jan, caixa(.04, jh, .06, mognoEsc), 0, (jy0 + jy1) / 2, -.03); for (let k = 1; k < 4; k++) em(jan, caixa(jw, .03, .06, mognoEsc), 0, jy0 + k * jh / 4, -.03);
  em(jan, malha(new THREE.PlaneGeometry(jw, jh), mat('#9aaab8', { r: .05, t: .18 })), 0, (jy0 + jy1) / 2, -.05).castShadow = false;
  // lambri escuro em volta
  const lamb = (comp, x, z, ry) => { const g = em(raiz, grupo(), x, 0, z, 0, ry); em(g, caixa(comp, 1.0, .03, mognoEsc), 0, .5, .015); em(g, caixa(comp, .05, .06, mogno), 0, 1.0, .03); em(g, caixa(comp, .15, .05, mogno), 0, .075, .025); };
  lamb(2 * D, W, 0, -PI / 2); lamb(D + jz0, -W, (-D + jz0) / 2, PI / 2); lamb(D - jz1, -W, (D + jz1) / 2, PI / 2);

  /* =========== estantes do fundo (livros instanciados) =========== */
  const livros = [], cores = ['#6e1f1a', '#2f4a32', '#5a3a1e', '#8a6a2a', '#3a2a24', '#7a4a2a', '#4a2a3a', '#26352e', '#9a7a4a', '#5e2a22', '#1e2a3a', '#c9b48a'];
  function estante(x, z, w, h, d, pai = raiz, buracos = {}) {
    const g = em(pai, grupo(), x, 0, z); g.updateMatrixWorld(true);
    em(g, caixa(.05, h, d, mogno), -w / 2, h / 2, 0); em(g, caixa(.05, h, d, mogno), w / 2, h / 2, 0);
    em(g, caixa(w + .1, .08, d + .05, mogno), 0, h + .04, .01); em(g, caixa(w, .12, d, mogno), 0, .06, 0); em(g, caixa(w, h, .02, mognoEsc), 0, h / 2, -d / 2 + .01);
    const nP = Math.round(h / .4), ys = [];
    for (let i = 0; i < nP; i++) { const y = .12 + i * (h - .16) / nP; ys.push(y); em(g, caixa(w - .05, .03, d - .02, mogno), 0, y, 0); }
    ys.forEach((y, iy) => {
      let xx = -w / 2 + .04; const vao = buracos[iy] || [];
      while (xx < w / 2 - .05) {
        const b = vao.find(([a, c]) => xx >= a - .001 && xx <= c); if (b) { xx = b[1] + .01; continue; }
        const bw = ent(.025, .06), bh = ent(.22, Math.min(.34, (h - .16) / nP - .05)), bd = ent(.18, d - .06), inc = r() < .06 ? ent(.1, .25) : 0;
        if (xx + bw > w / 2 - .03) break;
        const p = new THREE.Vector3(xx + bw / 2, y + .015 + bh / 2, d / 2 - bd / 2 - .02); g.localToWorld(p);
        livros.push({ x: p.x, y: p.y, z: p.z, w: bw, h: bh, d: bd, rz: -inc, ry: g.rotation.y, cor: cores[(r() * cores.length) | 0], tipo: (r() * 3) | 0 });
        xx += bw + (inc ? .03 : .002);
      }
    });
    return { g, ys };
  }
  const zE = -D + .2;
  const eA = estante(-2.35, zE, 2.0, 3.1, .38, raiz, { 2: [[.4, .75]], 4: [[-.6, -.3]], 6: [[.05, .3]] });
  const eB = estante(1.55, zE, .9, 3.1, .38, raiz, { 3: [[-.2, .2]] });
  const eC = estante(3.17, zE, .66, 3.1, .38);
  raiz.updateMatrixWorld(true);
  // estante secreta (gira para fora revelando um nicho)
  const secX = 2.42, piv = em(raiz, grupo(), secX - .42, 0, zE + .2);
  const secG = em(piv, grupo(), .42, 0, -.2);
  { const g = secG, w = .84, h = 3.1, d = .38;
    em(g, caixa(.04, h, d, mogno), -w / 2, h / 2, 0); em(g, caixa(.04, h, d, mogno), w / 2, h / 2, 0); em(g, caixa(w, .1, d, mogno), 0, .05, 0); em(g, caixa(w + .04, .06, d, mogno), 0, h, 0); em(g, caixa(w, h, .03, mognoEsc), 0, h / 2, -d / 2 + .015);
    for (let i = 0; i < 7; i++) { const y = .12 + i * .42; em(g, caixa(w - .04, .03, d - .02, mogno), 0, y, 0); let xx = -w / 2 + .03; while (xx < w / 2 - .06) { const bw = ent(.03, .06), bh = ent(.24, .34); const m = caixa(bw, bh, .24, mat(cores[(r() * cores.length) | 0], { r: .6 })); em(g, m, xx + bw / 2, y + .015 + bh / 2, .05); xx += bw + .003; } }
    // um livro vermelho se destaca: a pista da passagem
    em(g, caixa(.05, .3, .26, mat('#a8201a', { r: .4 })), .2, .12 + 3 * .42 + .17, .07);
  }
  const iSec = interativo(piv, 'porta', k => { piv.rotation.y = -1.95 * k; }); iSec.segredo = true;
  // nicho atrás da estante secreta
  { const n = em(raiz, grupo(), secX, 0, -D);
    em(n, caixa(.86, 3.1, .02, mat('#3a2a20', { r: .9 })), 0, 1.55, -.37); for (const s of [-1, 1]) em(n, caixa(.02, 3.1, .38, mognoEsc), s * .43, 1.55, -.18); em(n, caixa(.86, .02, .38, mognoEsc), 0, 3.1, -.18); em(n, caixa(.86, .02, .38, mognoEsc), 0, .01, -.18);
    em(n, caixa(.8, .04, .34, mognoEsc), 0, 1.2, -.18);
    const cx = em(n, grupo(), -.15, 1.22, -.2); em(cx, caixa(.22, .12, .14, mat('#4a2a1a', { r: .5 })), 0, .06, 0); em(cx, caixa(.23, .02, .15, latao), 0, .12, 0);
    em(n, cil(.02, .02, .14, mat('#efe5cc'), 10), .2, 1.29, -.18);
    const chama = em(n, malha(new THREE.ConeGeometry(.012, .04, 8), new THREE.MeshBasicMaterial({ color: '#ffcf70' })), .2, 1.38, -.18); chama.castShadow = false;
    const luz = new THREE.PointLight('#ffb050', 0, 1.4, 2); luz.position.set(secX, 1.6, -D - .12); raiz.add(luz);
    animados.push(t => { luz.intensity = iSec.k * (.7 + Math.sin(t * 13) * .08); chama.scale.y = 1 + Math.sin(t * 11) * .15; });
    item('chave', 'Chave do segredo', 'Abre o que ninguém deveria abrir.', P.chave(), n, .02, 1.22, -.16, 0, -.6, 0, 1.3, iSec);
  }

  /* =========== lareira de pedra com fogo =========== */
  const lar = em(raiz, grupo(), -.2, 0, -D + .3);
  em(lar, caixa(1.9, 1.3, .55, pedra), 0, .65, 0);
  em(lar, caixa(1.1, .85, .6, mat('#120c08', { r: 1 })), 0, .45, .02);
  em(lar, caixa(2.15, .1, .7, mognoEsc), 0, 1.35, .05);
  em(lar, caixa(1.5, 2.0, .35, pedra), 0, 2.4, -.08);
  for (let i = 0; i < 3; i++) em(lar, cil(.05, .05, .7, mat('#3a2418', { r: .9 }), 8), -.15 + i * .15, .14 + (i % 2) * .05, .1, 0, ent(-.3, .3), PI / 2);
  em(lar, caixa(.8, .03, .3, ferro), 0, .07, .1);
  const fogo = [], cFogo = ['#ffcf60', '#ff9a30', '#ff6a20'];
  for (let i = 0; i < 9; i++) { const f = em(lar, malha(new THREE.ConeGeometry(.06 + r() * .05, .25 + r() * .2, 8), new THREE.MeshBasicMaterial({ color: cFogo[i % 3], transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })), -.3 + i * .075, .32, .12 + (i % 2) * .05); f.castShadow = false; f.userData.semClique = true; fogo.push([f, r() * 9]); }
  const luzFogo = new THREE.PointLight('#ff9a40', 3, 5.5, 1.6); luzFogo.position.set(-.2, .6, -D + .8); raiz.add(luzFogo);
  animados.push(t => { fogo.forEach(([f, ph]) => { f.scale.set(1, .8 + Math.sin(t * 9 + ph) * .25 + Math.sin(t * 15 + ph) * .1, 1); }); luzFogo.intensity = 2.8 + Math.sin(t * 10) * .3 + Math.sin(t * 23) * .2; });
  // em cima da lareira: relógio, castiçais, vasinhos e a ampulheta
  const T = 1.4;
  { const c = em(lar, grupo(), 0, T, .05); em(c, caixa(.34, .42, .14, mogno), 0, .21, 0); em(c, cil(.11, .11, .02, mat('#ffffff', { map: Tex.mostrador() }), 24), 0, .26, .075, PI / 2, PI / 2); em(c, cil(.12, .17, .06, mogno, 16), 0, .45, 0); }
  for (const x of [-.75, .62]) { const c = em(lar, grupo(), x, T, .08); em(c, torno([[0, 0], [.05, 0], [.015, .03], [.012, .24], [.04, .27], [0, .27]], latao), 0, 0, 0); for (const s of [-1, 0, 1]) em(c, cil(.009, .009, .12, mat('#efe5cc'), 8), s * .05, .32, 0); }
  em(lar, torno([[0, 0], [.05, 0], [.07, .1], [.04, .18], [.05, .2], [0, .2]], mat('#3a5a5a', { r: .2 })), -.45, T, .02);
  em(lar, torno([[0, 0], [.04, 0], [.05, .06], [.03, .12], [0, .12]], mat('#8a3a2a', { r: .3 })), .3, T, .05);
  item('ampulheta', 'Ampulheta', null, criarAmpulheta(), lar, -.3, T, .12, 0, 0, 0, 1.15);
  itens.at(-1).vistaIcone = [0, .3, 1];
  // retrato sobre a lareira
  { const g = em(raiz, grupo(), -.2, 2.45, -D + .44); em(g, malha(new THREE.PlaneGeometry(.7, .9), mat('#ffffff', { map: Tex.quadro('retrato', 31, 384, 512), r: .7 })), 0, 0, .021); for (const [w, h, x, y] of [[.86, .08, 0, .49], [.86, .08, 0, -.49], [.08, .9, -.39, 0], [.08, .9, .39, 0]]) em(g, caixa(w, h, .04, mat('#b8893a', { r: .35, m: .8 })), x, y, 0); }

  /* =========== escada de rodinhas encostada na estante (com a maçã num degrau) =========== */
  const esc = em(raiz, grupo(), -1.75, 0, -D + .62, -.22, 0, 0);
  for (const s of [-1, 1]) em(esc, caixa(.04, 3.0, .05, mogno), s * .22, 1.5, 0);
  for (let i = 0; i < 9; i++) em(esc, caixa(.44, .03, .08, mogno), 0, .3 + i * .32, .01);
  for (const s of [-1, 1]) em(esc, cil(.035, .035, .03, ferro, 12), s * .22, .035, 0, 0, 0, PI / 2);
  lt3([-2.0, 2.95, -D + .43], [-1.5, 2.95, -D + .43]);
  item('maca', 'Maçã', null, criarMaca(), esc, .08, .3 + 3 * .32 + .015, .02, .22, 0, 0, 1.1);

  /* =========== poltrona, mesinha e luminária perto da janela =========== */
  const pol = em(raiz, grupo(), -2.75, 0, 1.25, 0, PI / 2 - .5);
  em(pol, caixa(.8, .22, .7, couro), 0, .32, 0); em(pol, caixa(.72, .12, .6, couro), 0, .48, .03); em(pol, caixa(.8, .7, .18, couro), 0, .72, -.28, -.1);
  for (const s of [-1, 1]) em(pol, caixa(.14, .34, .7, couro), s * .4, .52, 0);
  for (let i = 0; i < 12; i++) em(pol, esfera(.012, latao, 6, 4), -.36 + (i % 6) * .14, .62 + (i / 6 | 0) * .2, -.18);
  const mes = em(raiz, grupo(), -2.95, 0, .35);
  em(mes, cil(.26, .26, .03, mogno, 28), 0, .62, 0); em(mes, cil(.03, .05, .6, mogno, 10), 0, .3, 0); em(mes, cil(.18, .18, .03, mogno, 20), 0, .015, 0);
  for (let i = 0; i < 4; i++) em(mes, caixa(.2 - i * .015, .035, .15, mat(cores[i * 3], { r: .6 })), .05, .652 + i * .035, -.05, 0, ent(-.3, .3));
  item('xicara', 'Xícara', null, criarXicara(), mes, -.13, .635, .1, 0, .6, 0, 1.15);
  { const l = em(raiz, grupo(), -3.15, 0, 1.95); em(l, cil(.16, .18, .03, latao, 20), 0, .015, 0); em(l, cil(.012, .012, 1.6, latao, 8), 0, .8, 0); const cup = em(l, malha(new THREE.CylinderGeometry(.13, .22, .24, 24, 1, true), mat('#d8c8a0', { r: .9, lado: THREE.DoubleSide, e: '#ffb060', ei: .5 })), 0, 1.65, 0); cup.castShadow = false; const pl = new THREE.PointLight('#ffb35c', 1.6, 4, 1.6); pl.position.set(-3.15, 1.6, 1.95); raiz.add(pl); }
  // telescópio no tripé junto à janela
  { const t = em(raiz, grupo(), -2.95, 0, -.6, 0, .4); for (let i = 0; i < 3; i++) { const a = i * 2.094; em(t, cil(.012, .015, 1.3, mogno, 6), Math.cos(a) * .2, .62, Math.sin(a) * .2, Math.sin(a) * .16, 0, -Math.cos(a) * .16); } em(t, cil(.05, .035, .9, latao, 16), 0, 1.35, 0, 0, 0, 1.1); em(t, cil(.055, .055, .05, mogno, 16), -.4, 1.53, 0, 0, 0, 1.1); }

  /* =========== mesa de trabalho com gaveta (centro) =========== */
  const tap = em(raiz, malha(new THREE.CircleGeometry(1.6, 48), mat('#ffffff', { map: Tex.tapete(), r: .95 })), -.1, .006, .6, -PI / 2); tap.castShadow = false;
  const mesa = em(raiz, grupo(), -.2, 0, .55);
  const mw = 1.7, md = .85, mh = .78;
  em(mesa, caixa(mw, .05, md, mogno), 0, mh - .025, 0); em(mesa, caixa(mw - .02, .02, md - .02, veludo), 0, mh + .001, 0);
  for (const s of [-1, 1]) em(mesa, caixa(.45, mh - .05, md - .06, mognoEsc), s * (mw / 2 - .25), (mh - .05) / 2, 0);
  em(mesa, caixa(mw - .9, .04, md - .1, mognoEsc), 0, .1, 0);
  // gaveta do meio (a lanterna fica embaixo da mesa; a lupa, na gaveta)
  const gav = em(mesa, grupo(), 0, mh - .12, md / 2 - .01);
  em(gav, caixa(.74, .12, .025, mogno), 0, 0, 0); em(gav, esfera(.016, latao, 10, 8), 0, 0, .025);
  em(gav, caixa(.7, .01, .6, mogno), 0, -.05, -.3); for (const s of [-1, 1]) em(gav, caixa(.012, .09, .6, mogno), s * .35, 0, -.3); em(gav, caixa(.7, .09, .012, mogno), 0, 0, -.6);
  for (let i = 0; i < 5; i++) em(gav, malha(new THREE.PlaneGeometry(.16, .22), mat('#efe5cc', { r: .9, lado: THREE.DoubleSide })), ent(-.25, .2), -.044 + i * .002, -ent(.15, .45), -PI / 2, 0, ent(-.6, .6));
  const iGav = interativo(gav, 'gaveta', k => { gav.position.z = md / 2 - .01 + .4 * k; });
  item('lupa', 'Lupa', null, criarLupa(), gav, .15, -.044, -.3, 0, -.5, 0, 1.1, iGav);
  // em cima: mapa aberto, livros, tinteiro, castiçal, globo de mesa
  { const m = em(mesa, malha(new THREE.PlaneGeometry(.6, .45), mat('#ffffff', { map: Tex.mapa(), r: .9 })), -.15, mh + .004, -.05, -PI / 2, 0, .1); m.castShadow = false; }
  for (let i = 0; i < 5; i++) em(mesa, caixa(.24 - i * .01, .045, .17, mat(cores[(i * 5) % 12], { r: .6 })), .55, mh + .022 + i * .045, -.15, 0, ent(-.25, .25));
  em(mesa, torno([[0, 0], [.03, 0], [.03, .03], [.012, .04], [.012, .05], [0, .05]], mat('#1a2a3a', { r: .1, t: .85 })), .3, mh, .2);
  { const c = em(mesa, grupo(), -.65, mh, .2); em(c, torno([[0, 0], [.06, 0], [.06, .01], [.015, .02], [.012, .03], [.02, .04], [0, .04]], latao), 0, 0, 0); em(c, cil(.014, .014, .13, mat('#efe5cc'), 10), 0, .105, 0); }
  { const gl = em(mesa, grupo(), -.6, mh, -.25); em(gl, cil(.05, .06, .02, mogno), 0, .01, 0); em(gl, cil(.006, .006, .09, latao, 6), 0, .06, 0); em(gl, esfera(.08, mat('#ffffff', { map: Tex.mapa(), r: .5 }), 20, 14), 0, .17, 0, .4); }
  item('lanterna', 'Lanterna', null, criarLanterna(), mesa, -.05, .12, -.15, 0, .5, 0, 1.15);
  itens.at(-1).vistaIcone = [0, .3, 1];
  // cadeira da mesa
  { const c = em(raiz, grupo(), -.2, 0, 1.4, 0, PI + .15); em(c, caixa(.48, .05, .45, mogno), 0, .48, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) em(c, cil(.02, .02, .48, mogno, 8), sx * .2, .24, sz * .19); em(c, caixa(.48, .5, .04, couro), 0, .78, -.21); }

  /* =========== mesa de xadrez (frente, direita) =========== */
  const xad = em(raiz, grupo(), 1.6, 0, 1.25, 0, -.3);
  em(xad, cil(.04, .07, .68, mogno, 10), 0, .34, 0); em(xad, cil(.25, .25, .03, mogno, 20), 0, .015, 0);
  const tab = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#3a2418' : '#e8d8b8'; x.fillRect(i * 32, j * 32, 32, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  em(xad, caixa(.56, .04, .56, mogno), 0, .7, 0); em(xad, malha(new THREE.PlaneGeometry(.48, .48), mat('#ffffff', { map: tab, r: .4 })), 0, .721, 0, -PI / 2).castShadow = false;
  const peaoG = [[0, 0], [.014, 0], [.014, .004], [.01, .007], [.007, .011], [.005, .026], [.009, .028], [.005, .031], [.008, .038], [.007, .044], [0, .046]];
  const bispo = [[0, 0], [.016, 0], [.016, .005], [.009, .012], [.006, .04], [.01, .044], [.006, .048], [.01, .06], [.004, .074], [0, .078]];
  const rei = [[0, 0], [.018, 0], [.018, .006], [.01, .014], [.007, .05], [.012, .055], [.008, .06], [.012, .074], [0, .078]];
  const pecas = [];
  for (let i = 0; i < 14; i++) { const branco = i % 2 === 0, perfil = i < 9 ? peaoG : i < 12 ? bispo : rei; pecas.push([perfil, branco, -.21 + ((i * 3) % 8) * .06, -.21 + ((i * 5) % 8) * .06]); }
  for (const [pf, b, x, z] of pecas) em(xad, torno(pf, mat(b ? '#ece4d4' : '#2a1a12', { r: .35 }), 18), x, .722, z);
  for (let i = 0; i < 4; i++) em(xad, torno(peaoG, mat(i % 2 ? '#2a1a12' : '#ece4d4', { r: .35 }), 18), .33 + i * .02, .722 - .7, -.1 + i * .05).position.y = .03;
  item('torre', 'Torre de xadrez', null, criarTorre(), xad, .09, .722, .03, 0, 0, 0, 1);
  itens.at(-1).vistaIcone = [0, .35, 1];

  /* =========== armário com portas, globo de chão e cabideiro (direita) =========== */
  const arm = em(raiz, grupo(), W - .3, 0, .2, 0, -PI / 2);
  const aw = 1.2, ah = 1.0, ad = .5;
  em(arm, caixa(aw, .08, ad, mogno), 0, .1, 0); em(arm, caixa(aw + .06, .05, ad + .04, mogno), 0, ah, .01);
  for (const s of [-1, 1]) em(arm, caixa(.04, ah - .1, ad, mogno), s * (aw / 2 - .02), ah / 2, 0);
  em(arm, caixa(aw, ah - .1, .02, mognoEsc), 0, ah / 2, -ad / 2 + .01); em(arm, caixa(aw - .08, .025, ad - .05, mogno), 0, .52, 0);
  for (let i = 0; i < 4; i++) em(arm, cil(.05, .05, .14 + i * .02, mat(['#5a3a24', '#3a4a3a', '#7a5a3a', '#4a3a4a'][i], { r: .4, m: .3 }), 14), -.4 + i * .17, .62 + i * .01, -.05);
  for (let i = 0; i < 6; i++) em(arm, caixa(.04, .26, .2, mat(cores[i * 2], { r: .6 })), .1 + i * .045, .27, -.05);
  item('sino', 'Sininho de mesa', null, criarSino(), arm, -.32, .14, .02, 0, 0, 0, 1.2);
  itens.at(-1).vistaIcone = [0, .35, 1];
  const porta = lado => { const pv = em(arm, grupo(), lado * (aw / 2 - .04), .13, ad / 2 + .012), pw = aw / 2 - .05, fol = em(pv, grupo(), -lado * pw / 2, 0, 0); em(fol, caixa(pw, ah - .19, .022, mogno), 0, (ah - .19) / 2, 0); em(fol, caixa(pw - .1, ah - .34, .012, mognoEsc), 0, (ah - .19) / 2, .015); em(fol, esfera(.018, latao, 10, 8), -lado * (pw / 2 - .06), (ah - .19) / 2, .03); return interativo(pv, 'porta', k => { pv.rotation.y = (lado < 0 ? -1 : 1) * 1.8 * k; }); };
  const pE = porta(-1), pD = porta(1); itens.at(-1).dentro = [pE, pD];
  // em cima do armário: estatueta de coruja? não — o busto e pilhas de livros; a coruja fica no alto da estante
  { const b = em(arm, grupo(), .3, ah + .025, -.05); em(b, torno([[0, 0], [.1, 0], [.11, .04], [.12, .1], [.1, .15], [.05, .19], [.04, .23], [0, .24]], mat('#ece6da', { r: .8 }), 24), 0, 0, 0); em(b, esfera(.08, mat('#ece6da', { r: .8 }), 18, 12), 0, .31, 0).scale.set(.9, 1.15, 1); }
  for (let i = 0; i < 4; i++) em(arm, caixa(.26, .05, .19, mat(cores[i * 4 % 12], { r: .6 })), -.3, ah + .05 + i * .05, -.05, 0, ent(-.2, .2));
  // globo de chão com a bússola na base
  const glo = em(raiz, grupo(), 2.8, 0, -1.05);
  for (let i = 0; i < 3; i++) { const a = i * 2.094; em(glo, cil(.02, .025, .55, mogno, 8), Math.cos(a) * .22, .27, Math.sin(a) * .22, Math.sin(a) * .35, 0, -Math.cos(a) * .35); }
  em(glo, toro(.32, .025, mogno, PI * 2, 8, 40), 0, .58, 0, PI / 2); em(glo, toro(.28, .008, latao, PI * 2, 6, 40), 0, .8, 0, 0, 0, .4);
  em(glo, esfera(.27, mat('#ffffff', { map: Tex.mapa(), r: .5 }), 32, 22), 0, .8, 0, .4, 0, .4);
  em(glo, cil(.2, .2, .02, mogno, 24), 0, .12, 0);
  item('bussola', 'Bússola', null, criarBussola(), glo, .05, .13, .06, 0, .8, 0, 1.2);
  // cabideiro com sobretudo e a cartola (frente, esquerda)
  const cab = em(raiz, grupo(), -2.2, 0, 2.1);
  em(cab, cil(.025, .03, 1.9, mognoEsc, 10), 0, .95, 0); for (let i = 0; i < 3; i++) { const a = i * 2.094; em(cab, cil(.015, .015, .35, mognoEsc, 6), Math.cos(a) * .12, .1, Math.sin(a) * .12, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); }
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; em(cab, cil(.012, .012, .2, mognoEsc, 6), Math.cos(a) * .08, 1.75, Math.sin(a) * .08, Math.sin(a) * .9, 0, -Math.cos(a) * .9); }
  { const pg = new THREE.CylinderGeometry(.16, .32, 1.15, 20, 6, true), pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { const a = Math.atan2(pp.getZ(i), pp.getX(i)); pp.setX(i, pp.getX(i) * (1 + Math.sin(a * 7) * .06)); } pg.computeVertexNormals(); em(cab, malha(pg, mat('#2a2622', { r: .9, lado: THREE.DoubleSide })), .05, 1.15, .02); }
  item('cartola', 'Cartola', null, criarCartola(), cab, .02, 1.86, 0, .15, 0, .12, 1);
  itens.at(-1).vistaIcone = [0, .35, 1];
  // guarda-chuva fechado no canto, atrás da cortina
  const pano = mat('#ffffff', { map: Tex.tecido('#3a4a2a', '#4a5a34', 'listra', [3, 1]), r: .95, lado: THREE.DoubleSide });
  em(raiz, cil(.015, .015, jw + 1.2, latao, 10), -W + .2, jy1 + .2, (jz0 + jz1) / 2, PI / 2);
  function cortina(z, larg, alt, sentido, aberta) {
    const geo = new THREE.PlaneGeometry(larg, alt, 40, 10), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setX(i, x + larg / 2); pos.setZ(i, Math.sin((x + larg / 2) * 22) * .035); }
    geo.computeVertexNormals();
    const g = em(raiz, grupo(), -W + .2, jy1 + .18 - alt / 2, z, 0, sentido > 0 ? PI / 2 : -PI / 2); const m = em(g, malha(geo, pano), 0, 0, 0); m.scale.x = aberta ? .3 : 1; return { g, m };
  }
  const cA = cortina(1.15, .75, 3.0, 1, false), cB = cortina(-1.5, .7, 3.0, -1, true);
  const iCort = interativo(cA.g, 'cortina', k => { cA.m.scale.x = 1 - .7 * k; });
  item('guardachuva', 'Guarda-chuva', null, criarGuardaChuva(), raiz, -W + .09, 0, .62, 0, 0, -.12, 1, iCort);
  itens.at(-1).vistaIcone = [0, .25, 1];
  // coruja de madeira em cima da estante da esquerda (só se vê olhando para cima, ou de longe)
  item('coruja', 'Coruja de madeira', null, criarCoruja(), raiz, -2.18, eA.ys[6] + .018, zE + .06, 0, .35, 0, 1.15);
  itens.at(-1).vistaIcone = [0, .3, 1];
  // pilhas de livros pelo chão
  for (const [x, z, n] of [[1.0, -1.6, 6], [-1.2, -1.5, 4], [2.3, .9, 5], [-2.0, .1, 3]]) { let y = 0; for (let i = 0; i < n; i++) { const h = ent(.05, .08); livros.push({ x: x + ent(-.02, .02), y: y + h / 2, z, w: ent(.26, .34), h, d: ent(.2, .26), ry: ent(-.4, .4), cor: cores[(r() * 12) | 0], tipo: 2 }); y += h; } }
  instanciarLivros(livros);
  // vela grande e candelabro no chão perto da lareira
  { const c = em(raiz, grupo(), .95, 0, -1.85); em(c, torno([[0, 0], [.12, 0], [.03, .05], [.025, 1.0], [.08, 1.05], [0, 1.05]], latao), 0, 0, 0); for (const s of [-1, 0, 1]) em(c, cil(.014, .014, .16, mat('#efe5cc'), 8), s * .07, 1.13, 0); }

  /* =========== luz =========== */
  raiz.add(new THREE.HemisphereLight('#ffe2c0', '#3a2418', .6));
  const lua = new THREE.DirectionalLight('#a8b8d8', 1.4); lua.position.set(-8, 5, -.2); lua.target.position.set(-.5, 0, .2); raiz.add(lua, lua.target);
  lua.castShadow = true; lua.shadow.mapSize.set(MOVEL ? 1024 : 2048, MOVEL ? 1024 : 2048); Object.assign(lua.shadow.camera, { left: -5, right: 5, top: 4.5, bottom: -4.5, near: 2, far: 18 }); lua.shadow.bias = -.0004; lua.shadow.normalBias = .02;
  const frente = new THREE.DirectionalLight('#ffd8b0', .75); frente.position.set(1, 3, 8); raiz.add(frente);
  const mesaLuz = new THREE.PointLight('#ffc070', 1.4, 3.5, 1.6); mesaLuz.position.set(-.85, 1.15, .75); raiz.add(mesaLuz);

  /* ---------- objetos escondidos (formas próprias deste nível) ---------- */
  function criarAmpulheta() { const g = grupo(), m = mat('#6a3a1a', { r: .5 }, true), v = mat('#d8e8e8', { r: .05, t: .4 }, true), a = mat('#e0c080', { r: .9 }, true); em(g, cil(.045, .045, .012, m, 16), 0, .006, 0); em(g, cil(.045, .045, .012, m, 16), 0, .15, 0); for (let i = 0; i < 3; i++) { const t = i * 2.094; em(g, cil(.004, .004, .14, m, 6), Math.cos(t) * .038, .078, Math.sin(t) * .038); } em(g, torno([[.001, 0], [.03, .01], [.032, .03], [.006, .068], [.006, .072], [.032, .11], [.03, .13], [.001, .14]], v, 18), 0, .01, 0); em(g, malha(new THREE.ConeGeometry(.024, .03, 14), a), 0, .03, 0); em(g, malha(new THREE.ConeGeometry(.012, .015, 10), a), 0, .095, 0, PI); return g; }
  function criarMaca() { const g = grupo(); em(g, esfera(.04, mat('#b8201a', { r: .35 }, true), 18, 14), 0, .038, 0).scale.set(1, .92, 1); em(g, cil(.003, .004, .025, mat('#4a3020', {}, true), 6), 0, .085, 0, 0, 0, .2); em(g, malha(new THREE.SphereGeometry(.018, 8, 6), mat('#4a7a2a', { r: .6 }, true)), .015, .088, 0).scale.set(1, .2, .6); return g; }
  function criarXicara() { const g = grupo(), m = mat('#f2ece0', { r: .3 }, true); em(g, cil(.065, .05, .01, m, 24), 0, .005, 0); em(g, torno([[0, .002], [.025, .002], [.04, .05], [.042, .06], [0, .012]], mat('#f2ece0', { r: .3, lado: THREE.DoubleSide }, true), 20), 0, .01, 0); em(g, toro(.016, .004, m, PI), .045, .045, 0, 0, 0, -PI / 2); em(g, cil(.038, .038, .002, mat('#3a2010', { r: .1 }, true), 20), 0, .058, 0); return g; }
  function criarLupa() { const g = grupo(), m = mat('#c9a24a', { r: .3, m: .85 }, true); em(g, toro(.04, .006, m, PI * 2, 8, 32), 0, .006, 0, PI / 2); em(g, cil(.038, .038, .003, mat('#d8e8f0', { r: .05, t: .35 }, true), 24), 0, .006, 0); em(g, cil(.008, .01, .1, mat('#3a2010', { r: .5 }, true), 10), .095, .006, 0, 0, 0, PI / 2); return g; }
  function criarLanterna() { const g = grupo(), m = mat('#2a2522', { r: .5, m: .7 }, true); em(g, cil(.06, .065, .02, m, 6), 0, .01, 0); em(g, cil(.05, .05, .14, mat('#f0d890', { r: .2, t: .55, e: '#ffb050', ei: .4 }, true), 6), 0, .09, 0); for (let i = 0; i < 6; i++) { const a = i * PI / 3; em(g, cil(.004, .004, .14, m, 4), Math.cos(a) * .052, .09, Math.sin(a) * .052); } em(g, malha(new THREE.ConeGeometry(.065, .05, 6), m), 0, .185, 0); em(g, toro(.025, .004, m, PI), 0, .21, 0); return g; }
  function criarTorre() { const g = grupo(); em(g, torno([[0, 0], [.017, 0], [.017, .006], [.012, .012], [.01, .045], [.014, .05], [.014, .062], [0, .062]], mat('#ece4d4', { r: .35 }, true), 20), 0, 0, 0); for (let i = 0; i < 4; i++) { const a = i * PI / 2; em(g, caixa(.008, .01, .008, mat('#ece4d4', { r: .35 }, true)), Math.cos(a) * .011, .066, Math.sin(a) * .011); } return g; }
  function criarSino() { const g = grupo(), m = mat('#c9a24a', { r: .25, m: .9 }, true); em(g, torno([[0, .07], [.012, .068], [.02, .05], [.03, .015], [.04, 0], [.035, 0], [0, .01]], mat('#c9a24a', { r: .25, m: .9, lado: THREE.DoubleSide }, true), 24), 0, 0, 0); em(g, cil(.006, .006, .03, m, 8), 0, .085, 0); em(g, esfera(.01, mat('#3a2010', {}, true), 8, 6), 0, .1, 0); return g; }
  function criarBussola() { const g = grupo(), m = mat('#b39048', { r: .3, m: .85 }, true); em(g, cil(.035, .035, .014, m, 28), 0, .007, 0); em(g, cil(.03, .03, .002, mat('#f0e6cc', {}, true), 24), 0, .015, 0); em(g, caixa(.005, .002, .05, mat('#a8201a', {}, true)), 0, .017, 0, 0, .7); em(g, toro(.006, .002, m), 0, .007, -.04, 0, PI / 2); return g; }
  function criarCartola() { const g = grupo(), m = mat('#1e1a18', { r: .8 }, true); em(g, cil(.15, .15, .01, m, 28), 0, .005, 0); em(g, cil(.088, .095, .17, m, 24), 0, .095, 0); em(g, cil(.096, .096, .03, mat('#5a1a20', { r: .7 }, true), 24), 0, .03, 0); return g; }
  function criarGuardaChuva() { const g = grupo(); em(g, cil(.006, .006, .85, mat('#2a2522', { m: .6, r: .4 }, true), 6), 0, .44, 0); const pano = malha(new THREE.ConeGeometry(.05, .62, 8, 1, true), mat('#1e2a24', { r: .8, lado: THREE.DoubleSide }, true)); em(g, pano, 0, .48, 0, PI); em(g, toro(.03, .008, mat('#5a3018', { r: .5 }, true), PI), -.03, .87, 0, 0, 0, 0); em(g, esfera(.01, mat('#2a2522', {}, true), 6, 4), 0, .02, 0); return g; }
  function criarCoruja() { const g = grupo(), m = mat('#7a4a2a', { r: .6 }, true), o = mat('#e8c060', { r: .3 }, true), p = mat('#1a1008', {}, true); em(g, esfera(.05, m, 16, 12), 0, .05, 0).scale.set(1, 1.2, .9); em(g, esfera(.038, m, 14, 10), 0, .12, .005); for (const s of [-1, 1]) { em(g, esfera(.012, o, 10, 8), s * .015, .125, .032); em(g, esfera(.006, p, 6, 4), s * .015, .125, .042); em(g, malha(new THREE.ConeGeometry(.01, .025, 6), m), s * .022, .16, 0, 0, 0, -s * .3); } em(g, malha(new THREE.ConeGeometry(.006, .014, 5), mat('#c8902a', {}, true)), 0, .112, .04, PI / 2); return g; }

  /* ---------- funções internas (iguais às do ateliê) ---------- */
  function lt3(a, b) { const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), m = cil(.012, .012, v.length(), ferro, 6); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); raiz.add(m); }
  function item(id, nome, charada, obj, pai, x, y, z, rx, ry, rz, s = 1, dentro = null) {
    em(pai, obj, x, y, z, rx, ry, rz, s);
    const it = { id, nome, charada: charada || nome, obj, achado: false, dentro: dentro ? [dentro] : null };
    obj.userData.item = it; itens.push(it); return it;
  }
  function interativo(raizI, tipo, aplicar) { const it = { raiz: raizI, tipo, aberto: false, k: 0, aplicar }; raizI.userData.interativo = it; interativos.push(it); return it; }
  function instanciarLivros(lista) {
    for (let tipo = 0; tipo < 3; tipo++) {
      const sel = lista.filter(l => l.tipo === tipo); if (!sel.length) continue;
      const geo = new THREE.BoxGeometry(1, 1, 1), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) if (i < 16 || i >= 20) uv.setXY(i, .015, .995);
      const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: Tex.lombada(tipo), roughness: .62 }), sel.length); inst.castShadow = inst.receiveShadow = true;
      const o = new THREE.Object3D(), c = new THREE.Color();
      sel.forEach((l, i) => { o.position.set(l.x, l.y, l.z); o.rotation.set(0, l.ry || 0, l.rz || 0); o.scale.set(l.w, l.h, l.d); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); inst.setColorAt(i, c.set(l.cor)); });
      raiz.add(inst);
    }
  }

  return {
    nome: 'Biblioteca Secreta', modo: 'silhueta', raiz, itens, interativos,
    camera: { alvo: [-.1, 1.15, -.3], dist: 4.85, az: 0, el: .2, fov: 50, az0: -.8, az1: .8, el0: -.14, el1: .95, d0: .32, d1: 5.4,
      caixaAlvo: [[-3.36, .08, -2.62], [3.36, 3.0, 2.2]], caixaCam: [[-3.38, .1, -2.38], [3.38, 3.25, 6.5]] },
    fundo: '#120c08',
    atualizar(t, dt) { animados.forEach(f => f(t, dt)); }
  };
}
