'use strict';
// Jogo: progresso salvo, painel, telas, toque/mouse, disposição na tela e laço de desenho.
const SAVE = 'tico:v1', VIDA_MAX = 5, VIDA_MIN = 10;
// progresso salvo no aparelho (localStorage); versão 2 completa campos que faltarem e corrige valores fora do lugar
const S = (() => {
  const novo = { v: 2, nivel: 1, estrelas: {}, moedas: 500, vidas: VIDA_MAX, vidaT: 0, baus: {}, reforcos: { martelo: 0, flecha: 0, canhao: 0 } };
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE)); } catch (e) {}
  if (!s || typeof s !== 'object' || !s.nivel) return novo;
  s = Object.assign({}, novo, s); s.v = 2; s.reforcos = Object.assign({ martelo: 0, flecha: 0, canhao: 0 }, s.reforcos || {});
  s.nivel = clamp(Math.floor(+s.nivel) || 1, 1, NIVEIS.length); s.moedas = Math.max(0, Math.floor(+s.moedas) || 0); s.vidas = clamp(Math.floor(+s.vidas), 0, VIDA_MAX);
  for (const k in s.estrelas) if (+k > NIVEIS.length) delete s.estrelas[k];
  return s;
})();
addEventListener('pagehide', () => salvar()); document.addEventListener('visibilitychange', () => { if (document.hidden) salvar(); });
function salvar() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} }
function regenerarVidas() {
  if (S.vidas >= VIDA_MAX) { S.vidaT = 0; return; }
  const agora = Date.now(); if (!S.vidaT) S.vidaT = agora;
  const n = Math.floor((agora - S.vidaT) / (VIDA_MIN * 60000)); if (n > 0) { S.vidas = Math.min(VIDA_MAX, S.vidas + n); S.vidaT = S.vidas >= VIDA_MAX ? 0 : S.vidaT + n * VIDA_MIN * 60000; salvar(); }
}
const totalEstrelas = () => Object.values(S.estrelas).reduce((a, b) => a + b, 0);

// ---------- painel ----------
const HUD = {
  topo() {
    regenerarVidas(); $('#hVidas').textContent = S.vidas; $('#hMoedas').textContent = S.moedas; $('#hEstrelas').textContent = totalEstrelas();
    if (S.vidas < VIDA_MAX && S.vidaT) { const f = Math.max(0, VIDA_MIN * 60000 - (Date.now() - S.vidaT)), m = Math.floor(f / 60000), s = Math.floor(f / 1000) % 60; $('#hVidaT').textContent = `+1 em ${m}:${String(s).padStart(2, '0')}`; } else $('#hVidaT').textContent = '';
  },
  jogadas() { $('#hJog').textContent = T.jogadas; $('#painel .jogadas').classList.toggle('pouco', T.ativo && T.jogadas <= 5 && !metasFeitas()); },
  pontos() { $('#hPontos').textContent = T.pontos.toLocaleString('pt-BR'); },
  montarMetas() { $('#hMetas').innerHTML = T.metas.map((m, i) => `<div class="meta" data-i="${i}">${svgMeta(m)}<b>${m.falta}</b></div>`).join(''); },
  meta(m) { const el = $(`#hMetas .meta[data-i="${T.metas.indexOf(m)}"]`); if (!el) return; el.querySelector('b').textContent = m.falta; el.classList.remove('bate'); void el.offsetWidth; el.classList.add('bate'); el.classList.toggle('feita', m.falta <= 0); },
};

// ---------- balão, gritos ----------
let balaoT = 0;
const FALAS = {
  inicio: ['Me ajude a juntar as joias do reino!', 'Hoje o tesouro vai crescer!', 'Pronto para a aventura real?'],
  combo: ['UAU! Que combo!', 'Isso é que é realeza!', 'Brilhou mais que a minha coroa!', 'Majestade aprova!'],
  feliz: ['Boa jogada!', 'Isso aí!', 'Que lindo!', 'Mais, mais!'],
  susto: ['Só 5 jogadas!', 'Ai ai ai... está acabando!', 'Rápido, rápido!'],
  panico: ['Socorro! Poucas jogadas!', 'Minha coroa treme!', 'Pense bem nessa!'],
  vitoria: ['Vitória do reino!', 'Viva! O tesouro é nosso!', 'Você é demais!'],
  triste: ['Ah não... quase!', 'Minha coroa caiu de tristeza...', 'Vamos tentar de novo?'],
};
const Jogo = {
  balao(txt, dur = 2.6) { const b = $('#balao'); b.textContent = txt; b.classList.add('ver'); balaoT = dur; posicionarBalao(); },
  grito(txt) { const g = $('#grito'), b = document.createElement('b'); b.textContent = txt; g.innerHTML = ''; g.appendChild(b); g.style.left = (L.tab.x + L.tab.w / 2) + 'px'; g.style.top = (L.tab.y + L.tab.h * .42) + 'px'; },
  reagirJogada() {
    const m = T.mov;
    if (m.especiais >= 2 || m.removidas >= 20) { Rei.reagir('combo'); Jogo.grito(pega(['Majestoso!', 'Divino!', 'Espetacular!'])); Som.uau(); Jogo.balao(pega(FALAS.combo)); }
    else if (m.removidas >= 12 || T.cascata >= 3) { Rei.reagir('feliz'); Jogo.grito(pega(['Incrível!', 'Sensacional!', 'Ótimo!'])); Jogo.balao(pega(FALAS.feliz), 1.8); }
    else if (m.especiais) Rei.reagir('feliz');
    const perigo = T.jogadas <= 5 && T.jogadas > 0 && !metasFeitas();
    if (perigo && !T.perigo) { Rei.reagir('susto'); Som.susto(); Jogo.balao(T.jogadas === 5 ? 'Só 5 jogadas!' : pega(FALAS.panico)); }
    T.perigo = perigo; if (!Resgate.ativo) Som.intensidade(perigo ? .8 : 0); Rei.base(perigo || (Resgate.ativo && Resgate.p >= .65 && !metasFeitas()) ? 'panico' : 'normal'); HUD.jogadas();
  },
  async vencer() {
    T.ativo = false; HUD.jogadas(); Rei.base('normal'); Rei.reagir('combo');
    const sobra = T.jogadas; await espera(.4); if (Resgate.ativo) await Resgate.libertar(); if (T.modo === 'arr') await Arremesso.festa(); else if (T.modo === 'pin') await Pintura.festa(); else await festaReal();
    const ini = T.jogadasIni, est = sobra >= ini * .3 ? 3 : sobra >= ini * .15 ? 2 : 1;
    const ant = S.estrelas[T.nivel] || 0, ganhoM = 20 + est * 10 + (ant ? 0 : 30);
    S.estrelas[T.nivel] = Math.max(ant, est); S.moedas += ganhoM; if (T.nivel >= S.nivel) S.nivel = Math.min(NIVEIS.length, T.nivel + 1); S.ultimoVenceu = T.nivel; salvar(); HUD.topo();
    Rei.reagir('vitoria'); Jogo.balao(pega(FALAS.vitoria), 4); Som.musica(null); Som.vitoria();
    Confete.chuva(L.W, L.H, 160); Confete.explodir(0, -L.H / 2, 90, 900);
    await espera(.8);
    mostrarFim(true, est, ganhoM);
  },
  async perder() {
    T.ativo = false; HUD.jogadas(); if (Resgate.ativo) await Resgate.final();
    Rei.base('triste'); Rei.reagir('triste'); Som.musica(null); Som.derrota(); Jogo.balao(Resgate.ativo ? 'O rei precisa de ajuda!' : pega(FALAS.triste), 4);
    setTimeout(() => mostrarFim(false, 0, 0), 900);
  },
};
function posicionarBalao() {
  const b = $('#balao'); let x, y;
  if (Resgate.ativo) { const q = Rei.pontoBalao();[x, y] = telaDe(q.x, q.y, q.z); }
  else { const p = Rei.pontoBalao().project(Rei.cam); x = L.rei.x + (p.x + 1) / 2 * L.rei.w; y = L.rei.y + (1 - p.y) / 2 * L.rei.h; }
  b.style.left = Math.min(x, L.W - 180) + 'px'; b.style.top = Math.max((Resgate.ativo ? L.tab.y : L.rei.y) + 4, y - b.offsetHeight) + 'px';
}

// ---------- telas ----------
const telas = ['#telaInicio', '#telaNivel', '#telaFim', '#telaPausa', '#telaBau'];
function mostrar(id) { telas.forEach(t => $(t).hidden = t !== id); }
const BAUS = [5, 10, 15, 20];
const modoDe = nv => nv.modo === 'arremesso' ? 'arremesso' : nv.modo === 'pintura' ? 'pintura' : nv.resgate ? 'resgate' : 'joias';
const SVG_BAU = '<svg viewBox="0 0 60 52"><path d="M6 22h48v26H6z" fill="#b8642a" stroke="#5a2a08" stroke-width="2.5"/><path d="M6 22c0-14 48-14 48 0z" fill="#d07a34" stroke="#5a2a08" stroke-width="2.5"/><path d="M4 21h52v5H4z" fill="#ffc83a" stroke="#8a5a00" stroke-width="2"/><path d="M26 24h8v10h-8z" fill="#ffc83a" stroke="#8a5a00" stroke-width="2"/><path d="M14 22v26M46 22v26" stroke="#ffc83a" stroke-width="3"/></svg>';
const SVG_COROA = '<svg viewBox="0 0 46 40"><path d="M4 32L2 10l11 9 10-15 10 15 11-9-2 22z" fill="#ffd34d" stroke="#8a5a00" stroke-width="2.5" stroke-linejoin="round"/><rect x="4" y="31" width="38" height="6" rx="2" fill="#f0a20b" stroke="#8a5a00" stroke-width="2"/><circle cx="23" cy="21" r="3.5" fill="#ff2f55"/></svg>';
function montarMapa() {
  const mapa = $('#mapa'), nos = $('#mapaNos'), N = NIVEIS.length, PASSO = 96, H = N * PASSO + 230;
  mapa.style.height = H + 'px'; nos.innerHTML = '';
  const pos = i => ({ x: 50 + Math.sin(i * .85) * 28, y: H - 70 - i * PASSO }), pts = [];
  NIVEIS.forEach((nv, i) => {
    const n = i + 1, p = pos(i), e = S.estrelas[n] || 0, tranc = n > S.nivel, modo = modoDe(nv); pts.push(p);
    const b = document.createElement('button'); b.className = `no ${modo}` + (tranc ? ' trancado' : n === S.nivel ? ' atual' : ' feito');
    b.style.left = p.x + '%'; b.style.top = p.y + 'px'; b.title = { joias: 'Joias', resgate: 'Resgate', arremesso: 'Arremesso', pintura: 'Pintura' }[modo];
    b.innerHTML = tranc ? '&#128274;' : `<span>${n}</span><small>${'★'.repeat(e)}<i>${'★'.repeat(3 - e)}</i></small>`;
    b.onclick = () => { Som.init(); Som.clique(); if (!tranc) abrirNivel(n); else Jogo.balao('Vença os níveis anteriores primeiro!'); };
    nos.appendChild(b);
    if (n === Math.min(S.nivel, N)) { const r = document.createElement('div'); r.className = 'reiMarca'; r.innerHTML = SVG_COROA; r.style.left = p.x + '%'; r.style.top = (p.y - 42) + 'px'; nos.appendChild(r); }
    if (BAUS.includes(n)) {
      const q = pos(i + .5), estado = S.baus && S.baus[n] ? 'aberto' : S.nivel > n ? 'pronto' : 'fechado';
      const c = document.createElement('button'); c.className = 'bauNo ' + estado; c.innerHTML = SVG_BAU; c.title = 'Baú Real';
      c.style.left = (q.x > 50 ? q.x - 30 : q.x + 30) + '%'; c.style.top = q.y + 'px';
      c.onclick = () => { Som.init(); if (estado === 'pronto') abrirBau(n); else if (estado === 'fechado') { Som.nao(); Jogo.balao(`Vença o nível ${n} para abrir este baú!`); } else Jogo.balao('Esse baú já foi aberto.'); };
      nos.appendChild(c);
    }
  });
  $('#mapaLinha').setAttribute('viewBox', `0 0 100 ${H}`);
  $('#mapaLinha').innerHTML = `<polyline points="${pts.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#7a3d00" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".6"/><polyline points="${pts.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#ffd34d" stroke-width="7" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  const prox = Math.min(S.nivel, N); $('#bJogar').textContent = `Jogar nível ${prox}`; $('#bJogar').onclick = () => { Som.init(); Som.clique(); abrirNivel(prox); };
  const t = $('#telaInicio'), alvo = pos(prox - 1); requestAnimationFrame(() => { t.scrollTop = mapa.offsetTop + alvo.y - t.clientHeight * .5; });
}
async function abrirBau(n) {
  const i = BAUS.indexOf(n), premio = { moedas: 150 + i * 75, martelo: 1 + (i % 2), flecha: 1, canhao: i >= 1 ? 1 : 0 };
  S.baus = S.baus || {}; S.baus[n] = true; S.moedas += premio.moedas; S.reforcos = S.reforcos || { martelo: 0, flecha: 0, canhao: 0 };
  for (const k of ['martelo', 'flecha', 'canhao']) S.reforcos[k] = (S.reforcos[k] || 0) + premio[k];
  salvar(); mostrar('#telaBau'); $('#bauPremios').innerHTML = ''; $('#bPegar').hidden = true; $('.bauCartao').style.visibility = 'hidden'; balaoT = 0; $('#balao').classList.remove('ver');
  await Bau.abrir();
  const ic = r => document.querySelector(`#reforcos button[data-r="${r}"] svg`).outerHTML;
  $('#bauPremios').innerHTML = `<span><i class="ico moeda"></i>+${premio.moedas}</span>` + ['martelo', 'flecha', 'canhao'].filter(k => premio[k]).map((k, j) => `<span style="animation-delay:${.15 * (j + 1)}s">${ic(k)}+${premio[k]}</span>`).join('');
  $('#bPegar').hidden = false; $('.bauCartao').style.visibility = ''; HUD.topo(); Rei.reagir('vitoria'); Jogo.balao('Reforços! Use nos níveis de joias.', 3);
}
$('#bPegar').onclick = () => { Som.clique(); Bau.fechar(); Rei.parar(); irInicio(); };
function atualizarReforcos() {
  const r = S.reforcos || {};
  document.querySelectorAll('#reforcos button').forEach(b => { const n = r[b.dataset.r] || 0; b.querySelector('b').textContent = n; b.disabled = n <= 0; b.classList.toggle('ativo', T.reforco === b.dataset.r); });
}
document.querySelectorAll('#reforcos button').forEach(b => b.onclick = () => {
  Som.init(); if (!T.ativo || T.ocupado || T.modo !== 'joias') return; const r = b.dataset.r;
  T.reforco = T.reforco === r ? null : r; Som.clique(); atualizarReforcos();
  if (T.reforco) Jogo.balao({ martelo: 'Toque na peça que o martelo vai quebrar.', flecha: 'Toque numa peça: a flecha limpa a linha inteira.', canhao: 'Toque numa peça: o canhão limpa a coluna inteira.' }[r], 2.6);
});
const martelo = (() => { const g = new THREE.Group(), c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0xa0602a, roughness: .6 })); c.position.y = -.55; g.add(c); const h = new THREE.Mesh(new THREE.BoxGeometry(.65, .34, .34), MAT.ouro); h.position.y = -1.1; g.add(h); g.visible = false; tabG.add(g); return g; })();
async function usarReforco(k) {
  const r = T.reforco; T.reforco = null;
  if (!k || !S.reforcos || (S.reforcos[r] || 0) <= 0 || T.ocupado) { atualizarReforcos(); return; }
  S.reforcos[r]--; salvar(); atualizarReforcos(); T.ocupado = true; desselecionar(); inicioJogada();
  if (r === 'martelo') {
    const p = posCel(k.r, k.c); martelo.visible = true; martelo.position.set(p.x + .4, p.y + 1.6, 1.4);
    await Anim.add(.32, t => { martelo.rotation.z = -1.4 + t * 2.1; martelo.position.y = p.y + 1.6 - t * .2; }, Ease.inn);
    Som.pancada(10); tremerTela(.25); fxBr.emitir(p.x, p.y, .5, { tam: 2, vida: .3 }); atingir(k); await espera(.15); martelo.visible = false;
  } else { Som.foguete(); await linhaFoguete(k.r, k.c, r === 'flecha' ? 'h' : 'v', true); }
  Som.uau(); await resolver(); await fimJogada();
}
function montarListaNiveis() {
  const l = $('#listaNiveis'); l.innerHTML = '';
  NIVEIS.forEach((_, i) => {
    const n = i + 1, b = document.createElement('button'), e = S.estrelas[n] || 0, tranc = n > S.nivel;
    b.className = (tranc ? 'trancado' : n === S.nivel && !S.estrelas[n] ? 'atual' : '') + (NIVEIS[i].resgate && !tranc ? ' resgate' : '') + (NIVEIS[i].modo === 'arremesso' && !tranc ? ' arremesso' : '');
    b.innerHTML = tranc ? '&#128274;' : `${n}<small>${'★'.repeat(e)}<i>${'★'.repeat(3 - e)}</i></small>`;
    b.onclick = () => { Som.init(); Som.clique(); if (!tranc) abrirNivel(n); else Jogo.balao('Vença os níveis anteriores primeiro!'); };
    l.appendChild(b);
  });
  const prox = Math.min(S.nivel, NIVEIS.length); $('#bJogar').textContent = `Jogar nível ${prox}`; $('#bJogar').onclick = () => { Som.init(); Som.clique(); abrirNivel(prox); };
}
function irInicio() {
  T.ativo = false; T.emNivel = false; Resgate.sair(); Arremesso.sair(); Pintura.sair(); T.modo = 'joias'; T.reforco = null; $('#painel').hidden = true; $('#bPausa').hidden = true; Rei.base('normal'); Rei.parar();
  mostrar('#telaInicio'); dispor(); montarMapa(); Som.musica('mapa'); HUD.topo(); setTimeout(() => { Rei.reagir('aceno'); Jogo.balao(pega(FALAS.inicio)); }, 300);
}
function abrirNivel(n) {
  regenerarVidas();
  if (S.vidas <= 0) { HUD.topo(); Jogo.balao('Sem vidas! Espere um pouquinho que elas voltam.', 3); Rei.reagir('susto'); return; }
  const nv = NIVEIS[n - 1]; T.nivel = n; T.modo = nv.modo === 'arremesso' ? 'arr' : nv.modo === 'pintura' ? 'pin' : 'joias'; T.reforco = null;
  $('#nNum').textContent = n; $('#nJog').textContent = nv.jogadas || (nv.bolas ? nv.bolas.length : 0); $('#nJog').nextSibling.textContent = nv.bolas ? ' bolas' : ' jogadas';
  if (T.modo === 'arr') { Resgate.sair(); Pintura.sair(); Arremesso.carregar(nv); }
  else if (T.modo === 'pin') { Resgate.sair(); Arremesso.sair(); Pintura.carregar(nv); }
  else { Arremesso.sair(); Pintura.sair(); carregarNivel(nv); for (const o of pecasG.children) o.visible = false; }
  $('#nJog').textContent = T.jogadas;
  $('#nFaixa').classList.toggle('resgate', !!nv.resgate); $('#nFaixa').firstChild.textContent = nv.resgate ? 'Resgate! Nível ' : T.modo === 'arr' ? 'Arremesso! Nível ' : T.modo === 'pin' ? 'Pintura! Nível ' : 'Nível ';
  $('#nFaixa').classList.toggle('pintura', T.modo === 'pin');
  $('#nFaixa').classList.toggle('arremesso', T.modo === 'arr'); document.querySelector('#painel .jogadas span').textContent = T.modo === 'arr' ? 'Bolas' : 'Jogadas';
  if (T.modo === 'arr') { $('#nResgate').hidden = false; $('#nResgate').textContent = 'Arraste para mirar e solte para atirar. Derrube todas as latas e cristais!'; }
  if (T.modo === 'pin') { $('#nResgate').hidden = false; $('#nResgate').textContent = 'Escolha os potes de tinta: a parte pintada engole os blocos vizinhos da mesma cor. Pinte a escultura inteira!'; }
  $('#nResgate').hidden = !nv.resgate; if (nv.resgate) $('#nResgate').textContent = { agua: 'A sala do rei está enchendo de água!', teto: 'O teto de espinhos está descendo!', espinhos: 'Uma parede de espinhos vem chegando!' }[nv.resgate.perigo] + ' Quebre o entulho do canal para a pilha descer e soltar o Rei Tico.';
  $('#nMetas').innerHTML = T.metas.map(m => `<div class="meta">${svgMeta(m)}<b>${m.n}</b></div>`).join('');
  T.emNivel = true; atualizarReforcos(); $('#painel').hidden = false; HUD.montarMetas(); HUD.jogadas(); HUD.pontos(); $('#hNivel').textContent = n;
  dispor(); mostrar('#telaNivel');
}
async function comecarNivel() {
  mostrar(null); $('#bPausa').hidden = false; T.perigo = false; Rei.base('normal');
  Som.musica(T.modo === 'arr' ? 'arremesso' : T.modo === 'pin' ? 'pintura' : Resgate.ativo ? 'resgate' : 'joias'); Som.intensidade(0);
  if (T.modo === 'arr') await Arremesso.entrada(); else if (T.modo === 'pin') await Pintura.entrada(); else await entradaPecas(); T.ativo = true; T.ocupado = false;
  const nv = NIVEIS[T.nivel - 1];
  if (T.modo === 'arr') { Rei.reagir('aceno'); Jogo.balao(nv.dica || 'Arraste para mirar e solte para atirar!', 3.4); }
  else if (T.modo === 'pin') { Rei.reagir('aceno'); Jogo.balao(nv.dica || 'Os números nos potes mostram quantos blocos cada cor pinta!', 3.6); }
  else if (Resgate.ativo) { Rei.reagir('susto'); Som.susto(); Jogo.balao(Resgate.fala(0), 3.2); } else { Rei.reagir('aceno'); Jogo.balao(nv.dica || pega(FALAS.inicio), 3.4); }
}
function mostrarFim(venceu, est, moedas) {
  const tf = $('#telaFim'); tf.classList.toggle('perdeu', !venceu);
  $('#fTitulo').textContent = venceu ? 'Nível concluído!' : 'Acabaram as jogadas!';
  const estr = [...tf.querySelectorAll('.estrelasFim i')]; estr.forEach(e => e.className = ''); tf.querySelector('.estrelasFim').hidden = !venceu;
  $('#fGanho').innerHTML = venceu ? `<span><i class="ico moeda"></i>+${moedas}</span><span>${T.pontos.toLocaleString('pt-BR')} pts</span>` : '';
  const b1 = $('#bFim1'), b2 = $('#bFim2');
  if (venceu) {
    $('#fTexto').textContent = T.nivel >= NIVEIS.length ? 'Você venceu todos os níveis desta fase do jogo!' : 'O reino agradece!';
    b1.textContent = T.nivel >= NIVEIS.length ? 'Jogar de novo' : 'Próximo nível'; b1.className = 'botao verde grande'; b1.disabled = false;
    b1.onclick = () => { Som.clique(); abrirNivel(Math.min(NIVEIS.length, T.nivel + 1)); };
    b2.textContent = 'Níveis'; b2.onclick = () => { Som.clique(); irInicio(); };
    estr.forEach((e, i) => { if (i < est) setTimeout(() => { e.className = 'on'; Som.estrela(i); }, 450 + i * 420); });
    setTimeout(() => Som.moeda(), 450 + est * 420);
  } else {
    const falta = T.metas.reduce((a, m) => a + Math.max(0, m.falta), 0);
    $('#fTexto').textContent = `Faltou pouco: ${falta} para completar. ` + (T.modo === 'arr' ? 'Comprar +3 bolas?' : T.modo === 'pin' ? 'Comprar +3 jogadas?' : 'Comprar +5 jogadas?');
    const extra = T.modo === 'joias' ? 5 : 3; b1.textContent = T.modo === 'arr' ? 'Mais 3 bolas (300 moedas)' : `Mais ${extra} jogadas (300 moedas)`; b1.className = 'botao dourado'; b1.disabled = S.moedas < 300;
    b1.onclick = () => { if (S.moedas < 300) return; Som.moeda(); S.moedas -= 300; salvar(); HUD.topo(); T.jogadas += extra; if (T.modo === 'arr') Arremesso.recarregar(extra); Resgate.recuar(); Som.musica(T.modo === 'arr' ? 'arremesso' : T.modo === 'pin' ? 'pintura' : Resgate.ativo ? 'resgate' : 'joias'); mostrar(null); T.ativo = true; T.ocupado = false; T.perigo = false; Rei.parar(); Rei.base('normal'); Rei.reagir('feliz'); Jogo.balao('Ufa! Mais uma chance!'); HUD.jogadas(); };
    b2.textContent = 'Tentar de novo (−1 vida)'; b2.onclick = () => { Som.clique(); perderVida(); Rei.parar(); if (S.vidas > 0) abrirNivel(T.nivel); else irInicio(); };
    b2.insertAdjacentHTML('afterend', '');
  }
  mostrar('#telaFim');
}
function perderVida() { regenerarVidas(); if (S.vidas >= VIDA_MAX) S.vidaT = Date.now(); S.vidas = Math.max(0, S.vidas - 1); salvar(); HUD.topo(); }

$('#bComecar').onclick = () => { Som.init(); Som.clique(); comecarNivel(); };
$('#bVoltarNivel').onclick = () => { Som.clique(); irInicio(); };
$('#bPausa').onclick = () => { Som.init(); Som.clique(); if (!T.emNivel) return; mostrar('#telaPausa'); };
$('#bContinuar').onclick = () => { Som.clique(); mostrar(null); };
$('#bReiniciar').onclick = () => { Som.clique(); if (T.ocupado && T.ativo) return; perderVida(); if (S.vidas > 0) abrirNivel(T.nivel); else irInicio(); };
$('#bSairNivel').onclick = () => { Som.clique(); perderVida(); irInicio(); };
$('#bSom').onclick = () => { Som.init(); const on = Som.alternar(); $('#bSom').classList.toggle('mudo', !on); };
$('#bSom').classList.toggle('mudo', !Som.ligado());
addEventListener('keydown', e => { if (e.key === 'm' || e.key === 'M') $('#bSom').click(); if (e.key === 'Escape' && T.emNivel) $('#telaPausa').hidden ? $('#bPausa').click() : $('#bContinuar').click(); });

// ---------- toque e mouse ----------
const tela = $('#tela'); let toque = null;
const pausado = () => telas.some(t => !$(t).hidden);
tela.addEventListener('pointerdown', e => {
  Som.init();
  if (T.modo === 'arr') { if (!pausado()) { Arremesso.toque('down', e); tela.setPointerCapture?.(e.pointerId); } return; }
  if (L.rei.w > 2) { const rx = (e.clientX - (L.rei.x + L.rei.w / 2)) / (L.rei.w / 2), ry = (e.clientY - (L.rei.y + L.rei.h * .3)) / (L.rei.h / 2); Rei.olhar(rx, ry); }
  if (e.clientX >= L.rei.x && e.clientX <= L.rei.x + L.rei.w && e.clientY >= L.rei.y && e.clientY <= L.rei.y + L.rei.h) { if (!T.ativo || !T.ocupado) { Rei.reagir(pega(['feliz', 'aceno', 'susto'])); Jogo.balao(pega(['Ei! Isso faz cócegas!', 'Minha coroa!', 'Hehe!', 'Sou o Rei Tico!'])); } return; }
  if (T.modo === 'pin' || !T.ativo || T.ocupado || pausado()) return;
  const k = celulaNaTela(e.clientX, e.clientY); if (!k) { desselecionar(); return; }
  toque = { k, x: e.clientX, y: e.clientY, moveu: false }; tela.setPointerCapture?.(e.pointerId);
});
tela.addEventListener('pointermove', e => {
  if (T.modo === 'arr') { if (!pausado()) Arremesso.toque('move', e); return; }
  if (!toque || toque.moveu || T.reforco) return;
  const dx = e.clientX - toque.x, dy = e.clientY - toque.y, lim = Math.max(14, L.tab.h / T.Nr * .3);
  if (Math.hypot(dx, dy) < lim) return;
  toque.moveu = true; const k = toque.k;
  const alvo = Math.abs(dx) > Math.abs(dy) ? celula(k.r, k.c + Math.sign(dx)) : celula(k.r + Math.sign(dy), k.c);
  if (alvo) tentarTroca(k, alvo); else { if (k.gema) balancar(k.gema.mesh); }
});
tela.addEventListener('pointerup', e => {
  if (T.modo === 'arr') { if (!pausado()) Arremesso.toque('up', e); return; }
  if (!toque) return; const t = toque; toque = null; if (t.moveu || !T.ativo || T.ocupado) return;
  const k = t.k;
  if (T.reforco) { usarReforco(k); return; }
  if (k.gema && k.gema.tipo !== 'n' && !k.corrente) { tocarEspecial(k); return; }
  if (T.sel && T.sel !== k && Math.abs(T.sel.r - k.r) + Math.abs(T.sel.c - k.c) === 1) { tentarTroca(T.sel, k); return; }
  if (T.sel === k) { desselecionar(); return; }
  desselecionar(); if (movel(k)) selecionar(k); else { const o = k.bloco || k.gema; if (o && o.mesh) { balancar(o.mesh); Som.nao(); } }
});
tela.addEventListener('pointercancel', () => { toque = null; });

// ---------- disposição na tela ----------
function dispor() {
  const W = innerWidth, H = innerHeight; L.W = W; L.H = H; R.setSize(W, H, false);
  camOver.left = -W / 2; camOver.right = W / 2; camOver.top = H / 2; camOver.bottom = -H / 2; camOver.updateProjectionMatrix();
  const topoB = $('#topo').getBoundingClientRect().bottom + 4, pn = $('#painel'), naTela = T.emNivel, m = 8;
  L.paisagem = W > H * 1.15;
  const ladoTela = $('#telaInicio').hidden ? null : $('#telaInicio');
  if (L.paisagem) {
    const cw = Math.min(W * .36, 440);
    let y = topoB;
    if (naTela) { Object.assign(pn.style, { left: m + 'px', top: y + 'px', width: (cw - m * 2) + 'px', flexWrap: 'wrap' }); y += pn.offsetHeight + 8; }
    L.rei = { x: m, y, w: cw - m * 2, h: H - y - m };
    L.tab = { x: cw, y: topoB, w: W - cw - m, h: H - topoB - m };
  } else {
    let y = topoB;
    if (naTela) { Object.assign(pn.style, { left: m + 'px', top: y + 'px', width: (W - m * 2) + 'px', flexWrap: 'nowrap' }); y += pn.offsetHeight + 8; }
    const rh = Math.round(naTela ? (T.modo === 'pin' ? clamp(H * .19, 110, 190) : clamp(H - y - 14 - W * (T.Nr + 1.5) / (T.Nc + 1.2), 120, 330)) : clamp(H * .3, 120, 300));
    L.rei = { x: m, y, w: W - m * 2, h: rh };
    L.tab = { x: 0, y: y + rh + 6, w: W, h: H - (y + rh + 6) - m };
  }
  if (Resgate.ativo) { L.rei = { x: 0, y: 0, w: 0, h: 0 }; if (L.paisagem) { const cw = Math.min(W * .3, 360); Object.assign(pn.style, { left: m + 'px', top: topoB + 'px', width: (cw - m * 2) + 'px', flexWrap: 'wrap' }); L.tab = { x: cw, y: topoB, w: W - cw - m, h: H - topoB - m }; } else { const y = topoB + pn.offsetHeight + 8, hNec = W * (T.Nr + 1.1 + Resgate.alturaTopo) / (T.Nc + 1.1) * 1.05; L.tab = { x: 0, y, w: W, h: Math.min(H - y - m, hNec) }; } }
  if (Arremesso.ativo) { L.rei = { x: 0, y: 0, w: 0, h: 0 }; if (L.paisagem) { Object.assign(pn.style, { left: m + 'px', top: topoB + 'px', width: Math.min(W * .3, 360) - m * 2 + 'px', flexWrap: 'wrap' }); L.tab = { x: 0, y: 0, w: W, h: H }; L.rei = { x: m, y: H - Math.min(H * .42, 320) - m, w: Math.min(W * .22, 260), h: Math.min(H * .42, 320) }; } else { const y = topoB + pn.offsetHeight + 4; L.tab = { x: 0, y, w: W, h: H - y }; L.rei = { x: 0, y: H - Math.min(H * .24, 230), w: Math.min(W * .4, 220), h: Math.min(H * .24, 230) }; } }
  $('#palco').style.display = Resgate.ativo || Arremesso.ativo ? 'none' : '';
  Object.assign($('#palco').style, { left: L.rei.x + 'px', top: L.rei.y + 'px', width: L.rei.w + 'px', height: L.rei.h + 'px' });
  for (const id of ['#telaInicio']) Object.assign($(id).style, { left: L.tab.x + 'px', top: L.tab.y + 'px', width: L.tab.w + 'px', height: L.tab.h + 'px' });
  const nRef = Object.values(S.reforcos || {}).reduce((a, b) => a + b, 0), barra = T.emNivel ? (T.modo === 'pin' ? $('#potes') : T.modo === 'joias' && nRef > 0 ? $('#reforcos') : null) : null;
  $('#reforcos').hidden = !(barra && barra.id === 'reforcos');
  if (barra) { const hb = barra.id === 'potes' ? 88 : 62; L.tab.h -= hb; Object.assign(barra.style, { left: L.tab.x + 'px', top: (L.tab.y + L.tab.h + 2) + 'px', width: L.tab.w + 'px', height: (hb - 6) + 'px' }); }
  if (Pintura.ativo) Pintura.enquadrar();
  if (Arremesso.ativo) { Arremesso.enquadrar(); Rei.enquadrar(L.rei, false); } else if (!Resgate.ativo) Rei.enquadrar(L.rei, !L.paisagem && L.rei.w / L.rei.h > 1.7); enquadrarTab(); posicionarBalao();
}
addEventListener('resize', dispor);

// ---------- laço ----------
function desenharArea(r, cena, cam, fxs) {
  const pr = R.getPixelRatio(), y = L.H - r.y - r.h;
  R.setViewport(r.x, y, r.w, r.h); R.setScissor(r.x, y, r.w, r.h);
  const esc = r.h * pr / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  for (const f of fxs) f.mat.uniforms.escala.value = esc;
  R.clearDepth(); R.render(cena, cam);
}
let ultimo = performance.now(), relogio = 0;
function quadro(agora) {
  requestAnimationFrame(quadro);
  let dt = clamp((agora - ultimo) / 1000, 0, .05); ultimo = agora; dt *= VEL.v; if (dt <= 0) return;
  Anim.tick(dt); Rei.update(dt); Resgate.update(dt); Arremesso.update(dt); Pintura.update(dt); Bau.update(dt); tickTabuleiro(dt); Confete.tick(dt);
  if (balaoT > 0) { balaoT -= dt; posicionarBalao(); if (balaoT <= 0) $('#balao').classList.remove('ver'); }
  relogio += dt; if (relogio > 1) { relogio = 0; HUD.topo(); }
  R.setScissorTest(false); R.setViewport(0, 0, L.W, L.H); R.clear(); R.setScissorTest(true);
  if (T.emNivel && T.modo === 'arr') desenharArea(L.tab, Arremesso.cena, Arremesso.cam, Arremesso.fx);
  if (L.rei.w > 2) desenharArea(L.rei, Rei.cena, Rei.cam, [Rei.fx]);
  if (T.emNivel && T.modo === 'pin') desenharArea(L.tab, Pintura.cena, Pintura.cam, Pintura.fx);
  if (T.emNivel && (T.modo || 'joias') === 'joias') desenharArea(L.tab, cenaTab, camTab, [fxTab, fxBr, fxCaco]);
  R.setScissorTest(false); Bau.desenhar();
  R.setScissorTest(false); R.setViewport(0, 0, L.W, L.H); R.clearDepth(); R.render(cenaOver, camOver);
}
window.__tico = { VEL, L, dispor, enquadrarTab, processarFila, Som, T, S, Rei, Resgate, Arremesso, Pintura, Bau, abrirBau, usarReforco, montarMapa, atingir, todas, Anim, VEL, R, celula, tentarTroca, tocarEspecial, abrirNivel, comecarNivel, irInicio, existeJogada, telaDe, posCel, NIVEIS, Jogo, novaGema };
try { R.compile(Rei.cena, Rei.cam); R.compile(cenaTab, camTab); } catch (e) {}
irInicio(); requestAnimationFrame(quadro);
