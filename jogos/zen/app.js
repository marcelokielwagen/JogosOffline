/* app.js: junta tudo. Menu, escolha de jogo, dificuldade e fase, partida, ajustes e salvamento. */
(() => {
'use strict';

const $ = id => document.getElementById(id), RAIZ = document.documentElement, JOGOS = ['loop', 'okay'], N = Zen.FASES;
const tela = $('quadro'), inicio = $('inicio'), partida = $('partida'), fim = $('fim'), ajustes = $('ajustes');

/* ======================= salvamento ======================= */

/* Formato (localStorage "zen.v1"):
     jogo, dif                      última escolha
     fase["loop/facil"] = 7         fase atual de cada jogo e dificuldade
     feitas["loop/facil"] = "110…"  50 caracteres, 1 = fase concluída
     melhor["loop/facil/7"] = 31    menos giros (loop) ou menos lançamentos (okay)
     andamento["loop/facil/8"]      partida pela metade
     som, tema, calmo               ajustes                                              */
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const inteiro = (v, min, max, padrao) => Number.isInteger(v) && v >= min && v <= max ? v : padrao;
const fracao = (v, padrao) => Number.isFinite(v) && v >= 0 && v <= 1 ? v : padrao;

function carregar() {
  let d = {};
  try { d = obj(JSON.parse(localStorage.getItem(Zen.CHAVE))); } catch (e) { /* vazio, estragado ou bloqueado: começa do zero */ }
  const s = {
    jogo: JOGOS.includes(d.jogo) ? d.jogo : 'loop', dif: Zen.DIFS.includes(d.dif) ? d.dif : 'facil',
    fase: {}, feitas: {}, melhor: {}, andamento: {},
    som: { musica: fracao(obj(d.som).musica, .7), efeitos: fracao(obj(d.som).efeitos, .8), mudo: obj(d.som).mudo === true },
    tema: d.tema === 'pastel' ? 'pastel' : 'noite', calmo: d.calmo === true
  };
  for (const j of JOGOS) for (const x of Zen.DIFS) {
    const k = j + '/' + x, t = obj(d.feitas)[k];
    s.fase[k] = inteiro(obj(d.fase)[k], 1, N, 1);
    s.feitas[k] = typeof t === 'string' && /^[01]{50}$/.test(t) ? t : '0'.repeat(N);
    for (let f = 1; f <= N; f++) { const m = inteiro(obj(d.melhor)[k + '/' + f], 1, 1e6, 0); if (m) s.melhor[k + '/' + f] = m; }
  }
  for (const [k, v] of Object.entries(obj(d.andamento)).slice(-30)) if (/^(loop|okay)\/(facil|medio|dificil)\/\d{1,2}$/.test(k) && v && typeof v === 'object') s.andamento[k] = v;
  return s;
}
const S = carregar();
let gravarEm = 0;
function gravar() { clearTimeout(gravarEm); gravarEm = 0; try { localStorage.setItem(Zen.CHAVE, JSON.stringify(S)); } catch (e) { /* sem espaço ou modo privado: o jogo segue */ } }
const gravarLogo = () => { if (!gravarEm) gravarEm = setTimeout(gravar, 400); };       // junta várias mudanças numa gravação só

const chave = () => S.jogo + '/' + S.dif, feita = f => S.feitas[chave()][f - 1] === '1', quantas = () => S.feitas[chave()].split('1').length - 1;
// por onde continuar: a fase atual; se já foi feita, a próxima ainda não feita
function proximaPendente() {
  const a = S.fase[chave()]; if (!feita(a)) return a;
  for (let k = 1; k < N; k++) { const f = (a - 1 + k) % N + 1; if (!feita(f)) return f; }
  return a;
}

/* ======================= cores ======================= */

const VARIAVEIS = ['areia', 'areia2', 'sulco', 'tinta', 'tinta2', 'luz', 'sobre', 'pedra', 'sombra'];
const pingo = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
function lerCores() {
  const s = getComputedStyle(RAIZ), o = {};
  for (const n of VARIAVEIS) {
    const v = s.getPropertyValue('--' + n).trim(), m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(v);
    if (m) o[n] = [+m[1], +m[2], +m[3]];
    else { pingo.fillStyle = v; pingo.fillRect(0, 0, 1, 1); o[n] = [...pingo.getImageData(0, 0, 1, 1).data].slice(0, 3); }
  }
  return o;
}
// enquanto o CSS troca a paleta aos poucos, o desenho do jogo acompanha
let coresAte = 0;
function paleta(fase) {
  const p = String(Math.floor((fase - 1) / 10));
  if (RAIZ.dataset.tema === S.tema && RAIZ.dataset.paleta === p) return;
  RAIZ.dataset.tema = S.tema; RAIZ.dataset.paleta = p; coresAte = performance.now() + 1900;
  setTimeout(() => { document.querySelector('meta[name=theme-color]').content = getComputedStyle(RAIZ).getPropertyValue('--areia').trim(); }, 1700);
}

/* ======================= tela inicial ======================= */

const botoes = [];
for (let f = 1; f <= N; f++) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'fase'; b.textContent = f; b.dataset.fase = f;
  $('grade-fases').append(b); botoes.push(b);
}
function pintarInicio() {
  document.querySelector(`input[name=jogo][value=${S.jogo}]`).checked = true;
  document.querySelector(`input[name=dif][value=${S.dif}]`).checked = true;
  const n = quantas(), alvo = proximaPendente(), comecou = n || S.fase[chave()] > 1 || S.andamento[chave() + '/' + alvo];
  botoes.forEach((b, i) => {
    const f = i + 1, ok = feita(f), m = S.melhor[chave() + '/' + f];
    b.classList.toggle('feita', ok); b.classList.toggle('atual', f === alvo);
    b.setAttribute('aria-label', `Fase ${f}${ok ? ', concluída' : ''}${f === alvo ? ', atual' : ''}${m ? ', melhor: ' + contar(m) : ''}`);
  });
  $('feitas').textContent = `${n} de ${N}`;
  $('continuar').textContent = n === N ? `Jogar a fase ${alvo}` : comecou ? `Continuar na fase ${alvo}` : 'Começar';
  paleta(alvo);
}
const contar = n => S.jogo === 'loop' ? (n === 1 ? '1 giro' : n + ' giros') : (n === 1 ? '1 lançamento' : n + ' lançamentos');

/* ======================= partida ======================= */

let J = null, fase = 1, naPartida = false, empilhado = false, antes = 0, quadroId = 0;

function medir() {
  if (!J) return;
  const w = innerWidth, h = innerHeight, baixo = w > h && h <= 520;
  const est = getComputedStyle(RAIZ), px = n => parseFloat(est.getPropertyValue('--n-' + n)) || 0;
  J.redimensionar(w, h, Math.min(devicePixelRatio || 1, 2.5), baixo
    ? { topo: 64 + px('topo'), base: 14 + px('base'), esq: 72 + px('esq'), dir: 72 + px('dir') }
    : { topo: 74 + px('topo'), base: 84 + px('base'), esq: 12 + px('esq'), dir: 12 + px('dir') });
}
// as bordas seguras do celular (entalhe, barra de gestos) em números, para o desenho do jogo
const regua = document.createElement('div'); regua.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:var(--topo) var(--dir) var(--base) var(--esq)'; document.body.append(regua);
function bordas() { const s = getComputedStyle(regua); for (const [n, l] of [['topo', 'Top'], ['dir', 'Right'], ['base', 'Bottom'], ['esq', 'Left']]) RAIZ.style.setProperty('--n-' + n, parseFloat(s['padding' + l]) || 0); }

function situacao(m) {
  $('t-info').textContent = S.jogo === 'loop'
    ? (m.pontas === 0 ? 'Circuito fechado' : m.pontas === 1 ? '1 ponta solta' : m.pontas + ' pontas soltas')
    : (m.restam === 0 ? 'Tudo limpo' : m.restam === 1 ? 'Falta 1 forma' : `Faltam ${m.restam} formas`);
}
function guardarAndamento() {
  if (!J) return;
  const k = chave() + '/' + fase, a = J.guardar();
  delete S.andamento[k]; if (a) S.andamento[k] = a;              // apaga e põe de novo: os mais recentes ficam no fim
  const todos = Object.keys(S.andamento); while (todos.length > 30) delete S.andamento[todos.shift()];
}
let avisoEm = 0;
function aviso(texto, seg = 0) { clearTimeout(avisoEm); const a = $('aviso'); if (texto) a.textContent = texto; a.classList.toggle('visivel', !!texto); if (texto && seg) avisoEm = setTimeout(() => aviso(''), seg * 1000); }

function abrir(f) {
  fase = Math.max(1, Math.min(N, f)); S.fase[chave()] = fase; gravarLogo();
  fim.hidden = true; partida.classList.remove('venceu');
  paleta(fase); Zen.menosMovimento = S.calmo;
  if (J) J.destruir();
  J = Zen.jogos[S.jogo].criar(tela, {
    dif: S.dif, fase, cores: lerCores(), andamento: S.andamento[chave() + '/' + fase],
    aoMudar(m) {
      situacao(m); aviso('');
      if (m.estado !== 'voo') { guardarAndamento(); gravarLogo(); }
      if (S.jogo === 'okay' && m.lancamentos === 2 && m.estado === 'mira' && !quantas()) aviso('O pontilhado mostra o lançamento anterior', 5);
    },
    aoVencer: venceu
  });
  $('t-fase').textContent = `Fase ${fase}, ${Zen.NOMES[S.dif]}`; situacao(J.info);
  for (const b of partida.querySelectorAll('[data-acao=anterior]')) b.disabled = fase === 1;
  for (const b of partida.querySelectorAll('.rodape [data-acao=proxima]')) b.disabled = fase === N;
  tela.setAttribute('aria-label', `${Zen.NOMES[S.jogo]}, fase ${fase}`);
  Zen.Audio.cena(S.jogo, fase);
  medir();
  // ensina só quem ainda não concluiu nenhuma fase neste jogo
  const novato = Zen.DIFS.every(d => !S.feitas[S.jogo + '/' + d].includes('1'));
  aviso(novato ? (S.jogo === 'loop' ? 'Toque nas peças para girar, até não sobrar ponta solta' : 'Puxe para trás e solte. Apague todas as formas em um lançamento') : '');
}
function venceu(v) {
  const k = chave(), kf = k + '/' + fase, n = S.jogo === 'loop' ? v.giros : v.lancamentos, anterior = S.melhor[kf] || 0;
  S.feitas[k] = S.feitas[k].slice(0, fase - 1) + '1' + S.feitas[k].slice(fase);
  if (!anterior || n < anterior) S.melhor[kf] = n;
  delete S.andamento[kf]; gravar();
  const todas = quantas() === N, melhorou = anterior && n < anterior;
  $('fim-titulo').textContent = todas ? `${Zen.NOMES[S.dif]} completo` : S.jogo === 'loop' ? 'Circuito fechado' : 'Tudo limpo';
  $('fim-detalhe').textContent = S.jogo === 'okay' && n === 1 ? 'No primeiro lançamento' : contar(n) + (melhorou ? ', seu melhor até agora' : anterior && anterior < n ? `. Seu melhor: ${anterior}` : '');
  fim.querySelector('[data-acao=proxima]').textContent = fase < N ? 'Próxima fase' : 'Ver as fases';
  fim.hidden = false; partida.classList.add('venceu');
  fim.querySelector('[data-acao=proxima]').focus({ preventScroll: true });
}
function quadro(t) {
  quadroId = 0; if (!naPartida || !J) return;
  if (t < coresAte + 60) J.cores(lerCores());
  J.quadro(Math.max(0, (t - antes) / 1000)); antes = t;
  quadroId = requestAnimationFrame(quadro);
}
function entrar(f) {
  if (!naPartida) {
    naPartida = true; document.body.dataset.tela = 'partida'; partida.hidden = false; partida.offsetWidth;      // força o começo da transição
    partida.classList.remove('fora'); inicio.classList.add('fora');
    try { history.pushState({ zen: 1 }, ''); empilhado = true; } catch (e) { empilhado = false; }              // o "voltar" do celular volta ao menu
  }
  abrir(f); tela.focus({ preventScroll: true });
  antes = performance.now(); if (!quadroId) quadroId = requestAnimationFrame(quadro);
}
function sair() {
  if (!naPartida) return;
  naPartida = false; guardarAndamento(); gravar(); aviso('');
  document.body.dataset.tela = 'inicio'; partida.classList.add('fora'); inicio.classList.remove('fora');
  Zen.Audio.cena('menu'); pintarInicio();
  const b = botoes[proximaPendente() - 1]; $('continuar').focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest' });
  setTimeout(() => { if (!naPartida) { partida.hidden = true; if (J) { J.destruir(); J = null; } } }, 650);
}
const voltar = () => empilhado ? history.back() : sair();
addEventListener('popstate', () => { empilhado = false; if (ajustes.open) ajustes.close(); sair(); });

/* ======================= ajustes ======================= */

function aplicarSom() {
  Zen.Audio.ajustar(S.som);
  for (const b of document.querySelectorAll('[data-acao=mudo]')) {
    b.setAttribute('aria-pressed', S.som.mudo); b.setAttribute('aria-label', S.som.mudo ? 'Ligar o som' : 'Desligar o som');
    b.querySelector('use').setAttribute('href', S.som.mudo ? '#i-mudo' : '#i-som');
  }
}
function aplicarCalmo() { RAIZ.dataset.movimento = S.calmo ? 'menos' : 'normal'; Zen.menosMovimento = S.calmo; }
$('vol-musica').addEventListener('input', e => { S.som.musica = e.target.value / 100; Zen.Audio.ajustar(S.som); gravarLogo(); });
$('vol-efeitos').addEventListener('input', e => { S.som.efeitos = e.target.value / 100; Zen.Audio.ajustar(S.som); gravarLogo(); });
$('vol-efeitos').addEventListener('change', () => Zen.Audio.girar(.5, .6, 1));            // amostra do volume
for (const r of document.querySelectorAll('input[name=tema]')) r.addEventListener('change', () => { S.tema = r.value; paleta(naPartida ? fase : proximaPendente()); gravarLogo(); });
$('menos-movimento').addEventListener('change', e => { S.calmo = e.target.checked; aplicarCalmo(); gravarLogo(); });
function abrirAjustes() {
  $('vol-musica').value = Math.round(S.som.musica * 100); $('vol-efeitos').value = Math.round(S.som.efeitos * 100);
  document.querySelector(`input[name=tema][value=${S.tema}]`).checked = true; $('menos-movimento').checked = S.calmo;
  ajustes.showModal();
}
ajustes.addEventListener('click', e => { if (e.target === ajustes) ajustes.close(); });     // tocar fora fecha
ajustes.addEventListener('close', gravar);

/* ======================= botões ======================= */

const ACOES = {
  continuar() { entrar(proximaPendente()); },
  inicio: voltar,
  ajustes: abrirAjustes,
  mudo() { S.som.mudo = !S.som.mudo; aplicarSom(); gravar(); },
  refazer() { if (!J) return; fim.hidden = true; partida.classList.remove('venceu'); J.refazer(); delete S.andamento[chave() + '/' + fase]; gravar(); },
  anterior() { trocar(-1); },
  proxima() { if (fase === N) voltar(); else trocar(1); }
};
function trocar(d) { const f = fase + d; if (f < 1 || f > N) return; guardarAndamento(); abrir(f); tela.focus({ preventScroll: true }); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-acao],[data-fase]'); if (!b || b.disabled) return;
  if (b.dataset.acao !== 'mudo') Zen.Audio.toque();
  if (b.dataset.fase) entrar(+b.dataset.fase); else ACOES[b.dataset.acao]();
});
for (const r of document.querySelectorAll('input[name=jogo]')) r.addEventListener('change', () => { S.jogo = r.value; Zen.Audio.toque(); pintarInicio(); gravarLogo(); });
for (const r of document.querySelectorAll('input[name=dif]')) r.addEventListener('change', () => { S.dif = r.value; Zen.Audio.toque(); pintarInicio(); gravarLogo(); });

/* ======================= dedo, mouse e teclado ======================= */

tela.addEventListener('pointerdown', e => {
  if (!J || !fim.hidden) return;
  e.preventDefault(); tela.focus({ preventScroll: true });
  if (S.jogo === 'okay') { if (e.button > 0) return; try { tela.setPointerCapture(e.pointerId); } catch (x) { /* dedo já saiu */ } }
  J.toqueInicio(e.clientX, e.clientY, e.pointerId, e.button === 2 || e.shiftKey);
});
tela.addEventListener('pointermove', e => { if (J) J.toqueMove(e.clientX, e.clientY, e.pointerId); });
tela.addEventListener('pointerup', e => { if (J) J.toqueFim(e.clientX, e.clientY, e.pointerId); });
tela.addEventListener('pointercancel', e => { if (J) J.toqueFim(e.clientX, e.clientY, e.pointerId, true); });
tela.addEventListener('contextmenu', e => e.preventDefault());
// iPhone: impede zoom e arrasto da página durante a partida
for (const ev of ['touchstart', 'touchmove']) tela.addEventListener(ev, e => e.preventDefault(), { passive: false });
addEventListener('gesturestart', e => e.preventDefault());
addEventListener('keydown', e => {
  if (!naPartida || ajustes.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const noBotao = e.target.closest && e.target.closest('button,a,input');
  if (noBotao && (e.key === 'Enter' || e.key === ' ')) return;
  if (J && fim.hidden && J.tecla(e.key, e.shiftKey)) { e.preventDefault(); return; }
  if (e.key === 'Escape') voltar(); else if (e.key === 'r' || e.key === 'R') ACOES.refazer();
});

/* ======================= início ======================= */

let medirEm = 0;
const aoMudarTela = () => { cancelAnimationFrame(medirEm); medirEm = requestAnimationFrame(() => { bordas(); medir(); }); };
addEventListener('resize', aoMudarTela); addEventListener('orientationchange', () => setTimeout(aoMudarTela, 250));
addEventListener('pagehide', () => { if (naPartida) guardarAndamento(); gravar(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (naPartida) guardarAndamento(); gravar(); } else antes = performance.now(); });

try { if (history.state && history.state.zen) history.replaceState(null, ''); } catch (e) { /* arquivo local */ }
for (const s of ['#inicio', '#partida']) document.querySelector(s).classList.toggle('fora', s === '#partida');
$('sair').hidden = !/\/jogos\//.test(location.pathname);          // dentro da coleção aparece o botão "Todos os jogos"
bordas(); aplicarCalmo(); aplicarSom();
RAIZ.style.transition = 'none'; pintarInicio(); RAIZ.offsetWidth; RAIZ.style.transition = '';      // a primeira paleta entra sem transição
document.querySelector('meta[name=theme-color]').content = getComputedStyle(RAIZ).getPropertyValue('--areia').trim();

if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__zen = { S, get J() { return J; }, get fase() { return fase; }, get naPartida() { return naPartida; }, entrar, gravar };
})();
