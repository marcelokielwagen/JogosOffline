// Astronauta flutuando, ônibus espacial e o cabo que liga os dois (tudo modelado por código).
import * as THREE from 'three';
import { membro, torno, bola, caixaArred, fundir, tela } from './modelagem.js';

const fis = ({ clearcoat, clearcoatRoughness, sheen, sheenColor, ...o }) => new THREE.MeshStandardMaterial(o);
const metal = (cor, r = .25) => new THREE.MeshStandardMaterial({ color: cor, metalness: 1, roughness: r });
const luz = (cor, k = 2) => new THREE.MeshStandardMaterial({ color: 0, emissive: cor, emissiveIntensity: k });
const linear = t => { t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

// ---------- Astronauta (uns 100 de altura, centro no peito, de frente para +Z) ----------
export function criarAstronauta() {
  const g = new THREE.Group();
  const dobras = linear(tela(256, 256, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const y = Math.random() * h, a = 3 + Math.random() * 9, l = c.createLinearGradient(0, y - a, 0, y + a); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(.5, Math.random() < .5 ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)'); l.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = l; c.save(); c.translate(Math.random() * w, 0); c.rotate(Math.random() * .3 - .15); c.fillRect(-w, y - a, w * 2, a * 2); c.restore(); }
    for (let i = 0; i < 2600; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)'; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  }));
  dobras.repeat.set(2, 3);
  const pano = fis({ color: 0xf3f1ea, roughness: .82, bumpMap: dobras, bumpScale: 2.2, sheen: .4, sheenColor: new THREE.Color(0xffffff) });
  const casca = fis({ color: 0xf6f6f4, roughness: .32, clearcoat: .6, clearcoatRoughness: .2 });
  const cinza = fis({ color: 0x8d939e, roughness: .6, bumpMap: dobras, bumpScale: 1.2 });
  const escuro = fis({ color: 0x1c1f26, roughness: .45 }), verm = fis({ color: 0xd0202c, roughness: .6 }), aco = metal(0xd5dae4), ouro = metal(0xe0a83a, .2);
  const ringo = (r, e, m, p, n) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, e, 10, 36), m); t.position.set(...p); t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...n).normalize()); t.castShadow = true; g.add(t); return t; };
  const cx = (w, h, d, r, m, x, y, z, ry = 0) => { const b = caixaArred(w, h, d, r, m); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); return b; };
  // tronco
  g.add(torno([[-19, 8.6, 7.4], [-14, 11, 9], [-8, 10.8, 8.6], [-3, 11.6, 9], [6, 13.4, 9.8], [13, 13.6, 9.4], [18, 10.4, 8.2], [21, 8, 7.6]], pano, { n: 44, seg: 40, onda: (a, t) => 1 + (t < .42 ? Math.sin(t * 90) * .018 : 0) }));
  ringo(11, 1.5, aco, [0, -5.5, 0], [0, 1, 0]).scale.set(1, .8, 1);
  g.add(torno([[-3.4, 12, 9.4], [4, 13.8, 10.2], [12, 14, 9.8], [17, 11.4, 8.8]], casca, { n: 16, seg: 40 }));
  ringo(8.4, 1.7, aco, [0, 20.6, 0], [0, 1, 0]);
  // módulo de controle no peito
  cx(15, 10, 5, 1.6, casca, 0, 6, 11); cx(11, 3, 1, .6, escuro, 0, 8.6, 13.9);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.4, 16), [verm, aco, ouro, aco][i]); b.rotation.x = Math.PI / 2; b.position.set(-4.8 + i * 3.2, 4, 14); g.add(b); }
  { const l = new THREE.Mesh(new THREE.BoxGeometry(6, 1, .4), luz(0x4dffb0, 2)); l.position.set(-1.4, 8.6, 14.6); g.add(l); const l2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, .4), luz(0xff5040, 2)); l2.position.set(4, 8.6, 14.6); g.add(l2); }
  // mangueiras
  for (const s of [-1, 1]) { g.add(membro([[s * 6, 2, 13], [s * 10, -5, 13.5], [s * 13, 0, 8], [s * 12.4, 8, -3]], [1.1, 1.1, 1.1], s > 0 ? cinza : escuro, { n: 24, seg: 10, anel: t => 1 + .12 * Math.sin(t * 90) })); }
  // emblemas
  const emblema = (x, y, z, r, ry, cor) => { const t = tela(128, 128, c => { c.fillStyle = '#10204a'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.strokeStyle = cor; c.lineWidth = 7; c.beginPath(); c.arc(64, 64, 57, 0, 7); c.stroke(); c.fillStyle = '#ffb84a'; c.beginPath(); c.arc(58, 70, 24, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.save(); c.translate(58, 70); c.rotate(-.5); c.scale(1, .3); c.beginPath(); c.arc(0, 0, 40, 0, 7); c.stroke(); c.restore(); c.fillStyle = '#fff'; for (const [a, b] of [[94, 34], [104, 60], [30, 30]]) c.fillRect(a, b, 5, 5); }); const m = new THREE.Mesh(new THREE.CircleGeometry(r, 30), new THREE.MeshStandardMaterial({ map: t, roughness: .7, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
  emblema(-8.6, 14.4, 8.7, 2.8, -.5, '#d0202c');
  { const t = tela(256, 64, c => { c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#1a2a5c'; c.font = '900 44px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GALATIC', 128, 34); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.3), new THREE.MeshStandardMaterial({ map: t, roughness: .8 })); m.position.set(6.4, 14, 9.6); m.rotation.y = .32; g.add(m); }
  // mochila
  cx(25, 36, 11, 3, casca, 0, 4, -14.5); cx(20, 6, 3, 1.4, cinza, 0, 18, -21); cx(8, 12, 2.6, 1, cinza, -6, 2, -21); cx(8, 12, 2.6, 1, cinza, 6, 2, -21); cx(22, 2, 12.6, .9, verm, 0, -9, -14.5);
  for (const s of [-1, 1]) { const j = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 5, 16), aco); j.position.set(s * 14, -11, -15); j.rotation.z = s * .9; g.add(j); g.add(membro([[s * 9, 19, -6], [s * 10, 20, 0], [s * 9, 16, 7.4], [s * 8, 8, 9.6]], [1.3, 1.5, 1.5, 1.3], cinza, { n: 18, seg: 10, achat: 1.5 })); }
  // capacete: casca branca, visor dourado espelhado, lanternas e câmera
  const cab = new THREE.Group(); cab.position.set(0, 29.5, .8); g.add(cab);
  const bolha = new THREE.Mesh(new THREE.SphereGeometry(11.4, 48, 36), casca); bolha.scale.set(1, 1.04, 1.02); bolha.castShadow = true; cab.add(bolha);
  const vg = new THREE.SphereGeometry(11.75, 48, 36, Math.PI * .08, Math.PI * .84, Math.PI * .27, Math.PI * .4);
  const visor = new THREE.Mesh(vg, fis({ color: 0xffb23a, metalness: 1, roughness: .035, envMapIntensity: 2.6, clearcoat: 1, emissive: 0x402000, emissiveIntensity: .5 })); visor.scale.set(1, 1.04, 1.02); cab.add(visor);
  for (const [y, r] of [[7.8, 9], [-4.1, 11.2]]) { const a = new THREE.Mesh(new THREE.TorusGeometry(r, .7, 10, 44, Math.PI * .9), cinza); a.rotation.set(Math.PI / 2, 0, Math.PI * .05); a.position.y = y; cab.add(a); }
  for (const s of [-1, 1]) { const b = caixaArred(3, 7, 6, 1, casca); b.position.set(s * 11.8, 4, 1); cab.add(b); const l = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), luz(0xd8ecff, 2.6)); l.scale.z = .5; l.position.set(s * 11.8, 5.6, 4.6); cab.add(l); }
  { const b = caixaArred(6, 3, 5, 1, escuro); b.position.set(0, 12.6, 2); cab.add(b); const l = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), luz(0xff3040, 2.4)); l.position.set(0, 12.6, 5); cab.add(l); }
  // mão em "hang loose": polegar e mindinho abertos, os três do meio dobrados
  function mao(s) {
    const m = new THREE.Group(), luva = fis({ color: 0xe9e7e0, roughness: .7, bumpMap: dobras, bumpScale: .8 }), ponta = fis({ color: 0x9aa4b4, roughness: .6 });
    m.add(bola(3.7, luva, 0, 4, 0, 1, 1.12, .66));
    m.add(membro([[s * 2.4, 2.6, .4], [s * 5.6, 5, .9], [s * 8.4, 8.6, 1]], [1.5, 1.35, 1.15], luva)); m.add(bola(1.2, ponta, s * 8.5, 8.9, 1));
    m.add(membro([[-s * 2.6, 6.2, 0], [-s * 5.2, 9.4, .2], [-s * 7, 12.8, .2]], [1.25, 1.15, 1], luva)); m.add(bola(1.05, ponta, -s * 7.1, 13.1, .2));
    for (let i = 0; i < 3; i++) m.add(membro([[-s * (1.9 - i * 1.9), 7.4, .4], [-s * (1.9 - i * 1.9), 8.6, 2.2], [-s * (1.8 - i * 1.8), 6.6, 3.5], [-s * (1.7 - i * 1.7), 4.8, 2.6]], [1.35, 1.35, 1.25, 1.1], luva, { n: 10 }));
    const p = new THREE.Mesh(new THREE.TorusGeometry(3.1, .9, 10, 30), metal(0xc8ccd8)); p.rotation.x = Math.PI / 2; m.add(p);
    const f = new THREE.Mesh(new THREE.TorusGeometry(3.4, .7, 8, 30), verm); f.rotation.x = Math.PI / 2; f.position.y = -2.4; m.add(f);
    fundir(m); return m;
  }
  // braços (cada um gira no ombro)
  const bracos = [-1, 1].map(s => {
    const o = new THREE.Group(); o.position.set(s * 12.4, 13.5, 0);
    const alto = s > 0;
    const pts = alto ? [[0, 0, 0], [8, 3, 2], [15, 9, 5], [17, 19, 8], [18, 27, 10]] : [[0, 0, 0], [-8, -2, 3], [-16, -1, 8], [-21, 8, 13], [-24, 15, 16]];
    const prega = t => 1 + .03 * Math.abs(Math.sin(t * 24)) + (t > .42 && t < .56 ? .06 : 0);
    o.add(membro(pts, [5.6, 5.1, 4.8, 4.3, 3.5], pano, { n: 40, seg: 18, anel: prega }));
    for (const k of [.14, .3]) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .5), a = new THREE.Mesh(new THREE.TorusGeometry(k < .2 ? 5.7 : 5.3, .9, 10, 30), k < .2 ? aco : verm); a.position.copy(c.getPointAt(k)); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.getTangentAt(k)); o.add(a); }
    const h = mao(s), fim = pts[pts.length - 1]; h.position.set(...fim); h.rotation.set(.25, alto ? -.35 : .5, alto ? -.1 : .35); h.scale.setScalar(1.12); o.add(h);
    g.add(o); fundir(o);
    return { o, h, lado: s };
  });
  // pernas dobradas, flutuando
  const pernas = [-1, 1].map(s => {
    const o = new THREE.Group(); o.position.set(s * 5.4, -16, 0);
    const f = s > 0 ? [[0, 0, 0], [2, -11, 7], [3.4, -20, 10], [4, -30, 2], [4.6, -37, -5]] : [[0, 0, 0], [-2, -12, 4], [-4, -22, 4], [-5, -33, -4], [-5.4, -41, -11]];
    o.add(membro(f, [7.2, 6.6, 5.9, 5.5, 4.8], pano, { n: 46, seg: 18, anel: t => 1 + .032 * Math.abs(Math.sin(t * 20)) }));
    const c = new THREE.CatmullRomCurve3(f.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .5);
    for (const [k, m, r] of [[.16, aco, 7.1], [.3, verm, 6.7], [.9, aco, 5.2]]) { const a = new THREE.Mesh(new THREE.TorusGeometry(r, .9, 10, 32), m); a.position.copy(c.getPointAt(k)); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.getTangentAt(k)); o.add(a); }
    const j = caixaArred(8, 9, 3, 1.6, cinza); j.position.copy(c.getPointAt(.52)); j.position.z += 4.6; j.rotation.x = .2; o.add(j);
    const bp = f[f.length - 1]; const bota = membro([[bp[0], bp[1] + 1, bp[2] - 2], [bp[0], bp[1] - 4, bp[2] + 1], [bp[0] + s * .6, bp[1] - 6, bp[2] + 8]], [5, 5.4, 4.2], casca); o.add(bota);
    const sola = membro([[bp[0], bp[1] - 7.6, bp[2] - 2], [bp[0] + s * .6, bp[1] - 9.4, bp[2] + 8]], [4.6, 4.2], cinza, { achat: 1.1 }); sola.scale.y = 1; o.add(sola);
    g.add(o); fundir(o); return { o, lado: s };
  });
  fundir(g); fundir(cab);
  return { g, cab, bracos, pernas };
}

// ---------- Ônibus espacial (nariz em -X, uns 200 de comprimento) ----------
export function criarNave() {
  const g = new THREE.Group();
  // pintura: u em volta (0 = barriga, .5 = teto), v ao longo (0 = nariz)
  const W = 1024, H = 2048;
  const pintura = tela(W, H, c => {
    c.fillStyle = '#f4f3f0'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { const k = Math.random(); c.fillStyle = `rgba(${k < .5 ? '120,120,130' : '255,255,255'},${Math.random() * .09})`; c.fillRect(x, y, 15, 15); }
    c.strokeStyle = 'rgba(90,95,110,.16)'; c.lineWidth = 1; for (let y = 0; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    const Y = v => H * (1 - v), X = u => W * u;                 // v cresce do nariz para a cauda
    // barriga e nariz pretos (placas térmicas)
    c.fillStyle = '#17181c'; for (const s of [0, 1]) { c.beginPath(); c.moveTo(s ? W : 0, 0); c.lineTo(s ? X(.79) : X(.21), 0); c.lineTo(s ? X(.79) : X(.21), Y(.2)); c.lineTo(s ? X(.72) : X(.28), Y(.1)); c.lineTo(s ? X(.62) : X(.38), Y(.035)); c.lineTo(X(.5), Y(.02)); c.lineTo(X(.5), H); c.lineTo(s ? W : 0, H); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) if (Math.random() < .3) c.fillRect(x, y, 18, 18);
    // janelas da cabine
    c.fillStyle = '#05070c'; for (let i = 0; i < 6; i++) { const u = .365 + i * .046; c.beginPath(); c.moveTo(X(u), Y(.135)); c.lineTo(X(u + .04), Y(.135)); c.lineTo(X(u + .037), Y(.104 - Math.abs(i - 2.5) * .004)); c.lineTo(X(u + .004), Y(.104 - Math.abs(i - 2.5) * .004)); c.fill(); }
    c.fillStyle = 'rgba(120,190,255,.5)'; for (let i = 0; i < 6; i++) c.fillRect(X(.372 + i * .046), Y(.126), X(.012), H * .006);
    // portas do compartimento de carga
    c.strokeStyle = '#8a8f9c'; c.lineWidth = 5; c.strokeRect(X(.29), Y(.72), X(.42), Y(.22) - Y(.72)); c.beginPath(); c.moveTo(X(.5), Y(.72)); c.lineTo(X(.5), Y(.22)); c.stroke();
    c.lineWidth = 2; for (let i = 1; i < 6; i++) { const y = Y(.22 + i * .083); c.beginPath(); c.moveTo(X(.29), y); c.lineTo(X(.71), y); c.stroke(); }
    c.fillStyle = '#c9ced8'; for (const [a, b] of [[.31, .48], [.52, .69]]) for (let i = 0; i < 4; i++) c.fillRect(X(a) + 10, Y(.3 + i * .12), X(b - a) - 20, 8);
    // faixas e nome (texto ao longo do corpo, dos dois lados)
    c.fillStyle = '#d4202c'; c.fillRect(X(.232), Y(.9), 10, Y(.16) - Y(.9)); c.fillRect(X(.758), Y(.9), 10, Y(.16) - Y(.9)); c.fillStyle = '#1c3a8c'; c.fillRect(X(.248), Y(.9), 6, Y(.16) - Y(.9)); c.fillRect(X(.746), Y(.9), 6, Y(.16) - Y(.9));
    for (const [u, rot] of [[.272, Math.PI / 2], [.728, -Math.PI / 2]]) { c.save(); c.translate(X(u), Y(.47)); c.rotate(rot); c.fillStyle = '#1a2a5c'; c.font = 'italic 900 62px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GALATIC', 0, 0); c.restore(); }
    // escotilha e grades dos propulsores do nariz
    c.fillStyle = '#2a2c34'; for (const u of [.42, .5, .58]) for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(X(u), Y(.062 + i * .014), 9, 0, 7); c.fill(); }
  });
  const casco = fis({ map: pintura, roughness: .42, clearcoat: .35, clearcoatRoughness: .25, emissive: 0xffffff, emissiveMap: pintura, emissiveIntensity: .07 });
  const est = [[0, .4, .4, .4, -3], [.015, 3.6, 2.6, 3, -3], [.05, 7.4, 5.2, 5.4, -2.2], [.1, 10.4, 8, 7, -1.2], [.145, 12.2, 12.4, 8.4, -.5], [.2, 13.4, 14.6, 9.4, 0], [.3, 14, 15, 9.8, 0], [.75, 14, 15, 9.8, 0], [.9, 14.6, 14.6, 9.8, 0], [1, 14.2, 13, 9.6, 0]];
  const L = 190, n = 90, seg = 56, pos = [], uv = [], idx = [];
  const pega = (s, k) => { let i = 0; while (i < est.length - 2 && est[i + 1][0] < s) i++; const a = est[i], b = est[i + 1], t = Math.max(0, Math.min(1, (s - a[0]) / (b[0] - a[0]))); const a0 = est[Math.max(0, i - 1)], b1 = est[Math.min(est.length - 1, i + 2)]; const m0 = (b[k] - a0[k]) / (b[0] - a0[0] || 1) * (b[0] - a[0]), m1 = (b1[k] - a[k]) / (b1[0] - a[0] || 1) * (b[0] - a[0]), t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[k] + (t3 - t2) * m1; };
  for (let i = 0; i <= n; i++) {
    const s = Math.pow(i / n, 1.35), w = pega(s, 1), alto = pega(s, 2), baixo = pega(s, 3), dy = pega(s, 4);
    for (let k = 0; k <= seg; k++) {
      const a = -Math.PI / 2 - k / seg * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a), e = sn < 0 ? .5 : .86;       // barriga mais quadrada, teto redondo
      pos.push(-L / 2 + s * L, dy + Math.sign(sn) * Math.pow(Math.abs(sn), e) * (sn > 0 ? alto : baixo), Math.sign(cs) * Math.pow(Math.abs(cs), e) * w); uv.push(k / seg, s);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  casco.side = THREE.DoubleSide;
  const corpo = new THREE.Mesh(geo, casco); corpo.castShadow = corpo.receiveShadow = true; g.add(corpo);
  const preto = fis({ color: 0x17181c, roughness: .6 }), branco = fis({ color: 0xf3f2ee, roughness: .45, clearcoat: .3 }), cinza = fis({ color: 0x4a4d56, roughness: .5 }), aco = metal(0x9a9ea8, .3);
  const chapa = (pts, esp, m) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); const e = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: true, bevelSize: 1.2, bevelThickness: 1, bevelSegments: 4 }); const o = new THREE.Mesh(e, m); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // asas em delta: preta embaixo, branca em cima, borda de ataque cinza
  for (const s of [-1, 1]) {
    const asa = [[-34, 11], [8, 20], [40, 62], [62, 64], [74, 60], [78, 12]].map(([x, y]) => [x, s * y]), so = s > 0 ? asa : [...asa].reverse();
    for (const [m, y, e] of [[preto, -8.6, 1.4], [branco, -6.6, 1.2]]) { const o = chapa(so, e, m); o.rotation.x = Math.PI / 2; o.position.y = y + e; }
    g.add(membro([[-36, -6.6, s * 11], [8, -6.6, s * 20.6], [40, -6.6, s * 62.6]], [2, 2.1, 1.6], cinza, { n: 26, seg: 12 }));
    for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.8, .5, 20), cinza); l.position.set(64, -4, s * (25 + i * 24)); g.add(l); }
    const nav = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), luz(s > 0 ? 0x30ff70 : 0xff3040, 3)); nav.position.set(54, -5.4, s * 65); nav.userData.movel = true; g.add(nav); (g.userData.nav ||= []).push(nav.material);
    // casulos dos motores de manobra
    const c = bola(8, branco, 80, 11, s * 9.4, 2.1, .86, .78); g.add(c); const t = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.8, 6, 24, 1, true), aco); t.rotation.z = Math.PI / 2; t.position.set(98, 12, s * 9.6); g.add(t);
  }
  // leme
  { const o = chapa([[46, 12], [78, 50], [98, 51], [90, 14]], 2, branco); o.position.z = -1; g.add(membro([[44, 12, 0], [60, 31, 0], [78, 51, 0]], [1.6, 1.8, 1.6], cinza, { n: 14, seg: 10 }));
    const t = tela(128, 128, c => { c.fillStyle = '#12245a'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.fillStyle = '#ffb84a'; c.beginPath(); c.arc(64, 64, 26, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 8; c.save(); c.translate(64, 64); c.rotate(-.4); c.scale(1, .3); c.beginPath(); c.arc(0, 0, 48, 0, 7); c.stroke(); c.restore(); });
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(6.5, 30), new THREE.MeshStandardMaterial({ map: t, roughness: .5, transparent: true })); e.position.set(80, 36, s * 2.3); if (s < 0) e.rotation.y = Math.PI; g.add(e); } }
  // traseira e motores principais
  { const t = new THREE.Mesh(new THREE.CircleGeometry(13.5, 40), preto); t.rotation.y = Math.PI / 2; t.position.set(95.2, 1, 0); t.scale.set(1, .9, 1); g.add(t); }
  const chamas = [], brilhoMotor = luz(0xff9a40, 2.4);
  for (const [y, z] of [[7.5, 0], [-3, -6.4], [-3, 6.4]]) {
    const sino = new THREE.Mesh(new THREE.LatheGeometry([[1.8, 0], [2.4, 2], [3.8, 5], [5.2, 10], [5.9, 14]].map(([a, b]) => new THREE.Vector2(a, b)), 36), new THREE.MeshStandardMaterial({ color: 0x8a7f78, metalness: .9, roughness: .35, side: THREE.DoubleSide })); sino.rotation.z = -Math.PI / 2; sino.position.set(93, y, z); sino.castShadow = true; g.add(sino);
    const f = new THREE.Mesh(new THREE.CircleGeometry(4.6, 24), brilhoMotor); f.rotation.y = Math.PI / 2; f.position.set(102.5, y, z); g.add(f);
    const geoC = new THREE.ConeGeometry(5.6, 70, 28, 1, true); geoC.rotateZ(-Math.PI / 2); geoC.translate(35, 0, 0);
    const pc = geoC.attributes.position, cor = []; for (let i = 0; i < pc.count; i++) { const k = Math.pow(1 - pc.getX(i) / 70, 1.6); cor.push(k, k * (.55 + .4 * k), k * (.25 + .75 * k)); } geoC.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    const ch = new THREE.Mesh(geoC, new THREE.MeshBasicMaterial({ color: 0xffc890, vertexColors: true, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); ch.position.set(106, y, z); ch.userData.movel = true; g.add(ch); chamas.push(ch);
  }
  // escotilha do cabo, no teto
  const esc = new THREE.Mesh(new THREE.TorusGeometry(4, 1, 10, 30), metal(0xe0a83a, .2)); esc.rotation.x = Math.PI / 2; esc.position.set(-28, 15, 0); g.add(esc);
  const nav = g.userData.nav; fundir(g); g.userData.nav = nav;
  return { g, chamas, brilhoMotor, nav, escotilha: new THREE.Vector3(-28, 16, 0) };
}

// ---------- Cabo entre os dois (balança no espaço) ----------
export function criarCabo() {
  const N = 56, LADOS = 8, geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * (LADOS + 1) * 3), nor = new Float32Array(pos.length), uv = [], idx = [];
  for (let i = 0; i <= N; i++) for (let k = 0; k <= LADOS; k++) uv.push(i / N, k / LADOS);
  for (let i = 0; i < N; i++) for (let k = 0; k < LADOS; k++) { const a = i * (LADOS + 1) + k, b = a + LADOS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const t = tela(64, 64, c => { c.fillStyle = '#f2efe6'; c.fillRect(0, 0, 64, 64); c.strokeStyle = '#c8952e'; c.lineWidth = 12; c.beginPath(); c.moveTo(-10, 74); c.lineTo(74, -10); c.stroke(); c.beginPath(); c.moveTo(-42, 74); c.lineTo(42, -10); c.stroke(); c.beginPath(); c.moveTo(22, 74); c.lineTo(106, -10); c.stroke(); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(46, 1);
  const m = new THREE.Mesh(geo, fis({ map: t, roughness: .45, clearcoat: .5 })); m.castShadow = true; m.frustumCulled = false; m.userData.movel = true;
  const A = new THREE.Vector3(), T = new THREE.Vector3(), N1 = new THREE.Vector3(), B1 = new THREE.Vector3(), cima = new THREE.Vector3(0, 1, 0), pts = Array.from({ length: N + 1 }, () => new THREE.Vector3());
  function atualizar(de, ate, t) {
    for (let i = 0; i <= N; i++) {
      const u = i / N, arco = Math.sin(u * Math.PI);
      pts[i].lerpVectors(de, ate, u);
      pts[i].y += arco * (-20 + Math.sin(t * .8) * 5) + Math.sin(u * 9 + t * 1.3) * 5 * arco; pts[i].z += arco * (24 + Math.sin(t * .6 + u * 4) * 9) + Math.sin(u * 13 - t) * 3 * arco; pts[i].x += Math.sin(u * 11 + t * .7) * 4 * arco;
    }
    for (let i = 0; i <= N; i++) {
      T.copy(pts[Math.min(N, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize(); N1.crossVectors(cima, T).normalize(); B1.crossVectors(T, N1);
      for (let k = 0; k <= LADOS; k++) { const a = k / LADOS * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), j = (i * (LADOS + 1) + k) * 3; A.copy(N1).multiplyScalar(c).addScaledVector(B1, s); nor[j] = A.x; nor[j + 1] = A.y; nor[j + 2] = A.z; pos[j] = pts[i].x + A.x * 1.5; pos[j + 1] = pts[i].y + A.y * 1.5; pos[j + 2] = pts[i].z + A.z * 1.5; }
    }
    geo.attributes.position.needsUpdate = geo.attributes.normal.needsUpdate = true;
  }
  return { m, atualizar };
}
