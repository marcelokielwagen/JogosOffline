// Resta Um — tabuleiro inglês em cruz (33 casas, centro vazio).
(() => {
  const $ = id => document.getElementById(id);
  const valido = i => { const l = Math.floor(i / 7), c = i % 7; return (l >= 2 && l <= 4) || (c >= 2 && c <= 4); };
  const inicial = () => Array.from({ length: 49 }, (_, i) => !valido(i) ? -1 : i === 24 ? 0 : 1);
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  // Estado salvo: t = tabuleiro (1 peça, 0 buraco, -1 fora), hist = jogadas [de, meio, para].
  let e = JO.carregar('resta-um', null);
  if (!e || !Array.isArray(e.t) || e.t.length !== 49 || !Array.isArray(e.hist))
    e = { t: inicial(), hist: [], contado: false, stats: { vitorias: 0, melhor: null } };
  let sel = -1;

  function destinos(i) {
    if (e.t[i] !== 1) return [];
    const l = Math.floor(i / 7), c = i % 7, res = [];
    for (const [dl, dc] of DIRS) {
      const l2 = l + 2 * dl, c2 = c + 2 * dc;
      if (l2 < 0 || l2 > 6 || c2 < 0 || c2 > 6) continue;
      const meio = (l + dl) * 7 + c + dc, para = l2 * 7 + c2;
      if (e.t[meio] === 1 && e.t[para] === 0) res.push({ meio, para });
    }
    return res;
  }
  const restam = () => e.t.filter(v => v === 1).length;
  const temJogadas = () => e.t.some((v, i) => v === 1 && destinos(i).length);
  const salvar = () => JO.salvar('resta-um', e);

  function mover(de, d) {
    e.t[de] = 0; e.t[d.meio] = 0; e.t[d.para] = 1;
    e.hist.push([de, d.meio, d.para]); sel = -1;
    if (!temJogadas() && !e.contado) {
      e.contado = true;
      const n = restam();
      if (e.stats.melhor == null || n < e.stats.melhor) e.stats.melhor = n;
      if (n === 1) e.stats.vitorias++;
      if (navigator.vibrate) navigator.vibrate(n === 1 ? [40, 60, 120] : 60);
    }
    salvar(); desenhar(); animar(de, d.meio, d.para);
  }

  function tocar(i) {
    if (sel >= 0) {
      const d = destinos(sel).find(x => x.para === i);
      if (d) return mover(sel, d);
    }
    if (e.t[i] !== 1) { sel = -1; return desenhar(); }
    if (!destinos(i).length) {
      sel = -1; desenhar();
      casas[i].classList.add('treme');
      setTimeout(() => casas[i].classList.remove('treme'), 320);
      return;
    }
    sel = sel === i ? -1 : i; desenhar();
  }

  function desfazer() {
    const j = e.hist.pop(); if (!j) return;
    e.t[j[0]] = 1; e.t[j[1]] = 1; e.t[j[2]] = 0; sel = -1;
    salvar(); desenhar(); animar(j[2], -1, j[0]);
  }
  function novo() {
    e.t = inicial(); e.hist = []; e.contado = false; sel = -1;
    salvar(); desenhar();
  }

  // ---------- Tela ----------
  const casas = [];
  for (let i = 0; i < 49; i++) {
    let el;
    if (valido(i)) { el = document.createElement('button'); el.className = 'casa'; el.addEventListener('click', () => tocar(i)); }
    else el = document.createElement('div');
    $('tab').appendChild(el); casas.push(el);
  }

  function animar(de, meio, para) {
    if (!casas[para].animate) return;
    const a = casas[de].getBoundingClientRect(), b = casas[para].getBoundingClientRect();
    const pino = casas[para].querySelector('.pino');
    if (pino) pino.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(1.15)` }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
    if (meio >= 0) {
      const f = document.createElement('span'); f.className = 'pino fantasma';
      casas[meio].appendChild(f);
      const fim = () => f.remove();
      f.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.3)' }], { duration: 220, easing: 'ease-in' }).onfinish = fim;
      setTimeout(fim, 400);
    }
  }

  function desenhar() {
    const alvos = sel >= 0 ? destinos(sel).map(d => d.para) : [];
    const n = restam(), acabou = !temJogadas();
    casas.forEach((el, i) => {
      if (!valido(i)) return;
      el.className = 'casa' + (i === sel ? ' sel' : '') + (alvos.includes(i) ? ' destino' : '');
      el.innerHTML = e.t[i] === 1 ? '<span class="pino"></span>' : '';
      el.setAttribute('aria-label', `Linha ${Math.floor(i / 7) + 1}, coluna ${i % 7 + 1}: ${e.t[i] === 1 ? 'peça' : 'vazio'}`);
    });
    $('tab').classList.toggle('fim', acabou);
    $('n-pecas').textContent = n;
    $('n-jogadas').textContent = e.hist.length;
    $('n-melhor').textContent = e.stats.melhor == null ? '–' : e.stats.melhor;
    $('n-vitorias').textContent = e.stats.vitorias;

    let msg;
    if (!acabou) msg = sel >= 0 ? 'Agora toque no buraco que pisca' : e.hist.length ? 'Escolha uma peça' : 'Toque em uma peça para começar';
    else if (n === 1 && e.t[24] === 1) msg = 'Perfeito! Restou uma, e no centro 🏆';
    else if (n === 1) msg = 'Você venceu! Restou só uma 🎉';
    else msg = `Sem jogadas: restaram ${n} peças${n <= 3 ? '. Quase!' : ''}`;
    $('status').textContent = msg;
    $('status').classList.toggle('fim', acabou);
    $('status').classList.toggle('vitoria', acabou && n === 1);
    $('desfazer').disabled = !e.hist.length;
  }

  $('novo').addEventListener('click', novo);
  $('desfazer').addEventListener('click', desfazer);
  desenhar();
})();
