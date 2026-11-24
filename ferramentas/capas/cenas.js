// As capas dos jogos clássicos. As dos pinballs ficam em pinballs.js.
import * as THREE from 'three';
import { V, semear, sorte, entre, mat, verniz, metal, luz, tela, malha, esfera, caixa, relevo, letras, naipe3d, carta, estudio, infinito, fotografar, camera } from './base.js';
import { pinballGalaxia, galaticPinball } from './pinballs.js';

const W = 720, H = 900;
const X = '#ff5c78', O = '#3fd6c2', OURO = '#ffc34d', AZUL = '#6d7dff';
const tubo = (pts, r, m, n = 200) => malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 20), m);
const grao = (cor, forca = .06, esc = 1) => tela(512, 512, (c, w, h) => { c.fillStyle = cor; c.fillRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { c.fillStyle = `rgba(${sorte() < .5 ? '0,0,0' : '255,255,255'},${sorte() * forca})`; c.fillRect(sorte() * w, sorte() * h, esc, esc * (1 + sorte() * 2)); } });
function madeira(claro, escuro, veio) {
  return tela(1024, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, claro); g.addColorStop(.5, escuro); g.addColorStop(1, claro); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const y = sorte() * h, a = entre(4, 26); c.strokeStyle = veio + (.03 + sorte() * .13).toFixed(3) + ')'; c.lineWidth = entre(.5, 3.5); c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * .3, y + entre(-a, a), w * .6, y + entre(-a, a), w, y + entre(-a, a)); c.stroke(); }
    for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(40,16,0,${sorte() * .1})`; c.fillRect(sorte() * w, sorte() * h, entre(4, 22), 1); }
  });
}

// ---------- Jogo da Velha ----------
function velha(rapido) {
  const s = new THREE.Scene(); infinito(s, '#5a49d8', '#1a1250', { z: -5, cy: .5, r: .42 });
  const g = new THREE.Group(); s.add(g);
  const base = verniz('#2b2f8f', { roughness: .22 }), pad = verniz('#4650c8', { roughness: .3 });
  g.add(caixa(4.5, .5, 4.5, .22, base, 0, 0, 0));
  for (let i = 0; i < 9; i++) g.add(caixa(1.26, .26, 1.26, .11, pad, (i % 3 - 1) * 1.4, .25, (Math.floor(i / 3) - 1) * 1.4, 6));
  const mx = verniz(X, { roughness: .18 }), mo = verniz(O, { roughness: .18 });
  const xis = () => { const q = new THREE.Group(); for (const k of [-1, 1]) { const b = malha(new THREE.CapsuleGeometry(.155, .86, 16, 40), mx); b.rotation.z = k * Math.PI / 4; q.add(b); } q.rotation.x = -Math.PI / 2; return q; };
  const bola = () => malha(new THREE.TorusGeometry(.37, .15, 40, 100), mo);
  const põe = (o, c, l, y = .54) => { const q = new THREE.Group(); q.add(o); if (o.isMesh) o.rotation.x = Math.PI / 2; q.position.set((c - 1) * 1.4, y, (l - 1) * 1.4); g.add(q); return q; };
  põe(xis(), 0, 0); põe(xis(), 1, 1); põe(bola(), 2, 0); põe(bola(), 0, 1); põe(bola(), 1, 2);
  const cai = põe(xis(), 2, 2, 1.75); cai.rotation.set(.75, .5, -.35); cai.scale.setScalar(1.12);
  g.rotation.y = .3; g.position.y = .32;
  const c = camera(W, H, 29.5, [0, 10.6, 9.4], [.08, .6, .1]);
  return fotografar(s, c, { raio: 6, alvo: V(0, .6, 0), abertura: .08, chaves: [{ cor: 0xffe6cf, k: 2.7, pos: [-3, 5, 2.2], suave: .28 }, { cor: 0xff5fd0, k: 1.1, pos: [5, 2.4, -3], suave: .4 }], domo: { ceu: 0xa9b4ff, chao: 0x4a2f9a, k: 1.15 }, bloom: { f: .2, r: .6, l: .95 } }, W, H, rapido);
}

// ---------- Resta Um ----------
function restaUm(rapido) {
  const s = new THREE.Scene(); infinito(s, '#e9a15a', '#5a2413', { z: -5, r: .45 });
  const tex = madeira('#8a4a22', '#6b3214', 'rgba(30,8,0,'); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(.16, .16); tex.offset.set(.5, .5);
  const pau = verniz(0xffffff, { map: tex, roughness: .42, clearcoat: .9, clearcoatRoughness: .12 }), g = new THREE.Group(); s.add(g);
  // tabuleiro torneado, com calha em volta, e furos de verdade
  const forma = new THREE.Shape(); forma.absarc(0, 0, 3.02, 0, Math.PI * 2);
  const casas = []; for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (Math.abs(x) < 2 || Math.abs(y) < 2) casas.push([x, y]);
  for (const [x, y] of casas) { const f = new THREE.Path(); f.absarc(x * .72, y * .72, .27, 0, Math.PI * 2, true); forma.holes.push(f); }
  const tampo = malha(new THREE.ExtrudeGeometry(forma, { depth: .2, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 4, curveSegments: 60 }), pau); tampo.rotation.x = -Math.PI / 2; tampo.position.y = .1; g.add(tampo);
  g.add(malha(new THREE.CylinderGeometry(3.06, 3.06, .04, 128), verniz('#2c1208', { roughness: .6 }), 0, .09, 0));
  const aro = malha(new THREE.LatheGeometry([[2.9, .06], [3.06, .08], [3.12, .2], [3.2, .13], [3.34, .1], [3.48, .15], [3.56, .3], [3.64, .38], [3.76, .38], [3.84, .3], [3.86, .1], [3.8, -.14], [3.6, -.24], [0, -.24]].reverse().map(p => new THREE.Vector2(...p)), 160), pau); g.add(aro);
  // bolinhas de vidro com miolo colorido
  const cores = ['#ff3d6e', '#31c4ff', '#ffb52e', '#58e07a', '#b26bff', '#ff7a33', '#20d8c0'], vidro = mat({ color: 0xffffff, roughness: .02, transmission: 1, thickness: .5, ior: 1.46, clearcoat: 1, clearcoatRoughness: .01, specularIntensity: 1, envMapIntensity: 1.25 });
  const bolinha = (cor, r) => {
    const q = new THREE.Group(), m = vidro.clone(); m.attenuationColor = new THREE.Color(cor); m.attenuationDistance = .9; m.color.set(cor).lerp(new THREE.Color('#fff'), .62);
    q.add(malha(new THREE.SphereGeometry(r, 64, 48), m)); q.children[0].castShadow = false;
    const som = malha(new THREE.SphereGeometry(r * .62, 32, 24), mat({ color: cor })); som.material.colorWrite = false; som.material.depthWrite = false; q.add(som);
    for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14 - .5, a = t * 4.4 + k * 2.1; pts.push(V(Math.cos(a) * r * .34 * Math.cos(t * 2.6), t * r * 1.5, Math.sin(a) * r * .34 * Math.cos(t * 2.6))); } const f = tubo(pts, r * .17, mat({ color: k === 1 ? '#ffffff' : cor, roughness: .4, emissive: k === 1 ? '#ffffff' : cor, emissiveIntensity: .4 }), 60); f.castShadow = false; q.add(f); }
    q.rotation.set(entre(0, 3), entre(0, 3), entre(0, 3)); return q;
  };
  let n = 0; for (const [x, y] of casas) { if ((x === 0 && y === 0) || (x === 1 && y === 0) || (x === -1 && y === 2)) continue; const b = bolinha(cores[n++ * 5 % 7], .29); b.position.set(x * .72, .5, -y * .72); g.add(b); }
  for (let i = 0; i < 9; i++) { const a = 1.0 + i * .19, b = bolinha(cores[i % 7], .22); b.position.set(Math.cos(a) * 3.34, .32, Math.sin(a) * 3.34); g.add(b); }
  // a última bolinha, dourada, saltando
  const ouro = bolinha('#ffc23d', .4); ouro.position.set(.1, 1.62, .25); g.add(ouro);
  g.rotation.y = .35; g.position.y = .25;
  const c = camera(W, H, 33, [0, 9.6, 10.6], [0, .35, .05]);
  return fotografar(s, c, { raio: 5.4, alvo: V(0, .4, 0), abertura: .09, foco: 13.6, chaves: [{ cor: 0xffe2bd, k: 3, pos: [-4, 5, 1.5], suave: .25 }, { cor: 0xff9a60, k: .9, pos: [4, 2, -4], suave: .4 }], domo: { ceu: 0xffe9d2, chao: 0x7a3a18, k: .95 }, bloom: { f: .28, r: .5, l: .9 }, amostras: 160 }, W, H, rapido);
}

// ---------- Paciência ----------
function paciencia(rapido) {
  const s = new THREE.Scene(); const f = infinito(s, '#1f9a5c', '#04291d', { z: -4.5, r: .4, rough: .95 }); f.material.bumpMap = grao('#808080', .5); f.material.bumpMap.wrapS = f.material.bumpMap.wrapT = THREE.RepeatWrapping; f.material.bumpMap.repeat.set(5, 5); f.material.bumpScale = .5; f.material.envMapIntensity = .12;
  // leque
  const g = new THREE.Group(); s.add(g);
  [['10', 1], ['J', 3], ['Q', 2], ['K', 1], ['A', 0]].forEach(([v, n], i) => { const q = new THREE.Group(), k = carta(v, n, .12); k.position.y = 1.75; q.add(k); q.position.set(0, -1.05, i * .05); q.rotation.z = (1.7 - i) * .27; g.add(q); });
  g.scale.setScalar(1.5); g.position.set(-.25, 1.6, -.55); g.rotation.x = -.1;
  // espadas gigante e polida na frente
  const e = naipe3d(0, { alt: 2.0, prof: .42, chanfro: .13, frente: metal('#ffc857', .2, { clearcoat: 1, clearcoatRoughness: .06 }) }); e.position.set(.92, .86, 1.75); e.rotation.set(-.16, -.36, 0); s.add(e);
  const fio = naipe3d(0, { alt: 2.1, prof: .2, chanfro: .07, frente: verniz('#14172a', { roughness: .15 }) }); fio.position.copy(e.position); fio.rotation.copy(e.rotation); s.add(fio);
  // cartas voando
  [['7', 1, -2.35, 3.95, -.9, .5, .9, -.7], ['4', 3, 2.45, 4.35, -1.1, -.5, -.8, .6], ['9', 2, -1.75, .42, 1.55, -1.32, .1, .55], ['2', 1, 2.5, 1.9, -1.2, .3, -1, -.5]].forEach(([v, n, x, y, z, rx, ry, rz]) => { const k = carta(v, n, .3); k.position.set(x, y, z); k.rotation.set(rx, ry, rz); k.scale.setScalar(1.15); s.add(k); });
  // fichas
  const ficha = (cor, x, y, z) => { const t = tela(512, 512, (c, w) => { c.fillStyle = cor; c.fillRect(0, 0, w, w); c.translate(w / 2, w / 2); c.fillStyle = '#f7f3e6'; for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); c.fillRect(-26, -260, 52, 74); c.restore(); } c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fill(); c.fillStyle = cor; c.beginPath(); c.arc(0, 0, 134, 0, 7); c.fill(); }), lado = tela(512, 32, (c, w, h) => { c.fillStyle = cor; c.fillRect(0, 0, w, h); c.fillStyle = '#f7f3e6'; for (let i = 0; i < 8; i++) c.fillRect(i * 64 + 20, 0, 24, h); }); const m = malha(new THREE.CylinderGeometry(.46, .46, .13, 80), [verniz(0xffffff, { map: lado, roughness: .5, clearcoat: .4 }), verniz(0xffffff, { map: t, roughness: .5, clearcoat: .4 }), verniz(cor)], x, y, z); m.rotation.y = sorte() * 6; s.add(m); };
  for (let i = 0; i < 4; i++) ficha('#c8142f', -1.15 + entre(-.04, .04), .07 + i * .135, 2.35 + entre(-.04, .04)); for (let i = 0; i < 2; i++) ficha('#1e47c8', -.2 + entre(-.04, .04), .07 + i * .135, 2.75 + entre(-.04, .04));
  const c = camera(W, H, 30, [.2, 3.3, 11.8], [.1, 2.12, 0]);
  return fotografar(s, c, { raio: 6, alvo: V(0, 1.8, 0), abertura: .1, foco: 11.2, chaves: [{ cor: 0xfff0d8, k: 3, pos: [-3.4, 5, 4], suave: .25 }, { cor: 0x7affc0, k: .8, pos: [5, 3, -3], suave: .4 }], domo: { ceu: 0xe0f0ff, chao: 0x0d5a3a, k: .8 }, bloom: { f: .18, r: .5, l: 1 } }, W, H, rapido);
}

// ---------- FreeCell ----------
function freecell(rapido) {
  const s = new THREE.Scene(); infinito(s, '#3a6cff', '#0a1550', { z: -4.5, r: .42 });
  const verm = verniz('#e0142f', { roughness: .16 }), preto = verniz('#2a3152', { roughness: .2, metalness: .25 }), ouro = metal('#f2bb4e', .2);
  // quatro células douradas com cartas
  const vidro = mat({ color: '#9cc4ff', roughness: .15, transparent: true, opacity: .16, clearcoat: 1 });
  [['A', 0], ['K', 1], null, ['Q', 3]].forEach((k, i) => {
    const q = new THREE.Group(), borda = new THREE.Shape(), r = .14; const rr = (p, w, h, e) => { p.moveTo(-w + e, -h); p.lineTo(w - e, -h); p.quadraticCurveTo(w, -h, w, -h + e); p.lineTo(w, h - e); p.quadraticCurveTo(w, h, w - e, h); p.lineTo(-w + e, h); p.quadraticCurveTo(-w, h, -w, h - e); p.lineTo(-w, -h + e); p.quadraticCurveTo(-w, -h, -w + e, -h); };
    rr(borda, .56, .76, r); const furo = new THREE.Path(); rr(furo, .5, .7, r * .8); borda.holes.push(furo);
    q.add(malha(new THREE.ExtrudeGeometry(borda, { depth: .07, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 4, curveSegments: 16 }), ouro, 0, 0, -.05)); const p = malha(new THREE.PlaneGeometry(1, 1.4), vidro, 0, 0, -.04); p.castShadow = false; q.add(p);
    if (k) { const c = carta(...k); c.scale.setScalar(.97); c.position.z = .03; q.add(c); }
    q.position.set((i - 1.5) * 1.26, 3.45, -.6 - Math.abs(i - 1.5) * -.16); q.rotation.y = (1.5 - i) * .16; s.add(q);
  });
  // carta escorregando para a célula livre
  { const c = carta('J', 2, .25); c.position.set(.95, 2.3, .5); c.rotation.set(-.28, .3, -.3); s.add(c); }
  // naipes gigantes
  const n = (k, m, x, y, z, ry, a = 1.5) => { const o = naipe3d(k, { alt: a, prof: .34, chanfro: .12, frente: m }); o.position.set(x, y, z); o.rotation.set(-.14, ry, 0); s.add(o); const f = naipe3d(k, { alt: a * 1.05, prof: .14, chanfro: .06, frente: ouro }); f.position.copy(o.position); f.rotation.copy(o.rotation); s.add(f); };
  n(3, preto, -1.85, .84, .5, .42, 1.7); n(1, verm, -.72, .82, 1.5, .2, 1.65); n(0, preto, .78, .8, 1.6, -.2, 1.6); n(2, verm, 1.95, .84, .6, -.42, 1.7);
  const c = camera(W, H, 29, [0, 3.6, 12], [0, 2.02, 0]);
  return fotografar(s, c, { raio: 6, alvo: V(0, 1.8, 0), abertura: .07, foco: 11.4, chaves: [{ cor: 0xfff0dc, k: 2.7, pos: [-3, 5, 4], suave: .25 }, { cor: 0x58a0ff, k: 1.4, pos: [5, 3, -3], suave: .4 }], domo: { ceu: 0xcfe0ff, chao: 0x1c2f9a, k: 1 }, bloom: { f: .2, r: .5, l: 1 } }, W, H, rapido);
}

// ---------- Palavras Cruzadas ----------
function cruzadas(rapido) {
  const s = new THREE.Scene(), tex = madeira('#b5713a', '#96552a', 'rgba(50,18,0,'); tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping; tex.repeat.set(2, 2);
  const mesa = malha(new THREE.PlaneGeometry(30, 30), verniz(0xffffff, { map: tex, roughness: .5, clearcoat: .5, clearcoatRoughness: .25 })); mesa.rotation.x = -Math.PI / 2; s.add(mesa);
  const g = new THREE.Group(); s.add(g);
  const marfim = verniz('#fff4dc', { roughness: .35, clearcoat: .6 }), dourada = verniz('#ffc23a', { roughness: .3, clearcoat: .8 }), tinta = mat({ color: '#1d2352', roughness: .35, clearcoat: .6 });
  const peca = (l, x, y, z, m = marfim, sob) => { const q = new THREE.Group(); q.add(caixa(.94, .34, .94, .09, m, 0, .17, 0, 6)); const t = letras(l, { alt: .58, prof: .03, chanfro: .012, frente: sob || tinta, fonte: 'Georgia,serif', peso: 700, tam: 160 }); t.rotation.x = -Math.PI / 2; t.position.set(0, .36, .01); q.add(t); q.position.set(x, y, z); g.add(q); return q; };
  [...'JOGA'].forEach((l, i) => peca(l, i - 2, 0, 0, dourada)); [...'PALAVRA'].forEach((l, i) => { if (i !== 3) peca(l, 1, 0, i - 3); });
  [...'LETRA'].forEach((l, i) => { if (i !== 3) peca(l, i - 2, 0, 2); }); [...'DICA'].forEach((l, i) => { if (i !== 3) peca(l, i - 2, 0, -2); });
  { const a = peca('R', 2.25, 1.2, .1, dourada); a.rotation.set(.3, .25, -.35); }
  g.rotation.y = .3; g.position.set(.1, 0, .1);
  // lápis
  { const q = new THREE.Group(), am = verniz('#f2a71b', { roughness: .3 }), L = 5;
    const corpo = malha(new THREE.CylinderGeometry(.2, .2, L, 6), am); corpo.geometry = corpo.geometry.toNonIndexed(); corpo.geometry.computeVertexNormals(); q.add(corpo);
    q.add(malha(new THREE.CylinderGeometry(.2, .065, .5, 40), mat({ color: '#e8c08a', roughness: .7 }), 0, -L / 2 - .25, 0), malha(new THREE.ConeGeometry(.066, .18, 30).rotateX(Math.PI), mat({ color: '#222', roughness: .35 }), 0, -L / 2 - .59, 0), malha(new THREE.CylinderGeometry(.212, .212, .42, 50), metal('#cfd4dc', .25), 0, L / 2 + .2, 0), malha(new THREE.CapsuleGeometry(.19, .2, 16, 40), mat({ color: '#f07a8c', roughness: .7 }), 0, L / 2 + .5, 0));
    for (const y of [.08, .2, .32]) { const a = malha(new THREE.TorusGeometry(.215, .016, 10, 60), metal('#9aa2ae', .3), 0, L / 2 + y, 0); a.rotation.x = Math.PI / 2; q.add(a); }
    q.position.set(-2.1, .2, 2.75); q.rotation.set(Math.PI / 2, 0, 0); const r = new THREE.Group(); r.add(q); q.position.set(0, .2, 0); r.position.set(-2.72, 0, 3.75); r.rotation.y = -.12; s.add(r); }
  const c = camera(W, H, 33, [0, 11.8, 7.2], [.02, 0, .05]);
  return fotografar(s, c, { raio: 6.4, alvo: V(0, .3, 0), abertura: .12, foco: 13.2, chaves: [{ cor: 0xffdcae, k: 3.3, pos: [-4, 3.4, -2.4], suave: .16 }, { cor: 0x9ab8ff, k: .5, pos: [4, 4, 3], suave: .4 }], domo: { ceu: 0xfff0dd, chao: 0x7a4a24, k: .85 }, bloom: { f: .15, r: .5, l: 1 }, vinheta: .5 }, W, H, rapido);
}

// ---------- Caça-Palavras ----------
function cacaPalavras(rapido) {
  const s = new THREE.Scene(); infinito(s, '#20b8a6', '#06423f', { z: -30, r: .6 });
  const L = ['BOXELMA', 'SOLUTAR', 'PEIGATO', 'DRTINHE', 'CASAUMS', 'LUARFIP', 'VOTEMRA', 'ZINCOAB', 'MARESUK'], cor = mat({ color: '#143049', roughness: .6 }), branca = mat({ color: '#ffffff', roughness: .3, clearcoat: .7 });
  const g = new THREE.Group(); s.add(g); const P = [];
  g.add(caixa(7.6, .4, 9.6, .18, verniz('#fff0d2', { roughness: .5, clearcoat: .3 }), 0, 0, 0));
  L.forEach((t, j) => [...t].forEach((l, i) => { const marc = j === 2 && i >= 3, o = letras(l, { alt: .62, prof: .1, chanfro: .03, frente: marc ? branca : cor, tam: 170 }); o.rotation.x = -Math.PI / 2; o.position.set(i - 3, marc ? .5 : .25, j - 4); g.add(o); P.push(o); }));
  // cápsula brilhante sobre a palavra GATO
  { const m = malha(new THREE.CapsuleGeometry(.5, 3, 30, 60), verniz('#ff3f7f', { roughness: .2 })); m.rotation.z = Math.PI / 2; m.scale.set(1, 1, 1); m.scale.x = .42; m.position.set(1.5, .27, -2); g.add(m); }
  { const m = malha(new THREE.CapsuleGeometry(.48, 3, 30, 60), verniz('#3fd6c2', { roughness: .2 })); m.rotation.z = Math.PI / 2; m.scale.x = .2; m.position.set(-1.5, .2, 0); g.add(m); }
  // lupa
  let lente, lupa;
  { const q = new THREE.Group(), R = 1.95, ouro = metal('#f0b64a', .16);
    const aro = malha(new THREE.TorusGeometry(R, .16, 40, 160), ouro); aro.rotation.x = Math.PI / 2; q.add(aro);
    const aro2 = malha(new THREE.TorusGeometry(R - .06, .1, 30, 160), metal('#b9802a', .25)); aro2.rotation.x = Math.PI / 2; aro2.position.y = -.1; q.add(aro2);
    lente = malha(new THREE.CircleGeometry(R - .06, 96), new THREE.ShaderMaterial({ uniforms: { t: { value: null }, c: { value: new THREE.Vector2() }, tam: { value: new THREE.Vector2() } }, vertexShader: 'varying vec2 u; void main(){ u = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform sampler2D t; uniform vec2 c, tam; varying vec2 u; void main(){ float r = length(u); vec2 p = gl_FragCoord.xy / tam; float z = mix(.86, 1.1, pow(r, 6.)); vec3 k = texture2D(t, c + (p - c) * z).rgb; float b = smoothstep(.95, .3, length(u - vec2(-.35, .45))) * .05; gl_FragColor = vec4(k * (1.04 - .22 * pow(r, 6.)) + b, 1.); }' })); lente.rotation.x = -Math.PI / 2; lente.castShadow = false; q.add(lente);
    const casca = malha(new THREE.SphereGeometry(R, 96, 64).scale(1, .22, 1), mat({ color: 0x000000, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, roughness: .02, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2 })); casca.castShadow = false; q.add(casca); lupa = { malha: lente, esconder: [lente, casca] };
    const cabo = malha(new THREE.CylinderGeometry(.1, .13, .6, 40), ouro, 0, 0, R + .4); cabo.rotation.x = Math.PI / 2; q.add(cabo);
    const pega = malha(new THREE.CapsuleGeometry(.25, 1.7, 20, 60), verniz('#5a1d12', { roughness: .25 }), 0, 0, R + 1.75); pega.rotation.x = Math.PI / 2; q.add(pega);
    for (const z of [.72, 2.82]) { const a = malha(new THREE.TorusGeometry(.2, .08, 20, 60), ouro, 0, 0, R + z); q.add(a); }
    q.position.set(1.3, 1.5, -1.4); q.rotation.set(.06, .3, -.06); g.add(q); }
  g.rotation.y = .3;
  const c = camera(W, H, 31, [0, 13.2, 6.6], [.15, 0, -.75]);
  return fotografar(s, c, { raio: 7, alvo: V(0, .4, 0), abertura: .12, foco: 13.9, chaves: [{ cor: 0xfff0d8, k: 2.6, pos: [-4, 4.5, -1.5], suave: .2 }, { cor: 0x70fff0, k: .5, pos: [4, 3, 3], suave: .4 }], domo: { ceu: 0xeafcff, chao: 0x2a7a78, k: 1 }, bloom: { f: .2, r: .5, l: 1 }, lupa, exposicao: 1.02 }, W, H, rapido);
}

// ---------- Dobro ----------
function dobro(rapido) {
  const s = new THREE.Scene(); infinito(s, '#ffb050', '#a3154e', { z: -4.5, r: .5 });
  const g = new THREE.Group(); s.add(g);
  const bloco = (v, cor, x, y, z, t = 1.3, ry = 0, emi = 0) => {
    const q = new THREE.Group(); q.add(caixa(t, t, t, t * .16, verniz(cor, { roughness: .22, emissive: cor, emissiveIntensity: emi }), 0, 0, 0));
    const a = t * [0, .78, .62, .47, .36][String(v).length], o = { alt: a, prof: .02, chanfro: .02, frente: verniz('#ffffff', { roughness: .2, emissive: '#ffffff', emissiveIntensity: .12 }) };
    const f = letras(String(v), o); f.position.set(0, -.03, t / 2); q.add(f); const d = letras(String(v), v > 99 ? { ...o, alt: a * .86 } : o); d.position.set(t / 2, -.03, 0); d.rotation.y = Math.PI / 2; q.add(d); const c = letras(String(v), o); c.position.y = t / 2; c.rotation.x = -Math.PI / 2; q.add(c);
    q.position.set(x, y, z); q.rotation.y = ry; g.add(q); return q;
  };
  bloco(2, '#6d7dff', -1.5, .65, .9, 1.3, .12); bloco(4, '#ff4f78', 0, .65, 1.1, 1.3, -.06); bloco(8, '#1fc4ae', 1.5, .65, .85, 1.3, -.16);
  bloco(16, '#a24bff', -.8, .65, -.6, 1.3, .05); bloco(32, '#2c9bff', .75, .65, -.65, 1.3, -.05);
  bloco(64, '#ff6a2a', -.75, 1.96, .25, 1.3, .22); bloco(128, '#e83fa8', .72, 1.96, .2, 1.3, -.12);
  const topo = bloco(256, '#ffb114', .02, 3.5, .2, 1.5, .3, .12); topo.rotation.set(.22, .38, -.14);
  const p1 = bloco(2, '#6d7dff', -1.75, 3.6, -.6, .62); p1.rotation.set(.5, .6, .4); const p2 = bloco(4, '#ff4f78', 1.85, 3.0, -.4, .62); p2.rotation.set(-.3, -.5, .5); const p3 = bloco(8, '#1fc4ae', 1.4, 4.75, -1, .56); p3.rotation.set(.6, -.6, -.4);
  g.rotation.y = -.32; g.position.y = .02;
  const c = camera(W, H, 28, [0, 4.8, 13.4], [.1, 2.35, 0]);
  return fotografar(s, c, { raio: 6, alvo: V(0, 1.8, 0), abertura: .09, foco: 12.8, chaves: [{ cor: 0xfff0dc, k: 2.5, pos: [-3.5, 5, 4], suave: .28 }, { cor: 0xff7ab0, k: 1.1, pos: [5, 3, -3], suave: .4 }], domo: { ceu: 0xffe9d8, chao: 0xa0305a, k: 1.1 }, bloom: { f: .2, r: .6, l: .95 } }, W, H, rapido);
}

const CENAS = {
  velha, 'resta-um': restaUm, paciencia, freecell, cruzadas, 'caca-palavras': cacaPalavras, dobro,
  pinball: r => pinballGalaxia(W, H, r), 'pinball-show': r => galaticPinball(W, H, r), 'pinball-show-larga': r => galaticPinball(1200, 750, r),
};
export const NOMES = Object.keys(CENAS);
export async function capa(nome, rapido) { semear(11); Math.random = sorte; await document.fonts.ready; return CENAS[nome](rapido); }
