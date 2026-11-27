'use strict';
// Modo 1: tabuleiro de joias 3D (match-3). Regras, quedas, especiais, combos e obstáculos.
const cenaTab = new THREE.Scene(); cenaTab.environment = ENV;
const camTab = new THREE.PerspectiveCamera(30, 1, .1, 100);
cenaTab.add(new THREE.HemisphereLight(0xffffff, 0x4a2a7a, 1.0));
{ const a = new THREE.DirectionalLight(0xffffff, 2.2); a.position.set(-3, 5, 9); cenaTab.add(a); const b = new THREE.DirectionalLight(0xffc0f0, .9); b.position.set(4, -3, 6); cenaTab.add(b); }
const tabG = new THREE.Group(); cenaTab.add(tabG);
const fundoG = new THREE.Group(), pecasG = new THREE.Group(); tabG.add(fundoG, pecasG);
const fxTab = new Particulas(cenaTab, 1600, TEX_PONTO), fxBr = new Particulas(cenaTab, 500, TEX_BRILHO), fxCaco = new Particulas(cenaTab, 700, TEX_CACO, false);
const V3 = THREE.Vector3;

const T = { Nr: 8, Nc: 8, cel: [], cores: 5, jogadas: 0, metas: [], pontos: 0, ocupado: false, ativo: false, sel: null, fila: [], cascata: 0,
  mov: { removidas: 0, especiais: 0 }, ocioso: 0, dica: null, dicaT: 0, tremor: 0, nivel: 1, tempo: 0 };

const MAT_CASA = [0x17206e, 0x1f2b88].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: .15, envMapIntensity: .7 }));
const GEO_CASA = extrudar(retRedondo(.95, .95, .13), .06, .025);
const MAT_BASE = new THREE.MeshStandardMaterial({ color: 0x1a0c52, roughness: .5 });
const posCel = (r, c) => ({ x: c - (T.Nc - 1) / 2, y: (T.Nr - 1) / 2 - r });
const celula = (r, c) => (r >= 0 && r < T.Nr && c >= 0 && c < T.Nc && T.cel[r][c].existe) ? T.cel[r][c] : null;
const corEm = (r, c) => { const k = celula(r, c); return k && k.gema && k.gema.tipo === 'n' ? k.gema.cor : -1; };
const movel = k => !!(k && k.gema && !k.corrente && !k.bloco && !k.gema.ativando);
const vizinhos = k => [celula(k.r - 1, k.c), celula(k.r + 1, k.c), celula(k.r, k.c - 1), celula(k.r, k.c + 1)].filter(Boolean);
const todas = () => T.cel.flat().filter(k => k.existe);

function montarFundo() {
  for (const o of [...fundoG.children]) { fundoG.remove(o); if (o.geometry !== GEO_CASA) o.geometry.dispose(); }
  for (const k of todas()) { const p = posCel(k.r, k.c), m = new THREE.Mesh(GEO_CASA, MAT_CASA[(k.r + k.c) % 2]); m.position.set(p.x, p.y, -.36); fundoG.add(m); }
  const base = new THREE.Mesh(extrudar(retRedondo(T.Nc + .3, T.Nr + .3, .3), .1, .03), MAT_BASE); base.position.z = -.46; fundoG.add(base);
  const s = retRedondo(T.Nc + .75, T.Nr + .75, .45); s.holes.push(retRedondo(T.Nc + .14, T.Nr + .14, .22, new THREE.Path()));
  const moldura = new THREE.Mesh(extrudar(s, .16, .06, 3), MAT.ouro); moldura.position.z = -.36; fundoG.add(moldura);
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const j = new THREE.Mesh(GEO.gema[0], MAT.gema[(x + 1) / 2 + (y + 1)]); j.scale.setScalar(.5); j.position.set(x * (T.Nc / 2 + .2), y * (T.Nr / 2 + .2), -.15); fundoG.add(j); }
}

function novaGema(k, cor, tipo = 'n') {
  const g = { cor: tipo === 'n' ? cor : -1, tipo, mesh: meshGema(cor, tipo), fase: Math.random() * 6.28, ativando: false };
  const p = posCel(k.r, k.c); g.mesh.position.set(p.x, p.y, 0); pecasG.add(g.mesh); k.gema = g; return g;
}
function virarEspecial(g, tipo) { const pos = g.mesh.position.clone(); pecasG.remove(g.mesh); g.tipo = tipo; g.cor = -1; g.mesh = meshGema(0, tipo); g.mesh.position.copy(pos); pecasG.add(g.mesh); surgir(g.mesh); }
function surgir(m, d = .32) { m.scale.setScalar(.01); return Anim.add(d, t => m.scale.setScalar(Math.max(.01, t)), Ease.back); }
const corAleatoria = () => Math.floor(Math.random() * T.cores);
function corSemMatch(r, c) {
  for (let i = 0; i < 40; i++) { const cor = corAleatoria(); if (corEm(r, c - 1) === cor && corEm(r, c - 2) === cor) continue; if (corEm(r - 1, c) === cor && corEm(r - 2, c) === cor) continue; return cor; }
  return corAleatoria();
}

function carregarNivel(nv) {
  for (const o of [...pecasG.children]) pecasG.remove(o);
  T.Nr = nv.mapa.length; T.Nc = nv.mapa[0].length; T.cores = nv.cores; T.cel = []; T.fila = []; T.sel = null; T.dica = null;
  for (let r = 0; r < T.Nr; r++) {
    const linha = []; T.cel.push(linha);
    for (let c = 0; c < T.Nc; c++) {
      const ch = nv.mapa[r][c], k = { r, c, existe: ch !== '#', gema: null, gelo: 0, gMesh: null, bloco: null, corrente: 0, cMesh: null };
      if (ch === 'i' || ch === 'K') k.gelo = 1; if (ch === 'I') k.gelo = 2;
      if (ch === 'c' || ch === 'C') k.bloco = { tipo: 'caixa', hp: ch === 'C' ? 2 : 1 };
      if (ch === 'v') k.bloco = { tipo: 'cofre', hp: 3 };
      if (ch === 'E') k.bloco = { tipo: 'entulho', hp: 1 };
      if (ch === 'L' || ch === 'P') k.bloco = { tipo: 'cadeado', hp: ch === 'P' ? 2 : 1 };
      if (ch === 'k' || ch === 'K') k.corrente = 1;
      const p = posCel(r, c);
      if (k.gelo) { k.gMesh = meshGelo(k.gelo); k.gMesh.position.set(p.x, p.y, -.27); pecasG.add(k.gMesh); }
      if (k.bloco && k.bloco.tipo !== 'entulho') { k.bloco.mesh = k.bloco.tipo === 'caixa' ? meshCaixa(k.bloco.hp) : k.bloco.tipo === 'cadeado' ? meshCadeado(k.bloco.hp) : meshCofre(3); k.bloco.mesh.position.set(p.x, p.y, 0); pecasG.add(k.bloco.mesh); }
      if (k.corrente) { k.cMesh = meshCorrente(); k.cMesh.position.set(p.x, p.y, 0); pecasG.add(k.cMesh); }
      linha.push(k);
    }
  }
  for (let t = 0; t < 80; t++) {
    for (const k of todas()) { if (k.bloco) continue; if (k.gema) pecasG.remove(k.gema.mesh); k.gema = null; }
    for (const k of todas()) if (!k.bloco) novaGema(k, corSemMatch(k.r, k.c));
    if (existeJogada()) break;
  }
  Resgate.preparar(nv);
  const conta = { entulho: Resgate.total, gelo: todas().filter(k => k.gelo).length, caixa: todas().filter(k => k.bloco && k.bloco.tipo === 'caixa').length, cofre: todas().filter(k => k.bloco && k.bloco.tipo === 'cofre').length, corrente: todas().filter(k => k.corrente).length, cadeado: todas().filter(k => k.bloco && k.bloco.tipo === 'cadeado').length };
  T.metas = nv.metas.map(m => ({ ...m, n: m.n || conta[m.t], falta: m.n || conta[m.t] }));
  T.jogadas = nv.jogadas; T.pontos = 0; T.jogadasIni = nv.jogadas;
  montarFundo(); enquadrarTab();
}
async function entradaPecas() {
  const proms = [];
  for (const k of todas()) {
    const objs = [k.gema && k.gema.mesh, k.bloco && k.bloco.mesh, k.cMesh].filter(Boolean), p = posCel(k.r, k.c), atraso = (T.Nr - k.r) * .045 + k.c * .012;
    if (k.gMesh) { const m = k.gMesh; proms.push(espera(k.r * .03 + k.c * .03).then(() => { m.visible = true; return surgir(m, .35); })); }
    for (const m of objs) { m.position.y = p.y + 9; m.visible = false; proms.push(espera(atraso).then(() => { m.visible = true; return Anim.add(.38, t => m.position.y = p.y + 9 * (1 - t), Ease.inn); }).then(() => quique(m))); }
  }
  await Promise.all(proms);
}

// ---------- câmera e tela ----------
function enquadrarTab() {
  const a = L.tab.w / L.tab.h, f = Math.tan(THREE.MathUtils.degToRad(camTab.fov / 2));
  const topo = Resgate.ativo ? Resgate.alturaTopo : 0, hw = T.Nc / 2 + .55, hh = (T.Nr + 1.1 + topo) / 2, d = Math.max(hh / f, hw / (f * a)) * (topo ? 1.03 : 1.08), tilt = topo ? .07 : .2, cy = topo / 2;
  camTab.aspect = a; camTab.position.set(0, cy - d * Math.sin(tilt) - .2, d * Math.cos(tilt)); camTab.lookAt(0, cy - .12, 0); camTab.updateProjectionMatrix();
  camTab.userData.base = camTab.position.clone();
}
const ray = new THREE.Raycaster(), plano = new THREE.Plane(new V3(0, 0, 1), 0), vtmp = new V3();
function celulaNaTela(cx, cy) {
  const r = L.tab; if (cx < r.x || cx > r.x + r.w || cy < r.y || cy > r.y + r.h) return null;
  ray.setFromCamera({ x: (cx - r.x) / r.w * 2 - 1, y: -((cy - r.y) / r.h) * 2 + 1 }, camTab);
  if (!ray.ray.intersectPlane(plano, vtmp)) return null;
  const c = Math.round(vtmp.x + (T.Nc - 1) / 2), rr = Math.round((T.Nr - 1) / 2 - vtmp.y);
  return celula(rr, c);
}
function telaDe(x, y, z = 0) { vtmp.set(x, y, z).project(camTab); return [L.tab.x + (vtmp.x + 1) / 2 * L.tab.w, L.tab.y + (1 - vtmp.y) / 2 * L.tab.h]; }
function tremerTela(a) { T.tremor = Math.max(T.tremor, a); }

// ---------- pequenos efeitos ----------
function quique(m) { return Anim.add(.2, t => { const s = Math.sin(t * Math.PI) * (1 - t); m.scale.set(1 + s * .28, 1 - s * .28, 1); }); }
function balancar(m) { const x0 = m.position.x; return Anim.add(.3, t => m.position.x = x0 + Math.sin(t * 30) * .07 * (1 - t)); }
function estourar(g, silencioso) {
  const m = g.mesh, p = m.position, c = g.tipo === 'n' ? corRGB(COR_HEX[g.cor]) : [1, .95, .8];
  fxCaco.explosao(p.x, p.y, .25, 8, { cor: c, tam: .17, tamF: .05, v0: 1.5, v1: 4.2, grav: 8, arr: 1, vida0: .35, vida1: .75 });
  fxTab.explosao(p.x, p.y, .3, 6, { cor: c.map(v => v * .7 + .3), tam: .45, tamF: 0, v0: .3, v1: 1.3, vida0: .2, vida1: .4 });
  if (!silencioso) fxBr.emitir(p.x, p.y, .45, { tam: 1, tamF: .1, vida: .3 });
  Anim.add(.17, k => { const s = k < .35 ? 1 + k : 1.35 * (1 - (k - .35) / .65); m.scale.setScalar(Math.max(.001, s)); }).then(() => pecasG.remove(m));
}
function flutuar(txt, x, y, grande) { const [sx, sy] = telaDe(x, y, .5); const b = document.createElement('b'); b.textContent = txt; b.style.left = sx + 'px'; b.style.top = sy + 'px'; if (grande) b.style.fontSize = '28px'; $('#flutua').appendChild(b); setTimeout(() => b.remove(), 950); }
function pontuar(n) { T.pontos += n; HUD.pontos(); }
function contar(t, cor) {
  for (const m of T.metas) if (m.t === t && (t !== 'cor' || m.cor === cor) && m.falta > 0) { m.falta--; HUD.meta(m); return true; }
  return false;
}
const metasFeitas = () => T.metas.every(m => m.falta <= 0);

// ---------- dano ----------
function removerGema(k) {
  const g = k.gema; if (!g) return; k.gema = null; T.mov.removidas++; pontuar(40 * Math.max(1, T.cascata));
  if (g.tipo === 'n') contar('cor', g.cor); estourar(g);
}
function danificarGelo(k) {
  if (!k.gelo) return; k.gelo--; Som.gelo(); pontuar(60);
  const p = posCel(k.r, k.c); fxCaco.explosao(p.x, p.y, 0, 9, { cor: [.8, .95, 1], tam: .15, tamF: .04, v0: 1, v1: 3, grav: 6, vida0: .3, vida1: .6 });
  fxBr.emitir(p.x, p.y, .1, { tam: .7, vida: .25, cor: [.7, .9, 1] });
  if (k.gelo <= 0) { const m = k.gMesh; k.gMesh = null; Anim.add(.2, t => m.scale.set(1 + t * .25, 1 + t * .25, 1 - t)).then(() => pecasG.remove(m)); contar('gelo'); }
  else k.gMesh.material = MAT.gelo[k.gelo - 1];
}
function danificarBloco(k) {
  const b = k.bloco; if (!b) return; if (b.tipo === 'entulho') { Resgate.atingirEntulho(k); return; } b.hp--; pontuar(100);
  const p = posCel(k.r, k.c), m = b.mesh;
  if (b.tipo === 'caixa') { Som.madeira(); fxCaco.explosao(p.x, p.y, .3, 12, { cor: [.78, .52, .26], tam: .2, tamF: .06, v0: 1.5, v1: 4.5, grav: 9, vida0: .4, vida1: .85 }); }
  else if (b.tipo === 'cadeado') { Som.cadeado(); fxTab.explosao(p.x, p.y, .35, 14, { cor: [1, .8, .35], tam: .16, v0: 1.5, v1: 4.5, grav: 5, vida0: .25, vida1: .55 }); const c = m.userData.c; Anim.add(.3, t => c.rotation.z = Math.sin(t * 25) * .3 * (1 - t)); }
  else { Som.metal(); fxTab.explosao(p.x, p.y, .35, 16, { cor: [1, .85, .4], tam: .14, v0: 2, v1: 5.5, grav: 5, vida0: .2, vida1: .5 }); const d = m.userData.dial; const r0 = d.rotation.z; Anim.add(.35, t => d.rotation.z = r0 + t * 2.1, Ease.out); }
  if (b.hp <= 0) {
    k.bloco = null; contar(b.tipo); if (b.tipo === 'cadeado') Resgate.cadeadoAberto(p); fxBr.emitir(p.x, p.y, .4, { tam: 1.4, vida: .35, cor: [1, .9, .6] });
    Anim.add(.24, t => { m.scale.setScalar(1 + t * .35); m.rotation.z = t * .6; m.position.z = t * .4; }).then(() => pecasG.remove(m));
  } else { if (b.tipo === 'caixa') atualizarCaixa(m, b.hp); else if (b.tipo === 'cadeado') atualizarCadeado(m, b.hp); else atualizarCofre(m, b.hp); balancar(m); }
}
function quebrarCorrente(k) {
  if (!k.corrente) return; k.corrente = 0; Som.corrente(); contar('corrente'); pontuar(80);
  const m = k.cMesh; k.cMesh = null;
  const vs = m.children.map(e => ({ e, vx: e.position.x * 9 + rnd(-1, 1), vy: e.position.y * 9 + rnd(0, 2), p: e.position.clone() }));
  Anim.add(.45, t => { vs.forEach(v => { v.e.position.set(v.p.x + v.vx * t * .4, v.p.y + v.vy * t * .4 - t * t * 1.5, v.p.z + t); v.e.rotation.y += .2; }); m.scale.setScalar(1 - t * .5); }).then(() => pecasG.remove(m));
}
// golpe de explosão numa casa
function atingir(k) {
  if (!k) return;
  if (k.bloco) { danificarBloco(k); return; }
  if (k.gelo) danificarGelo(k);
  const g = k.gema; if (!g) return;
  if (k.corrente) { quebrarCorrente(k); return; }
  if (g.tipo !== 'n') { if (!g.ativando) { g.ativando = true; T.fila.push(k); } return; }
  removerGema(k);
}

// ---------- combinações ----------
function acharGrupos() {
  const runs = [];
  for (let r = 0; r < T.Nr; r++) for (let c = 0; c < T.Nc;) { const cor = corEm(r, c); if (cor < 0) { c++; continue; } let e = c + 1; while (e < T.Nc && corEm(r, e) === cor) e++; if (e - c >= 3) { const l = []; for (let i = c; i < e; i++) l.push(T.cel[r][i]); runs.push({ dir: 'h', cels: l }); } c = e; }
  for (let c = 0; c < T.Nc; c++) for (let r = 0; r < T.Nr;) { const cor = corEm(r, c); if (cor < 0) { r++; continue; } let e = r + 1; while (e < T.Nr && corEm(e, c) === cor) e++; if (e - r >= 3) { const l = []; for (let i = r; i < e; i++) l.push(T.cel[i][c]); runs.push({ dir: 'v', cels: l }); } r = e; }
  const pai = runs.map((_, i) => i), raiz = i => pai[i] === i ? i : (pai[i] = raiz(pai[i])), dono = new Map();
  runs.forEach((ru, i) => ru.cels.forEach(k => { if (dono.has(k)) pai[raiz(i)] = raiz(dono.get(k)); else dono.set(k, i); }));
  const grupos = new Map();
  runs.forEach((ru, i) => { const g = raiz(i); if (!grupos.has(g)) grupos.set(g, { runs: [], cels: new Set() }); const G = grupos.get(g); G.runs.push(ru); ru.cels.forEach(k => G.cels.add(k)); });
  return [...grupos.values()];
}
function decidirEspecial(gr, prefer) {
  const maior = gr.runs.reduce((a, b) => b.cels.length > a.cels.length ? b : a), temH = gr.runs.some(r => r.dir === 'h'), temV = gr.runs.some(r => r.dir === 'v');
  let tipo = null;
  if (maior.cels.length >= 5) tipo = 'disco'; else if (temH && temV) tipo = 'din'; else if (maior.cels.length === 4) tipo = maior.dir === 'h' ? 'fh' : 'fv';
  if (!tipo) return null;
  let cel = prefer.find(k => gr.cels.has(k));
  if (!cel && tipo === 'din') { const hs = new Set(gr.runs.filter(r => r.dir === 'h').flatMap(r => r.cels)); cel = gr.runs.filter(r => r.dir === 'v').flatMap(r => r.cels).find(k => hs.has(k)); }
  if (!cel) cel = maior.cels[Math.floor(maior.cels.length / 2)];
  return { tipo, cel };
}
async function limparGrupos(grupos, prefer) {
  const remover = new Map(), criar = [];
  for (const gr of grupos) { const e = decidirEspecial(gr, prefer); if (e) criar.push(e); for (const k of gr.cels) if (!remover.has(k)) remover.set(k, e); }
  Som.encaixe(T.cascata);
  const adj = new Set(); for (const k of remover.keys()) for (const v of vizinhos(k)) if (v.bloco) adj.add(v);
  for (const gr of grupos) { let x = 0, y = 0; gr.cels.forEach(k => { const p = posCel(k.r, k.c); x += p.x; y += p.y; }); const n = gr.cels.size; flutuar('+' + 40 * n * Math.max(1, T.cascata), x / n, y / n, n >= 5); }
  const proms = [];
  for (const [k, e] of remover) {
    if (k.corrente) { quebrarCorrente(k); danificarGelo(k); continue; }
    danificarGelo(k);
    if (e && k !== e.cel) { // a joia voa para onde nasce o especial
      const g = k.gema; if (!g) continue; k.gema = null; T.mov.removidas++; contar('cor', g.cor); pontuar(40 * Math.max(1, T.cascata));
      const a = posCel(e.cel.r, e.cel.c), p0 = g.mesh.position.clone(), p1 = new V3(a.x, a.y, .1);
      proms.push(Anim.add(.15, t => { g.mesh.position.lerpVectors(p0, p1, t); g.mesh.scale.setScalar(1 - t * .5); }, Ease.inn).then(() => pecasG.remove(g.mesh)));
    } else if (!e || k !== e.cel) removerGema(k);
  }
  adj.forEach(danificarBloco);
  await Promise.all(proms);
  for (const e of criar) {
    const k = e.cel, g = k.gema; if (k.bloco) continue;
    if (g) { contar('cor', g.cor); T.mov.removidas++; pecasG.remove(g.mesh); }
    const ng = novaGema(k, 0, e.tipo); surgir(ng.mesh, .36); T.mov.especiais++; pontuar(150);
    const p = posCel(k.r, k.c); fxBr.emitir(p.x, p.y, .5, { tam: 2.2, tamF: .2, vida: .4, cor: [1, .95, .7] }); fxTab.explosao(p.x, p.y, .3, 20, { cor: [1, .85, .4], tam: .2, v0: 1, v1: 3, vida0: .3, vida1: .6 });
    Som.especial();
  }
  await espera(.1);
}

// ---------- queda ----------
const fixo = k => !!(k.bloco || (k.gema && k.corrente));
const abertoAcima = k => { for (let r = k.r - 1; r >= 0; r--) { const q = T.cel[r][k.c]; if (q.existe && fixo(q)) return false; } return true; };
async function gravidade() {
  for (let rodada = 0; rodada < 60; rodada++) {
    const movs = [];
    for (let c = 0; c < T.Nc; c++) {
      const segs = []; let seg = [];
      for (let r = T.Nr - 1; r >= 0; r--) { const k = T.cel[r][c]; if (!k.existe) continue; if (fixo(k) || (k.gema && k.gema.ativando)) { segs.push({ cels: seg, topo: false }); seg = []; } else seg.push(k); }
      segs.push({ cels: seg, topo: true });
      for (const s of segs) {
        const gemas = s.cels.filter(k => k.gema).map(k => k.gema); s.cels.forEach(k => k.gema = null);
        gemas.forEach((g, i) => { const k = s.cels[i]; k.gema = g; const p = posCel(k.r, k.c); if (Math.abs(g.mesh.position.y - p.y) > .01 || Math.abs(g.mesh.position.x - p.x) > .01) movs.push({ g, k }); });
        if (s.topo && s.cels.length > gemas.length) {
          const topoY = posCel(s.cels[s.cels.length - 1].r, c).y;
          for (let i = gemas.length, n = 1; i < s.cels.length; i++, n++) { const k = s.cels[i], g = novaGema(k, corAleatoria()); g.mesh.position.y = topoY + n + .2; movs.push({ g, k }); }
        }
      }
    }
    if (!movs.length) {
      for (let r = T.Nr - 1; r >= 0; r--) for (let c = 0; c < T.Nc; c++) {
        const k = T.cel[r][c]; if (!k.existe || fixo(k) || k.gema) continue;
        const lados = Math.random() < .5 ? [-1, 1] : [1, -1]; let ok = false;
        for (const dc of lados) { const s = celula(r - 1, c + dc); if (s && s.gema && !fixo(s) && !s.gema.ativando) { k.gema = s.gema; s.gema = null; movs.push({ g: k.gema, k }); ok = true; break; } }
        // casa presa embaixo de um bloqueio: puxa do lado, de uma coluna que consegue repor de cima
        if (!ok) for (const dc of lados) { const s = celula(r, c + dc); if (s && s.gema && !fixo(s) && !s.gema.ativando && abertoAcima(s)) { k.gema = s.gema; s.gema = null; movs.push({ g: k.gema, k }); break; } }
      }
    }
    if (!movs.length) break;
    await Promise.all(movs.map(({ g, k }) => {
      const p = posCel(k.r, k.c), m = g.mesh, x0 = m.position.x, y0 = m.position.y, d = Math.hypot(p.x - x0, p.y - y0);
      return Anim.add(.06 + Math.sqrt(d) * .085, t => { m.position.x = lerp(x0, p.x, t); m.position.y = lerp(y0, p.y, t); }, Ease.inn).then(() => { Som.queda(); quique(m); });
    }));
  }
}

// ---------- especiais em ação ----------
const GEO_RAIO = new THREE.PlaneGeometry(1, 1);
function raioLuz(a, b, cor = 0xffffff) {
  const m = new THREE.Mesh(GEO_RAIO, new THREE.MeshBasicMaterial({ color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const dx = b.x - a.x, dy = b.y - a.y; m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, .5); m.rotation.z = Math.atan2(dy, dx); m.scale.set(Math.hypot(dx, dy), .09, 1); m.renderOrder = 15; tabG.add(m);
  Anim.add(.35, t => { m.material.opacity = 1 - t; m.scale.y = .09 + t * .05; }).then(() => { tabG.remove(m); m.material.dispose(); });
}
function anel(p, raio, cor = 0xffaa33) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.7, 1, 48), new THREE.MeshBasicMaterial({ color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.position.set(p.x, p.y, .45); m.renderOrder = 15; tabG.add(m);
  Anim.add(.4, t => { m.scale.setScalar(.3 + t * (raio + .7)); m.material.opacity = 1 - t; }, Ease.out).then(() => { tabG.remove(m); m.geometry.dispose(); m.material.dispose(); });
}
async function linhaFoguete(r, c, dir, origem) {
  const p0 = posCel(r, c), maxD = dir === 'h' ? Math.max(c, T.Nc - 1 - c) : Math.max(r, T.Nr - 1 - r), passo = .034, voo = maxD + 3;
  const pecas = [-1, 1].map(s => { const m = meshPontaFoguete(); if (dir === 'h') m.rotation.z = s > 0 ? 0 : Math.PI; else m.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; m.position.set(p0.x, p0.y, .3); tabG.add(m); return { m, s }; });
  Som.foguete();
  const anda = Anim.add(passo * voo, k => pecas.forEach(({ m, s }) => {
    const d = k * voo; if (dir === 'h') m.position.x = p0.x + s * d; else m.position.y = p0.y - s * d;
    fxTab.emitir(m.position.x, m.position.y, .3, { vx: rnd(-.3, .3), vy: rnd(-.3, .3), tam: rnd(.25, .4), tamF: 0, vida: rnd(.2, .4), cor: pega([[1, .6, .15], [1, .85, .3], [1, .35, .1]]) });
  }));
  if (origem) atingir(celula(r, c));
  for (let d = 1; d <= maxD; d++) { await espera(passo); for (const s of [-1, 1]) atingir(dir === 'h' ? celula(r, c + s * d) : celula(r + s * d, c)); }
  await anda; pecas.forEach(({ m }) => tabG.remove(m));
}
async function explodir(r, c, raio) {
  const p = posCel(r, c); Som.explosao(raio > 2); tremerTela(raio > 2 ? .4 : .22); anel(p, raio); anel(p, raio * .6, 0xffffff);
  fxTab.explosao(p.x, p.y, .4, 30 + raio * 12, { cor: [1, .65, .2], tam: .55, tamF: .1, v0: 2, v1: 5 + raio * 1.5, vida0: .3, vida1: .7 });
  fxBr.emitir(p.x, p.y, .6, { tam: 2 + raio, tamF: .3, vida: .35, cor: [1, .9, .7] });
  const alvos = [];
  for (let dr = -raio; dr <= raio; dr++) for (let dc = -raio; dc <= raio; dc++) if (dr * dr + dc * dc <= raio * raio + 1.5) alvos.push({ k: celula(r + dr, c + dc), d: Math.max(Math.abs(dr), Math.abs(dc)) });
  for (let d = 0; d <= raio; d++) { alvos.filter(a => a.d === d).forEach(a => atingir(a.k)); await espera(.035); }
}
function corMaisComum() { const n = new Array(T.cores).fill(0); for (const k of todas()) if (k.gema && k.gema.tipo === 'n') n[k.gema.cor]++; return n.indexOf(Math.max(...n)); }
async function bolaArcoIris(g, k, cor, virar) {
  const p = posCel(k.r, k.c), m = g.mesh; m.position.z = .35; Som.especial();
  await Anim.add(.25, t => { m.scale.setScalar(1 + t * .4); m.rotation.y += .3; }, Ease.out);
  const alvos = todas().filter(a => a.gema && a.gema.tipo === 'n' && a.gema.cor === cor);
  const virados = [];
  for (let i = 0; i < alvos.length; i++) {
    const a = alvos[i]; if (!a.gema) continue; const q = posCel(a.r, a.c);
    raioLuz(p, q, COR_HEX[cor]); Som.raio(i); fxBr.emitir(q.x, q.y, .4, { tam: .8, vida: .25 });
    if (virar && !a.corrente) { virarEspecial(a.gema, virar === 'din' ? 'din' : (Math.random() < .5 ? 'fh' : 'fv')); a.gema.ativando = true; virados.push(a); }
    else atingir(a);
    m.rotation.y += .4; await espera(.035);
  }
  await espera(virados.length ? .35 : .12);
  estourar(g); fxBr.emitir(p.x, p.y, .5, { tam: 2.5, vida: .4, cor: [1, .8, 1] });
  T.fila.push(...virados);
}
async function ativar(k, extra = {}) {
  const g = k.gema; if (!g || g.tipo === 'n') return;
  k.gema = null; T.mov.removidas++; pontuar(100);
  if (g.tipo !== 'din') danificarGelo(k);
  if (g.tipo === 'fh' || g.tipo === 'fv') { pecasG.remove(g.mesh); await linhaFoguete(k.r, k.c, g.tipo === 'fh' ? 'h' : 'v'); }
  else if (g.tipo === 'din') {
    Som.pavio(); const m = g.mesh, p = m.position.clone();
    await Anim.add(.28, t => { m.scale.setScalar(1 + t * .35); m.position.x = p.x + Math.sin(t * 60) * .05; fxTab.emitir(p.x + .17, p.y + .43, .3, { vx: rnd(-1, 1), vy: rnd(0, 1.5), tam: .15, vida: .25, cor: [1, .8, .3] }); });
    pecasG.remove(m); await explodir(k.r, k.c, extra.raio || 2);
  } else await bolaArcoIris(g, k, extra.cor ?? corMaisComum(), extra.virar);
}
async function processarFila() { while (T.fila.length) { const lote = T.fila.splice(0); await Promise.all(lote.map(k => ativar(k))); } }

// duas especiais trocadas uma com a outra = super combo
async function combo(ka, kb) {
  const A = ka.gema, B = kb.gema;
  if (A.tipo === 'n' || B.tipo === 'n') {
    const [ks, kn] = A.tipo === 'n' ? [kb, ka] : [ka, kb];
    ks.gema.ativando = true;
    if (ks.gema.tipo === 'disco') await ativar(ks, { cor: kn.gema.cor }); else await ativar(ks);
    return;
  }
  ka.gema = null; kb.gema = null; A.ativando = B.ativando = true; T.mov.especiais++;
  const p = posCel(kb.r, kb.c), p0 = A.mesh.position.clone();
  await Anim.add(.18, t => { A.mesh.position.lerpVectors(p0, new V3(p.x, p.y, .3), t); A.mesh.scale.setScalar(1 + t * .3); B.mesh.scale.setScalar(1 + t * .3); A.mesh.rotation.z = B.mesh.rotation.z = t * 3; }, Ease.inn);
  Som.uau(); tremerTela(.25); fxBr.emitir(p.x, p.y, .6, { tam: 3, tamF: .3, vida: .45, cor: [1, .95, .8] });
  const ta = A.tipo, tb = B.tipo, r = kb.r, c = kb.c, f = t => t === 'fh' || t === 'fv';
  if (ta === 'disco' && tb === 'disco') {
    pecasG.remove(A.mesh); estourar(B); Jogo.grito('Arco-íris total!'); Som.explosao(true); tremerTela(.5);
    const maxD = Math.max(T.Nr, T.Nc);
    for (let d = 0; d <= maxD; d++) { todas().filter(k => Math.max(Math.abs(k.r - r), Math.abs(k.c - c)) === d).forEach(k => { atingir(k); const q = posCel(k.r, k.c); raioLuz(p, q, pega(COR_HEX)); }); await espera(.05); }
  } else if (ta === 'disco' || tb === 'disco') {
    const bola = ta === 'disco' ? A : B, outro = ta === 'disco' ? B : A; pecasG.remove(outro.mesh);
    await bolaArcoIris(bola, kb, corMaisComum(), outro.tipo === 'din' ? 'din' : 'f');
  } else if (f(ta) && f(tb)) {
    pecasG.remove(A.mesh); pecasG.remove(B.mesh); atingir(kb);
    await Promise.all([linhaFoguete(r, c, 'h'), linhaFoguete(r, c, 'v')]);
  } else if (ta === 'din' && tb === 'din') {
    pecasG.remove(A.mesh); pecasG.remove(B.mesh); Jogo.grito('Kabum!'); await explodir(r, c, 4);
  } else {
    pecasG.remove(A.mesh); pecasG.remove(B.mesh); atingir(kb);
    await Promise.all([-1, 0, 1].flatMap(d => [linhaFoguete(r + d, c, 'h', d !== 0), linhaFoguete(r, c + d, 'v', d !== 0)]));
  }
}

// ---------- jogadas ----------
function existeJogada() {
  for (const k of todas()) if (k.gema && k.gema.tipo !== 'n' && !k.corrente) return { esp: k };
  const cria = (r, c) => { const cor = corEm(r, c); if (cor < 0) return false; let h = 1, v = 1;
    for (let i = c - 1; corEm(r, i) === cor; i--) h++; for (let i = c + 1; corEm(r, i) === cor; i++) h++;
    for (let i = r - 1; corEm(i, c) === cor; i--) v++; for (let i = r + 1; corEm(i, c) === cor; i++) v++; return h >= 3 || v >= 3; };
  for (const a of todas()) {
    if (!movel(a)) continue;
    for (const b of [celula(a.r, a.c + 1), celula(a.r + 1, a.c)]) {
      if (!movel(b)) continue;
      [a.gema, b.gema] = [b.gema, a.gema]; const ok = cria(a.r, a.c) || cria(b.r, b.c); [a.gema, b.gema] = [b.gema, a.gema];
      if (ok) return { a, b };
    }
  }
  return null;
}
async function animTroca(ka, kb) {
  const ga = ka.gema, gb = kb.gema, pa = ga.mesh.position.clone(), pb = gb.mesh.position.clone();
  await Anim.add(.17, t => { ga.mesh.position.lerpVectors(pa, pb, t); gb.mesh.position.lerpVectors(pb, pa, t); ga.mesh.position.z = Math.sin(t * Math.PI) * .45; gb.mesh.position.z = -Math.sin(t * Math.PI) * .2; }, Ease.inOut);
  ga.mesh.position.z = gb.mesh.position.z = 0;
}
const trocar = (ka, kb) => { [ka.gema, kb.gema] = [kb.gema, ka.gema]; };
function inicioJogada() { T.cascata = 0; T.mov = { removidas: 0, especiais: 0 }; T.ocioso = 0; T.ofereceu = false; pararDica(); Jogo.esconderDica(); }
function gastar() { T.jogadas--; HUD.jogadas(); Resgate.jogada(); }
async function resolver(prefer = []) {
  for (let i = 0; i < 60; i++) {
    await processarFila(); await gravidade();
    const gr = acharGrupos(); if (!gr.length) { if (T.fila.length) continue; break; }
    T.cascata++; await limparGrupos(gr, prefer); prefer = [];
  }
}
async function tentarTroca(ka, kb) {
  if (T.ocupado || !T.ativo || !ka || !kb) return;
  if (!movel(ka) || !movel(kb)) { if (ka.gema) balancar(ka.gema.mesh); Som.nao(); return; }
  T.ocupado = true; desselecionar(); inicioJogada(); Som.troca();
  await animTroca(ka, kb); trocar(ka, kb);
  if (ka.gema.tipo !== 'n' || kb.gema.tipo !== 'n') { gastar(); await combo(ka, kb); await resolver(); }
  else if (acharGrupos().length) { gastar(); await resolver([ka, kb]); }
  else { Som.nao(); await animTroca(ka, kb); trocar(ka, kb); T.ocupado = false; return; }
  await fimJogada();
}
async function tocarEspecial(k) {
  if (T.ocupado || !T.ativo || !k.gema || k.gema.tipo === 'n' || k.corrente) return;
  T.ocupado = true; desselecionar(); inicioJogada(); gastar();
  k.gema.ativando = true; T.fila.push(k); await resolver(); await fimJogada();
}
async function fimJogada() {
  Jogo.reagirJogada();
  if (metasFeitas()) { await Jogo.vencer(); return; }
  if (T.jogadas <= 0) { Jogo.perder(); return; }
  if (!existeJogada()) await embaralhar();
  T.ocupado = false;
}
async function embaralhar() {
  Jogo.balao('Opa, sem jogadas! Vou embaralhar!'); await espera(.5);
  const ks = todas().filter(k => movel(k) && k.gema.tipo === 'n'), gs = ks.map(k => k.gema);
  for (let t = 0; t < 200; t++) {
    for (let i = gs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [gs[i], gs[j]] = [gs[j], gs[i]]; }
    ks.forEach((k, i) => k.gema = gs[i]);
    if (t > 120) gs.forEach(g => { g.cor = corAleatoria(); pecasG.remove(g.mesh); const pos = g.mesh.position.clone(); g.mesh = meshGema(g.cor, 'n'); g.mesh.position.copy(pos); pecasG.add(g.mesh); });
    if (!acharGrupos().length && existeJogada()) break;
  }
  await Promise.all(ks.map(k => { const m = k.gema.mesh, a = m.position.clone(), p = posCel(k.r, k.c); return Anim.add(.5, t => { m.position.set(lerp(a.x, p.x, t), lerp(a.y, p.y, t), Math.sin(t * Math.PI) * 1.2); m.rotation.z = t * Math.PI * 2; }, Ease.inOut); }));
}
async function festaReal() {
  if (T.jogadas > 0) { Jogo.grito('Festa Real!'); Jogo.balao('Jogadas que sobraram viram foguetes!'); await espera(.6); }
  while (T.jogadas > 0) {
    const ks = todas().filter(k => movel(k) && k.gema.tipo === 'n'); if (!ks.length) break;
    const k = pega(ks); T.jogadas--; HUD.jogadas(); virarEspecial(k.gema, Math.random() < .5 ? 'fh' : 'fv'); Som.especial(); pontuar(400);
    const p = posCel(k.r, k.c); fxBr.emitir(p.x, p.y, .5, { tam: 1.6, vida: .3 }); await espera(.12);
  }
  for (let i = 0; i < 25; i++) {
    const esp = todas().filter(k => k.gema && k.gema.tipo !== 'n' && !k.corrente); if (!esp.length) break;
    esp.forEach(k => { k.gema.ativando = true; T.fila.push(k); }); T.cascata = 0; await resolver();
  }
}

// melhor jogada para a dica: especial pronto, ou a troca que faz mais combinação, ajuda os objetivos e bate em obstáculos
function melhorJogada() {
  let best = null, bs = -1;
  const metaCor = new Set(T.metas.filter(m => m.t === 'cor' && m.falta > 0).map(m => m.cor));
  const linha = k => { const c = k.gema.cor; let h = 1, v = 1; for (let i = k.c - 1; corEm(k.r, i) === c; i--) h++; for (let i = k.c + 1; corEm(k.r, i) === c; i++) h++; for (let i = k.r - 1; corEm(i, k.c) === c; i--) v++; for (let i = k.r + 1; corEm(i, k.c) === c; i++) v++; return [h, v]; };
  for (const a of todas()) {
    if (a.gema && a.gema.tipo !== 'n' && !a.corrente && 12 > bs) { bs = 12; best = { esp: a }; }
    if (!movel(a)) continue;
    for (const b of [celula(a.r, a.c + 1), celula(a.r + 1, a.c)]) {
      if (!movel(b) || a.gema.tipo !== 'n' || b.gema.tipo !== 'n') continue;
      [a.gema, b.gema] = [b.gema, a.gema]; let sc = 0;
      for (const k of [a, b]) { const [h, v] = linha(k), m = Math.max(h, v); if (m < 3) continue; sc += m * (m >= 4 ? 3 : 1) + (h >= 3 && v >= 3 ? 6 : 0); if (metaCor.has(k.gema.cor)) sc += 3; if (k.gelo) sc += 3; for (const q of vizinhos(k)) if (q.bloco || q.corrente) sc += 3; }
      [a.gema, b.gema] = [b.gema, a.gema];
      if (sc > bs) { bs = sc; best = { a, b }; }
    }
  }
  return best;
}
// ---------- seleção, dica e animação parada ----------
function selecionar(k) { T.sel = k; Som.selecao(); }
function desselecionar() { if (T.sel && T.sel.gema) T.sel.gema.mesh.userData.int.scale.setScalar(1); T.sel = null; }
function pararDica() { if (T.dica) for (const k of [T.dica.a, T.dica.b, T.dica.esp]) if (k && k.gema) k.gema.mesh.userData.int.rotation.z = 0; T.dica = null; }
function tickTabuleiro(dt) {
  T.tempo += dt; const t = T.tempo;
  for (const k of todas()) {
    const g = k.gema; if (!g) continue; const int = g.mesh.userData.int;
    if (g.tipo === 'n') int.rotation.y = Math.sin(t * 1.3 + g.fase) * .3;
    else if (g.tipo === 'disco') { int.rotation.y += dt * 1.6; int.userData.aro.rotation.z += dt * 2; }
    else if (g.tipo === 'din') { const f = int.userData.faisca; f.scale.setScalar(.7 + Math.random() * .8); if (Math.random() < dt * 8) { const p = g.mesh.position; fxTab.emitir(p.x + .2, p.y + .45, .2, { vx: rnd(-.6, .6), vy: rnd(.3, 1.2), tam: .12, vida: .3, cor: [1, .8, .3] }); } int.rotation.y = Math.sin(t * 2 + g.fase) * .25; }
    else int.rotation.x = Math.sin(t * 3 + g.fase) * .2;
  }
  if (T.sel && T.sel.gema) { const s = 1.14 + Math.sin(t * 10) * .07; T.sel.gema.mesh.userData.int.scale.setScalar(s); }
  if (!T.ativo || T.ocupado) T.ocioso = 0; else T.ocioso += dt;
  if (T.ocioso > 7 && !T.ofereceu && (T.modo || 'joias') === 'joias') { T.ofereceu = true; Jogo.oferecerDica(); }
  if (T.ocioso > 16 && !T.dica && (T.modo || 'joias') === 'joias') { const j = existeJogada(); if (j) { T.dica = j; T.dicaT = 0; } }
  if (T.dica) {
    T.dicaT += dt; const w = Math.sin(T.dicaT * 14) * .3 * (T.dicaT % 1.1 < .7 ? 1 : 0);
    for (const k of [T.dica.a, T.dica.b, T.dica.esp]) if (k && k.gema) k.gema.mesh.userData.int.rotation.z = w;
    if (T.dicaT > 3.3) { pararDica(); T.ocioso = 2; }
  }
  if (T.tremor > 0 && camTab.userData.base) { T.tremor = Math.max(0, T.tremor - dt * .9); const a = T.tremor * .5; camTab.position.copy(camTab.userData.base).add(new V3(rnd(-a, a), rnd(-a, a), 0)); }
  else if (camTab.userData.base) camTab.position.copy(camTab.userData.base);
  MAT.disco.emissiveIntensity = .12 + Math.sin(t * 4) * .06;
  fxTab.tick(dt); fxBr.tick(dt); fxCaco.tick(dt);
}
