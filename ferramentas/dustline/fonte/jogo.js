/* Dustline: escolher a pista, contagem, corrida contra o relógio com marcos, chegada, ou passeio livre.
   Estados: 'inicio' (câmera passeia em volta do carro), 'contagem', 'correndo', 'fim', 'livre'. */
const $ = id => document.getElementById(id), tela = $('tela');
let R; try { R = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' }); } catch (e) { $('semgl').hidden = false; throw e; }
R.outputColorSpace = THREE.LinearSRGBColorSpace; R.toneMapping = THREE.NoToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const cena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 1, 2600);
const salvo = Object.assign({ volume: 1, etapa: 0, modo: 'tempo', melhores: {}, pontos: {}, pintura: 'perola', dicas: 0 }, (() => { try { return JSON.parse(localStorage.getItem('dustline.v1')) || {}; } catch { return {}; } })());
salvo.melhores = salvo.melhores || {}; salvo.pontos = salvo.pontos || {}; salvo.etapa = ETAPAS[salvo.etapa] ? salvo.etapa : 0;
const guardar = () => { try { localStorage.setItem('dustline.v1', JSON.stringify(salvo)); } catch {} };

// luz: sol baixo (sombra acompanha o carro) e luz do céu. No Three r170 a intensidade vai vezes π.
const sol = new THREE.DirectionalLight('#fff', 1), ceuLuz = new THREE.HemisphereLight('#fff', '#888', 1);
sol.castShadow = true; sol.shadow.mapSize.setScalar(Som.pequeno ? 1024 : 2048); sol.shadow.bias = -.0004; sol.shadow.normalBias = .04; sol.shadow.radius = 3;
Object.assign(sol.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 300 }); cena.add(sol, sol.target, ceuLuz);
cena.fog = new THREE.Fog('#e8e1d2', 30, 250);
const pintura = () => PINTURAS.find(p => p.id === salvo.pintura) || PINTURAS[0], carro = criarCarro(pintura()), fantasma = criarCarro(PINTURAS[0], { fantasma: true }), F = criarFisica(carro), poeira = criarPoeira(), marcas = criarMarcas(), clima = criarClima();
cena.add(carro.grupo, fantasma.grupo, poeira.malha, marcas.malha, clima.malha); fantasma.grupo.visible = false;

/* ---------- pista ---------- */
let progresso = 0, preso = 0, etapa = salvo.etapa, estado = 'inicio', modo = ['tempo', 'drift', 'livre'].includes(salvo.modo) ? salvo.modo : 'tempo', relogio = 0, proxMarco = 0, longe = 0, tremor = 0, aoFim = 0;
function construir(i) {
  if (MUNDO) { cena.remove(MUNDO.grupo); MUNDO.descartar(); }
  etapa = i; const E = ETAPAS[i]; MUNDO = criarMundo(E); cena.add(MUNDO.grupo);
  CEU.c.forEach((c, k) => c.set(E.ceu[k])); CEU.sol.set(E.sol); CEU.nevoa.set(E.nevoa); CEU.dir.set(Math.cos(E.solDir), E.solAlt, Math.sin(E.solDir)).normalize();
  cena.fog.color.set(E.nevoa); cena.fog.near = E.perto; cena.fog.far = E.longe; sol.color.set(E.sol); sol.intensity = E.luz * Math.PI;
  ceuLuz.color.set(E.ceuLuz); ceuLuz.groundColor.set(E.chaoLuz); ceuLuz.intensity = E.amb * Math.PI;
  document.documentElement.style.setProperty('--tinta', E.tinta); document.querySelector('meta[name=theme-color]').content = E.nevoa; document.body.style.background = $('veu').style.background = E.nevoa;
  clima.usar(E.clima); poeira.cor(E.poeira); marcas.cor(E.marca); poeira.limpar(); marcas.limpar(); Som.mudarHora(E.musica);
  F.colocar(MUNDO.largada()); salvo.etapa = i; guardar(); listaPistas();
}
// troca com um véu rápido (montar a pista leva uma fração de segundo)
function trocar(i, depois) { $('veu').classList.add('ver'); setTimeout(() => { if (i !== etapa || !MUNDO) construir(i); else { F.colocar(MUNDO.largada()); poeira.limpar(); marcas.limpar(); } mirar(0, true); depois && depois(); setTimeout(() => $('veu').classList.remove('ver'), 120); }, 650); }

/* ---------- tela inicial ---------- */
const ptsTxt = n => Math.round(n).toLocaleString('pt-BR'), MEDALHA = ['', 'bronze', 'prata', 'ouro'];
// medalha: bronze por chegar; prata e ouro pelos alvos da pista (tempo: menor é melhor; drift: mais pontos)
function medalha(E, m, v) { if (v == null) return 0; const [pr, ou] = E.medalhas[m]; return m === 'tempo' ? (v <= ou ? 3 : v <= pr ? 2 : 1) : (v >= ou ? 3 : v >= pr ? 2 : 1); }
const tempoTxt = s => s == null ? '—' : `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
function listaPistas() {
  const el = $('pistas'); el.innerHTML = '';
  ETAPAS.forEach((E, i) => { const b = document.createElement('button'); b.setAttribute('role', 'listitem'); b.className = i === etapa ? 'atual' : ''; b.style.setProperty('--c', E.chao[1]);
    const v = modo === 'tempo' ? salvo.melhores[E.id] : salvo.pontos[E.id], md = modo === 'livre' ? 0 : medalha(E, modo, v);
    b.innerHTML = `<span class="n">${E.nome}</span><span class="t">${modo === 'tempo' ? 'melhor ' + tempoTxt(v) : modo === 'drift' ? 'recorde ' + (v == null ? '—' : ptsTxt(v)) : 'passeio livre'}</span>${md ? `<span class="med m${md}" title="${MEDALHA[md]}"></span>` : ''}`; b.onclick = () => { Som.botao(); comecar(i); }; el.append(b); });
}
for (const b of document.querySelectorAll('#modos button')) b.onclick = () => { modo = b.dataset.modo; salvo.modo = modo; guardar(); Som.botao(); for (const o of document.querySelectorAll('#modos button')) o.setAttribute('aria-checked', o === b); listaPistas(); };
for (const o of document.querySelectorAll('#modos button')) o.setAttribute('aria-checked', o.dataset.modo === modo);
function listaCores() {
  const el = $('cores'); el.innerHTML = '';
  PINTURAS.forEach(p => { const b = document.createElement('button'); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', p.id === salvo.pintura); b.setAttribute('aria-label', 'Carro ' + p.nome); b.title = p.nome;
    b.style.background = `linear-gradient(90deg, ${p.lata} 0 38%, ${p.faixa} 38% 62%, ${p.lata} 62%)`; b.onclick = () => { salvo.pintura = p.id; guardar(); carro.pintar(p); Som.botao(); listaCores(); }; el.append(b); });
}
listaCores();
function mostrarInicio() { estado = 'inicio'; $('inicio').classList.remove('some'); $('painel').hidden = true; $('fim').hidden = true; document.body.classList.remove('dirigindo'); aviso(''); listaPistas(); }
function irInicio() { if (estado === 'inicio') return; trocar(etapa, mostrarInicio); }
function comecar(i) {
  $('inicio').classList.add('some'); $('fim').hidden = true; estado = 'pausa';
  trocar(i, () => {
    document.body.classList.add('dirigindo');
    zerarDrift(); gravacao = []; fant = null; fantasma.grupo.visible = false; $('placar').hidden = modo !== 'drift'; $('relogio').classList.toggle('pequeno', modo === 'drift');
    if (modo === 'livre') { estado = 'livre'; $('painel').hidden = false; $('relogio').textContent = ''; $('marcos').innerHTML = ''; aviso(ETAPAS[etapa].nome, 2600); return; }
    if (modo === 'tempo') { try { fant = JSON.parse(localStorage.getItem('dustline.fantasma.' + ETAPAS[etapa].id)); } catch {} if (fant && fant.length > 6) { fantasma.grupo.visible = true; colocarFantasma(0); } else fant = null; }
    if (salvo.dicas < 4) { salvo.dicas++; guardar(); setTimeout(() => aviso(Som.pequeno ? 'drift: freio de mão + virar na curva' : 'drift: espaço (freio de mão) + seta na curva', 4200), 900); }
    estado = 'contagem'; relogio = 0; proxMarco = 0; progresso = MUNDO.ini - 9; $('painel').hidden = false; $('relogio').textContent = tempoTxt(0);
    $('marcos').innerHTML = MUNDO.marcos.map(() => '<i></i>').join('');
    let n = 3; const passo = () => { if (estado !== 'contagem') return; const c = $('contagem'); c.textContent = n || ''; c.classList.add('ver'); Som.contagem(n); setTimeout(() => c.classList.remove('ver'), n ? 600 : 300);
      if (n) { n--; setTimeout(passo, 850); } else estado = 'correndo'; };
    setTimeout(passo, 500);
  });
}
let relAviso = 0; function aviso(t, ms = 2400) { const a = $('aviso'); a.textContent = t; a.classList.toggle('ver', !!t); clearTimeout(relAviso); if (t) relAviso = setTimeout(() => a.classList.remove('ver'), ms); }
function chegou() {
  if (D.ativa) guardarDrift(); $('drift').classList.remove('ver');
  estado = 'fim'; const E = ETAPAS[etapa], c = $('fim'), drift = modo === 'drift', valor = drift ? D.total : Math.round(relogio * 10) / 10;
  const lista = drift ? salvo.pontos : salvo.melhores, antes = lista[E.id], recorde = antes == null || (drift ? valor > antes : valor < antes);
  if (recorde) { lista[E.id] = valor; guardar(); if (!drift) try { localStorage.setItem('dustline.fantasma.' + E.id, JSON.stringify(gravacao)); } catch {} }
  const md = medalha(E, modo, valor), mdAntes = medalha(E, modo, antes);
  Som.chegada(recorde); aoFim = 1.4;
  c.querySelector('.nome').textContent = E.nome; c.querySelector('.tempo').textContent = drift ? ptsTxt(valor) + ' pts' : tempoTxt(relogio);
  c.querySelector('.melhor').textContent = recorde ? (antes == null ? (drift ? 'primeiro recorde nesta pista' : 'primeiro tempo nesta pista') : (drift ? 'novo recorde!' : 'novo melhor tempo!')) : (drift ? 'recorde: ' + ptsTxt(antes) : 'melhor: ' + tempoTxt(antes));
  const [pr, ou] = E.medalhas[modo], alvo = md === 3 ? 'o máximo!' : `${md === 2 ? 'ouro' : 'prata'} com ${drift ? ptsTxt(md === 2 ? ou : pr) + ' pts' : tempoTxt(md === 2 ? ou : pr)}`;
  c.querySelector('.medalha').className = 'medalha m' + md; c.querySelector('.medalha').textContent = (md > mdAntes ? 'nova medalha de ' : 'medalha de ') + MEDALHA[md] + ' · ' + alvo;
  c.querySelector('.extra').textContent = drift ? 'tempo ' + tempoTxt(relogio) + (D.melhor ? ' · maior drift ' + ptsTxt(D.melhor) : '') : (D.melhor ? 'maior drift ' + ptsTxt(D.melhor) : '');
  listaPistas();
}

/* ---------- drift: pontos por ângulo e velocidade, multiplicador que sobe com drifts encadeados ----------
   Cada drift guarda seus pontos (× multiplicador) quando termina. O multiplicador sobe a cada 1,6 s de drift e
   continua se o próximo drift começar até 1,6 s depois. Zonas de cones valem o dobro.
   Bater forte ou sair muito da estrada perde só o drift atual (e zera o multiplicador). Saindo de um drift longo, turbo. */
const D = { pts: 0, mult: 1, t: 0, folga: 0, fora: 0, ativa: false, total: 0, melhor: 0 };
let relNota = 0;
function zerarDrift() { Object.assign(D, { pts: 0, mult: 1, t: 0, folga: 9, fora: 0, ativa: false, total: 0, melhor: 0 }); $('placar').textContent = '0 pts'; $('drift').classList.remove('ver', 'zona'); }
function notaDrift(txt, classe) { const n = $('dnota'); n.textContent = txt; n.className = 'ver ' + (classe || ''); clearTimeout(relNota); relNota = setTimeout(() => n.className = '', 1600); }
function guardarDrift() {
  const v = Math.round(D.pts * D.mult); D.ativa = false; D.pts = 0;
  if (v < 60) return; D.total += v; D.melhor = Math.max(D.melhor, v); $('placar').textContent = ptsTxt(D.total) + ' pts';
  const q = v >= 9000 ? 'lendário!' : v >= 4000 ? 'incrível!' : v >= 1600 ? 'ótimo drift' : v >= 500 ? 'bom drift' : 'drift';
  notaDrift(`+${ptsTxt(v)} · ${q}`); Som.drift(v);
}
function perderDrift(porque) { if (D.pts * D.mult > 150) { notaDrift(porque, 'perdeu'); Som.perdeu(); } Object.assign(D, { ativa: false, pts: 0, mult: 1, t: 0, folga: 9 }); $('drift').classList.remove('ver'); }
function drift(dt) {
  if (estado !== 'correndo' && estado !== 'livre') return;
  if (F.saiu > .8) { Som.turbo(); if (!D.ativa || D.folga > 0) notaDrift('turbo', 'turbo'); }
  const e = MUNDO.perto(F.x, F.z), zona = !!(e && e.d < 12 && MUNDO.emZona[e.i]);
  if (F.deriva && F.vel > 8) {
    if (!D.ativa) { if (D.folga > 1.6) Object.assign(D, { mult: 1, t: 0 }); Object.assign(D, { ativa: true, pts: 0 }); }
    D.pts += dt * Math.abs(F.ang) * 57.3 * F.vel * .25 * (zona ? 2 : 1); D.t += dt; D.folga = 0;
    const m = Math.min(5, 1 + Math.floor(D.t / 1.6)); if (m > D.mult) { D.mult = m; Som.combo(m); }
  } else { if (D.ativa) guardarDrift(); D.folga += dt; }
  if (D.ativa) {
    if (F.batida && F.batida.forca > 5) perderDrift('bateu · perdeu o drift');
    else if (!e || e.d > LARGURA / 2 + 4) { D.fora += dt; if (D.fora > 1.5) perderDrift('fora da estrada · perdeu o drift'); } else D.fora = 0;
  }
  const el = $('drift');
  const mostra = D.ativa || (D.t > 0 && D.folga < 1.6); el.classList.toggle('ver', mostra);
  if (mostra) { el.classList.toggle('zona', zona && D.ativa); el.classList.toggle('espera', !D.ativa); el.querySelector('.pts').textContent = D.ativa ? ptsTxt(D.pts) : ''; el.querySelector('.mult').textContent = '×' + D.mult; el.style.setProperty('--folga', D.ativa ? 1 : 1 - D.folga / 1.6); }
}

/* ---------- fantasma: o carro da sua melhor volta, transparente (só contra o relógio) ---------- */
let gravacao = [], fant = null;
function colocarFantasma(t) {
  const f = t * 15, i = Math.floor(f), u = f - i, n = fant.length / 3; if (i + 1 >= n) { fantasma.grupo.visible = false; return; }
  const a = i * 3, b = a + 3, x = fant[a] + (fant[b] - fant[a]) * u, z = fant[a + 1] + (fant[b + 1] - fant[a + 1]) * u; let dr = fant[b + 2] - fant[a + 2]; dr -= Math.round(dr / (2 * Math.PI)) * 2 * Math.PI;
  fantasma.grupo.position.set(x, MUNDO.altura(x, z) + .02, z); fantasma.grupo.rotation.set(0, fant[a + 2] + dr * u, 0);
  const perto = Math.hypot(x - F.x, z - F.z); fantasma.M.lata.opacity = Math.min(.26, Math.max(.06, (perto - 2) * .05));
}
function fantasmaQuadro() {
  if (estado !== 'correndo' || modo !== 'tempo') return;
  const k = Math.floor(relogio * 15); while (gravacao.length / 3 <= k) gravacao.push(Math.round(F.x * 100) / 100, Math.round(F.z * 100) / 100, Math.round(F.rumo * 1000) / 1000);
  if (fant && fantasma.grupo.visible) colocarFantasma(relogio);
}
$('bDeNovo').onclick = () => { Som.botao(); comecar(etapa); }; $('bProxima').onclick = () => { Som.botao(); comecar((etapa + 1) % ETAPAS.length); }; $('bPistas').onclick = () => { Som.botao(); irInicio(); };
$('bVoltar').onclick = () => { Som.botao(); irInicio(); };
// voltar para a estrada (tecla R, ou sozinho depois de muito tempo longe)
function voltarEstrada() { const e = MUNDO.perto(F.x, F.z), i = Math.max(2, Math.min(MUNDO.pontos.length - 6, e ? e.i : MUNDO.maisPerto(F.x, F.z))), p = MUNDO.pontos[i], s = MUNDO.pontos[i + 4]; F.colocar({ x: p.x, z: p.z, rumo: Math.atan2(s.x - p.x, s.z - p.z) }); mirar(0, true); marcas.limpar(); $('veu').classList.add('ver'); setTimeout(() => $('veu').classList.remove('ver'), 80); longe = -1; preso = 0; }

/* ---------- volume ---------- */
const VOL = [0, .5, 1]; let nivel = VOL.includes(salvo.volume) ? VOL.indexOf(salvo.volume) : 2;
function mudarVolume(n) { nivel = n; salvo.volume = VOL[n]; $('bSom').dataset.v = n; $('bSom').setAttribute('aria-label', ['Som desligado', 'Som baixo', 'Som normal'][n]); Som.ajustar(VOL[n]); guardar(); }
$('bSom').onclick = () => { mudarVolume((nivel + 2) % 3); Som.botao(); }; mudarVolume(nivel);

/* ---------- controles: teclado e botões de toque ---------- */
const teclas = new Set(), toque = new Set(), ent = { gas: 0, freio: 0, virar: 0, mao: false };
const MAPA_T = { ArrowUp: 'gas', w: 'gas', ArrowDown: 'freio', s: 'freio', ArrowLeft: 'esq', a: 'esq', ArrowRight: 'dir', d: 'dir', ' ': 'mao' };
addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, c = MAPA_T[k];
  if (c && estado !== 'inicio') { e.preventDefault(); teclas.add(c); }
  if (e.repeat) return;
  if (k === 'm') $('bSom').click(); if (k === 'Escape') irInicio(); if (k === 'r' && (estado === 'correndo' || estado === 'livre')) voltarEstrada();
  if (k === 'Enter' && estado === 'inicio' && e.target.tagName !== 'BUTTON') comecar(etapa); if (k === 'Enter' && estado === 'fim' && aoFim <= 0) comecar(etapa);
});
addEventListener('keyup', e => { const c = MAPA_T[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (c) teclas.delete(c); });
addEventListener('blur', () => { teclas.clear(); toque.clear(); for (const b of document.querySelectorAll('#controles .ativo')) b.classList.remove('ativo'); });
for (const b of document.querySelectorAll('#controles button')) {
  const k = b.dataset.k, liga = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} toque.add(k); b.classList.add('ativo'); }, solta = e => { e.preventDefault(); toque.delete(k); b.classList.remove('ativo'); };
  b.addEventListener('pointerdown', liga); b.addEventListener('pointerup', solta); b.addEventListener('pointercancel', solta); b.addEventListener('lostpointercapture', solta);
}
tela.addEventListener('contextmenu', e => e.preventDefault());
function lerEntrada() {
  const t = k => teclas.has(k) || toque.has(k), livre = estado === 'correndo' || estado === 'livre';
  ent.gas = livre && t('gas') ? 1 : 0; ent.freio = livre && t('freio') ? 1 : 0; ent.virar = livre ? (t('dir') ? 1 : 0) - (t('esq') ? 1 : 0) : 0; ent.mao = livre && t('mao');
  if (estado === 'fim') ent.freio = F.vf > 1 ? .5 : 0;
}

/* ---------- câmera: alta e inclinada, segue o carro e olha à frente; na tela inicial dá a volta devagar ---------- */
const Cam = { rumo: 0, alvo: new THREE.Vector3(), pos: new THREE.Vector3(), orbita: 0 };
function medir() { const w = innerWidth, h = innerHeight; R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 40 : 30; cam.updateProjectionMatrix(); }
function mirar(dt, ja) {
  const ini = estado === 'inicio'; Cam.orbita += dt * .12;
  let d = F.rumo - Cam.rumo; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; Cam.rumo += d * Math.min(1, ja ? 1 : dt * .9);
  const v = Math.min(Math.abs(F.vf), 30), lx = innerWidth < innerHeight ? 1.25 : 1, dist = (ini ? .62 : 1 + v * .007) * lx;
  const a = ini ? F.rumo + Math.PI * .75 + Cam.orbita : Cam.rumo, frente = ini ? new THREE.Vector3() : new THREE.Vector3(Math.sin(F.rumo), 0, Math.cos(F.rumo)).multiplyScalar(v * .3);
  const alvo = new THREE.Vector3(F.x, F.y + 1, F.z).add(frente), hz = (ini ? 30 : 27) * dist, pos = alvo.clone().add(new THREE.Vector3(-Math.sin(a) * hz, (ini ? 17 : 29) * dist, -Math.cos(a) * hz));
  if (ja) { Cam.alvo.copy(alvo); Cam.pos.copy(pos); } else { Cam.alvo.lerp(alvo, Math.min(1, dt * 4)); Cam.pos.lerp(pos, Math.min(1, dt * (ini ? 1.2 : 2.5))); }
  cam.position.copy(Cam.pos); if (tremor > 0) cam.position.add(new THREE.Vector3((Math.random() - .5) * tremor, (Math.random() - .5) * tremor, (Math.random() - .5) * tremor)); cam.lookAt(Cam.alvo);
  sol.position.copy(Cam.alvo).addScaledVector(CEU.dir, 140); sol.target.position.copy(Cam.alvo);
}

/* ---------- poeira, marcas e batidas ---------- */
let sobra = 0;
function efeitos(dt) {
  const v = Math.abs(F.vf), solto = 1 - F.superficie * .35, desliza = Math.min(1, Math.max(0, (F.derrapa - .8) / 5));
  sobra += dt * (v * .55 * solto + desliza * 26 + (ent.freio && v > 4 ? 8 : 0)) * (Som.pequeno ? .6 : 1);
  const sx = Math.sin(F.rumo), cz = Math.cos(F.rumo);
  while (sobra > 1) { sobra--; const [x, z] = F.rodas[Math.random() < .5 ? 0 : 1]; poeira.soltar(x, MUNDO.altura(x, z) + .25, z, -sx * v * .25, -cz * v * .25, 1.6 + desliza * 1.4 + v * .03, 1.4 + Math.random() * 1.4 + desliza); }
  const forca = desliza * .95 + (ent.freio && F.vf > 3 ? .45 : 0) + (F.superficie < .5 ? .08 : .04) * Math.min(1, v / 6);
  F.rodas.forEach(([x, z], r) => marcas.marcar(r, x, MUNDO.altura(x, z) + .07, z, F.rumo, v > 1 ? forca : 0));
  if (F.batidaAgua) { if (F.batidaAgua > 2) Som.batida(F.batidaAgua * .6); for (let k = 0; k < 8; k++) poeira.soltar(F.x, F.y + .3, F.z, 0, 0, 2, 1.2); F.batidaAgua = 0; }
  if (F.batida) { const b = F.batida; Som.batida(b.forca); tremor = Math.min(.6, b.forca * .05); if (b.tipo === 'arvore') MUNDO.arvores.sacudir(b.i, b.forca, -b.nx, -b.nz); for (let k = 0; k < 6; k++) poeira.soltar(F.x - b.nx * 1.2, F.y + .6, F.z - b.nz * 1.2, b.nx * 2, b.nz * 2, 2.2, 1.6); }
  tremor = Math.max(0, tremor - dt * 1.5);
}

/* ---------- corrida: marcos, chegada, ficar longe da estrada ---------- */
function corrida(dt) {
  const e = MUNDO.perto(F.x, F.z);
  if (estado === 'correndo') {
    relogio += dt; $('relogio').textContent = tempoTxt(relogio);
    if (e && e.d < 16 && e.i > progresso && e.i - progresso < 120) progresso = e.i;   // avança só pela estrada, sem pular trechos
    {
      while (proxMarco < MUNDO.marcos.length && progresso >= MUNDO.marcos[proxMarco]) {
        const pt = MUNDO.portais.find(p => p.i === MUNDO.marcos[proxMarco]); for (const m of pt.pano) m.material.color.set('#f2c76a');
        $('marcos').children[proxMarco].classList.add('ok'); proxMarco++; Som.marco();
      }
      if (proxMarco === MUNDO.marcos.length && progresso >= MUNDO.fim) chegou();
    }
  }
  if (estado === 'livre' && e && e.i >= MUNDO.fim && e.d < 14) { aviso('de volta ao começo', 2000); $('veu').classList.add('ver'); estado = 'pausa'; setTimeout(() => { F.colocar(MUNDO.largada()); mirar(0, true); marcas.limpar(); estado = 'livre'; $('veu').classList.remove('ver'); }, 650); }
  // muito longe da estrada: avisa e, se continuar, volta sozinho
  if ((estado === 'correndo' || estado === 'livre') && longe >= 0) {
    // parado com o acelerador apertado (preso numa pedra ou árvore) também conta
    if (ent.gas && Math.abs(F.vf) < .8 && (!e || e.d > LARGURA / 2)) preso += dt; else preso = 0;
    if (preso > 3.5) { preso = 0; voltarEstrada(); }
    if (!e || e.d > 28) { longe += dt; if (longe > 1.5 && longe - dt <= 1.5) aviso(Som.pequeno ? 'longe da estrada' : 'longe da estrada · R volta', 3000); if (longe > 6) voltarEstrada(); } else longe = 0;
  } else if (longe < 0) longe = 0;
  if (estado === 'fim' && aoFim > 0) { aoFim -= dt; if (aoFim <= 0) $('fim').hidden = false; }
}

/* ---------- quadro a quadro ---------- */
let t0 = 0, T = 0, primeiro = 2;
function passo(dt) {
  T += dt; lerEntrada(); if (!MUNDO) return;
  F.passo(dt, ent); efeitos(dt); corrida(dt); drift(dt); fantasmaQuadro(); poeira.quadro(dt); MUNDO.arvores.quadro(dt); mirar(dt);
  const escala = innerHeight / (2 * Math.tan(cam.fov * Math.PI / 360));
  clima.quadro(T, Cam.alvo, escala * .24); poeira.malha.material.uniforms.uEscala.value = escala * .2;
  Som.carro({ rpm: F.rpm, carga: F.carga, vel: Math.abs(F.vf), derrapa: F.derrapa, superficie: F.superficie });
}
function quadro(t) { requestAnimationFrame(quadro); const dt = Math.min(.05, (t - t0) / 1000 || .016); t0 = t; passo(dt); R.render(cena, cam); if (primeiro > 0 && !--primeiro) tela.classList.add('pronta'); }
medir(); construir(etapa); mirar(0, true); mostrarInicio(); requestAnimationFrame(quadro);
addEventListener('resize', medir); addEventListener('orientationchange', () => setTimeout(medir, 200));
tela.addEventListener('webglcontextlost', e => e.preventDefault()); tela.addEventListener('webglcontextrestored', () => { primeiro = 2; });
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__dustline = { THREE, R, cena, cam, F, Som, ent, teclas, toque, ETAPAS, passo, comecar, irInicio, voltarEstrada, construir, salvo,
  drift: D, fantasma, carro, get modo() { return modo; }, get mundo() { return MUNDO; }, get estado() { return estado; }, get relogio() { return relogio; }, get proxMarco() { return proxMarco; }, get etapa() { return etapa; } };
