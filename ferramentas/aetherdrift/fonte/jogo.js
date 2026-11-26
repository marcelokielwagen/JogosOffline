/* =====================================================================
   JOGO — liga tudo: desenho 3D, câmera, controles (teclado, mouse,
   toque), telas, voos, progresso salvo e laço principal.
   ===================================================================== */
const $ = s => document.querySelector(s);
const tela = $('#tela');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#semgl').hidden = false; $('#abertura').hidden = true; return; }
const ehToque = matchMedia('(pointer: coarse)').matches;
const Q = ehToque ? { seg: 300, arvores: 9000, pedras: 1600, flores: 16000, sombra: 1024, px: 1.5 } : { seg: 400, arvores: 19000, pedras: 3200, flores: 40000, sombra: 2048, px: 1.75 };
renderer.setPixelRatio(Math.min(devicePixelRatio, Q.px));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.96;

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 1.5, 6500);
cena.fog = new THREE.Fog('#f3e8d8', 380, 2300);
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1.5); cena.add(hemi);
const sol = new THREE.DirectionalLight('#ffffff', 2.6); sol.castShadow = true;
sol.shadow.mapSize.set(Q.sombra, Q.sombra);
Object.assign(sol.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, near: 10, far: 1400 });
sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.5;
cena.add(sol, sol.target);
const solDir = new THREE.Vector3(0.5, 0.6, 0.4).normalize();
const ceu = criarCeu(); cena.add(ceu);
const plan = new Planador(cena);

let raiz = null, voo = null, iVoo = -1, nuvens = null, passaros = null, agua = null, modoTela = 'abertura', tempo = 0;
const estado = { cume: 1, arcos: 0, lugares: 0, concluido: false, piloto: false, kRota: 0, saltou: false };
let progresso = {};
try { progresso = JSON.parse(localStorage.getItem('aetherdrift-voos')) || {}; } catch (e) {}
const salvar = () => { try { localStorage.setItem('aetherdrift-voos', JSON.stringify(progresso)); } catch (e) {} };

// ---------- carregar um voo ----------
function aplicarClima(d) {
  const u = ceu.material.uniforms;
  u.topo.value.set(d.ceu.topo); u.horiz.value.set(d.ceu.horiz); u.baixo.value.set(d.ceu.baixo); u.solCor.value.set(d.ceu.solCor);
  solDir.set(...d.ceu.sol).normalize(); u.solDir.value.copy(solDir);
  cena.fog.color.set(d.fog.cor); cena.fog.near = d.fog.perto; cena.fog.far = d.fog.longe; renderer.setClearColor(d.fog.cor);
  U.uFogCor.value.set(d.fog.cor); U.uFogPerto.value = d.fog.perto; U.uFogLonge.value = d.fog.longe;
  U.uNevCor.value.set(d.neblina.cor); U.uNevTopo.value = d.neblina.topo; U.uNevEsp.value = d.neblina.esp; U.uNevForca.value = d.neblina.forca;
  hemi.color.set(d.luz.hemiCeu); hemi.groundColor.set(d.luz.hemiChao); hemi.intensity = d.luz.hemiInt;
  sol.color.set(d.luz.sol); sol.intensity = d.luz.solInt;
}
function carregarVoo(i) {
  if (raiz) { cena.remove(raiz); descartar(raiz); }
  raiz = new THREE.Group(); cena.add(raiz);
  const def = VOOS[i]; iVoo = i; aplicarClima(def);
  semear(def.semente); situarCumes(def); construirRelevo(def, Q.seg);
  semear(def.semente + 5); tracarCascatas(def);
  raiz.add(malhaTerreno(def)); agua = malhaAgua(def); agua.material.uniforms.uSolDir.value.copy(solDir); raiz.add(agua);
  semear(def.semente + 1); plantarVegetacao(raiz, def, Q.arvores);
  espalharPedras(raiz, def, Q.pedras); espalharFlores(raiz, def, Q.flores);
  nuvens = criarNuvens(raiz, def); criarCordilheiras(raiz, def); passaros = criarPassaros(raiz, def);
  voo = construirVoo(def, { raiz }); passaros.nasTermicas(voo.rota.filter(p => p.termica).map(p => p.termica));
  Object.assign(estado, { cume: 1, arcos: 0, lugares: 0, concluido: false, piloto: false, kRota: 1, saltou: false });
  plan.pousar(voo.inicio.x, voo.inicio.y, voo.inicio.z, voo.inicio.yaw);
  voo.cumes[0].feito = true; voo.cumes[1].definirAlvo(true);
  camOrb = voo.inicio.yaw + Math.PI * 0.85;
  $('#nomeFase').textContent = def.nome; atualizarHud(true);
}

// ---------- mundo para o planador ----------
const mundo = {
  piso(x, z, y) {   // chão, água e o topo dos aquedutos (menos o vão central, por onde se passa)
    let p = piso(x, z);
    if (voo && y !== undefined) for (const o of voo.aquedutos) p = Math.max(p, pisoAqueduto(o, x, z, y));
    return p;
  },
  encosta(p) {   // vento que sobe pelas encostas viradas para ele
    if (!voo) return 0;
    const h0 = alturaTerreno(p.x, p.z), gx = (alturaTerreno(p.x + 6, p.z) - h0) / 6, gz = (alturaTerreno(p.x, p.z + 6) - h0) / 6;
    const s = gx * voo.vento.x + gz * voo.vento.y, folga = p.y - Math.max(h0, nivelAgua(p.x, p.z));
    return lim(s, 0, 1.2) * 6 * (1 - suave(15, 110, folga));
  },
};

// ---------- avisos (fila) ----------
const filaAviso = []; let avisoAte = 0;
function aviso(txt, seg = 3.5) { filaAviso.push([txt, seg]); }
function tocarAvisos() {
  if (tempo < avisoAte) return;
  const el = $('#aviso');
  if (!filaAviso.length) { el.classList.remove('on'); return; }
  const [txt, seg] = filaAviso.shift(); el.innerHTML = txt; el.classList.add('on'); avisoAte = tempo + seg;
}

// ---------- HUD ----------
function atualizarHud(tudo) {
  if (!voo) return;
  const c = voo.cumes[estado.cume];
  $('#alvoNome').textContent = estado.concluido ? 'Voo livre' : c ? c.nome : '';
  $('#cntArcos').textContent = `${estado.arcos}/${voo.arcos.length}`;
  $('#cntLugares').textContent = `${estado.lugares}/${voo.lugares.length}`;
  $('#cntCumes').textContent = `${estado.cume - 1 + (estado.concluido ? 1 : 0)}/${voo.cumes.length - 1}`;
  if (tudo) $('#bPiloto').classList.toggle('on', estado.piloto);
}
const seta = $('#seta'), alvoDist = $('#alvoDist');
function atualizarSeta() {
  const c = voo && voo.cumes[estado.cume];
  if (!c || estado.concluido) { seta.style.opacity = 0; alvoDist.textContent = ''; return; }
  const dx = c.centro.x - plan.pos.x, dz = c.centro.z - plan.pos.z, d = Math.hypot(dx, dz);
  const ang = Math.atan2(-dx, -dz), rel = angDif(camYawAtual, ang);
  seta.style.opacity = 1; seta.style.transform = `rotate(${-rel}rad)`;
  alvoDist.textContent = d > 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(d / 10) * 10 + ' m';
}

// ---------- câmera ----------
let camOrb = 0, camDist = 13, arrasto = null, orbYaw = 0, orbPitch = 0, ultArrasto = -9, camYawAtual = 0;
const alvoCam = new THREE.Vector3(), camPos = new THREE.Vector3(), tmpV = new THREE.Vector3();
function atualizarCamera(dt) {
  if (modoTela !== 'jogo' && voo) {   // abertura e painéis: passeio lento em volta do primeiro aqueduto
    const aq = voo.aquedutos[0], l = aq ? { x: aq.x, z: aq.z, y: aq.rio.L } : voo.lugares.find(x => x.tipo === 'cachoeira'); camOrb += dt * 0.025;
    tmpV.set(l.x + Math.sin(camOrb) * 190, 0, l.z + Math.cos(camOrb) * 190); tmpV.y = Math.max(l.y + 110, piso(tmpV.x, tmpV.z) + 45);
    camera.position.copy(tmpV); alvoCam.set(l.x - Math.sin(camOrb) * 60, l.y + 10, l.z - Math.cos(camOrb) * 60); camera.lookAt(alvoCam);
    camera.fov = 58; camera.updateProjectionMatrix(); camYawAtual = camOrb + Math.PI; return;
  }
  if (plan.estado === 'pousado') {
    const jogo = modoTela === 'jogo';
    camOrb += dt * (jogo ? 0.08 : 0.05);
    const d = jogo ? 30 : 64, a = camOrb + orbYaw;
    tmpV.set(plan.pos.x + Math.sin(a) * d, plan.pos.y + (jogo ? 8 : 20) + orbPitch * 20, plan.pos.z + Math.cos(a) * d);
    if (camPos.lengthSq() < 1) camPos.copy(tmpV); else camPos.lerp(tmpV, 1 - Math.exp(-dt * 2));
    camera.position.copy(camPos);
    alvoCam.set(plan.pos.x - Math.sin(a) * (jogo ? 30 : 60), plan.pos.y - (jogo ? 6 : 24), plan.pos.z - Math.cos(a) * (jogo ? 30 : 60));
    camera.lookAt(alvoCam); camYawAtual = a + Math.PI;
    camera.fov += (58 - camera.fov) * Math.min(1, dt * 2); camera.updateProjectionMatrix();
    return;
  }
  const dist = camDist * (innerWidth < innerHeight ? 1.5 : 1);
  if (tempo - ultArrasto > 1.6 && !arrasto) { orbYaw *= Math.exp(-dt * 1.5); orbPitch *= Math.exp(-dt * 1.5); }
  const y = plan.yaw + orbYaw, el = 0.3 + orbPitch;
  tmpV.set(plan.pos.x + Math.sin(y) * dist * Math.cos(el), plan.pos.y + dist * Math.sin(el) + 2.2, plan.pos.z + Math.cos(y) * dist * Math.cos(el));
  const minY = piso(tmpV.x, tmpV.z) + 3; if (tmpV.y < minY) tmpV.y = minY;
  camPos.lerp(tmpV, 1 - Math.exp(-dt * 3.2));
  camera.position.copy(camPos);
  const f = plan.frente; alvoCam.set(plan.pos.x + f.x * 10, plan.pos.y + f.y * 6 + 1.2, plan.pos.z + f.z * 10);
  camera.lookAt(alvoCam); camera.rotateZ(plan.roll * 0.22);
  camYawAtual = Math.atan2(-(plan.pos.x - camera.position.x), -(plan.pos.z - camera.position.z));
  const fov = 58 + suave(18, 45, plan.v) * 12; camera.fov += (fov - camera.fov) * Math.min(1, dt * 2); camera.updateProjectionMatrix();
}

// ---------- controles ----------
const teclas = new Set();
let joy = null, soproToque = false;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); teclas.add(k);
  if (modoTela !== 'jogo') return;
  if (k === ' ' || k === 'enter') { if (plan.estado === 'pousado') saltar(); e.preventDefault(); }
  if (k === 'v') alternarPiloto();
  if (k === 'm') { Som.alternarMudo(); sincronizarSom(); }
  if (k === 'escape') abrirVoos();
});
addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
addEventListener('blur', () => teclas.clear());
const tecla = (...ks) => ks.some(k => teclas.has(k));
function lerEntrada() {
  let x = 0, y = 0;
  if (tecla('a', 'arrowleft')) x -= 1; if (tecla('d', 'arrowright')) x += 1;
  if (tecla('w', 'arrowup')) y += 1; if (tecla('s', 'arrowdown')) y -= 1;
  if (joy) { x += joy.x; y += joy.y; }
  return { x: lim(x, -1, 1), y: lim(y, -1, 1), sopro: tecla(' ') || soproToque };
}
// arrastar na tela gira a câmera (olhar em volta)
tela.addEventListener('pointerdown', e => { if (modoTela !== 'jogo') return; arrasto = { x: e.clientX, y: e.clientY, id: e.pointerId }; tela.setPointerCapture(e.pointerId); });
tela.addEventListener('pointermove', e => {
  if (!arrasto || e.pointerId !== arrasto.id) return;
  orbYaw -= (e.clientX - arrasto.x) * 0.006; orbPitch = lim(orbPitch + (e.clientY - arrasto.y) * 0.004, -0.3, 0.9);
  arrasto.x = e.clientX; arrasto.y = e.clientY; ultArrasto = tempo;
});
const soltar = e => { if (arrasto && e.pointerId === arrasto.id) { arrasto = null; ultArrasto = tempo; } };
tela.addEventListener('pointerup', soltar); tela.addEventListener('pointercancel', soltar);
tela.addEventListener('wheel', e => { camDist = lim(camDist + Math.sign(e.deltaY) * 2, 9, 40); e.preventDefault(); }, { passive: false });
// joystick de toque
const joyEl = $('#joy'), joyBase = $('#joyBase'), joyPino = $('#joyPino');
joyEl.addEventListener('pointerdown', e => {
  joy = { id: e.pointerId, cx: e.clientX, cy: e.clientY, x: 0, y: 0 }; joyEl.setPointerCapture(e.pointerId);
  const r = joyEl.getBoundingClientRect(); joyBase.style.left = (e.clientX - r.left - 60) + 'px'; joyBase.style.top = (e.clientY - r.top - 60) + 'px'; joyBase.style.bottom = 'auto'; joyBase.style.opacity = 1;
});
joyEl.addEventListener('pointermove', e => {
  if (!joy || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; }
  joy.x = dx / m; joy.y = -dy / m; joyPino.style.transform = `translate(${dx}px, ${dy}px)`;
});
const soltarJoy = e => { if (joy && e.pointerId === joy.id) { joy = null; joyPino.style.transform = ''; joyBase.style.opacity = 0.7; } };
joyEl.addEventListener('pointerup', soltarJoy); joyEl.addEventListener('pointercancel', soltarJoy);
const bSopro = $('#bSopro');
bSopro.addEventListener('pointerdown', e => { e.preventDefault(); if (plan.estado === 'pousado') saltar(); else soproToque = true; bSopro.classList.add('on'); });
const fimSopro = () => { soproToque = false; bSopro.classList.remove('on'); };
bSopro.addEventListener('pointerup', fimSopro); bSopro.addEventListener('pointercancel', fimSopro); bSopro.addEventListener('pointerleave', fimSopro);
if (ehToque) document.body.classList.add('toque');

// ---------- salto, piloto do vento ----------
function saltar() {
  if (plan.estado !== 'pousado') return;
  plan.saltar(); estado.saltou = true; $('#bSaltar').hidden = true; $('#ajuda').style.opacity = 1;
  aviso('Segure <b>Espaço</b> para subir com o vento · <b>V</b> deixa o vento te levar pelo caminho', 6);
  setTimeout(() => { $('#ajuda').style.opacity = 0; }, 25000);
}
function alternarPiloto(forcar) {
  estado.piloto = forcar !== undefined ? forcar : !estado.piloto;
  if (estado.piloto) {
    if (plan.estado === 'pousado') { saltar(); estado.kRota = 1; }
    else {   // retoma do ponto mais perto, só dentro do trecho atual e sem voltar atrás
      const rota = voo.rota; let fim = rota.findIndex(p => p.cume === estado.cume), m = 1e18, melhor = estado.kRota;
      if (fim < 0) fim = rota.length - 1;
      for (let k = estado.kRota; k <= fim; k++) { const p = rota[k], d = Math.hypot(p.x - plan.pos.x, p.z - plan.pos.z); if (d < m) { m = d; melhor = k; } }
      estado.kRota = melhor;
    }
    aviso('O vento vai te levar pelo caminho ✦ mexa nos controles para voltar a pilotar', 4);
  }
  $('#bPiloto').classList.toggle('on', estado.piloto); Som.clique();
}
function comandoPiloto() {
  const rota = voo.rota, p = rota[estado.kRota];
  if (!p) { estado.piloto = false; $('#bPiloto').classList.remove('on'); return null; }
  const dx = p.x - plan.pos.x, dz = p.z - plan.pos.z, dh = Math.hypot(dx, dz), dy = p.y - plan.pos.y;
  if (p.termica) {
    const T = p.termica;
    if (Math.hypot(plan.pos.x - T.x, plan.pos.z - T.z) < T.r * 0.8) {   // dentro da espiral: deixa ela subir
      if (plan.pos.y > T.topo - 22) estado.kRota++;
      return { solto: true };
    }
  } else {
    const q = rota[estado.kRota + 1], passou = q && p.cume === undefined && ((plan.pos.x - p.x) * (q.x - p.x) + (plan.pos.z - p.z) * (q.z - p.z)) > 0;
    if (dh < (p.cume !== undefined ? 16 : 10) || passou || (p.cume !== undefined && p.cume < estado.cume)) { estado.kRota++; return comandoPiloto(); }
  }
  return { yaw: Math.atan2(-dx, -dz), pitch: lim(Math.atan2(dy, Math.max(dh, 25)) + 0.06, dy < -25 ? -0.68 : -0.45, 0.32), sopro: dy > 10 && !p.termica && dh < 300 };
}

// ---------- eventos do voo ----------
const pAnt = new THREE.Vector3();
function verificar() {
  // arcos de luz
  for (const a of voo.arcos) {
    if (!a.cruzou(pAnt, plan.pos)) continue;
    a.marcar(); estado.arcos++; Som.arco(estado.arcos % 9); plan.v = Math.min(plan.v + 3, 40); plan.vy += 2;
    if (estado.arcos === voo.arcos.length) aviso('Todos os arcos de luz deste vale ✦', 4);
    atualizarHud();
  }
  // lugares para descobrir
  for (const l of voo.lugares) {
    if (l.achado || Math.hypot(plan.pos.x - l.x, plan.pos.z - l.z) > l.raio) continue;
    l.achado = true; estado.lugares++; Som.descoberta();
    aviso(`<b>${l.nome}</b><br><span class="frase">${l.frase}</span>`, 5); atualizarHud();
  }
  // cortinas de água dos aquedutos: atravessar dá um banho de respingos
  for (const o of voo.aquedutos) {
    if (!cruzouCortina(o, pAnt, plan.pos)) continue;
    Som.respingo(); const r = $('#respingo'); r.classList.remove('on'); void r.offsetWidth; r.classList.add('on');
    if (!o.atravessou) { o.atravessou = true; aviso('Você passou por baixo da cachoeira ✦', 3); }
  }
  // espiral de vento
  plan.termica = null;
  for (const T of voo.termicas) { const f = T.em(plan.pos); if (f > 0) { plan.termica = { x: T.x, z: T.z, r: T.r, forca: f }; break; } }
  // coroa do próximo cume
  const c = voo.cumes[estado.cume];
  if (c && !estado.concluido && plan.pos.distanceTo(c.centro) < 26) {
    c.marcar(); Som.cume();
    estado.kRota = Math.max(estado.kRota, voo.rota.findIndex(p => p.cume === estado.cume) + 1);
    if (estado.cume === voo.cumes.length - 1) concluir();
    else { estado.cume++; voo.cumes[estado.cume].definirAlvo(true); aviso(`<b>${c.nome}</b> ✦ agora mergulhe no vale até o ${voo.cumes[estado.cume].nome}`, 5); }
    atualizarHud();
  }
  if (plan.voltando && !estado.avisouBorda) { estado.avisouBorda = true; aviso('O vento te traz de volta para o vale', 3); }
  if (!plan.voltando) estado.avisouBorda = false;
}
function concluir() {
  estado.concluido = true; estado.piloto = false; $('#bPiloto').classList.remove('on');
  const def = VOOS[iVoo], ant = progresso[def.id] || {};
  progresso[def.id] = { feito: true, arcos: Math.max(ant.arcos || 0, estado.arcos), lugares: Math.max(ant.lugares || 0, estado.lugares) }; salvar();
  Som.fim();
  const prox = VOOS[iVoo + 1];
  $('#cTitulo').textContent = def.nome;
  $('#cTexto').innerHTML = `Você chegou aos três cumes ✦<br>Arcos de luz: <b>${estado.arcos} de ${voo.arcos.length}</b> · Lugares: <b>${estado.lugares} de ${voo.lugares.length}</b>` +
    (prox ? `<br><br>Próximo vale: <b>${prox.nome}</b>.` : '<br><br>Você voou por todos os vales. Volte quando quiser, só para passear.');
  $('#bProximo').hidden = !prox;
  setTimeout(() => { modoTela = 'painel'; $('#hud').hidden = true; $('#concluida').hidden = false; }, 1800);
}

// ---------- telas ----------
function montarCartoes() {
  $('#cartoes').innerHTML = VOOS.map((v, i) => {
    const p = progresso[v.id];
    return `<button class="cartao ${p ? 'feita' : ''}" data-i="${i}" role="listitem">
      <span class="num" style="background:${v.cor}">${i + 1}</span>
      <span class="txt"><span class="nome">${v.nome}</span><span class="det">${v.det}</span></span>
      <span class="estado">${p ? '✦ voado' : 'voar'}</span></button>`;
  }).join('');
  $('#cartoes').querySelectorAll('.cartao').forEach(b => b.onclick = () => { Som.clique(); jogar(+b.dataset.i); });
}
function abrirVoos() { modoTela = 'painel'; estado.piloto = false; $('#hud').hidden = true; $('#concluida').hidden = true; $('#abertura').hidden = true; montarCartoes(); $('#fases').hidden = false; }
function jogar(i) {
  $('#fases').hidden = true; $('#concluida').hidden = true; $('#veu').classList.add('on');
  setTimeout(() => {
    if (i !== iVoo || estado.saltou || estado.concluido) carregarVoo(i);
    modoTela = 'jogo'; camPos.set(0, 0, 0); $('#hud').hidden = false; $('#bSaltar').hidden = false; $('#veu').classList.remove('on');
    aviso(`${VOOS[i].ola} ✦ salte do cume quando quiser`, 4);
  }, 80);
}
$('#bComecar').onclick = () => { Som.iniciar(); sincronizarSom(); Som.clique(); abrirVoos(); };
$('#bMenu').onclick = () => { Som.clique(); abrirVoos(); };
$('#bExplorar').onclick = () => { modoTela = 'jogo'; $('#concluida').hidden = true; $('#hud').hidden = false; atualizarHud(); };
$('#bOutras').onclick = () => abrirVoos();
$('#bProximo').onclick = () => jogar(iVoo + 1);
$('#bSaltar').onclick = () => { Som.iniciar(); saltar(); };
$('#bPiloto').onclick = () => alternarPiloto();
// volume
const bSom = $('#bSom'), caixaVol = $('#volume'), rVol = $('#rVolume');
function sincronizarSom() { bSom.classList.toggle('mudo', Som.mudo); rVol.value = Math.round((Som.mudo ? 0 : Som.volume) * 100); }
bSom.onclick = () => { Som.iniciar(); caixaVol.hidden = !caixaVol.hidden; sincronizarSom(); };
rVol.oninput = () => { Som.definirVolume(rVol.value / 100); sincronizarSom(); };
$('#bMudo').onclick = () => { Som.alternarMudo(); sincronizarSom(); };
sincronizarSom();

// ---------- laço ----------
function redimensionar() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', redimensionar); redimensionar();

function passo(dt) {
  tempo += dt; U.uTempo.value = tempo;
  if (modoTela === 'jogo' && voo) {
    let e = lerEntrada();
    if (estado.piloto && (e.x || e.y)) { alternarPiloto(false); aviso('Você está pilotando de novo', 2); }
    if (estado.piloto) { const c = comandoPiloto(); if (c && !c.solto) e = { x: 0, y: 0, sopro: c.sopro, piloto: c }; }
    pAnt.copy(plan.pos);
    plan.atualizar(dt, e, tempo, mundo);
    if (plan.estado === 'voando') verificar();
  } else plan.atualizarModelo(dt, tempo);
  if (voo) {
    const prox = voo.arcos.findIndex(b => !b.feito);
    voo.arcos.forEach((a, i) => a.atualizar(dt, tempo, i === prox));
    voo.cumes.forEach(c => c.atualizar(dt, tempo, plan));
    passaros.atualizar(dt, tempo, plan, modoTela === 'jogo' && plan.estado === 'voando'); voo.barcos.atualizar(dt, tempo);
    nuvens.position.x = ((nuvens.position.x + dt * nuvens.userData.vel + 300) % 600 + 600) % 600 - 300;
    // cachoeira mais perto define o som da água
    let dm = 1e9; for (const l of voo.lugares.filter(l => l.tipo === 'cachoeira').concat(voo.sonsAgua)) dm = Math.min(dm, Math.hypot(camera.position.x - l.x, camera.position.z - l.z, (camera.position.y - l.y) * 0.7));
    Som.cachoeira(modoTela === 'jogo' ? 1 - suave(40, 320, dm) : 0);
  }
  if (window.__vista) { camera.position.copy(window.__vista.p); camera.lookAt(window.__vista.a); } else atualizarCamera(dt);   // __vista: só para fotos de teste
  ceu.position.copy(camera.position);
  sol.target.position.copy(plan.pos); sol.position.copy(plan.pos).addScaledVector(solDir, 700);
  Som.atualizar(plan.estado === 'voando' && modoTela === 'jogo' ? plan.v : 0, plan.sopro, plan.rasante);
  if (modoTela === 'jogo') { tocarAvisos(); atualizarSeta(); }
  renderer.render(cena, camera);
}
let antes = performance.now();
function laco(agora) {
  requestAnimationFrame(laco);
  const dt = Math.min((agora - antes) / 1000, 0.05); antes = agora;
  passo(dt);
}
// fundo da abertura: o primeiro vale, visto girando devagar em volta do cume
carregarVoo(0);
requestAnimationFrame(laco);

// ganchos para testes automáticos
window.__ad = { plan, mundo, voo: () => voo, estado, VOOS, TER, jogar, saltar, alternarPiloto, camera, get modoTela() { return modoTela; }, passo, cena, renderer, orb: v => { orbYaw = v; } };
window.sim = (seg, e = { x: 0, y: 0, sopro: false }) => {
  const n = Math.round(seg * 30);
  for (let i = 0; i < n; i++) {
    let ent = typeof e === 'function' ? e() : e;
    if (estado.piloto) { const c = comandoPiloto(); if (c && !c.solto) ent = { x: 0, y: 0, sopro: c.sopro, piloto: c }; }
    pAnt.copy(plan.pos); tempo += 1 / 30; U.uTempo.value = tempo; plan.atualizar(1 / 30, ent, tempo, mundo); if (plan.estado === 'voando') verificar();
  }
  camPos.copy(plan.pos).add(new THREE.Vector3(Math.sin(plan.yaw) * camDist, 5, Math.cos(plan.yaw) * camDist));
  return { pos: plan.pos.clone(), v: plan.v, estado: { ...estado } };
};
