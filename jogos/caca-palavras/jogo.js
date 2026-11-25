// Caça-Palavras em 3D. Cada tema tem 10 fases; o quadro de cada fase é sorteado na hora.
import { criarTabuleiro, PELES } from '../../js/tabuleiro3d.js';
import { cenarioDe } from '../../js/cenarios3d.js';
import { criarSons, estiloDe } from '../../js/sons-palavras.js';
import { criarFases, janelaVitoria, relogio, TOTAL } from '../../js/fases.js';

const $ = id => document.getElementById(id);
const RETAS = [[0, 1], [1, 0]], DIAG = [...RETAS, [1, 1], [-1, 1]], TODAS = [...DIAG, [0, -1], [-1, 0], [-1, -1], [1, -1]];
// [lado do quadro, quantas palavras, direções, quantas na diagonal] de cada fase
const FASES = [[7, 5, DIAG, 3], [8, 6, DIAG, 3], [8, 6, DIAG, 4], [8, 7, DIAG, 4], [9, 7, DIAG, 5], [9, 8, DIAG, 5], [10, 8, DIAG, 6], [10, 8, TODAS, 6], [10, 9, TODAS, 7], [11, 10, TODAS, 8]];
const CORES = ['#8fa0ff', '#ff8aa0', '#4fd6c0', '#ffc33f', '#cf9bff', '#74d66a', '#ffa866', '#5fb8ff', '#f58fe0', '#b7d84a'];
const ENCHE = 'AAAAEEEEIIOOOUURRSSTTLLMMNNCCDDPBGFVHJQXZ';
const sorte = n => Math.floor(Math.random() * n);

// Soma as palavras das Cruzadas aos temas parecidos (sem Ç e com até 10 letras).
const MESMO = { 'TI': 'Tecnologia da informação', 'Segurança cibernética': 'Segurança cibernética', 'Infraestrutura de TI': 'Infraestrutura de TI', 'Redes': 'Redes e internet', 'Programação': 'Programação', 'Dados e IA': 'Dados, nuvem e IA', 'Animais': 'Animais', 'Comida': 'Comidas', 'Corpo': 'Corpo humano', 'Casa': 'Casa', 'Natureza': 'Natureza', 'Brasil': 'Brasil', 'Esportes': 'Esportes', 'Países': null };
const TEMAS = {}, GRUPOS = {};
for (const grupo in TEMAS_CACA) {
  GRUPOS[grupo] = Object.keys(TEMAS_CACA[grupo]);
  for (const t of GRUPOS[grupo]) {
    const s = new Set(TEMAS_CACA[grupo][t].split(' ')), b = MESMO[t] && BANCO[MESMO[t]];
    if (b) b.trim().split('\n').forEach(l => s.add(l.slice(0, l.indexOf('|')).replace(/Ç/g, 'C')));
    TEMAS[t] = [...s].filter(w => w.length >= 3 && w.length <= 10);
  }
}

let salvo = JO.carregar('caca', null) || {};
salvo.stats = salvo.stats || { v: 0, melhor: {} };
const salvar = () => JO.salvar('caca', salvo);
// Na versão antiga o jogo ficava solto em "caca"; agora fica em salvo.q, com as fases em salvo.fases.
for (const k of ['nivel', 'tema', 'escolha', 'g', 'p', 't', 'fim']) delete salvo[k];
salvo.fases = salvo.fases || {}; salvo.qr = salvo.qr || {};
const valido = x => x && x.fase >= 1 && TEMAS[x.tema] && Array.isArray(x.g) && x.g.length === x.n * x.n && Array.isArray(x.p);
if (!valido(salvo.q)) salvo.q = null;

const sons = criarSons();
window.JO_parado = () => JO.pausado();
let tab = null, q = null, N = 0, fim = false, inicio = null, fimSel = null, arrastando = false, moveu = false, ancora = null, ultTam = 0, dono = null;

// ---------- Montar um quadro ----------
// Prefere palavras que não saíram há pouco, e não junta "irmãs" (REDE e REDES).
function sortear(tema, n, qtd, antigas) {
  const todas = TEMAS[tema].filter(w => w.length <= n);
  for (let i = todas.length - 1; i > 0; i--) { const j = sorte(i + 1); [todas[i], todas[j]] = [todas[j], todas[i]]; }
  const quando = w => { const k = antigas.indexOf(w); return k < 0 ? 999 : k; };
  todas.sort((a, b) => quando(b) - quando(a));
  const r = [];
  for (const w of todas) if (r.length < qtd && !r.some(x => x.includes(w) || w.includes(x))) r.push(w);
  return r.sort((a, b) => b.length - a.length);
}
function quadro(tema, fase) {
  const [n, qtd, dirs, diag] = FASES[fase - 1], antigas = salvo.qr[tema] || [];
  for (let tent = 0; ; tent++) {
    const lista = sortear(tema, n, qtd, tent < 60 ? antigas : []), g = Array(n * n).fill(''), p = [];
    // Se as palavras da vez não cabem juntas (60 tentativas), sorteia outras. Quem vai na diagonal é sorteado; todas as posições possíveis entram no sorteio.
    const naDiag = new Set(lista.map((_, k) => k).sort(() => Math.random() - .5).slice(0, diag));
    for (const [k, w] of lista.entries()) {
      const lugares = [], querDiag = naDiag.has(k);
      for (const [dl, dc] of dirs) {
        if (!!(dl && dc) !== querDiag) continue;
        for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
          const fl = l + dl * (w.length - 1), fc = c + dc * (w.length - 1);
          if (fl < 0 || fl >= n || fc < 0 || fc >= n) continue;
          let cabe = true;
          for (let i = 0; i < w.length && cabe; i++) { const ch = g[(l + dl * i) * n + c + dc * i]; if (ch && ch !== w[i]) cabe = false; }
          if (cabe) lugares.push([dl, dc, l, c, fl, fc]);
        }
      }
      if (!lugares.length) break;
      const [dl, dc, l, c, fl, fc] = lugares[sorte(lugares.length)];
      for (let i = 0; i < w.length; i++) g[(l + dl * i) * n + c + dc * i] = w[i];
      p.push({ w, ok: false, a: { l, c }, b: { l: fl, c: fc } });
    }
    if (p.length < lista.length && tent < 400) continue;
    for (let i = 0; i < n * n; i++) if (!g[i]) g[i] = ENCHE[sorte(ENCHE.length)];
    salvo.qr[tema] = [...lista, ...antigas.filter(x => !lista.includes(x))].slice(0, 60);
    p.sort((a, b) => a.w.localeCompare(b.w));
    return { n, g, p };
  }
}

// ---------- Telas ----------
const F = criarFases({
  prog: salvo.fases, grupos: GRUPOS, lista: $('lista'), sons, aoJogar: novaFase,
  continuar: () => salvo.q && { tema: salvo.q.tema, texto: `${salvo.q.tema} · fase ${salvo.q.fase} · ${relogio(salvo.q.t)}`, abrir: () => abrir(salvo.q) },
  aoMudar: t => { $('titulo').textContent = t ? 'Fases' : 'Caça-Palavras'; $('voltar').hidden = !t; },
});
function telaLista(tema) {
  q = null; sons.pararMusica(); document.body.classList.remove('jogando'); $('jogo').hidden = true; $('lista').hidden = false; salvar();
  if (tema) F.fases(tema); else F.temas();
}
function novaFase(tema, fase) { abrir({ tema, fase, ...quadro(tema, fase), t: 0, aj: 0 }); }
function abrir(x) {
  q = x; salvo.q = x; N = x.n; fim = false; soltaTudo();
  $('lista').hidden = true; $('jogo').hidden = false; document.body.classList.add('jogando'); $('titulo').textContent = x.tema; $('voltar').hidden = false;
  listar();
  if (!tab && !criar3d()) return;
  const c = cenarioDe(x.tema);
  tab.montar(N, x.g.map(letra => ({ letra })), x.fase - 1, c);
  sons.pecas(N * N); sons.musica(estiloDe(c));
  const p = $('placa'); p.textContent = `Fase ${x.fase} · ${PELES[x.fase - 1].nome}`; p.classList.remove('mostra'); void p.offsetWidth; p.classList.add('mostra');
  desenhar(); salvar(); window.scrollTo(0, 0);
}
function soltaTudo() { ancora = null; arrastando = false; inicio = fimSel = null; }

// ---------- Desenho ----------
const casasDe = (a, b) => { const n = Math.max(Math.abs(b.l - a.l), Math.abs(b.c - a.c)), sl = Math.sign(b.l - a.l), sc = Math.sign(b.c - a.c); return Array.from({ length: n + 1 }, (_, i) => (a.l + sl * i) * N + a.c + sc * i); };
function desenhar() {
  const cor = {}, alt = {}, ouro = tab.pele.sel || '#ffcf33';
  q.p.forEach((p, k) => { if (p.ok) casasDe(p.a, p.b).forEach(i => { cor[i] = CORES[k % CORES.length]; alt[i] = .13; }); });
  if (arrastando && inicio && fimSel) casasDe(inicio, fimSel).forEach(i => { cor[i] = ouro; alt[i] = .42; });
  if (ancora) { const i = ancora.l * N + ancora.c; cor[i] = ouro; alt[i] = .42; }
  for (let i = 0; i < N * N; i++) tab.estado(i, cor[i] || null, alt[i] || 0);
}
function listar() {
  $('palavras').innerHTML = q.p.map((p, k) => `<span class="palavra${p.ok ? ' ok' : ''}" data-w="${p.w}" style="--cor:${CORES[k % CORES.length]}">${p.w}</span>`).join('');
  const n = q.p.filter(p => p.ok).length;
  $('achadas').textContent = `Fase ${q.fase} · ${n} de ${q.p.length}`; $('info-barra').style.width = Math.round(100 * n / q.p.length) + '%'; $('tempo').textContent = relogio(q.t);
}

// ---------- Seleção: arrastar, ou tocar na primeira e na última letra ----------
// Prende a seleção a uma linha reta (deitada, em pé ou diagonal) saindo do início.
function reta(a, b) {
  const dl = b.l - a.l, dc = b.c - a.c;
  if (!dl && !dc) return a;
  const passo = Math.round(Math.atan2(dl, dc) / (Math.PI / 4));
  const [sl, sc] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]][(passo + 8) % 8];
  let n = Math.max(Math.abs(dl), Math.abs(dc));
  while (n > 0 && (a.l + sl * n < 0 || a.l + sl * n >= N || a.c + sc * n < 0 || a.c + sc * n >= N)) n--;
  return { l: a.l + sl * n, c: a.c + sc * n };
}
function concluir(a, b) {
  const n = Math.max(Math.abs(b.l - a.l), Math.abs(b.c - a.c));
  if (!n || fim) return;
  const cs = casasDe(a, b), s = cs.map(i => q.g[i]).join(''), inv = [...s].reverse().join('');
  const p = q.p.find(x => !x.ok && (x.w === s || x.w === inv));
  if (!p) { if (n > 1) { sons.nada(); cs.forEach(i => tab.tremer(i)); } return; }
  p.ok = true; p.a = a; p.b = b;
  const cor = CORES[q.p.indexOf(p) % CORES.length], feitas = q.p.filter(x => x.ok).length;
  cs.forEach((i, k) => { tab.pular(i, k * .05, 1.1); setTimeout(() => tab.estourar(i, cor, 9), 90 + k * 50); });
  sons.palavra(feitas); JO.vibrar(30); listar();
  if (q.p.every(x => x.ok)) venceu();
  salvar();
}
function venceu() {
  fim = true;
  const x = q, e = !x.aj ? 3 : x.aj === 1 ? 2 : 1, r = F.venceu(x.tema, x.fase, e, x.t);
  salvo.q = null; salvo.stats.v++;
  const m = salvo.stats.melhor.fase; if (m == null || x.t < m) salvo.stats.melhor.fase = x.t;
  JO.vibrar([40, 60, 120]);
  setTimeout(() => { if (q !== x) return; tab.festa(); r.fechou ? sons.trofeu() : sons.fase(); }, 700);
  setTimeout(() => {
    if (q !== x || $('vitoria').open) return;
    janelaVitoria($('vitoria'), {
      tema: x.tema, fase: x.fase, e, fechou: r.fechou,
      texto: `${relogio(x.t)}${x.aj ? ` · ${x.aj} ${x.aj === 1 ? 'dica' : 'dicas'}` : ' · sem dica'}${r.recorde && !x.aj ? ' · melhor tempo!' : ''}`,
      verFases: () => telaLista(x.tema),
      proxima: async () => { if (x.fase >= TOTAL) return telaLista(); sons.cair(); await tab.sair(); if (q === x) novaFase(x.tema, x.fase + 1); },
    });
  }, r.fechou ? 3400 : 2200);
}
function criar3d() {
  try { tab = criarTabuleiro($('tela3d')); } catch (e) { $('palavras').textContent = 'Este aparelho não conseguiu abrir o 3D.'; return false; }
  const tela = $('tela3d');
  tela.addEventListener('pointerdown', ev => {
    if (fim || !q || (arrastando && ev.pointerId !== dono)) return;
    ev.preventDefault();
    const c = tab.pegar(ev.clientX, ev.clientY); if (!c || c.longe) return;
    if (ancora) { inicio = ancora; ancora = null; moveu = true; fimSel = reta(inicio, c); }
    else { inicio = { l: c.l, c: c.c }; fimSel = inicio; moveu = false; }
    arrastando = true; dono = ev.pointerId; ultTam = 0; sons.arrasta(0);
    try { tela.setPointerCapture(ev.pointerId); } catch (err) {}
    desenhar();
  });
  tela.addEventListener('pointermove', ev => {
    if (!arrastando || ev.pointerId !== dono) return;
    const c = tab.pegar(ev.clientX, ev.clientY); if (!c) return;
    const f = reta(inicio, c);
    if (f.l !== inicio.l || f.c !== inicio.c) moveu = true;
    if (f.l !== fimSel.l || f.c !== fimSel.c) {
      fimSel = f; const t = Math.max(Math.abs(f.l - inicio.l), Math.abs(f.c - inicio.c));
      if (t !== ultTam) { sons.arrasta(t); ultTam = t; }
      desenhar();
    }
  });
  tela.addEventListener('pointerup', ev => {
    if (!arrastando || ev.pointerId !== dono) return;
    arrastando = false;
    if (moveu) concluir(inicio, fimSel); else ancora = inicio;
    if (q) desenhar();
  });
  const larga = ev => { if (arrastando && ev.pointerId === dono) { soltaTudo(); if (q) desenhar(); } };
  tela.addEventListener('pointercancel', larga); tela.addEventListener('lostpointercapture', larga);
  return true;
}
function dica() {
  if (fim || !q) return;
  const falta = q.p.filter(p => !p.ok); if (!falta.length) return;
  const p = falta[sorte(falta.length)], i = p.a.l * N + p.a.c;
  q.aj++; sons.dica(); salvar(); soltaTudo(); desenhar();
  ancora = { l: p.a.l, c: p.a.c }; desenhar();
  for (let k = 0; k < 3; k++) tab.pular(i, 0, 1.2);
  const el = $('palavras').querySelector(`[data-w="${p.w}"]`); el.classList.add('pisca'); setTimeout(() => el.classList.remove('pisca'), 2600);
}

// ---------- Botões e relógio ----------
$('voltar').addEventListener('click', ev => { ev.preventDefault(); sons.toque(); telaLista(q ? q.tema : null); });
$('dica').addEventListener('click', dica);
$('outra').addEventListener('click', async () => { if (fim || !q) return; const x = q; fim = true; sons.cair(); await tab.sair(); if (q === x) novaFase(x.tema, x.fase); });
const mostraMusica = () => $('musica').classList.toggle('mudo', !sons.musicaLigada);
$('musica').addEventListener('click', () => { sons.alternarMusica(); mostraMusica(); });
setInterval(() => {
  if (!q || fim || document.hidden || JO.pausado()) return;
  q.t++; $('tempo').textContent = relogio(q.t);
  if (q.t % 5 === 0) salvar();
}, 1000);
mostraMusica(); telaLista();
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__cp = { get q() { return q; }, get tab() { return tab; }, sons, salvo, novaFase, F, TEMAS, quadro };
