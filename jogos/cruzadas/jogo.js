// Palavras Cruzadas. As grades vêm de grades.js (GRADES).
(() => {
  const $ = id => document.getElementById(id);
  // Progresso salvo por grade: salvo.g[i] = { l: letras de cada casa, rev: casas reveladas, fim: completa? }
  let salvo = JO.carregar('cruzadas', null);
  if (!salvo || typeof salvo.g !== 'object' || !salvo.g) salvo = { g: {} };

  let gi = -1, N = 0, sol = [], letras = [], palavras = [], ordem = [], daCasa = [], casas = [];
  let atual = -1, dir = 'h', marca = {}, rev = new Set(), fim = false;

  // ---------- Lista de grades ----------
  function totalCasas(g) { const s = new Set(); g.p.forEach(([l, c, d, p]) => { for (let i = 0; i < p.length; i++) s.add(d === 'h' ? l * g.t + c + i : (l + i) * g.t + c); }); return s.size; }
  function mostrarLista() {
    gi = -1;
    $('lista').hidden = false; $('jogo').hidden = true; $('titulo').textContent = 'Palavras Cruzadas';
    $('lista').innerHTML = '';
    GRADES.forEach((g, i) => {
      const s = salvo.g[i], total = totalCasas(g), feitas = s ? s.l.filter(Boolean).length : 0;
      const b = document.createElement('button');
      b.className = 'item' + (s && s.fim ? ' feita' : '');
      b.innerHTML = `<b>${g.n}</b><span>${s && s.fim ? '✓ Completa' : `${g.t}×${g.t} · ${g.p.length} palavras`}</span><div class="barrinha"><i style="width:${Math.round(100 * feitas / total)}%"></i></div>`;
      b.addEventListener('click', () => abrir(i));
      $('lista').appendChild(b);
    });
  }

  // ---------- Abrir uma grade ----------
  function abrir(i) {
    const g = GRADES[i]; gi = i; N = g.t;
    sol = Array(N * N).fill(null); daCasa = Array.from({ length: N * N }, () => ({}));
    palavras = g.p.map(([l, c, d, p, dica]) => ({ d, p, dica, cels: [...p].map((_, k) => d === 'h' ? l * N + c + k : (l + k) * N + c) }));
    palavras.forEach((w, wi) => w.cels.forEach((x, k) => { sol[x] = w.p[k]; daCasa[x][w.d] = wi; }));
    // Numeração: cada casa onde começa uma palavra ganha um número, na ordem de leitura.
    const num = {}; let n = 0;
    for (let x = 0; x < N * N; x++) if (palavras.some(w => w.cels[0] === x)) num[x] = ++n;
    palavras.forEach(w => w.num = num[w.cels[0]]);
    ordem = palavras.map((_, wi) => wi).sort((a, b) => (palavras[a].d === palavras[b].d ? palavras[a].num - palavras[b].num : palavras[a].d === 'h' ? -1 : 1));

    const s = salvo.g[i];
    letras = s && s.l.length === N * N ? s.l.slice() : Array(N * N).fill('');
    rev = new Set(s ? s.rev : []); fim = !!(s && s.fim); marca = {};

    const grade = $('grade'); grade.innerHTML = ''; grade.style.setProperty('--n', N); $('grade').parentNode.style.setProperty('--n', N);
    casas = sol.map((ch, x) => {
      const el = document.createElement(ch ? 'button' : 'div');
      if (ch) { el.className = 'cel'; el.addEventListener('click', () => tocar(x)); }
      grade.appendChild(el); return el;
    });
    $('lista').hidden = true; $('jogo').hidden = false; $('titulo').textContent = g.n; $('aviso').textContent = '';
    const primeira = ordem.find(wi => palavras[wi].cels.some(x => !letras[x])) ?? ordem[0];
    irPara(primeira);
  }

  const guardar = () => { salvo.g[gi] = { l: letras, rev: [...rev], fim }; JO.salvar('cruzadas', salvo); };
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
  function digitar(L) {
    if (fim || atual < 0) return;
    if (!rev.has(atual)) { letras[atual] = L; delete marca[atual]; }
    const w = palavraAtual(), k = w.cels.indexOf(atual);
    if (k < w.cels.length - 1) atual = w.cels[k + 1];
    $('aviso').textContent = '';
    guardar(); desenhar(); checarFim();
  }
  function apagar() {
    if (fim || atual < 0) return;
    const w = palavraAtual(), k = w.cels.indexOf(atual);
    if (letras[atual] && !rev.has(atual)) { letras[atual] = ''; delete marca[atual]; }
    else if (k > 0) { atual = w.cels[k - 1]; if (!rev.has(atual)) { letras[atual] = ''; delete marca[atual]; } }
    guardar(); desenhar();
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
    guardar(); desenhar(); checarFim();
  }
  function checarFim() {
    const cheias = sol.every((ch, x) => !ch || letras[x]);
    if (!cheias) return;
    if (!sol.every((ch, x) => !ch || letras[x] === ch)) { $('aviso').textContent = 'Tudo preenchido, mas há letras erradas. Use ✓ Palavra.'; return; }
    fim = true; marca = {}; guardar(); desenhar();
    JO.vibrar([40, 60, 120]); JO.som('vitoria');
    $('vitoria-txt').textContent = rev.size ? `Você completou a ${GRADES[gi].n} com ${rev.size} ${rev.size === 1 ? 'letra revelada' : 'letras reveladas'}.` : `Você completou a ${GRADES[gi].n} sem revelar nenhuma letra!`;
    $('vitoria-prox').hidden = !GRADES.some((_, i) => !(salvo.g[i] && salvo.g[i].fim));
    $('vitoria').showModal();
  }

  // ---------- Tela ----------
  function desenhar() {
    const w = palavraAtual(), naPalavra = new Set(w.cels);
    casas.forEach((el, x) => {
      if (!sol[x]) return;
      el.className = 'cel' + (naPalavra.has(x) ? ' pal' : '') + (x === atual ? ' atual' : '') + (marca[x] ? ' ' + marca[x] : '') + (rev.has(x) ? ' rev' : '');
      const n = palavras.find(p => p.cels[0] === x);
      el.innerHTML = (n ? `<i>${n.num}</i>` : '') + (letras[x] || '');
    });
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
    if (gi < 0 || document.querySelector('dialog[open]') || ev.ctrlKey || ev.metaKey || ev.altKey) return;
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
  $('voltar').addEventListener('click', ev => { if (gi >= 0) { ev.preventDefault(); mostrarLista(); } });
  $('ant').addEventListener('click', () => vizinha(-1));
  $('prox').addEventListener('click', () => vizinha(1));
  $('dica').addEventListener('click', () => tocar(atual));
  $('c-letra').addEventListener('click', () => conferir([atual]));
  $('c-palavra').addEventListener('click', () => conferir(palavraAtual().cels));
  $('revelar').addEventListener('click', revelar);
  $('abre-todas').addEventListener('click', listarTodas);
  $('limpar').addEventListener('click', () => { delete salvo.g[gi]; JO.salvar('cruzadas', salvo); $('todas').close(); abrir(gi); });
  $('vitoria-lista').addEventListener('click', () => { $('vitoria').close(); mostrarLista(); });
  $('vitoria-prox').addEventListener('click', () => {
    $('vitoria').close();
    const falta = GRADES.map((_, i) => i).filter(i => !(salvo.g[i] && salvo.g[i].fim));
    const prox = falta.find(i => i > gi) ?? falta[0];
    prox == null ? mostrarLista() : abrir(prox);
  });

  mostrarLista();
})();
