// Galatic Pinball: mesa com duas plataformas (astronauta e ônibus espacial), loopings, cometa e missões em fases.
// Aqui ficam o controle do jogo (bolas, pontos, mensagens), os controles e o laço de cada quadro.
// Regras em regras/conexoes.js, física em fisica/mundo.js, desenho em mesa/ e música em audio/som.js.
import { palhetas, COMETA } from './mesa/layout.js';
import { criarFisica, PASSO } from './fisica/mundo.js';
import { criarConexoes, FASES } from './regras/conexoes.js';
import { criarCena } from './mesa/cena3d.js';
import { criarSom } from './audio/som.js';

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const ESCALA = .82;       // velocidade da mesa em relação ao tempo real
const SALVA = 8;          // segundos depois do lançamento em que a bola perdida volta

const dados = JO.carregar('pinballShow', { melhor: 0, jogos: 0 });
let j = { estado: 'pronto', pontos: 0, bola: 1, total: 3, salvaAte: 0, lancada: false };

const som = criarSom(() => JO.carregar('som', true));
let comMusica = JO.carregar('pinballShowMusica', true);
som.musica(comMusica);
const F = criarFisica(aoEvento);
let cena;
try { cena = criarCena($('mesa')); }
catch (e) { $('sem3d').hidden = false; throw e; }
const X = criarConexoes({
  pontuar,
  msg,
  faisca: (de, para) => cena.faisca(de, para),
  salvar: s => { j.salvaAte = Math.max(j.salvaAte, F.relogio + s); },
  explodir: (n, espera) => {
    COMETA.volta = F.relogio + espera;
    cena.explodir(); cena.evento('explosao'); som.efeito('explosao'); JO.vibrar(200);
    F.bolasBonus(COMETA.x, COMETA.y, Math.min(n, Math.max(1, 6 - F.bolas.length)));
  },
  fase: (i, nivel) => { if (!cena) return; cena.evento('fase', { i }); som.fase(i); if (j.estado === 'jogando') som.efeito('fase'); },
  efeito: (tipo, lugar, n) => { if (tipo === 'missao') { cena.evento('missao'); som.efeito('missao'); } else if (n > 1) cena.evento('combo', { n }); },
  bolaExtra: n => { while (n-- > 0 && F.bolas.length < 3) F.bolaNoLancador(true); },
});
$('objetivos').innerHTML = FASES.map((f, i) => `<span id="obj-${i}">${i + 1}</span>`).join('') + '<b id="fase-nome"></b>';

// ---------- Mensagens e placar ----------
let msgAte = 0, msgAnim = null;
const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CORES_LETREIRO = ['#ff2fa0', '#1fd0ff', '#ffd23a', '#35ff9a', '#ff6a2a', '#9a5cff', '#ffffff'];
// estilhaços coloridos saindo do meio do letreiro (as mesmas peças são reaproveitadas)
const estilhacos = Array.from({ length: 44 }, (_, i) => { const e = document.createElement('i'); e.style.background = CORES_LETREIRO[i % 7]; e.className = i % 3 ? 'risco' : 'estrela'; $('estouro').appendChild(e); return e; });
function estilhacar(n, forca, largura) {
  if (calmo) return;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + Math.random() * .4, d = forca * (.55 + Math.random() * .7), x0 = Math.cos(a) * largura * .35, y0 = Math.sin(a) * 22, g = a * 180 / Math.PI;
    estilhacos[i].animate([
      { transform: `translate(${x0}px, ${y0}px) rotate(${g}deg) scale(1.3)`, opacity: 1 },
      { transform: `translate(${Math.cos(a) * (d + largura * .3)}px, ${Math.sin(a) * d * .8}px) rotate(${g}deg) scale(.15)`, opacity: 0 },
    ], { duration: 380 + Math.random() * 220, easing: 'cubic-bezier(.1,.8,.3,1)' });
  }
}
function msg(texto, s = 1.8) {
  const el = $('msg');
  if (msgAnim) { msgAnim.onfinish = null; msgAnim.cancel(); msgAnim = null; }
  el.replaceChildren(...texto.split('\n').map((l, i) => {
    const b = document.createElement('span'); b.textContent = l;
    b.className = /^[\d.]+$/.test(l) ? 'pontos' : i ? 'sub' : 'titulo';
    if (!calmo) b.animate([{ transform: 'scale(2.6)', opacity: 0 }, { transform: 'scale(.88)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 200, delay: i * 45, fill: 'backwards', easing: 'cubic-bezier(.2,.9,.3,1)' });
    return b;
  }));
  el.hidden = false; msgAte = performance.now() + Math.max(650, Math.min(1500, s * 480));
  estilhacar(s > 2 ? 44 : 28, s > 2 ? 210 : 140, el.offsetWidth);
  $('anuncio').textContent = texto;
}
function tirarMsg() {
  const el = $('msg'); msgAte = 0;
  if (calmo) { el.hidden = true; return; }
  estilhacar(20, 120, el.offsetWidth);
  msgAnim = el.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1, filter: 'blur(0)' }, { transform: 'translate(-50%, -50%) scale(1.8)', opacity: 0, filter: 'blur(6px)' }], { duration: 150, easing: 'ease-in' });
  msgAnim.onfinish = () => { el.hidden = true; msgAnim = null; };
}
function pontuar(n) { if (j.estado === 'jogando') j.pontos += n; }
const escrever = (id, v) => { const el = $(id); if (el.textContent !== v) el.textContent = v; }, esconder = (id, v) => { const el = $(id); if (el.hidden !== v) el.hidden = v; };
let faseNaTela = -1;
function placar() {
  escrever('pontos', fmt(j.pontos));
  escrever('bola', j.estado === 'fim' ? '–' : `${j.bola}/${j.total}`);
  escrever('recorde', fmt(Math.max(dados.melhor, j.pontos)));
  escrever('vinil', 'x' + X.vinil);
  const jogando = j.estado === 'jogando', combo = jogando && X.combo > 1 && X.tCombo > 0, show = jogando && X.show > 0;
  esconder('combo', !combo);
  if (combo) { escrever('combo-n', `COMBO x${X.combo}`); $('combo-tempo').style.transform = `scaleX(${X.tCombo / X.T_COMBO})`; }
  esconder('show', !show);
  if (show) $('show-tempo').style.transform = `scaleX(${X.show / X.T_SHOW})`;
  if (faseNaTela !== X.fase) { faseNaTela = X.fase; FASES.forEach((f, i) => { const e = $('obj-' + i); e.classList.toggle('feito', i < X.fase); e.classList.toggle('agora', i === X.fase); }); }
  const nf = `${X.nivel > 1 ? 'N' + X.nivel + ' · ' : ''}${FASES[X.fase].nome}`; if ($('fase-nome').textContent !== nf) $('fase-nome').textContent = nf;
  esconder('objetivos', !jogando);
  esconder('salva', !(jogando && F.relogio < j.salvaAte));
  const d = jogando ? X.dica() : '';
  if ($('dica').textContent !== d) { $('dica').textContent = d; $('dica').hidden = !d; }
}

function aoEvento(nome, d) {
  if (j.estado !== 'jogando') return;
  if (nome !== 'perdeu') cena.evento(nome, d);
  const qualSom = nome === 'trilha' ? (d.sobe && d.nome[0] !== 't' ? 'cano' : '') : nome === 'chegou' && d.nome === 'lancador' || nome === 'perdeu' && F.bolas.length ? '' : nome;
  if (qualSom) som.efeito(qualSom, nome === 'cometa' ? COMETA.batidas : nome === 'chegou' ? X.combo : d ? d.i || d.forca || 0 : 0, d ? ((d.x ?? d.ax ?? 185) - 185) / 185 : 0);
  switch (nome) {
    case 'estilingue': pontuar(100); JO.vibrar(12); break;
    case 'tecla': X.tecla(d); break;
    case 'letra': X.letra(d); break;
    case 'vinil': X.girouNoVinil(); break;
    case 'bumper': X.bumper(d); JO.vibrar(10); break;
    case 'cometa': X.cometa(); JO.vibrar(25); break;
    case 'alvo': X.alvo(d); JO.vibrar(12); break;
    case 'alta': X.alta(d); break;
    case 'catraca': X.catraca(); break;
    case 'volta': X.caminho('volta'); break;
    case 'chegou': if (d.nome !== 'lancador') { X.caminho(d.nome); JO.vibrar(20); } break;
    case 'buraco':
      JO.vibrar(30);
      // o elevador escolhe a varanda que ainda falta; se não, alterna
      if (d.nome === 'elevador') F.elevadorVai = X.feito.djs !== X.feito.casal ? (X.feito.djs ? 'elevD' : 'elevE') : (F.elevadorVai === 'elevE' ? 'elevD' : 'elevE');
      break;
    case 'pouso': if (d.forca > 500) JO.vibrar(15); break;
    case 'lancou': if (!j.lancada) { j.lancada = true; j.salvaAte = F.relogio + SALVA; } break;
    case 'perdeu':
      // a bola salva vale uma vez; na Hora do Show vale até acabar o tempo
      if (!d.bonus && F.relogio < j.salvaAte && F.bolas.length < 3) { if (!X.show) j.salvaAte = 0; F.bolaNoLancador(true); msg('BOLA\nDE VOLTA!', 1.6); som.efeito('salva'); return; }
      if (F.bolas.length) return;
      JO.vibrar(120); cena.evento('perdeu');
      X.perdeuBola();
      if (j.bola < j.total) { j.bola++; prepararBola(); msg(`BOLA ${j.bola}`, 1.6); }
      else fimDeJogo();
      break;
  }
}

function prepararBola() { j.lancada = false; j.salvaAte = 0; F.bolaNoLancador(); }
function novoJogo() {
  som.acordar();
  F.bolas.length = 0;
  X.zerar();
  j = { estado: 'jogando', pontos: 0, bola: 1, total: 3, salvaAte: 0, lancada: false };
  prepararBola();
  $('inicio').hidden = true;
  cena.modo('jogo');
  msg('PUXE O\nLANÇADOR', 2);
}
function fimDeJogo() {
  j.estado = 'fim';
  dados.jogos++;
  const recorde = j.pontos > dados.melhor;
  dados.melhor = Math.max(dados.melhor, j.pontos);
  JO.salvar('pinballShow', dados);
  msg(recorde ? 'NOVO\nRECORDE!' : 'FIM DE\nJOGO', 3);
  setTimeout(() => { if (j.estado !== 'fim') return; $('inicio-titulo').textContent = `${fmt(j.pontos)} pontos`; $('inicio').hidden = false; cena.modo('vitrine'); }, 1600);
}

// ---------- Controles ----------
const lado = { E: false, D: false };
function apertar(l, on) {
  if (lado[l] === on) return;
  lado[l] = on;
  for (const p of palhetas) if (p.lado === l) p.apertada = on && j.estado === 'jogando';
  if (on && j.estado === 'jogando') { som.efeito('palheta'); if (!F.naMola()) X.girarLetras(l); }
}
const parado = () => JO.pausado() || document.hidden || [...document.querySelectorAll('dialog')].some(d => d.open);

const teclas = { KeyZ: 'E', ArrowLeft: 'E', ShiftLeft: 'E', Slash: 'D', ArrowRight: 'D', ShiftRight: 'D', IntlRo: 'D' };
addEventListener('keydown', e => {
  if (e.repeat || parado()) return;
  if (e.code === 'KeyP') { JO.pausar(); return; }
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
const botaoMusica = $('musica'), pintarMusica = () => { botaoMusica.setAttribute('aria-pressed', comMusica); botaoMusica.classList.toggle('desligado', !comMusica); };
botaoMusica.addEventListener('click', () => { comMusica = !comMusica; JO.salvar('pinballShowMusica', comMusica); som.musica(comMusica); pintarMusica(); botaoMusica.blur(); });
pintarMusica();
document.addEventListener('visibilitychange', () => som.pausar(document.hidden));

// ---------- Laço de cada quadro ----------
let ultimo = performance.now(), acumulado = 0;
function quadro(agora) {
  const dt = Math.min(.05, (agora - ultimo) / 1000);
  ultimo = agora;
  som.pausar(parado());
  som.energia(cena.energia());
  if (!parado()) {
    acumulado += dt * ESCALA;
    const antes = F.relogio;
    while (acumulado >= PASSO) { F.passo(PASSO); acumulado -= PASSO; }
    if (F.bolas.some(b => !b.naMola)) X.passar(F.relogio - antes);   // com a bola no lançador, os tempos esperam
  } else { apertar('E', false); apertar('D', false); F.soltar(); }
  if (msgAte && agora > msgAte) tirarMsg();
  placar();
  cena.atualizar(F, X, som.batida());
  requestAnimationFrame(quadro);
}
placar();
requestAnimationFrame(quadro);
