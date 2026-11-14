// Paciência (Klondike). Carta = número 0..51: naipe = c/13 (0 ♠, 1 ♥, 2 ♣, 3 ♦), valor = c%13 (0 = Ás).
// Pilhas: 'e' estoque, 'd' descarte, 'f0'..'f3' montes de cima, 'c0'..'c6' colunas.
(() => {
  const $ = id => document.getElementById(id);
  const tab = $('tab');
  const naipe = c => Math.floor(c / 13), valor = c => c % 13, vermelha = c => naipe(c) % 2 === 1;
  const ROT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // ---------- Níveis ----------
  // voltas: quantas vezes o baralho pode ser passado (0 = sem limite); ajuda: Ases e 2 ficam à mão.
  const NIVEIS = {
    facil: { nome: 'Fácil', vira: 1, voltas: 0, ajuda: true },
    medio: { nome: 'Médio', vira: 3, voltas: 0, ajuda: false },
    dificil: { nome: 'Difícil', vira: 3, voltas: 3, ajuda: false },
  };

  // ---------- Estado ----------
  function nova(nivel, stats) {
    const b = Array.from({ length: 52 }, (_, i) => i);
    for (let i = 51; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    if (NIVEIS[nivel].ajuda) {
      // Leva os 4 Ases e os 4 "2" para lugares fáceis: topo das colunas ou primeiras cartas do baralho.
      const bons = [0, 2, 5, 9, 14, 20, 27, 44, 45, 46, 47, 48, 49, 50, 51];
      for (let i = bons.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bons[i], bons[j]] = [bons[j], bons[i]]; }
      const chave = b.filter(c => c % 13 <= 1).sort((x, y) => x % 13 - y % 13);
      chave.forEach((c, k) => { const de = b.indexOf(c), para = bons[k]; [b[de], b[para]] = [b[para], b[de]]; });
    }
    const c = []; for (let i = 0; i < 7; i++) c.push({ k: b.splice(0, i + 1), d: i });
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
  const salvar = () => JO.salvar('paciencia', e);
  const podeReciclar = () => !NIVEIS[e.nivel].voltas || e.voltas < NIVEIS[e.nivel].voltas - 1;

  let sel = null, toque = null, ultimoToque = { id: -1, t: 0 }, auto = null, festaId = 0, voa = new Set();
  let G = {}, onde = {}, xy = {};

  // ---------- Regras ----------
  function podeFund(c, n) {
    const p = e.f[n];
    return p.length ? naipe(p[p.length - 1]) === naipe(c) && valor(c) === p.length : valor(c) === 0;
  }
  function acharFund(c) { for (let n = 0; n < 4; n++) if (podeFund(c, n)) return n; return -1; }
  function podeCol(c, j) {
    const k = e.c[j].k;
    if (!k.length) return valor(c) === 12;
    const topo = k[k.length - 1];
    return vermelha(topo) !== vermelha(c) && valor(topo) === valor(c) + 1;
  }
  // Devolve o grupo de cartas que dá para pegar a partir desta carta (ou null).
  function pegavel(id) {
    const o = onde[id]; if (!o) return null;
    if (o.p === 'd') return o.i === e.w.length - 1 ? { p: 'd', i: o.i, ids: [id] } : null;
    if (o.p[0] === 'f') return o.i === e.f[+o.p[1]].length - 1 ? { p: o.p, i: o.i, ids: [id] } : null;
    if (o.p[0] === 'c') { const c = e.c[+o.p[1]]; return o.i >= c.d ? { p: o.p, i: o.i, ids: c.k.slice(o.i) } : null; }
    return null;
  }
  function foto() {
    if (auto) return;
    e.hist.push(JSON.stringify({ s: e.s, w: e.w, f: e.f, c: e.c, m: e.m, voltas: e.voltas }));
    if (e.hist.length > 300) e.hist.shift();
  }
  function tentar(g, p) {
    if (p === g.p) return false;
    const ok = p[0] === 'f' ? g.ids.length === 1 && podeFund(g.ids[0], +p[1]) : p[0] === 'c' ? podeCol(g.ids[0], +p[1]) : false;
    if (ok) mover(g, p);
    return ok;
  }
  function mover(g, p) {
    foto();
    if (g.p === 'd') e.w.pop();
    else if (g.p[0] === 'f') e.f[+g.p[1]].pop();
    else { const c = e.c[+g.p[1]]; c.k.splice(g.i); if (c.d > 0 && c.k.length === c.d) c.d--; }
    if (p[0] === 'f') e.f[+p[1]].push(g.ids[0]); else e.c[+p[1]].k.push(...g.ids);
    e.m++; sel = null;
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
    e.m++; sel = null; JO.som('carta'); salvar(); desenhar(ids);
    return true;
  }
  function desfazer() {
    if (!e.hist.length || e.ganhou || auto) return;
    Object.assign(e, JSON.parse(e.hist.pop())); sel = null; salvar(); desenhar();
  }

  // ---------- Completar sozinho ----------
  const podeCompletar = () => !e.ganhou && !auto && e.c.every(c => c.d === 0) && e.f.some(x => x.length < 13);
  function completar() {
    if (!podeCompletar()) return;
    let semJogada = 0; sel = null;
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
        el.classList.add('arrasta'); el.style.zIndex = 3000 + prox;
        ativos.push({ el, x: xy[id].x, y: xy[id].y, vx: (Math.random() < .5 ? -1 : 1) * (1.5 + Math.random() * 3), vy: -Math.random() * 5 });
      }
      for (const a of ativos) {
        if (a.fora) continue;
        a.vy += .45; a.x += a.vx; a.y += a.vy;
        if (a.y > chao) { a.y = chao; a.vy *= -.78; }
        a.el.style.transform = `translate(${a.x}px,${a.y}px)`;
        if (a.x < -G.cw * 1.3 || a.x > W + G.cw * .3) { a.fora = true; a.el.style.visibility = 'hidden'; }
      }
      if (prox < fila.length || ativos.some(a => !a.fora)) requestAnimationFrame(passo);
    })();
  }

  function novoJogo(nivel) {
    festaId++; clearInterval(auto); auto = null; sel = null;
    e = nova(nivel || e.nivel, e.stats); salvar();
    cartas.forEach(el => { el.classList.add('arrasta'); el.style.transform = `translate(${G.x(0)}px,0px)`; el.style.visibility = ''; });
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
    el.innerHTML = `<span class="v">${ROT[valor(id)]}</span><svg class="n" viewBox="0 0 24 24"><use href="#n${naipe(id)}"/></svg><svg class="g" viewBox="0 0 24 24"><use href="#n${naipe(id)}"/></svg>`;
    tab.appendChild(el); cartas.push(el);
  }

  function medir() {
    // A carta cabe na largura e, em tela deitada, também na altura; o tabuleiro fica centralizado.
    const W = tab.clientWidth, gap = Math.max(4, W * .012), livre = window.innerHeight - tab.getBoundingClientRect().top - 10;
    const cw = Math.max(34, Math.min((W - 6 * gap) / 7, livre / (1.42 * 3.7))), ch = cw * 1.42, y0 = ch + gap * 3;
    const H = Math.max(livre, y0 + ch * 2.2), x0 = (W - 7 * cw - 6 * gap) / 2;
    G = { W, gap, cw, ch, y0, H, x0, x: j => x0 + j * (cw + gap) };
    tab.style.height = H + 'px';
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
      setTimeout(() => { voa = new Set(); if (!(toque && toque.arrastando) && !e.ganhou) desenhar(); }, 260);
    }
    onde = {};
    const poe = (id, x, y, z, costas, p, i) => {
      const el = cartas[id];
      el.style.transform = `translate(${x}px,${y}px)`;
      el.style.zIndex = z + (voa.has(id) ? 1000 : 0);
      el.style.visibility = '';
      el.classList.toggle('costas', costas);
      el.classList.toggle('sel', !!sel && sel.ids.includes(id));
      el.classList.remove('arrasta');
      xy[id] = { x, y }; onde[id] = { p, i };
    };
    e.s.forEach((id, i) => poe(id, G.x(0), 0, i, true, 'e', i));
    const leque = e.vira === 3 ? 3 : 1, base = Math.max(0, e.w.length - leque);
    e.w.forEach((id, i) => poe(id, G.x(1) + Math.max(0, i - base) * G.cw * .3, 0, 100 + i, false, 'd', i));
    e.f.forEach((pl, n) => pl.forEach((id, i) => poe(id, G.x(3 + n), 0, 200 + i, false, 'f' + n, i)));
    e.c.forEach((c, j) => {
      const nu = c.k.length - c.d; let od = G.ch * .14, ou = G.ch * .32;
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

  // ---------- Toque e arrasto ----------
  function tocar(alvo) {
    if (e.ganhou || auto) return;
    if (alvo.classList.contains('vaga')) {
      const p = alvo.dataset.p;
      if (p === 'e') comprar();
      else if (sel && !tentar(sel, p)) { sel = null; desenhar(); }
      return;
    }
    const id = +alvo.dataset.id, o = onde[id];
    if (o.p === 'e') return void comprar();
    const agora = Date.now(), duplo = ultimoToque.id === id && agora - ultimoToque.t < 400;
    ultimoToque = { id, t: agora };
    if (duplo) { sel = null; if (!paraFundacao(id)) desenhar(); return; }
    if (sel && sel.ids[0] !== id && tentar(sel, o.p)) return;
    const g = pegavel(id);
    sel = g && !(sel && sel.ids[0] === id) ? g : null;
    desenhar();
  }

  // Impede o zoom do navegador no toque duplo (o toque duplo aqui sobe a carta).
  tab.addEventListener('touchstart', ev => ev.preventDefault(), { passive: false });
  tab.addEventListener('touchend', ev => ev.preventDefault(), { passive: false });
  tab.addEventListener('dblclick', ev => ev.preventDefault());
  tab.addEventListener('pointerdown', ev => {
    const alvo = ev.target.closest('.carta,.vaga');
    if (!alvo || toque) return;
    ev.preventDefault();
    toque = { alvo, x: ev.clientX, y: ev.clientY, arrastando: false, id: ev.pointerId, g: null };
    if (alvo.classList.contains('carta') && !e.ganhou && !auto) toque.g = pegavel(+alvo.dataset.id);
    try { tab.setPointerCapture(ev.pointerId); } catch (err) {}
  });
  tab.addEventListener('pointermove', ev => {
    if (!toque || ev.pointerId !== toque.id || !toque.g) return;
    const dx = ev.clientX - toque.x, dy = ev.clientY - toque.y;
    if (!toque.arrastando) {
      if (Math.hypot(dx, dy) < 8) return;
      toque.arrastando = true;
      if (sel) { sel = null; cartas.forEach(el => el.classList.remove('sel')); }
      toque.g.ids.forEach((id, k) => { cartas[id].classList.add('arrasta'); cartas[id].style.zIndex = 2000 + k; });
    }
    toque.g.ids.forEach(id => cartas[id].style.transform = `translate(${xy[id].x + dx}px,${xy[id].y + dy}px)`);
  });
  function soltar(ev) {
    if (!toque || ev.pointerId !== toque.id) return;
    const t = toque; toque = null;
    if (!t.arrastando) return tocar(t.alvo);
    const lider = t.g.ids[0];
    const cx = xy[lider].x + ev.clientX - t.x + G.cw / 2, cy = xy[lider].y + ev.clientY - t.y + G.ch / 2;
    const col = Math.max(0, Math.min(6, Math.round((cx - G.x0 - G.cw / 2) / (G.cw + G.gap))));
    const p = cy < G.y0 - G.gap ? (col >= 3 ? 'f' + (col - 3) : null) : 'c' + col;
    if (!p || !tentar(t.g, p)) desenhar();
  }
  tab.addEventListener('pointerup', soltar);
  tab.addEventListener('pointercancel', ev => { if (toque && ev.pointerId === toque.id) { toque = null; desenhar(); } });

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
    if (e.m > 0 && !e.ganhou && !document.hidden) {
      e.t++; $('tempo').textContent = relogio(e.t);
      if (e.t % 5 === 0) salvar();
    }
  }, 1000);
  window.addEventListener('resize', () => { medir(); desenhar(); });

  medir(); desenhar();
})();
