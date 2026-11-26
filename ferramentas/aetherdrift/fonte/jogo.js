/* =====================================================================
   JOGO — liga tudo: desenho 3D, câmera, controles (teclado, mouse,
   toque), interface, fases, progresso salvo e laço principal.
   ===================================================================== */
const $ = s => document.querySelector(s);
const tela = $('#tela');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#semgl').hidden = false; $('#abertura').hidden = true; return; }
const ehToque = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, ehToque ? 1.5 : 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.94;

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1500);
cena.fog = new THREE.Fog('#f7e7d3', 150, 660);
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1.5); cena.add(hemi);
const sol = new THREE.DirectionalLight('#ffffff', 2.7); sol.castShadow = true;
sol.shadow.mapSize.set(ehToque ? 1024 : 2048, ehToque ? 1024 : 2048);
Object.assign(sol.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 330 });
sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06;
cena.add(sol, sol.target);
const solDir = new THREE.Vector3(0.5, 0.6, 0.4).normalize();
const ceu = criarCeu(); cena.add(ceu);
const agua = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshPhongMaterial({ color: '#88d9cf', specular: '#fff3d6', shininess: 70, transparent: true, opacity: 0.86 }));
agua.rotation.x = -Math.PI / 2; agua.position.y = NIVEL_AGUA; agua.receiveShadow = true; cena.add(agua);
const polen = criarPolen(cena), efeitos = new Efeitos(cena), jog = new Jogador(cena);

let raizFase = null, fase = null, iFase = -1, nuvens = [], modoTela = 'abertura', tempo = 0;
const estado = { elos: {}, concluida: false, dicas: new Set(), jogou: new Set() };
let progresso = { feitas: {} };
try { progresso = JSON.parse(localStorage.getItem('aetherdrift-progresso')) || progresso; } catch (e) {}
const salvar = () => { try { localStorage.setItem('aetherdrift-progresso', JSON.stringify(progresso)); } catch (e) {} };

// ---------- clima e fases ----------
function aplicarClima(c) {
  const u = ceu.material.uniforms;
  u.topo.value.set(c.ceuTopo); u.horiz.value.set(c.ceuHoriz); u.baixo.value.set(c.ceuBaixo); u.solCor.value.set(c.solCor);
  solDir.set(...c.solDir).normalize(); u.solDir.value.copy(solDir);
  cena.fog.color.set(c.nevoa); cena.fog.near = c.perto; cena.fog.far = c.longe; renderer.setClearColor(c.nevoa);
  hemi.color.set(c.hemiCeu); hemi.groundColor.set(c.hemiChao); hemi.intensity = c.hemiInt;
  sol.color.set(c.solLuz); sol.intensity = c.solInt; agua.material.color.set(c.agua);
}
function carregarFase(i) {
  if (raizFase) { cena.remove(raizFase); descartar(raizFase); }
  SUP.length = 0; raizFase = new THREE.Group(); cena.add(raizFase);
  const def = FASES[i], clima = CLIMAS[def.clima]; iFase = i; aplicarClima(clima);
  estado.elos = {}; estado.concluida = false; estado.dicas = new Set();
  fase = def.construir({ raiz: raizFase, ef: efeitos, elo: acenderElo, aviso, jog, clima });
  semear(i * 977 + 13); nuvens = criarNuvens(raizFase, 18); criarMontanhasDistantes(raizFase, clima.montanhas);
  jog.colocar(fase.inicio.x, fase.inicio.z, fase.inicio.yaw);
  camYaw = fase.inicio.yaw + Math.PI; alvoCam.set(jog.pos.x, jog.pos.y + 1.5, jog.pos.z);
  $('#nomeFase').textContent = def.nome;
  $('#elos').innerHTML = def.elos.map(e => `<span class="elo" data-elo="${e.id}"><i></i>${e.nome}</span>`).join('');
}
function acenderElo(nome) {
  if (estado.elos[nome]) return;
  estado.elos[nome] = true;
  const def = FASES[iFase], e = def.elos.find(x => x.id === nome), f = fase.farois[nome];
  if (f) { f.acender(); efeitos.explodir(f.m.position.x, f.m.position.y - 83, f.m.position.z, '#ffd27a', 90, 7); }
  fase.portal.acender(nome); Som.elo();
  const chip = document.querySelector(`.elo[data-elo="${nome}"]`); if (chip) chip.classList.add('on');
  const faltam = def.elos.filter(x => !estado.elos[x.id]).length;
  if (faltam) aviso(`Elo ${e.nome} aceso ✦ Falta${faltam > 1 ? 'm' : ''} ${faltam}.`, 3.5);
  else {
    aviso(`Elo ${e.nome} aceso ✦`, 2.4);
    setTimeout(() => { fase.portal.abrir(); Som.portal(); aviso('Os três elos brilham! O portal no terraço do morro se abriu.', 5); }, 1500);
  }
}
function concluir() {
  estado.concluida = true;
  const def = FASES[iFase], prox = FASES[iFase + 1];
  progresso.feitas[def.id] = true; salvar();
  Som.portal(); efeitos.explodir(jog.pos.x, jog.pos.y + 2, jog.pos.z, '#ffe0a0', 120, 8);
  $('#cTitulo').textContent = `${def.nome} concluída`;
  $('#cTexto').textContent = prox ? (prox.pronta ? `A próxima fase, ${prox.nome}, está aberta.` : `A próxima fase, ${prox.nome}, chega na próxima etapa de construção. Enquanto isso, o vale continua todo seu.`) : 'Você completou todas as fases!';
  setTimeout(() => { modoTela = 'painel'; $('#hud').hidden = true; $('#concluida').hidden = false; }, 900);
}

// ---------- telas ----------
function montarCartoes() {
  $('#cartoes').innerHTML = '';
  FASES.forEach((f, i) => {
    const aberta = i === 0 || progresso.feitas[FASES[i - 1].id], ok = f.pronta && aberta, feita = progresso.feitas[f.id];
    const b = document.createElement('button'); b.className = 'cartao' + (ok ? '' : ' fechada') + (feita ? ' feita' : ''); b.setAttribute('role', 'listitem');
    const estadoTxt = feita ? 'concluída ✦' : ok ? (i === iFase && estado.jogou.has(i) ? 'continuar' : 'jogar') : !f.pronta ? 'em breve' : 'bloqueada';
    b.innerHTML = `<span class="num" style="background:${f.cor}">${i + 1}</span><span class="txt"><span class="nome">${f.nome}</span><span class="det">${f.det}</span></span><span class="estado">${estadoTxt}</span>`;
    if (ok) b.onclick = () => { Som.clique(); jogar(i); };
    $('#cartoes').appendChild(b);
  });
}
function abrirFases() { modoTela = 'fases'; montarCartoes(); $('#fases').hidden = false; $('#hud').hidden = true; $('#concluida').hidden = true; $('#abertura').hidden = true; $('#volume').hidden = true; }
function jogar(i) {
  if (i !== iFase) carregarFase(i);
  $('#fases').hidden = true; $('#hud').hidden = false; modoTela = 'jogo'; atualizarModos(); atualizarAjuda();
  if (!estado.jogou.has(i)) {
    estado.jogou.add(i);
    aviso(`Bem-vindo ao ${FASES[i].nome} ☀`, 3);
    aviso('Acenda os três elos: Luz, Vento e Céu. Os feixes de luz no horizonte mostram onde.', 6);
  }
}
$('#bComecar').onclick = () => { Som.iniciar(); Som.clique(); abrirFases(); };
$('#bMenu').onclick = () => { Som.clique(); abrirFases(); };
$('#bExplorar').onclick = () => { $('#concluida').hidden = true; $('#hud').hidden = false; modoTela = 'jogo'; };
$('#bOutras').onclick = () => abrirFases();

// ---------- avisos (um por vez, em fila) ----------
const fila = []; let avisando = false;
function aviso(txt, seg = 3.5) { if (fila.length > 3) fila.shift(); fila.push([txt, seg]); if (!avisando) proximoAviso(); }
function proximoAviso() {
  const a = fila.shift(), el = $('#aviso'); if (!a) { avisando = false; return; }
  avisando = true; el.textContent = a[0]; el.classList.add('on');
  setTimeout(() => { el.classList.remove('on'); setTimeout(proximoAviso, 480); }, a[1] * 1000);
}

// ---------- formas ----------
const AJUDA = {
  andar: 'WASD ou setas andam · espaço pula · arraste para olhar · 1 2 3 trocam a forma',
  carro: 'W acelera · S freia · A D viram · passe pelos arcos de brisa · 1 sai do carro',
  voo: 'A D fazem curva · W mergulha (mais veloz) · S puxa para cima · correntes de ar sobem',
};
function atualizarModos() {
  document.querySelectorAll('#modos button').forEach(b => {
    b.setAttribute('aria-checked', b.dataset.modo === jog.modo);
    b.classList.toggle('bloq', b.dataset.modo === 'carro' && !jog.noChao && jog.modo !== 'carro');
  });
}
function atualizarAjuda() { $('#ajuda').textContent = AJUDA[jog.modo]; }
function pedirModo(m) {
  const r = jog.trocar(m);
  if (r === 'semChao') aviso('O carro precisa de chão firme.', 2);
}
jog.aoTrocar = (m) => {
  atualizarModos(); atualizarAjuda();
  const cor = m === 'voo' ? '#fff3cf' : m === 'carro' ? '#bff0da' : '#ffe0c0';
  efeitos.explodir(jog.pos.x, jog.pos.y + 1, jog.pos.z, cor, 26, 3.5);
};
jog.aoMergulho = on => $('#veu').classList.toggle('on', on);
jog.aoRampa = () => efeitos.explodir(jog.pos.x, jog.pos.y + 0.5, jog.pos.z, '#c8f5e0', 30, 4);
document.querySelectorAll('#modos button').forEach(b => b.addEventListener('click', () => { pedirModo(b.dataset.modo); }));

// ---------- som ----------
function atualizarSomUI() { $('#bSom').classList.toggle('mudo', Som.mudo); $('#rVolume').value = Som.mudo ? 0 : Math.round(Som.volume * 100); $('#bMudo').textContent = Som.mudo ? 'ligar som' : 'sem som'; }
$('#bSom').onclick = () => { Som.iniciar(); $('#volume').hidden = !$('#volume').hidden; atualizarSomUI(); };
$('#rVolume').oninput = e => { Som.definirVolume(e.target.value / 100); atualizarSomUI(); };
$('#bMudo').onclick = () => { Som.alternarMudo(); atualizarSomUI(); };
atualizarSomUI();

// ---------- teclado ----------
const teclas = new Set(); let puloPend = false;
addEventListener('keydown', ev => {
  if (modoTela !== 'jogo') { if ((ev.code === 'Enter' || ev.code === 'Space') && modoTela === 'abertura') $('#bComecar').click(); return; }
  const k = ev.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) ev.preventDefault();
  teclas.add(k);
  if (ev.repeat) return;
  Som.iniciar();
  if (k === 'Space') puloPend = true;
  if (k === 'Digit1' || k === 'Numpad1') pedirModo('andar');
  if (k === 'Digit2' || k === 'Numpad2') pedirModo('carro');
  if (k === 'Digit3' || k === 'Numpad3') pedirModo('voo');
  if (k === 'KeyQ') pedirModo({ andar: 'carro', carro: 'voo', voo: 'andar' }[jog.modo]);
  if (k === 'KeyE' || k === 'Enter') interagir();
  if (k === 'KeyM') { Som.alternarMudo(); atualizarSomUI(); }
  if (k === 'Escape') abrirFases();
});
addEventListener('keyup', ev => teclas.delete(ev.code));
addEventListener('blur', () => teclas.clear());
const tem = (...ks) => ks.some(k => teclas.has(k));

// ---------- mouse e toque: arrastar gira a câmera, tocar gira peças ----------
let camYaw = 0, camPitch = 0.34, camDist = 9, zoom = 1, ultimoArrasto = -1e9;
const alvoCam = new THREE.Vector3(), ponteiros = new Map(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function ligarToque() { document.body.classList.add('toque'); }
if (ehToque) ligarToque();
tela.addEventListener('pointerdown', ev => {
  if (ev.pointerType === 'touch') ligarToque();
  Som.iniciar();
  try { tela.setPointerCapture(ev.pointerId); } catch (e) {}
  ponteiros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, t0: performance.now(), moveu: 0 });
});
tela.addEventListener('pointermove', ev => {
  const p = ponteiros.get(ev.pointerId); if (!p) return;
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY; p.moveu += Math.abs(dx) + Math.abs(dy);
  if (p.moveu > 6 && modoTela === 'jogo') { camYaw -= dx * 0.0055; camPitch = lim(camPitch + dy * 0.004, 0.02, 1.25); ultimoArrasto = performance.now(); }
});
const soltar = (ev, valeClique) => {
  const p = ponteiros.get(ev.pointerId); if (!p) return; ponteiros.delete(ev.pointerId);
  if (valeClique && p.moveu <= 8 && performance.now() - p.t0 < 450) clicar(ev.clientX, ev.clientY);
};
tela.addEventListener('pointerup', ev => soltar(ev, true));
tela.addEventListener('pointercancel', ev => soltar(ev, false));
tela.addEventListener('wheel', ev => { zoom = lim(zoom * (ev.deltaY > 0 ? 1.08 : 0.93), 0.55, 1.9); ev.preventDefault(); }, { passive: false });
tela.addEventListener('contextmenu', ev => ev.preventDefault());

function clicar(x, y) {
  if (modoTela !== 'jogo' || !fase.clicaveis) return;
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(fase.clicaveis, false)[0]; if (!hit) return;
  const { peca, grade } = hit.object.userData; if (!peca) return;
  if (jog.pos.distanceTo(grade.g.position) > 26) { aviso('Chegue mais perto das peças.', 2); return; }
  grade.girar(peca);
}
function interagir() {
  const g = fase && fase.grade; if (!g) return;
  if (Math.abs(jog.pos.y - g.o.y - 0.36) > 1.2) return;
  const p = g.pecaEm(jog.pos.x, jog.pos.z); if (p) g.girar(p);
}

// joystick virtual (lado esquerdo) e botão de pulo
const joyEl = $('#joy'), joyBase = $('#joyBase'), joyPino = $('#joyPino'), joyV = { x: 0, y: 0 }; let joyId = null, joyC = null;
joyEl.addEventListener('pointerdown', ev => {
  Som.iniciar(); joyId = ev.pointerId; try { joyEl.setPointerCapture(joyId); } catch (e) {}
  const r = joyEl.getBoundingClientRect();
  joyBase.style.left = (ev.clientX - r.left - 60) + 'px'; joyBase.style.bottom = (r.bottom - ev.clientY - 60) + 'px'; joyBase.style.opacity = 1;
  joyC = { x: ev.clientX, y: ev.clientY }; ev.preventDefault();
});
joyEl.addEventListener('pointermove', ev => {
  if (ev.pointerId !== joyId) return;
  let dx = ev.clientX - joyC.x, dy = ev.clientY - joyC.y; const l = Math.hypot(dx, dy), M = 50;
  if (l > M) { dx *= M / l; dy *= M / l; }
  joyV.x = dx / M; joyV.y = -dy / M; joyPino.style.transform = `translate(${dx}px,${dy}px)`;
});
const joyFim = ev => { if (ev.pointerId !== joyId) return; joyId = null; joyV.x = joyV.y = 0; joyPino.style.transform = ''; joyBase.style.left = joyBase.style.bottom = joyBase.style.opacity = ''; };
joyEl.addEventListener('pointerup', joyFim); joyEl.addEventListener('pointercancel', joyFim);
$('#bPulo').addEventListener('pointerdown', ev => { ev.preventDefault(); Som.iniciar(); puloPend = true; });

function entrada() {
  let x = 0, y = 0;
  if (tem('KeyA', 'ArrowLeft')) x -= 1; if (tem('KeyD', 'ArrowRight')) x += 1;
  if (tem('KeyW', 'ArrowUp')) y += 1; if (tem('KeyS', 'ArrowDown')) y -= 1;
  x = lim(x + joyV.x, -1, 1); y = lim(y + joyV.y, -1, 1);
  const e = { x, y, pulo: puloPend }; puloPend = false; return e;
}

// ---------- câmera ----------
const DIST = { andar: 9, carro: 12.5, voo: 15 };
function atualizarCamera(dt) {
  camDist += (DIST[jog.modo] * zoom - camDist) * (1 - Math.exp(-3 * dt));
  const livre = performance.now() - ultimoArrasto > 1600;
  if (jog.modo !== 'andar' && livre) {        // no carro e no voo, a câmera volta sozinha para trás
    camYaw = angLerp(camYaw, jog.yaw + Math.PI, 1 - Math.exp(-(jog.modo === 'voo' ? 1.5 : 2.2) * dt));
    camPitch += ((jog.modo === 'voo' ? 0.4 : 0.3) - camPitch) * (1 - Math.exp(-0.8 * dt));
  }
  const frente = jog.modo === 'andar' ? 0 : 3;
  const tx = jog.pos.x + Math.sin(jog.yaw) * frente, tz = jog.pos.z + Math.cos(jog.yaw) * frente, ty = jog.pos.y + 1.6;
  const k = 1 - Math.exp(-9 * dt);
  alvoCam.x += (tx - alvoCam.x) * k; alvoCam.z += (tz - alvoCam.z) * k; alvoCam.y += (ty - alvoCam.y) * (1 - Math.exp(-6 * dt));
  const cp = Math.cos(camPitch);
  camera.position.set(alvoCam.x + Math.sin(camYaw) * cp * camDist, alvoCam.y + Math.sin(camPitch) * camDist, alvoCam.z + Math.cos(camYaw) * cp * camDist);
  const hc = Math.max(alturaTerreno(camera.position.x, camera.position.z), NIVEL_AGUA) + 1.1;
  if (camera.position.y < hc) camera.position.y = hc;
  camera.lookAt(alvoCam);
}
function cameraVitrine(t) {   // abertura e painéis: volta lenta e alta pelo vale
  const a = t * 0.04 + 0.6, c = modoTela === 'abertura' || !fase ? { x: -20, y: 6, z: 20 } : jog.pos;
  camera.position.set(c.x + Math.sin(a) * 110, (c.y || 0) + 48, c.z + Math.cos(a) * 110);
  camera.lookAt(c.x, (c.y || 0) + 4, c.z);
}

// ---------- tamanho da tela ----------
function ajustar() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 70 : 55; camera.updateProjectionMatrix();
}
addEventListener('resize', ajustar); ajustar();

// ---------- laço principal ----------
const relogio = new THREE.Clock(), jogFalso = { pos: new THREE.Vector3(0, -999, 0), modo: 'nada', termica: 0 };
function dicasPorPerto() {
  for (const d of fase.dicas) {
    const id = d.texto; if (estado.dicas.has(id)) continue;
    if (d.modo && d.modo !== jog.modo) continue;
    if (d.antes && fase.portal.aberto) continue;
    if (d.y !== undefined && Math.abs(jog.pos.y - d.y) > 2) continue;
    if (Math.hypot(jog.pos.x - d.x, jog.pos.z - d.z) < d.r) { estado.dicas.add(id); aviso(d.texto, 5.5); }
  }
}
function quadro() {
  requestAnimationFrame(quadro);
  const dt = Math.min(relogio.getDelta(), 0.05); tempo += dt;
  if (fase) {
    if (modoTela === 'jogo') {
      const e = entrada();
      jog.termica = 0;
      fase.atualizar(dt, jog, tempo);                  // elevador e térmicas antes do jogador
      jog.atualizar(dt, e, camYaw);
      atualizarCamera(dt);
      dicasPorPerto();
      if (!estado.concluida && fase.portal.dentro(jog)) concluir();
      atualizarModos();
      Som.atualizar(jog.modo, jog.velocidade);
    } else {
      fase.atualizar(dt, jogFalso, tempo);
      cameraVitrine(tempo);
      Som.atualizar('andar', 0);
    }
    for (const n of nuvens) { n.position.x += n.userData.v * dt; if (n.position.x > 420) n.position.x = -420; }
  }
  // sol acompanha a câmera para as sombras ficarem sempre por perto
  const foco = modoTela === 'jogo' ? alvoCam : camera.position;
  sol.position.copy(foco).addScaledVector(solDir, 150); sol.target.position.copy(foco); sol.target.updateMatrixWorld();
  ceu.position.copy(camera.position);
  polen.atualizar(dt, tempo, camera);
  efeitos.atualizar(dt);
  renderer.render(cena, camera);
}
carregarFase(0);
quadro();
// para testes automáticos (não muda nada no jogo)
window.__ad = { jog, get fase() { return fase; }, estado, acenderElo, jogar, pedirModo, get modoTela() { return modoTela; }, camera, set camYaw(v) { camYaw = v; } };
