// FreeCell. Carta = número 0..51: naipe = c/13 (0 ♠, 1 ♥, 2 ♣, 3 ♦), valor = c%13 (0 = Ás).
// Pilhas: 'l0'.. células livres (5 no Muito fácil, 4, ou 3 no Difícil), 'f0'..'f3' montes, 'c0'..'c7' colunas.
// Os jogos numerados usam a mesma distribuição clássica do FreeCell (jogos 1 a 32.000).
(() => {
  const $ = id => document.getElementById(id);
  const tab = $('tab');
  const naipe = c => Math.floor(c / 13), valor = c => c % 13, vermelha = c => naipe(c) % 2 === 1;
  const ROT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const NIVEIS = {
    mfacil: { cel: 5, dica: true, nome: 'Muito fácil' },
    facil: { cel: 4, dica: true, nome: 'Fácil' },
    medio: { cel: 4, dica: true, nome: 'Médio' },
    dificil: { cel: 3, dica: false, nome: 'Difícil' },
  };
  const LISTAS = window.FC_JOGOS || { facil: [1, 2, 3], dificil: [1, 2, 3] };

  // ---------- Distribuição numerada (mesma regra do FreeCell clássico) ----------
  const MSN = [2, 3, 1, 0]; // naipe clássico (♣ ♦ ♥ ♠) -> nosso
  function distribuir(n) {
    let s = n >>> 0;
    const rnd = () => { s = (s * 214013 + 2531011) % 2147483648; return s >> 16; };
    const b = []; for (let i = 51; i >= 0; i--) b.push(i);
    for (let i = 0; i < 52; i++) { const j = 51 - rnd() % (52 - i); [b[i], b[j]] = [b[j], b[i]]; }
    const c = [[], [], [], [], [], [], [], []];
    b.forEach((x, i) => c[i % 8].push(MSN[x % 4] * 13 + Math.floor(x / 4)));
    return c;
  }
  function sortear(nivel) {
    const lista = LISTAS[nivel];
    if (lista && lista.length) return lista[Math.floor(Math.random() * lista.length)];
    let n; do n = 1 + Math.floor(Math.random() * 32000); while (n === 11982); // o 11982 não tem solução
    return n;
  }

  // ---------- Estado ----------
  function ajustarStats(s) {
    s = s || {};
    for (const k in NIVEIS) s[k] = s[k] || { j: 0, v: 0, seq: 0, max: 0, melhor: null };
    return s;
  }
  function nova(nivel, n, stats) {
    if (n == null) n = sortear(nivel);
    return { nivel, n, c: distribuir(n), l: Array(NIVEIS[nivel].cel).fill(null), f: [[], [], [], []], m: 0, t: 0, hist: [], ganhou: false, contou: false, stats };
  }
  function valida(x) {
    try {
      const todas = [...x.l.filter(c => c != null), ...x.f.flat(), ...x.c.flat()];
      return NIVEIS[x.nivel] && x.l.length === NIVEIS[x.nivel].cel && x.f.length === 4 && x.c.length === 8 &&
        todas.length === 52 && new Set(todas).size === 52 && Array.isArray(x.hist);
    } catch (err) { return false; }
  }
  let e = JO.carregar('freecell', null);
  if (!valida(e)) e = nova((e && NIVEIS[e.nivel]) ? e.nivel : 'facil', null, e && e.stats);
  e.stats = ajustarStats(e.stats);
  const salvar = Cartas.gravador(() => { e.stats.v = Object.keys(NIVEIS).reduce((s, k) => s + e.stats[k].v, 0); JO.salvar('freecell', e); });

  let ocupado = null, festaId = 0, voa = new Set(), avisoT = null;
  let G = {}, onde = {};
  const xy = {};

  // ---------- Regras ----------
  const topo = a => a[a.length - 1];
  const encaixa = (baixo, cima) => vermelha(baixo) !== vermelha(cima) && valor(baixo) === valor(cima) + 1;
  const nivelNaipe = n => { const p = e.f.find(x => x.length && naipe(x[0]) === n); return p ? p.length : 0; };
  function acharFund(c) {
    for (let n = 0; n < 4; n++) { const p = e.f[n]; if (p.length && naipe(p[0]) === naipe(c) && valor(c) === p.length) return n; }
    if (valor(c) === 0) for (let n = 0; n < 4; n++) if (!e.f[n].length) return n;
    return -1;
  }
  const celulaLivre = () => e.l.indexOf(null);
  // Quantas cartas dá para mover de uma vez (usando células e colunas livres como apoio).
  function maxMover(paraVazia) {
    const livres = e.l.filter(c => c == null).length;
    const vazias = e.c.filter(c => !c.length).length - (paraVazia ? 1 : 0);
    return (livres + 1) * 2 ** Math.max(0, vazias);
  }
  function pegavel(id) {
    const o = onde[id]; if (!o) return null;
    if (o.p[0] === 'l') return { p: o.p, i: 0, ids: [id] };
    if (o.p[0] !== 'c') return null;
    const col = e.c[+o.p.slice(1)], ids = col.slice(o.i);
    for (let k = 1; k < ids.length; k++) if (!encaixa(ids[k - 1], ids[k])) return null;
    return { p: o.p, i: o.i, ids };
  }
  function podeCol(g, j) {
    const col = e.c[j];
    if (!col.length) return g.ids.length <= maxMover(true);
    return encaixa(topo(col), g.ids[0]) && g.ids.length <= maxMover(false);
  }
  // Ajusta o destino: monte ou célula específicos viram "qualquer monte/célula que sirva".
  function destino(g, p) {
    if (!p || p === g.p) return null;
    if (p[0] === 'f') { if (g.ids.length !== 1) return null; const n = acharFund(g.ids[0]); return n < 0 ? null : 'f' + n; }
    if (p[0] === 'l') {
      if (g.ids.length !== 1 || g.p[0] === 'l') return null;
      if (e.l[+p[1]] == null) return p;
      const k = celulaLivre(); return k < 0 ? null : 'l' + k;
    }
    return podeCol(g, +p.slice(1)) ? p : null;
  }
  function foto() {
    e.hist.push(JSON.stringify({ c: e.c, l: e.l, f: e.f, m: e.m }));
    if (e.hist.length > 400) e.hist.shift();
  }
  function tirar(g) {
    if (g.p[0] === 'l') e.l[+g.p[1]] = null;
    else if (g.p[0] === 'f') e.f[+g.p[1]].pop();
    else e.c[+g.p.slice(1)].splice(g.i);
  }
  function por(ids, p) {
    if (p[0] === 'l') e.l[+p[1]] = ids[0];
    else if (p[0] === 'f') e.f[+p[1]].push(ids[0]);
    else e.c[+p.slice(1)].push(...ids);
  }
  function tentar(g, p) {
    const d = destino(g, p);
    if (!d) return false;
    foto(); tirar(g); por(g.ids, d);
    e.m++; limparDica();
    if (!e.contou) { e.contou = true; e.stats[e.nivel].j++; }
    JO.som('carta'); salvar(); desenhar(g.ids);
    autoSubir();
    return true;
  }
  // Melhor lugar para o toque simples: monte, coluna que encaixa, célula livre, coluna vazia.
  function melhorLugar(g) {
    if (g.p[0] === 'f') return null;
    if (g.ids.length === 1 && acharFund(g.ids[0]) >= 0) return 'f0';
    const cs = [0, 1, 2, 3, 4, 5, 6, 7].map(j => 'c' + j).filter(p => destino(g, p));
    const cheia = cs.find(p => e.c[+p[1]].length), vazia = cs.find(p => !e.c[+p[1]].length);
    if (cheia) return cheia;
    if (g.ids.length === 1 && destino(g, 'l0')) return 'l0';
    return vazia && !(g.p[0] === 'c' && g.i === 0) ? vazia : null;
  }
  function desfazer() {
    terminar(); mao.cancelar();
    if (!e.hist.length || e.ganhou) return;
    Object.assign(e, JSON.parse(e.hist.pop())); limparDica(); salvar(); desenhar();
  }

  // ---------- Subir sozinho para os montes (só cartas que não fazem mais falta) ----------
  function segura(c) {
    const v = valor(c);
    if (nivelNaipe(naipe(c)) !== v) return false;
    if (v <= 1) return true;
    for (let n = 0; n < 4; n++) if ((n % 2 === 1) !== vermelha(c) && nivelNaipe(n) < v - 1) return false;
    return true;
  }
  function subirUma() {
    const cand = [...e.l.map((c, i) => c == null ? null : { p: 'l' + i, i: 0, ids: [c] }),
      ...e.c.map((col, j) => col.length ? { p: 'c' + j, i: col.length - 1, ids: [topo(col)] } : null)].filter(Boolean);
    const g = cand.find(x => segura(x.ids[0]));
    if (g) { tirar(g); por(g.ids, 'f' + acharFund(g.ids[0])); }
    return g;
  }
  function autoSubir() {
    clearTimeout(ocupado);
    ocupado = setTimeout(function passo() {
      const g = subirUma();
      if (g) { JO.som('carta'); desenhar(g.ids); ocupado = setTimeout(passo, 100); return; }
      fimAuto();
    }, 140);
  }
  // Se o jogador toca antes de terminar, sobe tudo de uma vez: ninguém precisa esperar.
  function terminar() {
    if (!ocupado) return;
    clearTimeout(ocupado); ocupado = null;
    const ids = []; let g; while ((g = subirUma())) ids.push(...g.ids);
    if (ids.length) desenhar(ids);
    fimAuto();
  }
  function fimAuto() {
    ocupado = null; salvar();
    if (!mao.arrastando()) desenhar();
    if (e.ganhou) return;
    if (e.f.every(x => x.length === 13)) vitoria();
    else if (travado()) setTimeout(() => { if (!ocupado && travado() && !$('travou').open) { JO.som('derrota'); $('travou').showModal(); } }, 300);
  }
  function travado() {
    if (celulaLivre() >= 0 || e.c.some(c => !c.length)) return false;
    const soltas = [...e.l, ...e.c.map(topo)];
    for (const c of soltas) {
      if (acharFund(c) >= 0) return false;
      if (e.c.some(col => encaixa(topo(col), c))) return false;
    }
    return true;
  }

  // ---------- Dica (procura uma jogada que leve à vitória) ----------
  function resolver(limite) {
    const ncel = NIVEIS[e.nivel].cel, nai = naipe, val = valor, red = vermelha;
    const ini = { c: e.c.map(x => x.slice()), f: [0, 1, 2, 3].map(nivelNaipe), l: e.l.filter(c => c != null), p: null };
    const chave = st => st.c.map(x => x.join(',')).sort().join('|') + '#' + st.l.slice().sort((a, b) => a - b).join(',');
    const h = st => {
      let s = 0;
      for (const col of st.c) for (let i = 0; i < col.length; i++) for (let k = i + 1; k < col.length; k++) if (val(col[k]) > val(col[i])) { s++; break; }
      return (52 - st.f[0] - st.f[1] - st.f[2] - st.f[3]) * 2 + s + st.l.length * .5 - st.c.filter(x => !x.length).length;
    };
    const seg = (st, c) => { const v = val(c); if (st.f[nai(c)] !== v) return false; if (v <= 1) return true;
      for (let n = 0; n < 4; n++) if ((n % 2 === 1) !== red(c) && st.f[n] < v - 1) return false; return true; };
    const auto = st => { let mud = true; while (mud) { mud = false;
      for (const col of st.c) { const c = topo(col); if (c != null && seg(st, c)) { col.pop(); st.f[nai(c)]++; mud = true; } }
      for (let i = 0; i < st.l.length; i++) { const c = st.l[i]; if (seg(st, c)) { st.l.splice(i, 1); st.f[nai(c)]++; i--; mud = true; } } } };
    const copia = st => ({ c: st.c.map(x => x.slice()), f: st.f.slice(), l: st.l.slice(), p: st.p });
    const heap = [];
    const push = (pr, x) => { heap.push([pr, x]); let i = heap.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
    const pop = () => { const t = heap[0], u = heap.pop(); if (heap.length) { heap[0] = u; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return t[1]; };
    auto(ini);
    if (ini.f.every(x => x === 13)) return null;
    const visto = new Set([chave(ini)]);
    push(h(ini), { st: ini, g: 0 });
    let nos = 0;
    while (heap.length) {
      const { st, g } = pop();
      if (st.f.every(x => x === 13)) return st.p;
      if (++nos > limite) return undefined;
      const add = (ns, mov) => { if (!ns.p) ns.p = mov; auto(ns); const k = chave(ns); if (visto.has(k)) return; visto.add(k); push(h(ns) + (g + 1) * .05, { st: ns, g: g + 1 }); };
      const vazia = st.c.findIndex(x => !x.length);
      for (let i = 0; i < st.l.length; i++) {
        const c = st.l[i];
        if (st.f[nai(c)] === val(c)) { const ns = copia(st); ns.l.splice(i, 1); ns.f[nai(c)]++; add(ns, { id: c, para: 'f' }); }
        for (let j = 0; j < 8; j++) { const t = topo(st.c[j]);
          if (t == null ? j === vazia : encaixa(t, c)) { const ns = copia(st); ns.l.splice(i, 1); ns.c[j].push(c); add(ns, { id: c, para: 'c' + j }); } }
      }
      for (let i = 0; i < 8; i++) {
        const col = st.c[i]; if (!col.length) continue; const c = topo(col);
        if (st.f[nai(c)] === val(c)) { const ns = copia(st); ns.c[i].pop(); ns.f[nai(c)]++; add(ns, { id: c, para: 'f' }); }
        for (let j = 0; j < 8; j++) { if (j === i) continue; const t = topo(st.c[j]);
          if (t == null ? (j === vazia && col.length > 1) : encaixa(t, c)) { const ns = copia(st); ns.c[i].pop(); ns.c[j].push(c); add(ns, { id: c, para: 'c' + j }); } }
        if (st.l.length < ncel) { const ns = copia(st); ns.c[i].pop(); ns.l.push(c); add(ns, { id: c, para: 'l' }); }
      }
    }
    return false; // não há solução a partir daqui
  }
  function limparDica() { document.querySelectorAll('.dica').forEach(x => x.classList.remove('dica')); }
  function aviso(txt, ms) {
    clearTimeout(avisoT); $('aviso').textContent = txt; $('aviso').hidden = false;
    avisoT = setTimeout(() => $('aviso').hidden = true, ms || 2200);
  }
  function dica() {
    terminar(); mao.cancelar();
    if (e.ganhou || !NIVEIS[e.nivel].dica) return;
    limparDica(); desenhar();
    aviso('Pensando…', 10000);
    setTimeout(() => {
      const r = resolver(25000);
      if (r === false) return aviso('Daqui não tem mais solução. Tente desfazer.', 3200);
      if (!r) { const s = dicaSimples(); if (!s) return aviso('Não achei uma dica agora. Tente outra jogada.', 3000); return mostrar(s); }
      mostrar(r);
    }, 40);
  }
  // Reserva, quando a busca não termina a tempo: uma jogada útil simples.
  function dicaSimples() {
    const soltas = [...e.l.map((c, i) => c == null ? null : { id: c, de: 'l' + i }), ...e.c.map((col, j) => col.length ? { id: topo(col), de: 'c' + j, col } : null)].filter(Boolean);
    for (const s of soltas) if (acharFund(s.id) >= 0) return { id: s.id, para: 'f' };
    for (const s of soltas) {
      const debaixo = s.col && s.col.length > 1 ? s.col[s.col.length - 2] : null;
      if (debaixo != null && encaixa(debaixo, s.id)) continue; // já está bem encaixada
      const j = e.c.findIndex(col => col.length && encaixa(topo(col), s.id));
      if (j >= 0) return { id: s.id, para: 'c' + j };
    }
    return null;
  }
  function mostrar(r) {
    $('aviso').hidden = true;
    const marcar = el => { void el.offsetWidth; el.classList.add('dica'); };
    marcar(cartas[r.id]);
    let alvo;
    if (r.para === 'f') { const n = acharFund(r.id); alvo = e.f[n].length ? cartas[topo(e.f[n])] : vagas['f' + n]; }
    else if (r.para === 'l') alvo = vagas['l' + celulaLivre()];
    else { const col = e.c[+r.para.slice(1)]; alvo = col.length ? cartas[topo(col)] : vagas[r.para]; }
    if (alvo) marcar(alvo);
  }

  // ---------- Vitória ----------
  function vitoria() {
    const s = e.stats[e.nivel];
    e.ganhou = true; e.hist = []; s.v++; s.seq++; s.max = Math.max(s.max, s.seq);
    if (s.melhor == null || e.t < s.melhor) s.melhor = e.t;
    salvar(); desenhar();
    JO.vibrar([40, 60, 120]); JO.som('vitoria');
    const id = ++festaId;
    setTimeout(() => { if (id === festaId) festa(id); }, 350);
    setTimeout(() => {
      if (!e.ganhou || id !== festaId) return;
      $('vitoria-txt').textContent = `${NIVEIS[e.nivel].nome} · Jogo nº ${e.n} · Tempo ${relogio(e.t)} · ${e.m} jogadas. ` +
        `Vitórias neste nível: ${s.v} de ${s.j} (${Math.round(100 * s.v / Math.max(1, s.j))}%) · Sequência: ${s.seq} · Melhor tempo: ${relogio(s.melhor)}`;
      if (!$('vitoria').open) $('vitoria').showModal();
    }, 3400);
  }
  function festa(ficha) {
    const W = tab.clientWidth, chao = tab.clientHeight - G.ch;
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

  // ---------- Novo jogo / recomeçar / nível ----------
  function abandonar() { if (e.m > 0 && !e.ganhou) e.stats[e.nivel].seq = 0; }
  function comecar(nivel, n, mesmo) {
    mao.cancelar(); festaId++; clearTimeout(ocupado); ocupado = null; limparDica();
    const contou = mesmo ? e.contou : false;
    if (!mesmo) abandonar();
    e = nova(nivel, n, e.stats); e.contou = contou; salvar();
    medir();
    cartas.forEach(el => { el.classList.add('arrasta'); Cartas.pos(el, G.W / 2 - G.cw / 2, G.y0); el.style.visibility = ''; });
    void tab.offsetWidth;
    desenhar();
    if (!mesmo) aviso(`${NIVEIS[nivel].nome} · Jogo nº ${e.n}`, 1600);
  }
  let pendente = null;
  function pedir(titulo, acao) {
    if (e.m > 0 && !e.ganhou) { pendente = acao; $('confirma-tit').textContent = titulo; $('confirma').showModal(); }
    else acao();
  }

  // ---------- Tela ----------
  const vagas = {}, cartas = [];
  for (const p of ['l0', 'l1', 'l2', 'l3', 'l4', 'f0', 'f1', 'f2', 'f3', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
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
    const gap = Math.max(1, Math.min(8, W * .005)), prop = baixa ? 1.32 : 1.68;
    const cw = Math.max(30, Math.min((W - 7 * gap) / 8, livre / (prop * (baixa ? 4 : 4.1)), 130)), ch = cw * prop, y0 = ch + Math.max(6, gap * 2.5);
    const H = Math.max(livre, y0 + ch * 2.4), x0 = (W - 8 * cw - 7 * gap) / 2;
    G = { W, gap, cw, ch, y0, H, x0, x: j => x0 + j * (cw + gap) };
    tab.style.height = H + 'px'; tab.style.setProperty('--v', baixa ? .4 : .6);
    tab.style.setProperty('--cw', cw + 'px'); tab.style.setProperty('--ch', ch + 'px');
    const pv = (p, x, y) => vagas[p].style.transform = `translate(${x}px,${y}px)`;
    // Com 5 células, os 4 montes ficam um pouco sobrepostos para caber na mesma linha.
    const cel = NIVEIS[e.nivel].cel;
    G.fx = n => cel > 4 ? G.x(5) + n * (G.x(7) - G.x(5)) / 3 : G.x(4 + n);
    for (let n = 0; n < 5; n++) { pv('l' + n, G.x(n), 0); vagas['l' + n].hidden = n >= cel; }
    for (let n = 0; n < 4; n++) pv('f' + n, G.fx(n), 0);
    for (let j = 0; j < 8; j++) pv('c' + j, G.x(j), y0);
  }

  const relogio = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

  function desenhar(movidas) {
    if (movidas && movidas.length) {
      voa = new Set(movidas);
      setTimeout(() => { voa = new Set(); if (!mao.arrastando() && !e.ganhou) desenhar(); }, 220);
    }
    onde = {};
    const poe = (id, x, y, z, p, i) => {
      const el = cartas[id];
      el.classList.remove('arrasta', 'pega', 'mira');
      if (el.style.visibility) el.style.visibility = '';
      Cartas.pos(el, x, y, z + (voa.has(id) ? 1000 : 0));
      xy[id] = { x, y }; onde[id] = { p, i };
    };
    e.l.forEach((id, n) => { if (id != null) poe(id, G.x(n), 0, 100, 'l' + n, 0); });
    e.f.forEach((pl, n) => pl.forEach((id, i) => poe(id, G.fx(n), 0, 200 + n * 20 + i, 'f' + n, i)));
    e.c.forEach((col, j) => {
      let ou = G.ch * .46;
      const total = Math.max(0, col.length - 1) * ou + G.ch, cabe = G.H - G.y0 - 4;
      if (total > cabe) ou = (cabe - G.ch) / Math.max(1, col.length - 1);
      col.forEach((id, i) => poe(id, G.x(j), G.y0 + i * ou, 300 + i, 'c' + j, i));
    });
    $('jogadas').textContent = e.m;
    $('tempo').textContent = relogio(e.t);
    $('numero-txt').textContent = e.n;
    $('desfazer').disabled = !e.hist.length || e.ganhou;
    $('dica').hidden = !NIVEIS[e.nivel].dica;
    $('dica').disabled = e.ganhou;
    document.querySelectorAll('.modos button').forEach(b => b.classList.toggle('ativo', b.dataset.nivel === e.nivel));
  }

  // ---------- Toque e arrasto (o dedo é lido em js/cartas.js) ----------
  // O que está neste ponto do tabuleiro. Um pouco abaixo da última carta da coluna ainda vale.
  function achar(x, y) {
    if (x < G.x0 - G.cw * .5 || x > G.x(7) + G.cw * 1.5) return null;
    const j = Math.max(0, Math.min(7, Math.floor((x - G.x0 + G.gap / 2) / (G.cw + G.gap))));
    if (y < G.y0 - 2) {
      const cel = NIVEIS[e.nivel].cel;
      if (j < cel) return { p: 'l' + j, id: e.l[j] };
      if (x < G.fx(0)) return null;
      return { p: 'f0' };
    }
    const k = e.c[j];
    if (!k.length) return y < G.y0 + G.ch * 1.4 ? { p: 'c' + j } : null;
    if (y > xy[topo(k)].y + G.ch * 1.4) return null;
    let i = k.length - 1; while (i > 0 && xy[k[i]].y > y) i--;
    return { p: 'c' + j, id: k[i] };
  }
  function tocar(alvo) {
    if (e.ganhou || alvo.id == null) return false;
    let g = pegavel(alvo.id);
    if (!g) {
      const col = alvo.p[0] === 'c' ? e.c[+alvo.p[1]] : [];
      JO.som('erro'); Cartas.tremer(col.slice(col.indexOf(alvo.id)).map(id => cartas[id]));
      return false;
    }
    const p = melhorLugar(g);
    if (p && tentar(g, p)) return true;
    JO.som('erro'); Cartas.tremer(g.ids.map(id => cartas[id]));
    return false;
  }
  function alvos(g) {
    const r = [];
    if (destino(g, 'f0')) { const n = acharFund(g.ids[0]); r.push({ p: 'f0', x: G.fx(0), y: 0, w: G.fx(3) + G.cw - G.fx(0), h: G.ch, el: e.f[n].length ? cartas[topo(e.f[n])] : vagas['f' + n] }); }
    for (let n = 0; n < NIVEIS[e.nivel].cel; n++) { const d = destino(g, 'l' + n); if (d) r.push({ p: d, x: G.x(n), y: 0, w: G.cw, h: G.ch, el: vagas[d] }); }
    for (let j = 0; j < 8; j++) if (destino(g, 'c' + j)) { const k = e.c[j]; r.push({ p: 'c' + j, x: G.x(j), y: G.y0, w: G.cw, h: G.H - G.y0, el: k.length ? cartas[topo(k)] : vagas['c' + j] }); }
    return r;
  }
  function falhou(g, x, y) {
    if (g.ids.length < 2 || y < G.y0) return;
    const col = e.c[Math.max(0, Math.min(7, Math.floor((x - G.x0) / (G.cw + G.gap))))], max = maxMover(!col.length);
    if (g.ids.length > max && (!col.length || encaixa(topo(col), g.ids[0]))) aviso(max === 1 ? 'Dá para mover só 1 carta de uma vez agora' : `Dá para mover só ${max} cartas de uma vez agora`);
  }
  const mao = Cartas.ligar({
    tab, cartas, xy, medidas: () => G, antes: terminar, achar, alvos, tocar, mover: tentar, falhou,
    pegar: id => e.ganhou ? null : pegavel(id),
    repete: () => false, voltou: () => desenhar(), aoArrastar: limparDica,
  });

  // ---------- Botões e relógio ----------
  $('novo').addEventListener('click', () => pedir('Começar um novo jogo?', () => comecar(e.nivel)));
  $('confirma-sim').addEventListener('click', () => { $('confirma').close(); const a = pendente; pendente = null; if (a) a(); });
  $('vitoria-novo').addEventListener('click', () => { $('vitoria').close(); comecar(e.nivel); });
  $('desfazer').addEventListener('click', desfazer);
  $('dica').addEventListener('click', dica);
  document.querySelectorAll('.modos button').forEach(b => b.addEventListener('click', () => {
    const nv = b.dataset.nivel; if (nv === e.nivel) return;
    pedir(`Mudar para ${NIVEIS[nv].nome}?`, () => comecar(nv));
  }));
  $('numero').addEventListener('click', () => {
    $('escolher-atual').textContent = e.n; $('num-campo').value = '';
    $('num-nota').textContent = e.nivel === 'dificil' ? 'No Difícil (3 células), nem todo número escolhido tem solução.' :
      e.nivel !== 'medio' ? 'Um número escolhido pode não ser um jogo fácil.' : '';
    $('recomecar').disabled = e.m === 0;
    $('escolher').showModal();
  });
  $('recomecar').addEventListener('click', () => { $('escolher').close(); comecar(e.nivel, e.n, true); });
  function irNumero() {
    const n = Math.floor(+$('num-campo').value);
    if (!(n >= 1 && n <= 32000)) { $('num-nota').textContent = 'Digite um número de 1 a 32.000.'; JO.som('erro'); return; }
    $('escolher').close();
    pedir(`Jogar o jogo nº ${n}?`, () => comecar(e.nivel, n));
  }
  $('num-ir').addEventListener('click', irNumero);
  $('num-campo').addEventListener('keydown', ev => { if (ev.key === 'Enter') irNumero(); });
  $('travou-desfazer').addEventListener('click', () => { $('travou').close(); desfazer(); });
  $('travou-recomecar').addEventListener('click', () => { $('travou').close(); comecar(e.nivel, e.n, true); });
  $('travou-novo').addEventListener('click', () => { $('travou').close(); comecar(e.nivel); });

  setInterval(() => {
    if (e.m > 0 && !e.ganhou && !document.hidden && !JO.pausado()) {
      e.t++; $('tempo').textContent = relogio(e.t);
      if (e.t % 5 === 0) salvar();
    }
  }, 1000);
  window.addEventListener('resize', () => { mao.cancelar(); medir(); if (!e.ganhou) desenhar(); });

  medir(); desenhar();
  if (!e.ganhou) autoSubir();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__fc = { get e() { return e; }, distribuir, resolver, tentar, pegavel, desenhar, comecar };
})();
