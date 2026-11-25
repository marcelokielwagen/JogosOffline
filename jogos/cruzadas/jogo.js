// Palavras Cruzadas em 3D. Cada tema tem 10 fases, com a grade sorteada na hora (gerador.js).
// Grades grandes: as prontas de grades.js e grades-temas.js (GRADES), sem fases.
import { criarTabuleiro, PELES } from '../../js/tabuleiro3d.js';
import { cenarioDe } from '../../js/cenarios3d.js';
import { criarSons, estiloDe } from '../../js/sons-palavras.js';
import { criarFases, janelaVitoria, relogio, TOTAL } from '../../js/fases.js';

const $ = id => document.getElementById(id);
// [lado máximo da grade, quantas palavras] de cada fase
const FASES = [[6, 4], [6, 5], [7, 5], [7, 6], [7, 6], [8, 7], [8, 7], [9, 8], [9, 8], [9, 9]];
const TEMAS = Gerador.temas();
const TEC = ['Tecnologia da informação', 'Segurança cibernética', 'Infraestrutura de TI', 'Redes e internet', 'Programação', 'Dados, nuvem e IA'];
const GRUPOS = { 'Tecnologia': TEC, 'Geral': Object.keys(TEMAS).filter(t => !TEC.includes(t)) };

// salvo.g[i] = grade grande { l: letras, rev: reveladas, fim }; fases = progresso; q = fase em andamento; qr = palavras recentes por tema.
let salvo = JO.carregar('cruzadas', null);
if (!salvo || typeof salvo.g !== 'object' || !salvo.g) salvo = { g: {} };
salvo.fases = salvo.fases || {}; salvo.qr = salvo.qr || {}; salvo.total = GRADES.length;
if (salvo.q && !(salvo.q.fase >= 1 && TEMAS[salvo.q.tema])) salvo.q = null; // partida rápida da versão antiga
const gravar = () => JO.salvar('cruzadas', salvo);

const sons = criarSons();
window.JO_parado = () => JO.pausado();
let tab = null; // o 3D só é criado quando abre a primeira fase
let q = null, gi = -1; // fase aberta, ou grade grande aberta
let N = 0, sol = [], letras = [], palavras = [], ordem = [], daCasa = [];
let atual = -1, dir = 'h', marca = {}, rev = new Set(), fim = false, certas = new Set(), trocando = false;

// ---------- Telas ----------
const F = criarFases({
  prog: salvo.fases, grupos: GRUPOS, lista: $('lista'), sons,
  aoJogar: novaFase,
  continuar: () => salvo.q && { tema: salvo.q.tema, texto: `${salvo.q.tema} · fase ${salvo.q.fase} · ${relogio(salvo.q.t)}`, abrir: () => abrirFase(salvo.q) },
  depois: grandes,
  aoMudar: t => { $('titulo').textContent = t ? 'Fases' : 'Palavras Cruzadas'; $('voltar').hidden = !t; },
});
function telaLista(tema) {
  gi = -1; q = null; sons.pararMusica(); document.body.classList.remove('jogando');
  $('jogo').hidden = true; $('lista').hidden = false; gravar();
  if (tema) F.fases(tema); else F.temas();
}
function grandes(L) {
  const det = document.createElement('details'); det.className = 'grandes';
  const prontas = GRADES.filter((_, i) => salvo.g[i] && salvo.g[i].fim).length;
  det.innerHTML = `<summary>Grades grandes <small>${prontas}/${GRADES.length}</small></summary><div class="lista"></div>`;
  L.appendChild(det);
  const Lg = det.querySelector('.lista'), cats = [];
  GRADES.forEach((g, i) => { const c = g.cat || 'Variadas'; let x = cats.find(k => k.nome === c); if (!x) cats.push(x = { nome: c, itens: [] }); x.itens.push(i); });
  cats.sort((x, y) => (x.nome === 'Variadas') - (y.nome === 'Variadas'));
  cats.forEach(cat => {
    const h = document.createElement('h2'); h.className = 'cat'; h.textContent = cat.nome; Lg.appendChild(h);
    cat.itens.forEach(i => {
      const g = GRADES[i], s = salvo.g[i], total = totalCasas(g), feitas = s ? s.l.filter(Boolean).length : 0, b = document.createElement('button');
      b.className = 'item' + (s && s.fim ? ' feita' : '');
      b.innerHTML = `<b>${g.n}</b><span>${s && s.fim ? '✓ Completa' : `${g.p.length} palavras`}</span><div class="barrinha"><i style="width:${Math.round(100 * feitas / total)}%"></i></div>`;
      b.addEventListener('click', () => { sons.abreFase(); abrirGrande(i); }); Lg.appendChild(b);
    });
  });
}
function totalCasas(g) { const s = new Set(); g.p.forEach(([l, c, d, p]) => { for (let i = 0; i < p.length; i++) s.add(d === 'h' ? l * g.t + c + i : (l + i) * g.t + c); }); return s.size; }

// ---------- Abrir ----------
function novaFase(tema, fase) {
  const [t, w] = FASES[fase - 1], antigas = salvo.qr[tema] || [];
  const g = Gerador.nova(TEMAS[tema], t, w, antigas), novas = g.p.map(x => x[3]);
  salvo.qr[tema] = [...novas, ...antigas.filter(x => !novas.includes(x))].slice(0, 70);
  abrirFase({ tema, fase, g, l: null, rev: [], aj: 0, t: 0 });
}
function abrirFase(x) {
  q = x; salvo.q = x; gi = -1;
  montar({ n: x.tema, t: x.g.t, p: x.g.p }, x.l ? { l: x.l, rev: x.rev } : null, x.fase - 1, x.tema);
  mostrarPlaca(`Fase ${x.fase} · ${PELES[x.fase - 1].nome}`); guardar();
}
function abrirGrande(i) { q = null; gi = i; const g = GRADES[i]; montar(g, salvo.g[i], i % 3, g.cat || 'Variadas'); }
function mostrarPlaca(t) { const p = $('placa'); p.textContent = t; p.classList.remove('mostra'); void p.offsetWidth; p.classList.add('mostra'); }

function montar(g, s, pele, tema) {
  N = g.t; trocando = false;
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

  $('lista').hidden = true; $('jogo').hidden = false; document.body.classList.add('jogando');
  $('jogo').classList.toggle('e-fase', !!q);
  $('titulo').textContent = g.n; $('voltar').hidden = false; $('aviso').textContent = '';
  $('c-letra').textContent = q ? '💡 Letra' : '✓ Letra'; $('c-palavra').hidden = !!q; $('limpar').hidden = !!q; $('tempo').hidden = !q;
  if (!tab && !criar3d()) return;
  tab.montar(N, sol.map((ch, x) => ch ? { letra: letras[x], num: num[x] } : null), pele, cenarioDe(tema));
  sons.pecas(sol.filter(Boolean).length); sons.musica(estiloDe(cenarioDe(tema)));
  palavras.forEach(w => w.ok = false); verCertas();
  irPara(ordem.find(wi => palavras[wi].cels.some(x => !letras[x])) ?? ordem[0]);
  window.scrollTo(0, 0);
}
function criar3d() {
  try { tab = criarTabuleiro($('tela3d')); } catch (e) { $('dica').textContent = 'Este aparelho não conseguiu abrir o 3D.'; return false; }
  $('tela3d').addEventListener('pointerdown', ev => { ev.preventDefault(); const c = tab.pegar(ev.clientX, ev.clientY); if (c && c.dentro && sol[c.i]) tocar(c.i); });
  return true;
}

const certa = w => w.cels.every(x => letras[x] === sol[x]), cheia = w => w.cels.every(x => letras[x]);
// Casas das palavras já completas e certas (não mudam mais). Devolve as que acabaram de ficar certas.
function verCertas() {
  const novas = palavras.filter(w => certa(w) && !w.ok);
  palavras.forEach(w => w.ok = certa(w));
  certas = new Set(palavras.filter(w => w.ok).flatMap(w => w.cels));
  return novas;
}
function guardar() {
  if (q) { q.l = letras; q.rev = [...rev]; } else if (gi >= 0) salvo.g[gi] = { l: letras, rev: [...rev], fim };
  gravar();
}
const palavraAtual = () => palavras[daCasa[atual][dir]];

function irPara(wi) { const w = palavras[wi]; dir = w.d; atual = w.cels.find(x => !letras[x]) ?? w.cels[0]; desenhar(); }
function tocar(x) {
  if (trocando) return;
  if (x === atual) { const o = dir === 'h' ? 'v' : 'h'; if (daCasa[x][o] != null) dir = o; }
  else { atual = x; if (daCasa[x][dir] == null) dir = dir === 'h' ? 'v' : 'h'; }
  sons.toque(); tab.pular(x, 0, .3); desenhar();
}
function vizinha(passo) { const p = ordem.indexOf(daCasa[atual][dir]); sons.toque(); irPara(ordem[(p + passo + ordem.length) % ordem.length]); }

// ---------- Escrever ----------
const presa = x => rev.has(x) || certas.has(x);
function escrever(x, L) { letras[x] = L; tab.letra(x, L, true); }
function digitar(L) {
  if (fim || trocando || atual < 0) return;
  const w = palavraAtual();
  if (!presa(atual)) { escrever(atual, L); delete marca[atual]; sons.letra(w.cels.indexOf(atual)); } else sons.tecla();
  $('aviso').textContent = '';
  seguir(w);
}
function seguir(w) {
  festejar(verCertas());
  if (w.ok) proximaAberta(); else avancar(w);
  guardar(); desenhar(); checarFim();
}
// Próxima casa: a vaga seguinte da palavra; com a palavra cheia e errada, mostra os erros (nas fases).
function avancar(w) {
  const k = w.cels.indexOf(atual);
  if (cheia(w) && q) {
    w.cels.forEach(x => { if (letras[x] !== sol[x]) marca[x] = 'erro'; });
    atual = w.cels.find(x => letras[x] !== sol[x]);
    sons.erro(); JO.vibrar(40); w.cels.forEach(x => tab.tremer(x));
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
  sons.palavra(palavras.filter(w => w.ok).length); JO.vibrar(25);
  novas.forEach(w => w.cels.forEach((x, k) => { delete marca[x]; tab.pular(x, .1 + k * .06, 1.1); setTimeout(() => tab.estourar(x, ['#5fe08a', '#ffd23f', '#4ad0ff'][k % 3], 8), 180 + k * 60); }));
}
function apagar() {
  if (fim || trocando || atual < 0) return;
  const w = palavraAtual(), k = w.cels.indexOf(atual);
  sons.apagar();
  if (letras[atual] && !presa(atual)) { escrever(atual, ''); delete marca[atual]; }
  else if (k > 0) { atual = w.cels[k - 1]; if (!presa(atual)) { escrever(atual, ''); delete marca[atual]; } }
  guardar(); desenhar();
}
function darLetra() {
  if (fim || trocando || atual < 0) return;
  const w = palavraAtual();
  if (presa(atual)) atual = w.cels.find(x => !presa(x)) ?? atual;
  if (presa(atual)) return;
  escrever(atual, sol[atual]); rev.add(atual); delete marca[atual]; q.aj = (q.aj || 0) + 1; sons.dica();
  seguir(w);
}
function conferir(lista) {
  let erros = 0, vistas = 0;
  lista.forEach(x => { if (letras[x]) { vistas++; marca[x] = letras[x] === sol[x] ? 'ok' : 'erro'; if (marca[x] === 'erro') { erros++; tab.tremer(x); } } });
  if (vistas) erros ? sons.erro() : sons.dica();
  $('aviso').textContent = !vistas ? 'Escreva alguma letra primeiro.' : erros ? (erros === 1 ? '1 letra errada.' : erros + ' letras erradas.') : 'Tudo certo até aqui!';
  desenhar();
}
function revelar() {
  if (fim || trocando) return;
  const w = palavraAtual(); if (w.ok) return;
  w.cels.forEach(x => { if (letras[x] !== sol[x]) { escrever(x, sol[x]); rev.add(x); if (q) q.aj = (q.aj || 0) + 1; } delete marca[x]; });
  $('aviso').textContent = ''; sons.dica();
  festejar(verCertas()); proximaAberta(); guardar(); desenhar(); checarFim();
}

// ---------- Fim ----------
function checarFim() {
  if (!sol.every((ch, x) => !ch || letras[x])) return;
  if (!sol.every((ch, x) => !ch || letras[x] === ch)) { $('aviso').textContent = 'Tudo preenchido, mas há letras erradas.' + (q ? '' : ' Use ✓ Palavra.'); return; }
  fim = true; marca = {}; trocando = true;
  JO.vibrar([40, 60, 120]);
  if (q) return fimFase();
  guardar(); desenhar(); tab.festa(); sons.fase();
  const d = $('vitoria'), feita = gi; d.innerHTML = `<h2>Grade completa! 🎉</h2><p>${rev.size ? `Com ${rev.size} ${rev.size === 1 ? 'letra revelada' : 'letras reveladas'}.` : 'Sem revelar nenhuma letra!'}</p><button class="btn principal">Ver as grades</button>`;
  d.querySelector('button').onclick = () => { d.close(); telaLista(); };
  setTimeout(() => { if (gi === feita && !d.open) d.showModal(); }, 1500);
}
function fimFase() {
  const x = q, e = !x.aj ? 3 : x.aj <= 2 ? 2 : 1, r = F.venceu(x.tema, x.fase, e, x.t);
  salvo.q = null; gravar(); desenhar();
  setTimeout(() => { if (q !== x) return; tab.festa(); r.fechou ? sons.trofeu() : sons.fase(); }, 450);
  setTimeout(() => {
    if (q !== x || $('vitoria').open) return;
    janelaVitoria($('vitoria'), {
      tema: x.tema, fase: x.fase, e, fechou: r.fechou,
      texto: `${relogio(x.t)}${x.aj ? ` · ${x.aj} ${x.aj === 1 ? 'letra de ajuda' : 'letras de ajuda'}` : ' · sem ajuda'}${r.recorde && !x.aj ? ' · melhor tempo!' : ''}`,
      verFases: () => telaLista(x.tema),
      proxima: async () => { if (x.fase >= TOTAL) return telaLista(); sons.cair(); await tab.sair(); if (q === x) novaFase(x.tema, x.fase + 1); },
    });
  }, r.fechou ? 3200 : 1900);
}

// ---------- Desenho ----------
function desenhar() {
  const w = palavraAtual(), naPalavra = new Set(w.cels), certo = tab.pele.certo || '#86e6ad', ouro = tab.pele.sel || '#ffcf33';
  sol.forEach((ch, x) => {
    if (!ch) return;
    if (x === atual && !fim) tab.estado(x, ouro, .42);
    else if (marca[x] === 'erro') tab.estado(x, tab.pele.erro || '#ff8592', naPalavra.has(x) ? .14 : 0);
    else if (certas.has(x) || marca[x] === 'ok') tab.estado(x, certo, naPalavra.has(x) && !fim ? .16 : .04);
    else if (naPalavra.has(x) && !fim) tab.estado(x, '#a8c6ff', .16);
    else tab.estado(x, null, 0);
  });
  const feitas = palavras.filter(p => p.ok).length;
  $('feitas').textContent = `${q ? `Fase ${q.fase} · ` : ''}${feitas} de ${palavras.length}`; $('info-barra').style.width = Math.round(100 * feitas / palavras.length) + '%';
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
      b.addEventListener('click', () => { $('todas').close(); sons.toque(); irPara(wi); });
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
    // Responde ao encostar o dedo, sem esperar soltar.
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); t === '⌫' ? apagar() : digitar(t); });
    b.addEventListener('click', ev => { if (ev.detail === 0) t === '⌫' ? apagar() : digitar(t); });
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
    if (l >= 0 && l < N && c >= 0 && c < N && sol[l * N + c]) { atual = l * N + c; const o = dl ? 'v' : 'h'; if (daCasa[atual][o] != null) dir = o; else if (daCasa[atual][dir] == null) dir = dir === 'h' ? 'v' : 'h'; sons.toque(); desenhar(); }
    ev.preventDefault();
  }
});

// ---------- Botões ----------
$('voltar').addEventListener('click', ev => { ev.preventDefault(); sons.toque(); if (q) telaLista(q.tema); else telaLista(); });
$('ant').addEventListener('click', () => vizinha(-1));
$('prox').addEventListener('click', () => vizinha(1));
$('dica').addEventListener('click', () => tocar(atual));
$('c-letra').addEventListener('click', () => q ? darLetra() : conferir([atual]));
$('c-palavra').addEventListener('click', () => conferir(palavraAtual().cels));
$('revelar').addEventListener('click', revelar);
$('abre-todas').addEventListener('click', listarTodas);
$('limpar').addEventListener('click', () => { delete salvo.g[gi]; gravar(); $('todas').close(); abrirGrande(gi); });
const mostraMusica = () => $('musica').classList.toggle('mudo', !sons.musicaLigada);
$('musica').addEventListener('click', () => { sons.alternarMusica(); mostraMusica(); });
setInterval(() => {
  if (!q || fim || document.hidden || JO.pausado()) return;
  q.t++; $('tempo').textContent = relogio(q.t);
  if (q.t % 5 === 0) gravar();
}, 1000);
mostraMusica(); telaLista();
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__cz = { get q() { return q; }, get atual() { return atual; }, get tab() { return tab; }, sol: () => sol, sons, salvo, novaFase, F };
