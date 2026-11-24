// Pinball Show — protótipo cinza (Fase 3): 3 andares, palhetas, rampas, elevador, teclado e vinil.
// Aqui ficam o controle do jogo (bolas, pontos, mensagens), os controles e o laço de cada quadro.
// A música, a transformação da mesa, os 14 estágios e a banda entram nas próximas fases.
import { palhetas, TECLAS } from './mesa/layout.js';
import { criarFisica, PASSO } from './fisica/mundo.js';
import { criarCena } from './mesa/cena3d.js';

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const ESCALA = .6;        // a mesa roda a 60% do tempo real (bola mais fácil de acompanhar)
const SALVA = 8;          // segundos depois do lançamento em que a bola perdida volta

const dados = JO.carregar('pinballShow', { melhor: 0, jogos: 0 });
let j = { estado: 'pronto', pontos: 0, bola: 1, total: 3, salvaAte: 0, lancada: false };

const F = criarFisica(aoEvento);
let cena;
try { cena = criarCena($('mesa')); }
catch (e) { $('sem3d').hidden = false; throw e; }

// ---------- Mensagens e placar ----------
let msgAte = 0;
function msg(texto, s = 1.8) {
  const el = $('msg');
  el.textContent = texto; el.classList.remove('anim'); void el.offsetWidth; el.classList.add('anim');
  el.hidden = false; msgAte = performance.now() + s * 1000;
  $('anuncio').textContent = texto;
}
function pontuar(n) { if (j.estado === 'jogando') j.pontos += n; }
function placar() {
  $('pontos').textContent = fmt(j.pontos);
  $('bola').textContent = j.estado === 'fim' ? '–' : `${j.bola}/${j.total}`;
  $('recorde').textContent = fmt(Math.max(dados.melhor, j.pontos));
}

function aoEvento(nome, d) {
  if (j.estado !== 'jogando') return;
  switch (nome) {
    case 'estilingue': pontuar(100); JO.vibrar(12); break;
    case 'tecla':
      pontuar(1000);
      if (!d.acesa) { d.acesa = true; if (TECLAS.every(t => t.acesa)) { pontuar(50000); msg('TECLADO\nCOMPLETO!', 2.2); setTimeout(() => TECLAS.forEach(t => t.acesa = false), 1200); } }
      break;
    case 'chegou':
      if (d.nome === 'rampaE' || d.nome === 'rampaD') { pontuar(5000); msg('RAMPA!\n5.000', 1.2); }
      else if (d.nome === 'rampaC') { pontuar(10000); msg('ANDAR DE CIMA!\n10.000', 1.4); }
      else if (d.nome === 'elevador') { pontuar(7500); msg('ELEVADOR\n7.500', 1.4); }
      break;
    case 'elevador': JO.vibrar(30); break;
    case 'pouso': if (d.forca > 500) JO.vibrar(15); break;
    case 'lancou': if (!j.lancada) { j.lancada = true; j.salvaAte = F.relogio + SALVA; } break;
    case 'perdeu':
      if (F.bolas.length) return;
      if (F.relogio < j.salvaAte) { F.bolaNoLancador(); msg('BOLA\nDE VOLTA!', 1.6); return; }
      JO.vibrar(120);
      if (j.bola < j.total) { j.bola++; prepararBola(); msg(`BOLA ${j.bola}`, 1.6); }
      else fimDeJogo();
      break;
  }
}

function prepararBola() { j.lancada = false; j.salvaAte = 0; F.bolaNoLancador(); }
function novoJogo() {
  F.bolas.length = 0;
  TECLAS.forEach(t => t.acesa = false);
  j = { estado: 'jogando', pontos: 0, bola: 1, total: 3, salvaAte: 0, lancada: false };
  prepararBola();
  $('inicio').hidden = true;
  msg('PUXE O\nLANÇADOR', 2);
}
function fimDeJogo() {
  j.estado = 'fim';
  dados.jogos++;
  const recorde = j.pontos > dados.melhor;
  dados.melhor = Math.max(dados.melhor, j.pontos);
  JO.salvar('pinballShow', dados);
  msg(recorde ? 'NOVO\nRECORDE!' : 'FIM DE\nJOGO', 3);
  setTimeout(() => { $('inicio-titulo').textContent = `${fmt(j.pontos)} pontos`; $('inicio').hidden = false; }, 1600);
}

// ---------- Controles ----------
const lado = { E: false, D: false };
function apertar(l, on) {
  if (lado[l] === on) return;
  lado[l] = on;
  for (const p of palhetas) if (p.lado === l) p.apertada = on && j.estado === 'jogando';
}
const parado = () => JO.pausado() || document.hidden || [...document.querySelectorAll('dialog')].some(d => d.open);

const teclas = { KeyZ: 'E', ArrowLeft: 'E', ShiftLeft: 'E', Slash: 'D', ArrowRight: 'D', ShiftRight: 'D', IntlRo: 'D' };
addEventListener('keydown', e => {
  if (e.repeat || parado()) return;
  if (teclas[e.code]) { apertar(teclas[e.code], true); e.preventDefault(); }
  else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') {
    e.preventDefault();
    if (j.estado !== 'jogando') novoJogo(); else F.comecarPuxar();
  }
});
addEventListener('keyup', e => {
  if (teclas[e.code]) apertar(teclas[e.code], false);
  else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') F.soltar();
});

// Toque: metade esquerda = palheta esquerda; metade direita = palheta direita (e lançador, se a bola estiver nele)
const toques = new Map();
const mesa = $('mesa');
mesa.addEventListener('pointerdown', e => {
  if (j.estado !== 'jogando' || parado()) return;
  e.preventDefault();
  mesa.setPointerCapture(e.pointerId);
  const r = mesa.getBoundingClientRect(), l = e.clientX - r.left < r.width / 2 ? 'E' : 'D';
  toques.set(e.pointerId, l);
  apertar(l, true);
  if (l === 'D') F.comecarPuxar();
});
const fimToque = e => {
  const l = toques.get(e.pointerId);
  if (!l) return;
  toques.delete(e.pointerId);
  if (![...toques.values()].includes(l)) apertar(l, false);
  if (l === 'D') F.soltar();
};
mesa.addEventListener('pointerup', fimToque);
mesa.addEventListener('pointercancel', fimToque);
mesa.addEventListener('contextmenu', e => e.preventDefault());
$('jogar').addEventListener('click', novoJogo);

// ---------- Laço de cada quadro ----------
let ultimo = performance.now(), acumulado = 0;
function quadro(agora) {
  const dt = Math.min(.05, (agora - ultimo) / 1000);
  ultimo = agora;
  if (!parado()) {
    acumulado += dt * ESCALA;
    while (acumulado >= PASSO) { F.passo(PASSO); acumulado -= PASSO; }
  } else { apertar('E', false); apertar('D', false); F.soltar(); }
  if (msgAte && agora > msgAte) { $('msg').hidden = true; msgAte = 0; }
  placar();
  cena.atualizar(F);
  requestAnimationFrame(quadro);
}
placar();
requestAnimationFrame(quadro);
