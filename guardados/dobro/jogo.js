// Dobro: deslize para juntar números iguais num quadro 4x4.
(() => {
  const $ = id => document.getElementById(id);
  const tab = $('tab'), N = 4, META = 2048;
  for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.className = 'vazio'; tab.appendChild(d); }

  // Estado salvo: g = 16 valores (0 = vazio), pts, ant = jogada anterior (para desfazer), stats.
  let e = JO.carregar('dobro', null);
  const valido = x => x && Array.isArray(x.g) && x.g.length === N * N && x.stats;
  let pecas = []; // { v, i, el }

  const cor = v => {
    const k = Math.log2(v);
    return k >= 11 ? 'linear-gradient(135deg, #f0b429, #e8590c)' : `hsl(${(215 + k * 31) % 360} 58% ${54 - Math.min(k, 8)}%)`;
  };
  function veste(p, classe) {
    const t = String(p.v);
    p.el.className = 'peca' + (t.length >= 3 ? ' d' + Math.min(t.length, 5) : '') + (classe ? ' ' + classe : '');
    p.el.style.background = cor(p.v);
    p.el.innerHTML = `<span>${t}</span>`;
  }
  const posiciona = p => p.el.style.transform = `translate(calc(${p.i % N} * (100% + var(--g))), calc(${Math.floor(p.i / N)} * (100% + var(--g))))`;
  function cria(v, i, classe) {
    const p = { v, i, el: document.createElement('div') };
    veste(p, classe); posiciona(p); tab.appendChild(p.el); pecas.push(p);
    return p;
  }
  const valores = () => { const g = Array(N * N).fill(0); pecas.forEach(p => g[p.i] = p.v); return g; };
  function montar(g) { pecas.forEach(p => p.el.remove()); pecas = []; g.forEach((v, i) => { if (v) cria(v, i); }); }
  function sorteia() {
    const g = valores(), livres = g.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (livres.length) cria(Math.random() < .9 ? 2 : 4, livres[Math.floor(Math.random() * livres.length)], 'nasce');
  }
  function semJogadas() {
    const g = valores();
    for (let i = 0; i < N * N; i++) {
      if (!g[i]) return false;
      if (i % N < N - 1 && g[i] === g[i + 1]) return false;
      if (i < N * (N - 1) && g[i] === g[i + N]) return false;
    }
    return true;
  }

  function painel() {
    $('pontos').textContent = e.pts;
    $('recorde').textContent = e.stats.melhor;
    $('desfazer').disabled = !e.ant || e.fim;
    $('status').textContent = e.fim ? 'Fim de jogo: não há mais jogadas' : e.pts ? 'Maior peça: ' + Math.max(...e.g) : 'Deslize o dedo para juntar números iguais';
  }
  const salvar = () => { e.g = valores(); JO.salvar('dobro', e); };

  function novoJogo() {
    e = { g: Array(N * N).fill(0), pts: 0, ant: null, venceu: false, fim: false, stats: (e && e.stats) || { melhor: 0, maior: 0 } };
    montar(e.g); sorteia(); sorteia(); salvar(); painel();
  }

  // dir: 0 esquerda, 1 direita, 2 cima, 3 baixo
  function mover(dir) {
    if (e.fim) return;
    const em = Array(N * N).fill(null); pecas.forEach(p => em[p.i] = p);
    const antes = { g: valores(), pts: e.pts };
    let mudou = false, ganho = 0; const somem = [];
    for (let k = 0; k < N; k++) {
      const linha = []; // posições desta fileira, começando pelo lado para onde tudo vai
      for (let j = 0; j < N; j++) linha.push(dir === 0 ? k * N + j : dir === 1 ? k * N + (N - 1 - j) : dir === 2 ? j * N + k : (N - 1 - j) * N + k);
      let alvo = 0, ult = null;
      for (const p of linha.map(i => em[i]).filter(Boolean)) {
        if (ult && ult.v === p.v && !ult.fundida) {
          p.i = ult.i; somem.push(p); ult.v *= 2; ult.fundida = true; ganho += ult.v; mudou = true;
        } else { const d = linha[alvo++]; if (p.i !== d) mudou = true; p.i = d; ult = p; }
      }
    }
    if (!mudou) return;
    pecas = pecas.filter(p => !somem.includes(p));
    somem.forEach(p => { posiciona(p); setTimeout(() => p.el.remove(), 130); });
    pecas.forEach(p => { posiciona(p); if (p.fundida) { p.fundida = false; setTimeout(() => veste(p, 'junta'), 90); } else p.el.classList.remove('nasce', 'junta'); });
    e.ant = antes; e.pts += ganho;
    sorteia();
    const maior = Math.max(...valores());
    if (e.pts > e.stats.melhor) e.stats.melhor = e.pts;
    if (maior > e.stats.maior) e.stats.maior = maior;
    JO.som(ganho ? 'toque' : 'carta');
    if (maior >= META && !e.venceu) {
      e.venceu = true; JO.vibrar([40, 60, 120]); JO.som('vitoria');
      aviso('Você chegou ao ' + META + '! 🎉', `Pontos: ${e.pts}. Pode continuar jogando para ir ainda mais longe.`, true);
    } else if (semJogadas()) {
      e.fim = true; JO.vibrar(80); JO.som('derrota');
      aviso('Fim de jogo', `Você fez ${e.pts} pontos e chegou na peça ${maior}. Recorde: ${e.stats.melhor}.`, false);
    }
    salvar(); painel();
  }
  function aviso(titulo, texto, continua) {
    $('aviso-titulo').textContent = titulo; $('aviso-txt').textContent = texto;
    $('aviso-fecha').textContent = continua ? 'Continuar jogando' : 'Fechar';
    setTimeout(() => { if (!$('aviso').open) $('aviso').showModal(); }, 350);
  }
  function desfazer() {
    if (!e.ant || e.fim) return;
    e.pts = e.ant.pts; montar(e.ant.g); e.ant = null; salvar(); painel();
  }

  // ---------- Controles: deslizar, setas da tela e teclado ----------
  let toque = null;
  tab.addEventListener('pointerdown', ev => { toque = { x: ev.clientX, y: ev.clientY }; try { tab.setPointerCapture(ev.pointerId); } catch (err) {} });
  tab.addEventListener('pointerup', ev => {
    if (!toque) return;
    const dx = ev.clientX - toque.x, dy = ev.clientY - toque.y; toque = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    mover(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 1) : (dy < 0 ? 2 : 3));
  });
  tab.addEventListener('pointercancel', () => toque = null);
  document.querySelectorAll('.setas button').forEach(b => b.addEventListener('click', () => mover(+b.dataset.dir)));
  document.addEventListener('keydown', ev => {
    const d = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 }[ev.key];
    if (d != null && !document.querySelector('dialog[open]')) { mover(d); ev.preventDefault(); }
  });

  $('novo').addEventListener('click', () => (e.pts > 0 && !e.fim) ? $('confirma').showModal() : novoJogo());
  $('confirma-sim').addEventListener('click', () => { $('confirma').close(); novoJogo(); });
  $('aviso-novo').addEventListener('click', () => { $('aviso').close(); novoJogo(); });
  $('desfazer').addEventListener('click', desfazer);

  if (valido(e)) { montar(e.g); painel(); } else novoJogo();
})();
