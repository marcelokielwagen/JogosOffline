/* Jogo: câmera isométrica, gestos (tocar para andar, arrastar peças, espiar), tela inicial e níveis. */
const $ = id => document.getElementById(id), tela = $('tela');
let R; try { R = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' }); } catch (e) { $('semgl').hidden = false; throw e; }
R.outputColorSpace = THREE.LinearSRGBColorSpace; R.toneMapping = THREE.NoToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.shadowMap.autoUpdate = false;
const cena = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 220);
const salvo = Object.assign({ hora: 0, volume: 1, feitos: 0 }, (() => { try { return JSON.parse(localStorage.getItem('hushbell.v1')) || {}; } catch { return {}; } })());
const guardar = () => { try { localStorage.setItem('hushbell.v1', JSON.stringify(salvo)); } catch {} };
salvo.hora = HORAS[salvo.hora] ? salvo.hora : 0; let hora = HORAS[salvo.hora]; aplicarHora(hora, 1); Som.mudarHora(hora.id);

const sol = new THREE.DirectionalLight('#fff', 1); sol.position.set(-.42, 1, .62).multiplyScalar(30); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.radius = 3.5; sol.shadow.bias = -.0006; sol.shadow.normalBias = .03;
Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 16, bottom: -14, near: 1, far: 70 }); cena.add(sol, new THREE.HemisphereLight('#fff', '#fff', .5));
const monumento = criarMonumento(), heroi = criarPersonagem(), longe = criarLonge(), andar = criarAndar(heroi);
const fundo = new THREE.Group(); fundo.add(longe); cena.add(criarCeu(), fundo, monumento.grupo, heroi.grupo);
for (const n of [[-6, -9, 22, 40, 11, .85, 1], [9, -11, 20, 38, 12, .9, 4], [-9, -11.5, -24, 26, 8, .8, 7], [8, -12.5, -24, 30, 9, .9, 2], [0, -16, -26, 60, 13, 1, 9], [13, 4, 24, 22, 5, .42, 5], [-14, 9, 25, 24, 5, .36, 3]]) { const m = criarNevoa(...n); m.userData.base = m.position.clone(); m.userData.s = n[6]; fundo.add(m); }

// nuvens grandes que atravessam o céu bem devagar (e voltam pelo outro lado)
for (const [x, y, fundo2, l, a, f, sem, v] of [[-30, -4, 18, 30, 7, .5, 11, .32], [10, 7, 22, 26, 6, .38, 21, .22], [24, -7, -18, 34, 8, .55, 31, .4], [-12, 12, 26, 22, 5, .3, 41, .18]]) { const m = criarNevoa(x, y, fundo2, l, a, f, sem); m.userData.vento = { x, y, fundo: fundo2, v }; fundo.add(m); }
const poeira = criarPoeira(), brilhos = criarBrilhos(); cena.add(poeira, brilhos);

/* ---------- mundos: a tela inicial (o monumento) e os níveis ---------- */
const casa = new Mundo({ grupo: monumento.grupo, estaticas: monumento.obras, inicio: 'c4,0,1', sinos: monumento.sinos, vista: { centro: naTela(.35, 2.25), alt: 13.2, larg: 7.9 } });
let mundo = casa, nivelAtual = -1, trocando = false, venceu = false;
andar.colocar(casa, casa.no(casa.inicio));

/* ---------- câmera: sempre no ângulo exato da ilusão; arrastar só deixa espiar ---------- */
const AZ = Math.PI / 4, EL = Math.atan(Math.SQRT1_2), Cam = { az: 0, el: 0, vaz: 0, vel: 0, alvoAz: 0, alvoEl: 0, zoom: 1, alvoZoom: 1, intro: 0 };
const girado = new THREE.Quaternion(), isoInv = new THREE.Quaternion();
cam.position.copy(EIXO.olho).multiplyScalar(80); cam.lookAt(0, 0, 0); isoInv.copy(cam.quaternion).invert();
function medir() { const w = innerWidth, h = innerHeight; R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setSize(w, h, false); U.uAspecto.value = w / h; }
function mirar() {
  const v = vistaAgora, centro = v.centro, a = AZ + Cam.az, e = EL + Cam.el, asp = innerWidth / innerHeight, meia = Math.max(v.alt, v.larg / asp) / Cam.zoom;
  cam.left = -meia * asp; cam.right = meia * asp; cam.top = meia; cam.bottom = -meia; cam.updateProjectionMatrix();
  cam.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(80).add(centro); cam.lookAt(centro); cam.updateMatrixWorld();
  // ao espiar, o que está longe acompanha quase todo o giro (senão voaria para fora da tela)
  girado.copy(cam.quaternion).multiply(isoInv); fundo.quaternion.identity().slerp(girado, .9); fundo.position.copy(centro).applyQuaternion(fundo.quaternion).negate().add(centro);
}

/* ---------- gestos ---------- */
const dedos = new Map(); let inicio = null, arrastou = false, pinca = 0, onda = 0, espiou = false, pegou = null;
const raio = new THREE.Raycaster(), v2 = new THREE.Vector2();
const mirarRaio = (x, y) => { v2.set(x / innerWidth * 2 - 1, 1 - y / innerHeight * 2); raio.setFromCamera(v2, cam); };
const alvoEm = (x, y, comHeroi = true) => { mirarRaio(x, y); return raio.intersectObjects(comHeroi ? [mundo.grupo, heroi.grupo] : [mundo.grupo], true)[0]; };
// peça sob o dedo; se errou por pouco, a peça girável mais perto (no toque o dedo cobre bastante coisa)
function pecaEm(x, y, folga) {
  const a = alvoEm(x, y, false); if (a && a.object.userData.peca) return a.object.userData.peca;
  let m = null, md = folga; for (const p of mundo.pecas) { if (p.travada) continue; const q = p.centro.clone().add(mundo.grupo.position).project(cam), d = Math.hypot((q.x + 1) / 2 * innerWidth - x, (1 - q.y) / 2 * innerHeight - y); if (d < md) { md = d; m = p; } }
  return m;
}
let pairar = null, ultPairar = 0;
const distDedos = () => { const [a, b] = [...dedos.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
tela.addEventListener('pointerdown', e => {
  dedos.set(e.pointerId, [e.clientX, e.clientY]); try { tela.setPointerCapture(e.pointerId); } catch {}
  if (dedos.size === 1) { inicio = [e.clientX, e.clientY]; arrastou = false; const pc = !trocando && !venceu && pecaEm(e.clientX, e.clientY, e.pointerType === 'touch' ? 46 : 24); pegou = pc ? { peca: pc } : null; }
  else { arrastou = true; pinca = distDedos(); Cam.alvoAz = Cam.alvoEl = 0; if (pegou && pegou.ativo) soltarPeca(pegou); pegou = null; }
});
tela.addEventListener('pointermove', e => {
  if (!dedos.size && e.pointerType === 'mouse' && performance.now() - ultPairar > 70) {   // mouse parado em cima: mostra o que dá para pegar
    ultPairar = performance.now(); const pc = trocando ? null : pecaEm(e.clientX, e.clientY, 0); pairar = pc && !pc.travada ? pc : null;
    mirarRaio(e.clientX, e.clientY); const a = !pairar && !trocando && alvoEm(e.clientX, e.clientY, false), n = a && mundo.escolher(raio, a);
    tela.classList.toggle('sobrePeca', !!pairar); tela.classList.toggle('sobreChao', !!n);
  }
  if (!dedos.has(e.pointerId)) return; dedos.set(e.pointerId, [e.clientX, e.clientY]);
  if (dedos.size >= 2) { const d = distDedos(); if (pinca) zoom(d / pinca); pinca = d; return; }
  const dx = e.clientX - inicio[0], dy = e.clientY - inicio[1];
  if (!arrastou && Math.hypot(dx, dy) > 9) { arrastou = true; tela.classList.add('arrastando'); if (pegou) pegarPeca(pegou, inicio[0], inicio[1]); }
  if (!arrastou) return;
  if (pegou) { if (pegou.ativo) moverPeca(pegou, e.clientX, e.clientY); return; }
  const f = Math.min(innerWidth, 700); Cam.alvoAz = -Math.tanh(dx / f * 1.6) * .42; Cam.alvoEl = Math.tanh(dy / f * 1.6) * .26; if (Math.abs(Cam.alvoAz) + Math.abs(Cam.alvoEl) > .12) espiou = true;
});
function solta(e) {
  if (!dedos.delete(e.pointerId)) return;
  if (dedos.size) { inicio = [...dedos.values()][0].slice(); return; }
  tela.classList.remove('arrastando'); Cam.alvoAz = Cam.alvoEl = 0;
  if (pegou) { if (pegou.ativo) soltarPeca(pegou); pegou = null; }
  if (espiou) { espiou = false; setTimeout(Som.ilusao, 420); }
  if (!arrastou && e.type === 'pointerup') tocar(e.clientX, e.clientY);
}
tela.addEventListener('pointerleave', () => { pairar = null; }); tela.addEventListener('pointerup', solta); tela.addEventListener('pointercancel', solta);
function zoom(k) { Cam.alvoZoom = Math.max(.75, Math.min(2.2, Cam.alvoZoom * k)); }
tela.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * .001)); }, { passive: false });
tela.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- peças que giram ---------- */
// uma roda move junto as peças ligadas a ela; peça "travada" só se move pela roda
const plano = new THREE.Plane(), ponto = new THREE.Vector3(), BASE_GIRO = { x: new THREE.Vector3(0, 1, 0), y: new THREE.Vector3(1, 0, 0), z: new THREE.Vector3(1, 0, 0) };
const membrosDe = p => [p, ...(p.move || [])];
// ângulo do dedo em volta do eixo da peça (no plano do giro)
function anguloDedo(p, x, y) {
  mirarRaio(x, y); plano.setFromNormalAndCoplanarPoint(p.ev, p.centro); if (!raio.ray.intersectPlane(plano, ponto)) return null;
  const a = BASE_GIRO[p.eixo], b = a.clone().applyAxisAngle(p.ev, QUARTO), d = ponto.sub(p.centro); if (d.length() < .25) return null;
  return Math.atan2(d.dot(b), d.dot(a));
}
function pegarPeca(g, x, y) {
  const p = g.peca, M = membrosDe(p), ocupada = n => n && M.includes(n.peca);
  const sobre = !andar.andando() && ocupada(andar.no) ? andar.no.peca : null;
  // não gira: peça presa à roda, peça ainda assentando, sino passando por ela, ou sino em cima de uma peça que deita de lado
  if (p.travada || M.some(q => q.soltando) || (andar.andando() && (ocupada(andar.no) || ocupada(andar.proximo()))) || (sobre && sobre.eixo !== 'y')) { Som.nao(); tremer(p); return; }
  const a0 = x === null ? 0 : anguloDedo(p, x, y); if (a0 === null) return;
  Object.assign(g, { ativo: true, a0, ult: a0, membros: M, ang0: new Map(M.map(q => [q, q.ang])), quarto: 0, antes: new Set(M.flatMap(q => [...mundo.ligacoes(q)])), monta: sobre, faltam: 0 });
  if (sobre) { andar.montado = sobre; g.rel = andar.pos.clone().sub(sobre.centro); g.rumo = heroi.grupo.rotation.y; }
  for (const q of M) { q.girando = true; q.giro = g; } mundo.montar(); andar.remapear();
}
function tremer(p) { p.treme = .35; }
// teclado: Q/E (ou , .) giram a peça escolhida; Tab troca de peça
function girarPorTecla(p, dq) { if (!p || trocando || venceu) return; const g = { peca: p }; pegarPeca(g, null, null); if (!g.ativo) return; Som.girar(4 + quarto(dq), 0); soltarPeca(g, dq); }
let escolhida = -1;
const giraveis = () => mundo.pecas.filter(p => !p.travada);
function moverPeca(g, x, y) {
  const a = anguloDedo(g.peca, x, y); if (a === null) return; let d = a - g.ult; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; g.ult = a;
  for (const q of g.membros) q.ang += d;
  const q = Math.round((g.peca.ang - g.ang0.get(g.peca)) / QUARTO);
  if (q !== g.quarto) { g.quarto = q; Som.girar(4 + quarto(q), (x / innerWidth - .5) * 1.2); }
}
function soltarPeca(g, forcado = null) {
  g.ativo = false; const p = g.peca, q0 = Math.round((p.ang - g.ang0.get(p)) / QUARTO), livres = [];
  if (!g.monta) { const n = andar.no; livres.push(n.rampa ? [n.x, n.y, n.z] : [n.x, n.y + 1, n.z]); }
  const cabe = dq => g.membros.every(m => { const s = mundo.ocupadas(m); for (const b of livres) s.add(K3(...b)); const c = celulasPeca(m, quarto(m.rot + dq)); return [...c.blocos, ...c.rampas.map(r => [r.x, r.y, r.z])].every(b => !s.has(K3(...b))); });
  const dq = (forcado !== null ? [forcado, 0] : [q0, q0 + 1, q0 - 1, q0 + 2, q0 - 2]).find(cabe) ?? 0; g.faltam = g.membros.length; g.mudou = dq !== 0;
  if (forcado !== null && !dq) { Som.nao(); tremer(p); }
  for (const m of g.membros) Object.assign(m, { alvo: g.ang0.get(m) + dq * QUARTO, soltando: true, vel: 0, rotNova: quarto(m.rot + dq) });
}
// as peças assentam; quando todas param, o mapa é refeito e, se abriu caminho novo, toca o acorde de encaixe
function assentar(p) {
  const g = p.giro; p.ang = p.alvo; p.rot = p.rotNova; p.soltando = false; p.girando = false; p.grupo.quaternion.setFromAxisAngle(p.ev, p.ang);
  if (--g.faltam > 0) return;
  mundo.montar();
  if (g.monta) {
    const q = g.monta, pos = g.rel.clone().applyAxisAngle(q.ev, q.ang - g.ang0.get(q)).add(q.centro), n = mundo.noPerto(pos);
    andar.montado = null; if (n) { andar.no = n; andar.pos.copy(n.centro); andar.lift = n.lift; } heroi.rumo = null;
  }
  andar.remapear(); andar.desenhar();
  if (g.mudou) girosNoNivel++;
  const depois = new Set(g.membros.flatMap(q => [...mundo.ligacoes(q)])); if ([...depois].some(l => !g.antes.has(l))) Som.encaixe(); else Som.passo(1);
  for (const q of g.membros) q.giro = null; R.shadowMap.needsUpdate = true;
}
function quadroPecas(dt) {
  for (const p of mundo.pecas) {
    if (p.treme > 0) { p.treme -= dt; p.grupo.quaternion.setFromAxisAngle(p.ev, p.ang + Math.sin(p.treme * 40) * .03 * p.treme); }
    if (p.soltando) { p.vel += ((p.alvo - p.ang) * 120 - p.vel * 17) * dt; p.ang += p.vel * dt; if (Math.abs(p.alvo - p.ang) < .002 && Math.abs(p.vel) < .02) { assentar(p); continue; } }
    if (!p.girando) continue;
    p.grupo.quaternion.setFromAxisAngle(p.ev, p.ang); R.shadowMap.needsUpdate = true;
    const g = p.giro;
    if (g && g.monta === p) { heroi.grupo.position.copy(g.rel).applyAxisAngle(p.ev, p.ang - g.ang0.get(p)).add(p.centro).add(mundo.grupo.position); if (p.eixo === 'y') heroi.rumo = g.rumo + p.ang - g.ang0.get(p); }
  }
}

/* ---------- o que dá para girar: brilho nas peças e mãozinha de dica ---------- */
let girosNoNivel = 0, tempoNivel = 0;
function quadroRealce(dt) {
  tempoNivel += dt; const G = giraveis(), esc = G[escolhida] || null, dicaAtiva = mundo !== casa && !girosNoNivel && tempoNivel > 1.5 && !trocando;
  for (const p of mundo.pecas) {
    const ativa = p.giro || (pegou && pegou.peca === p), dono = mundo.pecas.find(q => q.move && q.move.includes(p));
    const alvo = ativa || (dono && dono.giro) ? 1 : p === pairar || p === esc ? .7 : dicaAtiva && (!p.travada) ? .45 + .4 * Math.sin(T * 2.6) : 0;
    p.realce += (alvo - p.realce) * Math.min(1, dt * 6); p.mat.userData.uRealce.value = Math.max(0, p.realce);
  }
  // mãozinha: no nível 1 depois de 3 s, nos outros depois de 12 s sem nenhum giro
  const d = $('dica'), mostra = dicaAtiva && !pegou && !andar.andando() && tempoNivel > (nivelAtual === 0 ? 3 : 12) && G.length;
  d.classList.toggle('ver', !!mostra);
  if (mostra) { const q = G[0].centro.clone().add(new THREE.Vector3(0, .9, 0)).add(mundo.grupo.position).project(cam); d.style.transform = `translate(${(q.x + 1) / 2 * innerWidth}px, ${(1 - q.y) / 2 * innerHeight}px)`; }
}

/* ---------- tocar ---------- */
function ehPlanta(a) { const c = a.object.geometry.attributes.color, i = a.face.a; return c && c.getY(i) > c.getX(i) + .02; }
function tocar(x, y) {
  $('titulo').classList.add('some'); if (trocando) return;
  const a = alvoEm(x, y); if (!a) return;
  const p = a.point, pan = (x / innerWidth - .5) * 1.2, tipo = a.object.userData.tipo;
  if (tipo === 'personagem') { heroi.pular(); return depois(Som.personagem); }
  if (tipo && tipo.startsWith('sino')) { mundo.sinos[a.object.userData.sino].userData.vel += tipo === 'sinoGrande' ? 1.1 : 3; return depois(() => tipo === 'sinoGrande' ? Som.sinoGrande() : Som.sininho(a.object.userData.sino, pan)); }
  if (tipo === 'agua') { onde(p); return depois(() => Som.agua(pan)); }
  const n = !venceu && mundo.escolher(raio, a);
  if (n) { onde(n.centro); if (n === andar.no && !andar.andando()) return depois(() => Som.passo(3, pan)); if (!andar.ir(n)) return depois(Som.nao); return; }
  onde(p); depois(() => ehPlanta(a) ? Som.folha(pan) : Som.pedra(Math.max(-1, Math.min(13, Math.round(p.y * .8 + 1))), pan));
}
const onde = p => U.uOndas.value[onda = (onda + 1) % 4].set(p.x, p.y, p.z, 0);
const depois = f => Som.estado === 'running' ? f() : setTimeout(f, 180);   // no primeiro toque o som ainda está ligando
let passos = 0;
andar.aoPasso = n => { const s = n.centro.clone().project(cam); Som.passo(Math.round(n.h * .7) + (passos++ % 3 === 2 ? 2 : 0), s.x * .6); };
andar.aoChegar = n => { if (mundo.meta && n.id === mundo.meta && !venceu) vitoria(); };

/* ---------- níveis, progresso e viagem entre eles ---------- */
const ROMANO = ['I', 'II', 'III', 'IV', 'V'];
let viagem = null, vistaAgora = casa.vista, relNivel = 0;
// ficha: se a pessoa sair durante a comemoração, os temporizadores dela não fazem mais nada
let fichaVitoria = 0; const seAinda = (n, f) => () => { if (n === fichaVitoria) f(); };
function vitoria() {
  venceu = true; const ficha = ++fichaVitoria; const i = nivelAtual, ultimo = i === NIVEIS.length - 1;
  salvo.feitos = Math.max(salvo.feitos, i + 1); guardar(); pontos();
  for (const s of mundo.sinos) s.userData.vel += ultimo ? 1.6 : 2.4; onde(andar.no.centro); setTimeout(() => onde(andar.no.centro.clone().add(new THREE.Vector3(0, 1.4, 0))), 450);
  heroi.pular(); setTimeout(() => heroi.pular(), 900); const lugar = andar.no.centro.clone().add(new THREE.Vector3(.3, 1.4, .3)); brilhos.userData.soltar(lugar, 40); setTimeout(() => brilhos.userData.soltar(lugar, 40), 700);
  if (ultimo) { Som.sinoGrande(); setTimeout(seAinda(ficha, Som.chegada), 700); setTimeout(seAinda(ficha, () => { Som.sinoGrande(); for (const s of mundo.sinos) s.userData.vel += 1.2; }), 3200); setTimeout(seAinda(ficha, () => letreiro('o sino voltou a cantar', 5200)), 1200); setTimeout(seAinda(ficha, () => irPara(-1)), 8800); }
  else { Som.chegada(); setTimeout(seAinda(ficha, () => irPara(i + 1)), 4800); }
}
function letreiro(txt, ms = 2800) { const n = $('nomeNivel'); n.textContent = txt; n.classList.add('ver'); clearTimeout(relNivel); relNivel = setTimeout(() => n.classList.remove('ver'), ms); }
// viagem: o nível atual desce para dentro da névoa e o próximo sobe dela
function irPara(i) {
  if (trocando) return; trocando = true; fichaVitoria++; pegou = null; venceu = false; Som.viagem();
  const novo = i < 0 ? casa : NIVEIS[i].montar(); novo.grupo.position.y = -18;
  viagem = { fase: 0, t: 0, i, velho: mundo, novo, de: vistaAgora };
  $('bJogar').classList.add('some'); $('pontos').classList.add('some'); $('bCasa').hidden = true; $('titulo').classList.add('some');
}
const suave = k => k * k * (3 - 2 * k);
function quadroViagem(dt) {
  const v = viagem; if (!v) return; v.t += dt; R.shadowMap.needsUpdate = true;
  const D1 = 1.5, D2 = 1.9, total = Math.min(1, (v.fase ? D1 + v.t : v.t) / (D1 + D2)), e = suave(total);
  vistaAgora = { centro: v.de.centro.clone().lerp(v.novo.vista.centro, e), alt: v.de.alt + (v.novo.vista.alt - v.de.alt) * e, larg: v.de.larg + (v.novo.vista.larg - v.de.larg) * e };
  if (v.fase === 0) {
    const k = Math.min(1, v.t / D1); v.velho.grupo.position.y = -18 * k * k; if (k > .35) heroi.grupo.visible = false;
    if (k >= 1) {
      cena.remove(v.velho.grupo); v.velho.grupo.position.y = 0; if (v.velho !== casa) v.velho.grupo.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      mundo = v.novo; nivelAtual = v.i; cena.add(mundo.grupo); andar.colocar(mundo, mundo.no(mundo.inicio)); heroi.rumo = null; v.fase = 1; v.t = 0;
    }
  } else {
    const k = Math.min(1, v.t / D2); mundo.grupo.position.y = -18 * Math.pow(1 - k, 3); if (k > .7 && !heroi.grupo.visible) { heroi.grupo.visible = true; heroi.pular(); }
    if (k >= 1) {
      mundo.grupo.position.y = 0; viagem = null; trocando = false; vistaAgora = mundo.vista; andar.desenhar(); girosNoNivel = 0; tempoNivel = 0; escolhida = -1;
      const casaAgora = mundo === casa; $('bJogar').classList.toggle('some', !casaAgora); $('pontos').classList.toggle('some', !casaAgora); $('bCasa').hidden = casaAgora;
      if (!casaAgora) letreiro(ROMANO[nivelAtual] + '  ·  ' + NIVEIS[nivelAtual].nome);
    }
  }
}
// bolinhas da tela inicial: uma por nível; as já liberadas podem ser escolhidas
function pontos() {
  const el = $('pontos'); el.innerHTML = '';
  NIVEIS.forEach((n, i) => { const b = document.createElement('button'); b.className = i < salvo.feitos ? 'feito' : i === Math.min(salvo.feitos, NIVEIS.length - 1) ? 'proximo' : ''; b.disabled = i > salvo.feitos; b.setAttribute('aria-label', 'Nível ' + (i + 1) + ': ' + n.nome); b.title = ROMANO[i] + ' · ' + n.nome; b.onclick = () => { Som.botao(); irPara(i); }; el.append(b); });
}
salvo.feitos = Math.max(0, Math.min(NIVEIS.length, salvo.feitos | 0)); pontos();
$('bJogar').onclick = () => irPara(salvo.feitos >= NIVEIS.length ? 0 : salvo.feitos); $('bCasa').onclick = () => irPara(-1);

/* ---------- botões ---------- */
let relNome = 0;
function mudarHora(i, quieto) {
  salvo.hora = i; hora = HORAS[i]; Som.mudarHora(hora.id); guardar();
  document.documentElement.style.setProperty('--tinta', hora.tinta); document.querySelector('meta[name=theme-color]').content = hora.nevoa; document.body.style.background = $('veu').style.background = hora.nevoa;
  if (quieto) return; Som.botao(); $('titulo').classList.add('some');
  const n = $('nomeHora'); n.textContent = hora.nome; n.classList.add('ver'); clearTimeout(relNome); relNome = setTimeout(() => n.classList.remove('ver'), 2200);
}
const VOL = [0, .5, 1]; let nivel = VOL.includes(salvo.volume) ? VOL.indexOf(salvo.volume) : 2;
function mudarVolume(n) { nivel = n; salvo.volume = VOL[n]; $('bSom').dataset.v = n; $('bSom').setAttribute('aria-label', ['Som desligado', 'Som baixo', 'Som normal'][n]); Som.ajustar(VOL[n]); guardar(); }
$('bHora').onclick = () => mudarHora((salvo.hora + 1) % HORAS.length); $('bSom').onclick = () => { mudarVolume((nivel + 2) % 3); Som.botao(); };
mudarHora(salvo.hora, true); mudarVolume(nivel);
// teclado: setas (ou WASD) andam uma casa na direção da tela; Q/E giram; Tab escolhe a peça; Espaço pula; Enter joga
const SETAS = { ArrowUp: [0, -1], w: [0, -1], ArrowRight: [1, 0], d: [1, 0], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0] };
addEventListener('keydown', e => {
  if (e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (SETAS[k]) { e.preventDefault(); if (trocando || venceu || andar.andando() || andar.montado) return; const [dx, dz] = SETAS[k], n = andar.no;
    const ed = n.viz.find(v => Math.round((v.P.x - n.x) * 2) === dx && Math.round((v.P.z - n.z) * 2) === dz); if (ed) { $('titulo').classList.add('some'); andar.ir(ed.para); } else Som.nao(); return; }
  if (e.repeat) return;
  if (k === 'Tab' && mundo !== casa) { e.preventDefault(); const G = giraveis(); if (G.length) { escolhida = (escolhida + 1) % G.length; Som.botao(); } return; }
  if ((k === 'q' || k === ',' || k === 'e' || k === '.') && mundo !== casa) { const G = giraveis(); if (escolhida < 0) escolhida = 0; girarPorTecla(G[escolhida], k === 'q' || k === ',' ? 1 : 3); return; }
  if (k === ' ') { e.preventDefault(); heroi.pular(); Som.personagem(); return; }
  if (k === 'Enter' && mundo === casa && !trocando) { $('bJogar').click(); return; }
  if (k === 'h') $('bHora').click(); if (k === 'm') $('bSom').click(); if (k === 'Escape' && mundo !== casa) irPara(-1);
});
addEventListener('resize', medir); addEventListener('orientationchange', () => setTimeout(medir, 200));

/* ---------- quadro a quadro ---------- */
let t0 = 0, T = 0, primeiro = 3;
function passo(dt) {
  T += dt; U.uTempo.value = T; aplicarHora(hora, 1 - Math.exp(-dt * 1.7));
  for (const o of U.uOndas.value) o.w += dt;
  // mola: a câmera volta sozinha ao ângulo exato
  const mola = dedos.size ? 60 : 26, atrito = dedos.size ? 14 : 9.4;
  Cam.vaz += ((Cam.alvoAz - Cam.az) * mola - Cam.vaz * atrito) * dt; Cam.vel += ((Cam.alvoEl - Cam.el) * mola - Cam.vel * atrito) * dt; Cam.az += Cam.vaz * dt; Cam.el += Cam.vel * dt;
  if (!Cam.alvoAz && !Cam.alvoEl && Math.abs(Cam.az) + Math.abs(Cam.el) + Math.abs(Cam.vaz) + Math.abs(Cam.vel) < .0008) Cam.az = Cam.el = Cam.vaz = Cam.vel = 0;
  Cam.intro = Math.min(1, Cam.intro + dt / 3.2); const s = 1 - Math.pow(1 - Cam.intro, 3); Cam.zoom += (Cam.alvoZoom * (.9 + .1 * s) - Cam.zoom) * Math.min(1, dt * 7);
  for (const b of mundo.sinos) { const u = b.userData, g = 9 / u.len; u.vel += (-g * u.ang - .35 * u.vel + Math.sin(T * .9 + u.fase) * .05) * dt; u.ang += u.vel * dt; b.rotation.set(u.ang * .4, 0, u.ang); }
  for (const m of longe.children) { const [y, k] = m.userData.deriva; m.position.y = y + Math.sin(T * .22 + k * 1.7) * .12; const alt = m.position.clone().applyQuaternion(fundo.quaternion).add(fundo.position).y; m.material.userData.uNev.value.set(alt - 7 * m.scale.x, alt + .5); }
  for (const m of fundo.children) if (m.userData.vento) { const v = m.userData.vento; v.x += v.v * dt; if (v.x > 42) v.x = -42; m.position.copy(naTela(v.x, v.y, v.fundo)); }
  { const u = poeira.material.uniforms, va = vistaAgora, asp = innerWidth / innerHeight, h = Math.max(va.alt, va.larg / asp) / Cam.zoom; u.uCentro.value.copy(va.centro); u.uTam.value.set(h * asp * 2.3, h * 2.3, 34); u.uPx.value = brilhos.material.uniforms.uPx.value = R.getPixelRatio() * Math.min(1.6, Math.max(.8, innerHeight / 700)); }
  brilhos.userData.quadro(dt); quadroRealce(dt);
  for (const m of fundo.children) if (m.userData.base) m.position.copy(m.userData.base).addScaledVector(EIXO.dir, Math.sin(T * .035 + m.userData.s) * 1.6);
  quadroViagem(dt); andar.quadro(dt); quadroPecas(dt); heroi.quadro(T, dt); mirar();
}
function quadro(t) {
  requestAnimationFrame(quadro); const dt = Math.min(.05, (t - t0) / 1000 || .016); t0 = t; passo(dt);
  if (primeiro > 0) { R.shadowMap.needsUpdate = true; if (!--primeiro) tela.classList.add('pronta'); }
  R.render(cena, cam);
}
Cam.zoom = .9; medir(); mirar(); requestAnimationFrame(quadro);
tela.addEventListener('webglcontextlost', e => e.preventDefault()); tela.addEventListener('webglcontextrestored', () => { primeiro = 3; });
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__hushbell = { THREE, R, cena, cam, Cam, Som, U, monumento, heroi, andar, passo, mudarHora, alvoEm, HORAS, irPara, celulasPeca, NIVEIS, get viagem() { return viagem; }, get nivel() { return nivelAtual; }, get girosNoNivel() { return girosNoNivel; }, poeira, get mundo() { return mundo; }, get venceu() { return venceu; }, casa };
