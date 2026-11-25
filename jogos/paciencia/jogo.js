// Paciência (Klondike). Carta = número 0..51: naipe = c/13 (0 ♠, 1 ♥, 2 ♣, 3 ♦), valor = c%13 (0 = Ás).
// Pilhas: 'e' estoque, 'd' descarte, 'f0'..'f3' montes de cima, 'c0'..'c6' colunas.
(() => {
  const $ = id => document.getElementById(id);
  const tab = $('tab');
  const naipe = c => Math.floor(c / 13), valor = c => c % 13, vermelha = c => naipe(c) % 2 === 1;
  const ROT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // ---------- Níveis ----------
  // vira: cartas por compra; voltas: passadas no baralho (0 = sem limite); aberto: tudo virado para cima e qualquer
  // carta na coluna vazia; ajuda: Ases (1), até 2 (2) ou até 3 (3) ficam à mão; testado: ver sorteio.js.
  const NIVEIS = {
    mfacil: { nome: 'Muito fácil', vira: 1, voltas: 0, aberto: true, ajuda: 3, testado: 3 },
    facil: { nome: 'Fácil', vira: 1, voltas: 0, ajuda: 2, testado: 99 },
    medio: { nome: 'Médio', vira: 3, voltas: 0, ajuda: 1, testado: 99 },
    dificil: { nome: 'Difícil', vira: 3, voltas: 3, ajuda: 0, testado: 0 },
  };

  // ---------- Estado ----------
  function nova(nivel, stats) {
    const { s: b, c } = Sorteio.novo(NIVEIS[nivel]);
    if (NIVEIS[nivel].aberto) c.forEach(x => x.d = 0);
    return { s: b, w: [], f: [[], [], [], []], c, m: 0, t: 0, nivel, vira: NIVEIS[nivel].vira, voltas: 0, hist: [], ganhou: false, stats };
  }
  function valida(x) {
    try {
      const todas = [...x.s, ...x.w, ...x.f.flat(), ...x.c.flatMap(c => c.k)];
      return x.f.length === 4 && x.c.length === 7 && todas.length === 52 && new Set(todas).size === 52 && Array.isArray(x.hist);
    } catch (err) { return false; }
  }
  function ajustarStats(s) {
    s = s || {}; s.v = s.v || 0; if (s.melhor === undefined) s.melhor = null;
    s.n = s.n || {}; for (const k in NIVEIS) s.n[k] = s.n[k] || { v: 0, melhor: null };
    return s;
  }
  let e = JO.carregar('paciencia', null);
  if (e && !NIVEIS[e.nivel]) e.nivel = e.vira === 3 ? 'medio' : 'facil'; // jogo salvo antes dos níveis
  if (!valida(e)) e = nova((e && e.nivel) || 'facil', e && e.stats);
  e.stats = ajustarStats(e.stats); e.vira = NIVEIS[e.nivel].vira; e.voltas = e.voltas || 0;
  const salvar = Cartas.gravador(() => JO.salvar('paciencia', e));
  const podeReciclar = () => !NIVEIS[e.nivel].voltas || e.voltas < NIVEIS[e.nivel].voltas - 1;

  let auto = null, festaId = 0, voa = new Set();
  let G = {}, onde = {};
  const xy = {};

  // ---------- Regras ----------
  const encaixa = (baixo, cima) => vermelha(baixo) !== vermelha(cima) && valor(baixo) === valor(cima) + 1;
  function podeFund(c, n) {
    const p = e.f[n];
    return p.length ? naipe(p[p.length - 1]) === naipe(c) && valor(c) === p.length : valor(c) === 0;
  }
  function acharFund(c) { for (let n = 0; n < 4; n++) if (podeFund(c, n)) return n; return -1; }
  function podeCol(c, j) {
    const k = e.c[j].k;
    if (!k.length) return NIVEIS[e.nivel].aberto || valor(c) === 12;
    return encaixa(k[k.length - 1], c);
  }
  // Devolve o grupo de cartas que dá para pegar a partir desta carta (ou null).
  function pegavel(id) {
    const o = onde[id]; if (!o) return null;
    if (o.p === 'd') return o.i === e.w.length - 1 ? { p: 'd', i: o.i, ids: [id] } : null;
    if (o.p[0] === 'f') return o.i === e.f[+o.p[1]].length - 1 ? { p: o.p, i: o.i, ids: [id] } : null;
    if (o.p[0] !== 'c') return null;
    const c = e.c[+o.p[1]], ids = c.k.slice(o.i);
    for (let k = 1; k < ids.length; k++) if (!encaixa(ids[k - 1], ids[k])) return null;
    return o.i >= c.d ? { p: o.p, i: o.i, ids } : null;
  }
  function foto() {
    if (auto) return;
    e.hist.push(JSON.stringify({ s: e.s, w: e.w, f: e.f, c: e.c, m: e.m, voltas: e.voltas }));
    if (e.hist.length > 300) e.hist.shift();
  }
  function podeIr(g, p) {
    if (p === g.p) return false;
    return p[0] === 'f' ? g.ids.length === 1 && podeFund(g.ids[0], +p[1]) : p[0] === 'c' ? podeCol(g.ids[0], +p[1]) : false;
  }
  // Melhor lugar para o toque simples: monte, depois coluna com carta, depois coluna vazia.
  function melhorLugar(g) {
    if (g.ids.length === 1) { const n = acharFund(g.ids[0]); if (n >= 0) return 'f' + n; }
    const cs = [0, 1, 2, 3, 4, 5, 6].map(j => 'c' + j).filter(p => podeIr(g, p));
    const vazia = cs.find(p => !e.c[+p[1]].k.length);
    return cs.find(p => e.c[+p[1]].k.length) || (vazia && !(g.p[0] === 'c' && g.i === 0) ? vazia : null);
  }
  function mover(g, p) {
    foto();
    if (g.p === 'd') e.w.pop();
    else if (g.p[0] === 'f') e.f[+g.p[1]].pop();
    else { const c = e.c[+g.p[1]]; c.k.splice(g.i); if (c.d > 0 && c.k.length === c.d) c.d--; }
    if (p[0] === 'f') e.f[+p[1]].push(g.ids[0]); else e.c[+p[1]].k.push(...g.ids);
    e.m++;
    if (e.f.every(x => x.length === 13)) return vitoria(g.ids);
    JO.som('carta'); salvar(); desenhar(g.ids);
  }
  function paraFundacao(id) {
    const g = pegavel(id);
    if (!g || g.ids.length !== 1 || g.p[0] === 'f') return false;
    const n = acharFund(id);
    if (n < 0) return false;
    mover(g, 'f' + n); return true;
  }
  function comprar() {
    if (!e.s.length && !e.w.length) return false;
    if (!e.s.length && !podeReciclar()) { if (!auto) JO.som('erro'); return false; }
    foto();
    let ids = [];
    if (!e.s.length) { e.s = e.w.reverse(); e.w = []; e.voltas++; }
    else for (let n = 0; n < e.vira && e.s.length; n++) { const c = e.s.pop(); e.w.push(c); ids.push(c); }
    e.m++; JO.som('carta'); salvar(); desenhar(ids);
    return true;
  }
  function desfazer() {
    if (!e.hist.length || e.ganhou || auto) return;
    mao.cancelar(); Object.assign(e, JSON.parse(e.hist.pop())); salvar(); desenhar();
  }

  // ---------- Completar sozinho ----------
  const podeCompletar = () => !e.ganhou && !auto && e.f.some(x => x.length < 13) &&
    e.c.every(c => c.d === 0 && c.k.every((x, i) => !i || valor(c.k[i - 1]) > valor(x)));
  function completar() {
    if (!podeCompletar()) return;
    let semJogada = 0; mao.cancelar();
    auto = setInterval(() => {
      const topos = [e.w[e.w.length - 1], ...e.c.map(c => c.k[c.k.length - 1])].filter(c => c != null)
        .filter(c => acharFund(c) >= 0).sort((a, b) => valor(a) - valor(b));
      if (topos.length) { semJogada = 0; paraFundacao(topos[0]); return; }
      if (++semJogada > e.s.length + e.w.length + 2 || !comprar()) pararAuto();
    }, 110);
  }
  function pararAuto() { clearInterval(auto); auto = null; salvar(); desenhar(); }

  // ---------- Vitória ----------
  function vitoria(ids) {
    clearInterval(auto); auto = null;
    e.ganhou = true; e.hist = []; e.stats.v++;
    if (e.stats.melhor == null || e.t < e.stats.melhor) e.stats.melhor = e.t;
    const sn = e.stats.n[e.nivel]; sn.v++;
    if (sn.melhor == null || e.t < sn.melhor) sn.melhor = e.t;
    salvar(); desenhar(ids);
    JO.vibrar([40, 60, 120]); JO.som('vitoria');
    const id = festaId;
    setTimeout(() => { if (id === festaId) festa(); }, 350);
    setTimeout(() => {
      if (!e.ganhou || (id !== festaId - 1 && id !== festaId)) return;
      const sn = e.stats.n[e.nivel];
      $('vitoria-txt').textContent = `${NIVEIS[e.nivel].nome} · Tempo ${relogio(e.t)} · ${e.m} jogadas · Vitórias neste nível: ${sn.v} · Melhor tempo neste nível: ${relogio(sn.melhor)}`;
      if (!$('vitoria').open) $('vitoria').showModal();
    }, 3200);
  }
  function festa() {
    const ficha = ++festaId, W = tab.clientWidth, chao = tab.clientHeight - G.ch;
    const fila = []; for (let v = 12; v >= 0; v--) for (let n = 0; n < 4; n++) if (e.f[n][v] != null) fila.push(e.f[n][v]);
    const ativos = []; let prox = 0, quadro = 0;
    (function passo() {
      if (ficha !== festaId) return;
      if (quadro++ % 6 === 0 && prox < fila.length) {
        const id = fila[prox++], el = cartas[id];
        el.classList.add('arrasta'); Cartas.pos(el, xy[id].x, xy[id].y, 3000 + prox);
        ativos.push({ el, x: xy[id].x, y: xy[id].y, vx: (Math.random() < .5 ? -1 : 1) * (1.5 + Math.random() * 3), vy: -Math.random() * 5 });
      }
      for (const a of ativos) {
        if (a.fora) continue;
        a.vy += .45; a.x += a.vx; a.y += a.vy;
        if (a.y > chao) { a.y = chao; a.vy *= -.78; }
        Cartas.pos(a.el, a.x, a.y);
        if (a.x < -G.cw * 1.3 || a.x > W + G.cw * .3) { a.fora = true; a.el.style.visibility = 'hidden'; }
      }
      if (prox < fila.length || ativos.some(a => !a.fora)) requestAnimationFrame(passo);
    })();
  }

  function novoJogo(nivel) {
    mao.cancelar(); festaId++; clearInterval(auto); auto = null;
    e = nova(nivel || e.nivel, e.stats); salvar();
    cartas.forEach(el => { el.classList.add('arrasta'); Cartas.pos(el, G.x(0), 0); el.style.visibility = ''; });
    void tab.offsetWidth; // força o navegador a aplicar a posição antes de distribuir
    desenhar();
  }

  // ---------- Tela ----------
  const vagas = {}, cartas = [];
  for (const p of ['e', 'd', 'f0', 'f1', 'f2', 'f3', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']) {
    const v = document.createElement('div'); v.className = 'vaga'; v.dataset.p = p; tab.appendChild(v); vagas[p] = v;
  }
  for (let id = 0; id < 52; id++) {
    const el = document.createElement('div');
    el.className = 'carta' + (vermelha(id) ? ' r' : ''); el.dataset.id = id;
    el.innerHTML = `<span class="v${valor(id) === 9 ? ' dez' : ''}">${ROT[valor(id)]}</span><svg class="n" viewBox="0 0 24 24"><use href="#n${naipe(id)}"/></svg><svg class="g" viewBox="0 0 24 24"><use href="#n${naipe(id)}"/></svg>`;
    tab.appendChild(el); cartas.push(el);
  }

  function medir() {
    // Cartas na largura toda da tela; em tela deitada ou no computador, o limite passa a ser a altura.
    const W = tab.clientWidth, livre = window.innerHeight - tab.getBoundingClientRect().top - 10, baixa = livre < 480;
    const gap = Math.max(1.5, Math.min(8, W * .006)), prop = baixa ? 1.32 : 1.6;
    const cw = Math.max(34, Math.min((W - 6 * gap) / 7, livre / (prop * (baixa ? 3.2 : 3.6)), 150)), ch = cw * prop, y0 = ch + Math.max(6, gap * 2);
    const H = Math.max(livre, y0 + ch * 2.2), x0 = (W - 7 * cw - 6 * gap) / 2;
    G = { W, gap, cw, ch, y0, H, x0, x: j => x0 + j * (cw + gap) };
    tab.style.height = H + 'px'; tab.style.setProperty('--v', baixa ? .5 : .6);
    tab.style.setProperty('--cw', cw + 'px'); tab.style.setProperty('--ch', ch + 'px');
    const pv = (p, x, y) => vagas[p].style.transform = `translate(${x}px,${y}px)`;
    pv('e', G.x(0), 0); pv('d', G.x(1), 0);
    for (let n = 0; n < 4; n++) pv('f' + n, G.x(3 + n), 0);
    for (let j = 0; j < 7; j++) pv('c' + j, G.x(j), y0);
  }

  const relogio = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

  function desenhar(movidas) {
    if (movidas && movidas.length) {
      voa = new Set(movidas);
      setTimeout(() => { voa = new Set(); if (!mao.arrastando() && !e.ganhou) desenhar(); }, 220);
    }
    onde = {};
    const poe = (id, x, y, z, costas, p, i) => {
      const el = cartas[id];
      el.classList.toggle('costas', costas);
      el.classList.remove('arrasta', 'pega', 'mira');
      if (el.style.visibility) el.style.visibility = '';
      Cartas.pos(el, x, y, z + (voa.has(id) ? 1000 : 0));
      xy[id] = { x, y }; onde[id] = { p, i };
    };
    e.s.forEach((id, i) => poe(id, G.x(0), 0, i, true, 'e', i));
    const leque = e.vira === 3 ? 3 : 1, base = Math.max(0, e.w.length - leque);
    e.w.forEach((id, i) => poe(id, G.x(1) + Math.max(0, i - base) * G.cw * .3, 0, 100 + i, false, 'd', i));
    e.f.forEach((pl, n) => pl.forEach((id, i) => poe(id, G.x(3 + n), 0, 200 + i, false, 'f' + n, i)));
    e.c.forEach((c, j) => {
      const nu = c.k.length - c.d; let od = G.ch * .2, ou = G.ch * .46;
      const total = c.d * od + Math.max(0, nu - 1) * ou + G.ch, cabe = G.H - G.y0 - 4;
      if (total > cabe) { const f = (cabe - G.ch) / (total - G.ch); od *= f; ou *= f; }
      let y = G.y0;
      c.k.forEach((id, i) => { poe(id, G.x(j), y, 300 + i, i < c.d, 'c' + j, i); y += i < c.d ? od : ou; });
    });
    $('jogadas').textContent = e.m;
    $('tempo').textContent = relogio(e.t);
    const lim = NIVEIS[e.nivel].voltas;
    $('vira-txt').textContent = e.vira === 3 ? 'Vira 3 · voltas' : 'Vira 1 · voltas';
    $('voltas').textContent = lim ? `${Math.min(e.voltas + 1, lim)} de ${lim}` : '∞';
    vagas.e.classList.toggle('fim', !podeReciclar());
    document.querySelectorAll('.modos button').forEach(b => b.classList.toggle('ativo', b.dataset.nivel === e.nivel));
    $('desfazer').disabled = !e.hist.length || e.ganhou || !!auto;
    $('completar').hidden = !podeCompletar();
  }

  // ---------- Toque e arrasto (o dedo é lido em js/cartas.js) ----------
  // O que está neste ponto do tabuleiro. Um pouco abaixo da última carta da coluna ainda vale.
  function achar(x, y) {
    const j = Math.max(0, Math.min(6, Math.floor((x - G.x0 + G.gap / 2) / (G.cw + G.gap))));
    if (x < G.x0 - G.cw * .5 || x > G.x(6) + G.cw * 1.5) return null;
    const topo = a => a.length ? a[a.length - 1] : null;
    if (y < G.y0 - 2) {
      if (j === 0) return { p: 'e' };
      if (j < 3) return { p: 'd', id: topo(e.w) };
      return { p: 'f' + (j - 3), id: topo(e.f[j - 3]) };
    }
    const k = e.c[j].k;
    if (!k.length) return y < G.y0 + G.ch * 1.4 ? { p: 'c' + j } : null;
    if (y > xy[topo(k)].y + G.ch * 1.4) return null;
    let i = k.length - 1; while (i > 0 && xy[k[i]].y > y) i--;
    return { p: 'c' + j, id: k[i] };
  }
  function tocar(alvo) {
    if (e.ganhou || auto) return false;
    if (alvo.p === 'e') return comprar();
    if (alvo.id == null || alvo.p[0] === 'f') return false;
    let g = pegavel(alvo.id);
    if (!g) return false;
    let p = melhorLugar(g);
    // Tocou no meio de uma sequência que não se move dali: tenta a partir das cartas de cima dela.
    if (!p && g.p[0] === 'c') {
      const c = e.c[+g.p[1]];
      for (let i = g.i - 1; i >= c.d && !p; i--) { const g2 = pegavel(c.k[i]); if (!g2) break; p = melhorLugar(g2); if (p) g = g2; }
    }
    if (p) { mover(g, p); return true; }
    JO.som('erro'); Cartas.tremer(g.ids.map(id => cartas[id]));
    return false;
  }
  function alvos(g) {
    const r = [];
    for (let n = 0; n < 4; n++) if (podeIr(g, 'f' + n)) { const f = e.f[n]; r.push({ p: 'f' + n, x: G.x(3 + n), y: 0, w: G.cw, h: G.ch, el: f.length ? cartas[f[f.length - 1]] : vagas['f' + n] }); }
    for (let j = 0; j < 7; j++) if (podeIr(g, 'c' + j)) { const k = e.c[j].k; r.push({ p: 'c' + j, x: G.x(j), y: G.y0, w: G.cw, h: G.H - G.y0, el: k.length ? cartas[k[k.length - 1]] : vagas['c' + j] }); }
    return r;
  }
  const mao = Cartas.ligar({
    tab, cartas, xy, medidas: () => G, antes() {}, achar, alvos, tocar, mover,
    pegar: id => e.ganhou || auto ? null : pegavel(id),
    repete: alvo => alvo.p === 'e', voltou: () => desenhar(),
  });

  // ---------- Botões e relógio ----------
  let nivelPedido = null;
  function pedirNovo(nivel) {
    nivelPedido = nivel || null;
    $('confirma-tit').textContent = nivel ? `Mudar para ${NIVEIS[nivel].nome}?` : 'Começar um novo jogo?';
    (e.m > 0 && !e.ganhou) ? $('confirma').showModal() : novoJogo(nivelPedido);
  }
  $('novo').addEventListener('click', () => pedirNovo());
  document.querySelectorAll('.modos button').forEach(b => b.addEventListener('click', () => { if (b.dataset.nivel !== e.nivel) pedirNovo(b.dataset.nivel); }));
  $('confirma-sim').addEventListener('click', () => { $('confirma').close(); novoJogo(nivelPedido); });
  $('vitoria-novo').addEventListener('click', () => { $('vitoria').close(); novoJogo(); });
  $('desfazer').addEventListener('click', desfazer);
  $('completar').addEventListener('click', completar);

  setInterval(() => {
    if (e.m > 0 && !e.ganhou && !document.hidden && !JO.pausado()) {
      e.t++; $('tempo').textContent = relogio(e.t);
      if (e.t % 5 === 0) salvar();
    }
  }, 1000);
  window.addEventListener('resize', () => { mao.cancelar(); medir(); if (!e.ganhou) desenhar(); });

  medir(); desenhar();
})();
