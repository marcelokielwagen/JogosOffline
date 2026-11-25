// Palavras Cruzadas. Partidas rápidas: grade pequena sorteada na hora (gerador.js), por tema.
// Grades grandes: as prontas de grades.js e grades-temas.js (GRADES).
(() => {
  const $ = id => document.getElementById(id);
  // Progresso salvo por grade: salvo.g[i] = { l: letras de cada casa, rev: casas reveladas, fim: completa? }
  let salvo = JO.carregar('cruzadas', null);
  if (!salvo || typeof salvo.g !== 'object' || !salvo.g) salvo = { g: {} };

  // Partidas rápidas: salvo.q = partida em andamento, qn = completas por tema, qt = melhor tempo por tamanho, qr = palavras recentes.
  salvo.qn = salvo.qn || {}; salvo.qt = salvo.qt || {}; salvo.qr = salvo.qr || {};
  const TAM = { mini: { nome: 'Mini', t: 7, w: 6 }, media: { nome: 'Média', t: 9, w: 9 } };
  if (!TAM[salvo.tam]) salvo.tam = 'mini';
  const TEMAS = Gerador.temas();
  // Partida começada na versão 3D (que saiu): continua como partida rápida; a lista de palavras recentes volta ao tamanho daqui.
  if (salvo.q && !(TEMAS[salvo.q.tema] && salvo.q.g && Array.isArray(salvo.q.g.p) && salvo.q.g.p.length)) salvo.q = null;
  if (salvo.q && !TAM[salvo.q.tam]) salvo.q.tam = salvo.q.g.p.length > 6 ? 'media' : 'mini';
  for (const t in salvo.qr) if (TEMAS[t]) salvo.qr[t] = salvo.qr[t].slice(0, Math.floor(TEMAS[t].length / 2));
  const relogio = x => String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');

  let q = null; // partida rápida aberta (null = grade grande ou lista)
  let gi = -1, N = 0, sol = [], letras = [], palavras = [], ordem = [], daCasa = [], casas = [];
  let atual = -1, dir = 'h', marca = {}, rev = new Set(), fim = false, certas = new Set();

  // ---------- Lista de grades ----------
  function totalCasas(g) { const s = new Set(); g.p.forEach(([l, c, d, p]) => { for (let i = 0; i < p.length; i++) s.add(d === 'h' ? l * g.t + c + i : (l + i) * g.t + c); }); return s.size; }
  function mostrarLista() {
    gi = -1; q = null;
    $('lista').hidden = false; $('jogo').hidden = true; $('titulo').textContent = 'Palavras Cruzadas'; $('voltar').hidden = true;
    const L = $('lista'); L.innerHTML = '';
    salvo.total = GRADES.length; JO.salvar('cruzadas', salvo);

    // Partidas rápidas
    const cab = document.createElement('div'); cab.className = 'rapida';
    cab.innerHTML = '<h2 class="cat">Partida rápida</h2><div class="modos" role="group" aria-label="Tamanho">' +
      Object.entries(TAM).map(([k, x]) => `<button data-tam="${k}" class="${k === salvo.tam ? 'ativo' : ''}">${x.nome} · ${x.w} palavras</button>`).join('') + '</div>';
    cab.querySelectorAll('[data-tam]').forEach(b => b.addEventListener('click', () => {
      salvo.tam = b.dataset.tam; JO.salvar('cruzadas', salvo);
      cab.querySelectorAll('[data-tam]').forEach(x => x.classList.toggle('ativo', x === b));
    }));
    L.appendChild(cab);
    const botao = (cls, titulo, sub, acao) => {
      const b = document.createElement('button'); b.className = 'item ' + cls;
      b.innerHTML = `<b>${titulo}</b><span>${sub}</span>`; b.addEventListener('click', acao); L.appendChild(b); return b;
    };
    if (salvo.q) botao('destaque larga', '▶ Continuar', `${salvo.q.tema} · ${relogio(salvo.q.t)}`, () => abrirRapida(salvo.q));
    botao('destaque larga', '🎲 Surpresa', 'Sorteia um tema', () => { const n = Object.keys(TEMAS); novaRapida(n[Math.floor(Math.random() * n.length)]); });
    Object.keys(TEMAS).forEach(t => botao('', t, salvo.qn[t] ? `✓ ${salvo.qn[t]} ${salvo.qn[t] === 1 ? 'completa' : 'completas'}` : 'Jogar', () => novaRapida(t)));

    // Grades grandes, recolhidas
    const det = document.createElement('details'); det.className = 'grandes';
    const prontas = GRADES.filter((_, i) => salvo.g[i] && salvo.g[i].fim).length;
    det.innerHTML = `<summary>Grades grandes <small>${prontas}/${GRADES.length}</small></summary><div class="lista"></div>`;
    L.appendChild(det);
    const Lg = det.querySelector('.lista');
    // Agrupa por categoria: primeiro as temáticas (palavra grande no centro), depois as variadas.
    const cats = [];
    GRADES.forEach((g, i) => { const c = g.cat || 'Variadas'; let x = cats.find(k => k.nome === c); if (!x) cats.push(x = { nome: c, itens: [] }); x.itens.push(i); });
    cats.sort((x, y) => (x.nome === 'Variadas') - (y.nome === 'Variadas'));
    cats.forEach(cat => {
      const h = document.createElement('h2'); h.className = 'cat'; h.textContent = cat.nome;
      const feitasCat = cat.itens.filter(i => salvo.g[i] && salvo.g[i].fim).length;
      h.innerHTML += ` <small>${feitasCat}/${cat.itens.length}</small>`;
      Lg.appendChild(h);
      cat.itens.forEach(i => {
        const g = GRADES[i], s = salvo.g[i], total = totalCasas(g), feitas = s ? s.l.filter(Boolean).length : 0;
        const b = document.createElement('button');
        b.className = 'item' + (s && s.fim ? ' feita' : '');
        const sub = s && s.fim ? '✓ Completa' : g.centro ? `Palavra central de ${g.centro.length} letras` : `${g.t}×${g.t} · ${g.p.length} palavras`;
        b.innerHTML = `<b>${g.n}</b><span>${sub}</span><div class="barrinha"><i style="width:${Math.round(100 * feitas / total)}%"></i></div>`;
        b.addEventListener('click', () => abrir(i));
        Lg.appendChild(b);
      });
    });
  }

  // ---------- Abrir uma grade ----------
  function abrir(i) { q = null; gi = i; montar(GRADES[i], salvo.g[i]); }
  // ---------- Partida rápida ----------
  function novaRapida(tema) {
    const tam = TAM[salvo.tam], antigas = salvo.qr[tema] || [];
    const g = Gerador.nova(TEMAS[tema], tam.t, tam.w, new Set(antigas));
    // Lembra as últimas palavras do tema (até metade do banco) para a próxima partida ser diferente.
    salvo.qr[tema] = [...g.p.map(x => x[3]), ...antigas].slice(0, Math.floor(TEMAS[tema].length / 2));
    abrirRapida({ tema, tam: salvo.tam, g, l: null, rev: [], t: 0 });
  }
  function abrirRapida(x) {
    q = x; salvo.q = x; gi = -1;
    montar({ n: x.tema, t: x.g.t, p: x.g.p }, x.l ? { l: x.l, rev: x.rev } : null);
    guardar();
  }
  function montar(g, s) {
    N = g.t;
    sol = Array(N * N).fill(null); daCasa = Array.from({ length: N * N }, () => ({}));
    palavras = g.p.map(([l, c, d, p, dica]) => ({ d, p, dica, cels: [...p].map((_, k) => d === 'h' ? l * N + c + k : (l + k) * N + c) }));
    palavras.forEach((w, wi) => w.cels.forEach((x, k) => { sol[x] = w.p[k]; daCasa[x][w.d] = wi; }));
    // Numeração: cada casa onde começa uma palavra ganha um número, na ordem de leitura.
    const num = {}; let n = 0;
    for (let x = 0; x < N * N; x++) if (palavras.some(w => w.cels[0] === x)) num[x] = ++n;
    palavras.forEach(w => w.num = num[w.cels[0]]);
    ordem = palavras.map((_, wi) => wi).sort((a, b) => (palavras[a].d === palavras[b].d ? palavras[a].num - palavras[b].num : palavras[a].d === 'h' ? -1 : 1));

    letras = s && s.l.length === N * N ? s.l.slice() : Array(N * N).fill('');
    rev = new Set(s ? s.rev : []); fim = !!(s && s.fim); marca = {};

    const grade = $('grade'); grade.innerHTML = ''; grade.style.setProperty('--n', N); $('grade').parentNode.style.setProperty('--n', N);
    casas = sol.map((ch, x) => {
      const el = document.createElement(ch ? 'button' : 'div');
      if (ch) { el.className = 'cel'; el.addEventListener('click', () => tocar(x)); }
      grade.appendChild(el); return el;
    });
    // As casas entram em onda.
    casas.forEach((el, x) => sol[x] && el.animate && el.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: (Math.floor(x / N) + x % N) * 18, fill: 'backwards', easing: 'ease-out' }));
    $('jogo').classList.toggle('e-rapida', !!q);
    $('c-letra').textContent = q ? '💡 Letra' : '✓ Letra'; $('c-palavra').hidden = !!q; $('limpar').hidden = !!q; $('info').hidden = !q;
    $('lista').hidden = true; $('jogo').hidden = false; $('titulo').textContent = g.n; $('voltar').hidden = false; $('aviso').textContent = '';
    verCertas();
    const primeira = ordem.find(wi => palavras[wi].cels.some(x => !letras[x])) ?? ordem[0];
    irPara(primeira);
    window.scrollTo(0, 0);
  }
  // Casas das palavras já completas e certas (não mudam mais). Devolve as palavras que acabaram de ficar certas.
  const certa = w => w.cels.every(x => letras[x] === sol[x]);
  const cheia = w => w.cels.every(x => letras[x]);
  function verCertas() {
    const novas = palavras.filter(w => certa(w) && !w.ok);
    palavras.forEach(w => w.ok = certa(w));
    certas = new Set(palavras.filter(w => w.ok).flatMap(w => w.cels));
    return novas;
  }

  function guardar() {
    if (q) { q.l = letras; q.rev = [...rev]; } else salvo.g[gi] = { l: letras, rev: [...rev], fim };
    JO.salvar('cruzadas', salvo);
  }
  const palavraAtual = () => palavras[daCasa[atual][dir]];

  function irPara(wi) {
    const w = palavras[wi]; dir = w.d;
    atual = w.cels.find(x => !letras[x]) ?? w.cels[0];
    desenhar();
  }
  function tocar(x) {
    if (x === atual) { const o = dir === 'h' ? 'v' : 'h'; if (daCasa[x][o] != null) dir = o; }
    else { atual = x; if (daCasa[x][dir] == null) dir = dir === 'h' ? 'v' : 'h'; }
    desenhar();
  }
  function vizinha(passo) {
    const p = ordem.indexOf(daCasa[atual][dir]);
    irPara(ordem[(p + passo + ordem.length) % ordem.length]);
  }

  // ---------- Escrever ----------
  const presa = x => rev.has(x) || certas.has(x);
  function digitar(L) {
    if (fim || atual < 0) return;
    const w = palavraAtual();
    if (!presa(atual)) { letras[atual] = L; delete marca[atual]; }
    $('aviso').textContent = '';
    const novas = verCertas();
    festejar(novas);
    if (w.ok) proximaAberta(); else avancar(w);
    guardar(); desenhar(); checarFim();
  }
  // Próxima casa: a vaga seguinte da palavra; com a palavra cheia e errada, mostra os erros (partida rápida).
  function avancar(w) {
    const k = w.cels.indexOf(atual);
    if (cheia(w) && q) {
      w.cels.forEach(x => { if (letras[x] !== sol[x]) marca[x] = 'erro'; });
      atual = w.cels.find(x => letras[x] !== sol[x]);
      JO.som('erro'); JO.vibrar(40);
      w.cels.forEach(x => casas[x].animate && casas[x].animate([{ translate: '0' }, { translate: '-4px' }, { translate: '4px' }, { translate: '0' }], 200));
      return;
    }
    const resto = w.cels.slice(k + 1);
    atual = resto.find(x => !letras[x]) ?? resto[0] ?? (q ? w.cels.find(x => !letras[x]) : null) ?? atual;
  }
  // Pula para a próxima palavra que falta.
  function proximaAberta() {
    const p = ordem.indexOf(daCasa[atual][dir]);
    for (let k = 1; k <= ordem.length; k++) {
      const w = palavras[ordem[(p + k) % ordem.length]];
      if (!w.ok) { dir = w.d; atual = w.cels.find(x => !letras[x]) ?? w.cels.find(x => letras[x] !== sol[x]); return; }
    }
  }
  function festejar(novas) {
    if (!novas.length) return;
    JO.som('acerto'); JO.vibrar(25);
    novas.forEach(w => w.cels.forEach((x, k) => { delete marca[x]; casas[x].animate && casas[x].animate([{ scale: 1 }, { scale: 1.25, background: '#8ff0c0' }, { scale: 1 }], { duration: 320, delay: k * 45 }); }));
  }
  function apagar() {
    if (fim || atual < 0) return;
    const w = palavraAtual(), k = w.cels.indexOf(atual);
    if (letras[atual] && !presa(atual)) { letras[atual] = ''; delete marca[atual]; }
    else if (k > 0) { atual = w.cels[k - 1]; if (!presa(atual)) { letras[atual] = ''; delete marca[atual]; } }
    guardar(); desenhar();
  }
  function darLetra() {
    if (fim || atual < 0) return;
    const w = palavraAtual();
    if (presa(atual)) atual = w.cels.find(x => !presa(x)) ?? atual;
    if (presa(atual)) return;
    letras[atual] = sol[atual]; rev.add(atual); delete marca[atual];
    festejar(verCertas());
    if (w.ok) proximaAberta(); else avancar(w);
    guardar(); desenhar(); checarFim();
  }
  function conferir(lista) {
    let erros = 0, vistas = 0;
    lista.forEach(x => { if (letras[x]) { vistas++; marca[x] = letras[x] === sol[x] ? 'ok' : 'erro'; if (marca[x] === 'erro') erros++; } });
    if (vistas) JO.som(erros ? 'erro' : 'acerto');
    $('aviso').textContent = !vistas ? 'Escreva alguma letra primeiro.' : erros ? (erros === 1 ? '1 letra errada.' : erros + ' letras erradas.') : 'Tudo certo até aqui!';
    desenhar();
  }
  function revelar() {
    if (fim) return;
    palavraAtual().cels.forEach(x => { if (letras[x] !== sol[x]) { letras[x] = sol[x]; rev.add(x); } delete marca[x]; });
    $('aviso').textContent = '';
    festejar(verCertas()); proximaAberta();
    guardar(); desenhar(); checarFim();
  }
  function checarFim() {
    const cheias = sol.every((ch, x) => !ch || letras[x]);
    if (!cheias) return;
    if (!sol.every((ch, x) => !ch || letras[x] === ch)) { $('aviso').textContent = 'Tudo preenchido, mas há letras erradas. Use ✓ Palavra.'; return; }
    fim = true; marca = {};
    if (q) return fimRapida();
    guardar(); desenhar();
    JO.vibrar([40, 60, 120]); JO.som('vitoria');
    $('vitoria-txt').textContent = rev.size ? `Você completou a ${GRADES[gi].n} com ${rev.size} ${rev.size === 1 ? 'letra revelada' : 'letras reveladas'}.` : `Você completou a ${GRADES[gi].n} sem revelar nenhuma letra!`;
    $('vitoria-prox').hidden = !GRADES.some((_, i) => !(salvo.g[i] && salvo.g[i].fim));
    $('vitoria-prox').textContent = 'Próxima grade'; $('vitoria-lista').textContent = 'Ver todas as grades';
    $('vitoria').showModal();
  }
  function fimRapida() {
    const m = salvo.qt[q.tam], novo = !rev.size && (m == null || q.t < m);
    if (novo) salvo.qt[q.tam] = q.t;
    salvo.qn[q.tema] = (salvo.qn[q.tema] || 0) + 1; salvo.q = null;
    JO.salvar('cruzadas', salvo); desenhar();
    JO.vibrar([40, 60, 120]); JO.som('vitoria');
    casas.forEach((el, x) => sol[x] && el.animate && el.animate([{ transform: 'none' }, { transform: 'translateY(-10px) rotate(6deg)' }, { transform: 'none' }], { duration: 420, delay: (Math.floor(x / N) + x % N) * 30 }));
    $('vitoria-txt').textContent = `${q.tema} em ${relogio(q.t)}` + (rev.size ? `, com ${rev.size} ${rev.size === 1 ? 'letra revelada' : 'letras reveladas'}.` : novo ? '. Novo melhor tempo!' : `. Melhor tempo: ${relogio(salvo.qt[q.tam])}.`);
    $('vitoria-prox').hidden = false; $('vitoria-prox').textContent = 'Outra partida'; $('vitoria-lista').textContent = 'Escolher outro tema';
    const aberta = q;
    setTimeout(() => { if (q === aberta && !$('vitoria').open) $('vitoria').showModal(); }, 900);
  }

  // ---------- Tela ----------
  function desenhar() {
    const w = palavraAtual(), naPalavra = new Set(w.cels);
    casas.forEach((el, x) => {
      if (!sol[x]) return;
      el.className = 'cel' + (naPalavra.has(x) ? ' pal' : '') + (x === atual ? ' atual' : '') + (marca[x] ? ' ' + marca[x] : '') + (rev.has(x) ? ' rev' : '') + (certas.has(x) ? ' certa' : '');
      const n = palavras.find(p => p.cels[0] === x);
      el.innerHTML = (n ? `<i>${n.num}</i>` : '') + (letras[x] || '');
    });
    const feitas = palavras.filter(p => p.ok).length;
    $('feitas').textContent = `${q ? q.tema + ' · ' : ''}${feitas} de ${palavras.length}`; $('info-barra').style.width = Math.round(100 * feitas / palavras.length) + '%';
    if (q) $('tempo').textContent = relogio(q.t);
    $('dica').innerHTML = `<small>${w.num} ${w.d === 'h' ? '→ HORIZONTAL' : '↓ VERTICAL'} · ${w.p.length} letras</small>${w.dica}`;
  }

  function listarTodas() {
    const cx = $('todas-lista'); cx.innerHTML = '';
    for (const d of ['h', 'v']) {
      const h = document.createElement('h3'); h.textContent = d === 'h' ? '→ Horizontais' : '↓ Verticais'; cx.appendChild(h);
      ordem.filter(wi => palavras[wi].d === d).forEach(wi => {
        const w = palavras[wi], b = document.createElement('button');
        b.textContent = `${w.num}. ${w.dica} (${w.p.length})`;
        if (w.cels.every(x => letras[x])) b.className = 'pronta';
        b.addEventListener('click', () => { $('todas').close(); irPara(wi); });
        cx.appendChild(b);
      });
    }
  }

  // ---------- Teclado da tela ----------
  ['QWERTYUIOP', 'ASDFGHJKLÇ', 'ZXCVBNM⌫'].forEach(linha => {
    const div = document.createElement('div'); div.className = 'linha';
    [...linha].forEach(t => {
      const b = document.createElement('button');
      b.className = 'tecla' + (t === '⌫' ? ' larga' : ''); b.textContent = t;
      b.setAttribute('aria-label', t === '⌫' ? 'Apagar' : t);
      b.addEventListener('click', () => { JO.som('toque'); t === '⌫' ? apagar() : digitar(t); });
      div.appendChild(b);
    });
    $('teclado').appendChild(div);
  });

  // Teclado de verdade (computador)
  document.addEventListener('keydown', ev => {
    if ((gi < 0 && !q) || document.querySelector('dialog[open]') || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    if (/^[a-zçA-ZÇ]$/.test(k)) { digitar(k.toUpperCase()); ev.preventDefault(); }
    else if (k === 'Backspace') { apagar(); ev.preventDefault(); }
    else if (k === 'Tab') { vizinha(ev.shiftKey ? -1 : 1); ev.preventDefault(); }
    else if (k.startsWith('Arrow')) {
      const [dl, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
      const l = Math.floor(atual / N) + dl, c = atual % N + dc;
      if (l >= 0 && l < N && c >= 0 && c < N && sol[l * N + c]) { atual = l * N + c; const q = dl ? 'v' : 'h'; if (daCasa[atual][q] != null) dir = q; else if (daCasa[atual][dir] == null) dir = dir === 'h' ? 'v' : 'h'; desenhar(); }
      ev.preventDefault();
    }
  });

  // ---------- Botões ----------
  $('voltar').addEventListener('click', ev => { if (gi >= 0 || q) { ev.preventDefault(); mostrarLista(); } });
  $('ant').addEventListener('click', () => vizinha(-1));
  $('prox').addEventListener('click', () => vizinha(1));
  $('dica').addEventListener('click', () => tocar(atual));
  $('c-letra').addEventListener('click', () => q ? darLetra() : conferir([atual]));
  $('c-palavra').addEventListener('click', () => conferir(palavraAtual().cels));
  $('revelar').addEventListener('click', revelar);
  $('abre-todas').addEventListener('click', listarTodas);
  $('limpar').addEventListener('click', () => { delete salvo.g[gi]; JO.salvar('cruzadas', salvo); $('todas').close(); abrir(gi); });
  $('vitoria-lista').addEventListener('click', () => { $('vitoria').close(); mostrarLista(); });
  $('vitoria-prox').addEventListener('click', () => {
    $('vitoria').close();
    if (q) return novaRapida(q.tema);
    const falta = GRADES.map((_, i) => i).filter(i => !(salvo.g[i] && salvo.g[i].fim));
    const prox = falta.find(i => i > gi) ?? falta[0];
    prox == null ? mostrarLista() : abrir(prox);
  });

  setInterval(() => {
    if (!q || fim || document.hidden || JO.pausado()) return;
    q.t++; $('tempo').textContent = relogio(q.t);
    if (q.t % 5 === 0) JO.salvar('cruzadas', salvo);
  }, 1000);

  mostrarLista();
})();
