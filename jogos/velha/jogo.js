// Jogo da Velha — 2 jogadores ou contra o computador (X = você, O = computador).
(() => {
  const LINHAS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const zero = () => ({ X: 0, O: 0, E: 0 });
  const $ = id => document.getElementById(id);

  // Estado salvo no aparelho: jogadas feitas, modo, quem começa e placar de cada modo.
  let e = JO.carregar('velha', null);
  if (!e || !Array.isArray(e.hist)) e = { hist: [], modo: 'facil', inicia: 'X', placar: { 2: zero(), facil: zero(), dificil: zero() } };
  let espera = null, ultima = -1;

  const outro = j => (j === 'X' ? 'O' : 'X');
  const vez = () => (e.hist.length % 2 === 0 ? e.inicia : outro(e.inicia));
  const tabuleiro = () => { const t = Array(9).fill(''); e.hist.forEach((c, i) => t[c] = i % 2 === 0 ? e.inicia : outro(e.inicia)); return t; };
  const contraPC = () => e.modo !== '2';

  function resultado(t) {
    for (const l of LINHAS) if (t[l[0]] && t[l[0]] === t[l[1]] && t[l[1]] === t[l[2]]) return { quem: t[l[0]], linha: l };
    return t.every(Boolean) ? { quem: 'E' } : null;
  }

  // ---------- Computador ----------
  function minimax(t, jogador, prof) {
    const r = resultado(t);
    if (r) return r.quem === 'O' ? 10 - prof : r.quem === 'X' ? prof - 10 : 0;
    let melhor = jogador === 'O' ? -99 : 99;
    for (let i = 0; i < 9; i++) if (!t[i]) {
      t[i] = jogador; const v = minimax(t, outro(jogador), prof + 1); t[i] = '';
      melhor = jogador === 'O' ? Math.max(melhor, v) : Math.min(melhor, v);
    }
    return melhor;
  }
  function escolhaPC() {
    const t = tabuleiro(), livres = t.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    const sorteia = lista => lista[Math.floor(Math.random() * lista.length)];
    if (e.modo === 'facil') {
      // Fácil: só aproveita vitória pronta metade das vezes; no resto joga ao acaso.
      if (Math.random() < .5) for (const i of livres) { t[i] = 'O'; const g = resultado(t); t[i] = ''; if (g && g.quem === 'O') return i; }
      return sorteia(livres);
    }
    let melhor = -99, opcoes = [];
    for (const i of livres) {
      t[i] = 'O'; const v = minimax(t, 'X', 1); t[i] = '';
      if (v > melhor) { melhor = v; opcoes = [i]; } else if (v === melhor) opcoes.push(i);
    }
    return sorteia(opcoes);
  }
  function agendaPC() {
    clearTimeout(espera);
    if (contraPC() && vez() === 'O' && !resultado(tabuleiro()))
      espera = setTimeout(() => marcar(escolhaPC()), 500);
  }

  // ---------- Jogadas ----------
  function marcar(i) {
    const t = tabuleiro();
    if (t[i] || resultado(t)) return;
    e.hist.push(i); ultima = i;
    const r = resultado(tabuleiro());
    if (r) { e.placar[e.modo][r.quem]++; if (navigator.vibrate) navigator.vibrate(r.quem === 'E' ? 40 : [40, 60, 90]); }
    JO.salvar('velha', e); desenhar(); agendaPC();
  }
  function tocar(i) { if (!(contraPC() && vez() === 'O')) marcar(i); }

  function novo() {
    clearTimeout(espera);
    if (e.hist.length) e.inicia = outro(e.inicia);
    e.hist = []; ultima = -1;
    JO.salvar('velha', e); desenhar(); agendaPC();
  }
  function desfazer() {
    if (!e.hist.length || resultado(tabuleiro())) return;
    clearTimeout(espera);
    e.hist.pop();
    if (contraPC() && vez() === 'O' && e.hist.length) e.hist.pop();
    ultima = -1; JO.salvar('velha', e); desenhar(); agendaPC();
  }
  function trocarModo(m) {
    if (m === e.modo) return;
    clearTimeout(espera);
    e.modo = m; e.hist = []; e.inicia = 'X'; ultima = -1;
    JO.salvar('velha', e); desenhar();
  }

  // ---------- Tela ----------
  const casas = [];
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.className = 'casa'; b.addEventListener('click', () => tocar(i));
    $('tabuleiro').appendChild(b); casas.push(b);
  }

  function desenhar() {
    const t = tabuleiro(), r = resultado(t), p = e.placar[e.modo], pc = contraPC();
    casas.forEach((b, i) => {
      b.className = 'casa' + (t[i] ? ' ' + t[i].toLowerCase() : '') + (i === ultima ? ' nova' : '') + (r && r.linha && r.linha.includes(i) ? ' ganhou' : '');
      b.setAttribute('aria-label', `Casa ${i + 1}: ${t[i] || 'vazia'}`);
    });
    $('tabuleiro').classList.toggle('fim', !!r);

    const risco = $('risco'), linha = risco.querySelector('line');
    if (r && r.linha) {
      const c = i => [50 + 100 * (i % 3), 50 + 100 * Math.floor(i / 3)];
      const [x1, y1] = c(r.linha[0]), [x2, y2] = c(r.linha[2]);
      const dx = Math.sign(x2 - x1) * 28, dy = Math.sign(y2 - y1) * 28;
      linha.setAttribute('x1', x1 - dx); linha.setAttribute('y1', y1 - dy);
      linha.setAttribute('x2', x2 + dx); linha.setAttribute('y2', y2 + dy);
      risco.classList.add('mostra');
    } else risco.classList.remove('mostra');

    $('nome-x').textContent = pc ? 'Você (X)' : 'Jogador X';
    $('nome-o').textContent = pc ? 'Computador (O)' : 'Jogador O';
    $('pt-x').textContent = p.X; $('pt-o').textContent = p.O; $('pt-e').textContent = p.E;
    document.querySelector('.ponto.x').classList.toggle('vez', !r && vez() === 'X');
    document.querySelector('.ponto.o').classList.toggle('vez', !r && vez() === 'O');

    let msg;
    if (!r) msg = pc ? (vez() === 'X' ? 'Sua vez' : 'Computador pensando…') : `Vez do ${vez()}`;
    else if (r.quem === 'E') msg = 'Deu velha! Empate 🤝';
    else if (pc) msg = r.quem === 'X' ? 'Você venceu! 🎉' : 'O computador venceu 🤖';
    else msg = `${r.quem} venceu! 🎉`;
    $('status').textContent = msg;
    $('status').classList.toggle('fim', !!r);

    $('desfazer').disabled = !!r || !e.hist.length || (pc && e.hist.length === 1 && e.inicia === 'O');
    document.querySelectorAll('.modos button').forEach(b => b.classList.toggle('ativo', b.dataset.modo === e.modo));
  }

  $('novo').addEventListener('click', novo);
  $('desfazer').addEventListener('click', desfazer);
  $('zerar').addEventListener('click', () => { e.placar[e.modo] = zero(); JO.salvar('velha', e); desenhar(); });
  document.querySelectorAll('.modos button').forEach(b => b.addEventListener('click', () => trocarModo(b.dataset.modo)));

  desenhar(); agendaPC();
})();
