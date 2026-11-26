// Portões de energia (2 ou 3 lados, parados ou correndo), barris, caixas, gaiolas, carros, muros e vãos da ponte, com os números sempre iguais ao efeito real.
import * as THREE from 'three';
import { materialDesenho, contorno, Pecas, caixaRedonda, caixaChanfro } from './desenho.js';
import { ARMAS } from '../dados/balanco.js';

const LARG = 5, ALT = 3.1;
const texto = l => l.tipo === 'soma' || l.tipo === 'tiro' ? (l.v >= 0 ? '+' : '−') + Math.abs(l.v) : l.tipo === 'vezes' ? '×' + l.v : l.tipo === 'divide' ? '÷' + l.v : l.tipo === 'arma' ? 'ARMA' : l.tipo === 'especial' ? '+' + l.v : `+${l.v}%`;
const legenda = l => l.tipo === 'tiro' ? 'ATIRE' : l.tipo === 'arma' ? 'MELHOR' : l.tipo === 'cadencia' ? 'CADÊNCIA' : l.tipo === 'especial' ? (l.v > 1 ? ARMAS[l.arma].plural : ARMAS[l.arma].nome).toUpperCase() : l.tipo === 'vezes' || l.v > 0 && l.tipo !== 'divide' ? 'SOLDADOS' : 'PERDE';

// desenho da arma no portão
function figura(x, arma, cx, cy) {
  x.save(); x.translate(cx, cy); x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#1a1220';
  const P = (cor, ...p) => { x.beginPath(); p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.stroke(); x.fillStyle = cor; x.fill(); };
  if (arma === 4) { P('#e0352b', [-54, -13], [40, -13], [40, 13], [-54, 13]); P('#8d97a6', [-70, -20], [-52, -13], [-52, 13], [-70, 20]); P('#ffc62e', [40, -14], [70, 0], [40, 14]); P('#1d1822', [-12, 13], [2, 13], [-2, 34], [-14, 34]); P('#fbf6ea', [-26, -13], [-14, -13], [-14, 13], [-26, 13]); }
  else if (arma === 3) { P('#5d6675', [-6, -18], [66, -18], [66, -8], [-6, -8]); P('#5d6675', [-6, -5], [66, -5], [66, 5], [-6, 5]); P('#5d6675', [-6, 8], [66, 8], [66, 18], [-6, 18]); P('#8d97a6', [36, -22], [46, -22], [46, 22], [36, 22]); P('#ffc62e', [-56, -24], [-4, -24], [-4, 24], [-56, 24]); P('#1d1822', [-40, 24], [-26, 24], [-30, 42], [-44, 42]); }
  else { P('#8d97a6', [-50, -12], [20, -12], [20, 10], [-50, 10]); P('#ff7a1f', [-18, -18], [6, -18], [6, 18], [-18, 18]); P('#1d1822', [20, -14], [40, -20], [40, 18], [20, 12]); P('#1d1822', [-40, 10], [-28, 10], [-32, 34], [-44, 34]); P('#ff4a1a', [42, -14], [64, -24], [60, -8], [82, -2], [60, 6], [64, 22], [42, 12]); P('#ffe27a', [44, -6], [60, -2], [44, 6]); }
  x.restore();
}
function letreiro(w = 256, h = 160) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { c, t, escrever(a, b, arma) {
    const x = c.getContext('2d'), F = '"Arial Black", system-ui, sans-serif'; x.clearRect(0, 0, w, h); x.textAlign = 'center'; x.lineJoin = 'round'; x.strokeStyle = '#1a1220'; x.fillStyle = '#fff';
    const L = (s, px, y, e) => { x.font = `900 ${px}px ${F}`; const k = Math.min(1, (w - 16) / x.measureText(s).width); x.save(); x.translate(cx, y); x.scale(k, 1); x.lineWidth = e; x.strokeText(s, 0, 0); x.fillText(s, 0, 0); x.restore(); }; let cx = w / 2;
    if (arma !== undefined) { figura(x, arma, 168, 56); cx = 54; x.font = `900 78px ${F}`; x.lineWidth = 13; x.strokeText(a, cx, 88); x.fillText(a, cx, 88); cx = w / 2; L(b, 34, 146, 9); return void (t.needsUpdate = true); }
    if (b === undefined) L(a, h * .6, h * .72, 12); else { L(a, a.length > 3 ? 70 : 100, 100, 14); L(b, 30, 146, 9); }
    t.needsUpdate = true;
  } };
}
const VERT = 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
// carro gordinho de desenho (frente para -z)
export function pecasCarro(cor = '#d63a2c', velho = false) {
  const P = new Pecas().por(caixaRedonda(1.9, .62, 4.2, .16, 1), cor, { y: .62 }).por(caixaRedonda(1.62, .62, 2.1, .2, 1), cor, { y: 1.12, z: .25 }).por(caixaChanfro(1.68, .36, 1.5, .06), '#8fd0ee', { y: 1.16, z: .25 }).por(caixaChanfro(1.36, .36, 2.2, .06), '#8fd0ee', { y: 1.15, z: .25 }).por(caixaChanfro(1.94, .16, .3, .04), '#3a3550', { y: .42, z: -2.05 }).por(caixaChanfro(1.94, .16, .3, .04), '#3a3550', { y: .42, z: 2.05 });
  for (const s of [-1, 1]) { P.por(caixaChanfro(.42, .18, .1, .03), '#fff3c0', { x: s * .62, y: .7, z: -2.08 }).por(caixaChanfro(.4, .16, .1, .03), '#e0352b', { x: s * .64, y: .72, z: 2.08 }); for (const z of [-1.3, 1.3]) P.por(new THREE.CylinderGeometry(.38, .38, .28, 14).rotateZ(Math.PI / 2), '#2a2430', { x: s * .84, y: .38, z }).por(new THREE.CylinderGeometry(.2, .2, .3, 10).rotateZ(Math.PI / 2), '#d8d4e0', { x: s * .85, y: .38, z }); }
  if (velho) P.por(caixaRedonda(1.1, .1, 1, .04, 1), '#5a3a2a', { y: .95, z: -1.4, ry: .3 });
  return P;
}

export function criarPortoes(cena, S, ruido) {
  const lixo = [], D = o => (lixo.push(o), o), grupos = [];
  const gPainel = D(new THREE.PlaneGeometry(1, ALT - .2)), gTxt = D(new THREE.PlaneGeometry(3.1, 1.94));
  const mObj = D(materialDesenho({}, { ruido, borda: 1 })), mBorda = D(contorno({ esp: .02 }));
  const com = (P, g) => { const geo = D(P.pronta()); return pai => { const m = new THREE.Mesh(geo, mObj), b = new THREE.Mesh(geo, mBorda); m.castShadow = m.receiveShadow = true; m.add(b); (pai.userData.pecas ??= []).push([m, b]); pai.add(m); return m; }; };
  // longe: sem contorno e sem sombra (não dá para ver, e pesa)
  const longe = (g, perto) => { const sim = perto < 40; if (g.userData.sim !== sim) { g.userData.sim = sim; for (const [m, b] of g.userData.pecas || []) { m.castShadow = sim; b.visible = sim; } } };
  const poste = com(new Pecas().por(new THREE.CylinderGeometry(.16, .2, ALT + .5, 10), '#3a3550', { y: (ALT + .5) / 2 }).por(new THREE.CylinderGeometry(.36, .44, .34, 10), '#ffc62e', { y: .17 }).por(new THREE.SphereGeometry(.24, 10, 8), '#ffc62e', { y: ALT + .6 }));
  const trilho = com(new Pecas().por(caixaRedonda(9.6, .16, .34, .06, 1), '#3a3550', { y: .06 }).por(caixaRedonda(9.6, .06, .12, .02, 1), '#ffc62e', { y: .15 }).por(caixaRedonda(9.9, .16, .16, .06, 1), '#3a3550', { y: ALT + .42 }));
  const AZUL = new THREE.Color('#1d7bff'), VERM = new THREE.Color('#ff2a1a'), OURO = new THREE.Color('#ffae0d');
  for (const p of S.portoes) {
    const g = new THREE.Group(); g.position.z = -p.d; cena.add(g); if (p.anda) trilho(g);
    const postes = Array.from({ length: p.lados.length + 1 }, () => poste(g));
    const lados = p.lados.map(l => {
      const u = { uCor: { value: new THREE.Color() }, uA: { value: 1 }, uL: { value: 5 } };
      const m = D(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: u, vertexShader: VERT, fragmentShader: 'varying vec2 vU; uniform vec3 uCor; uniform float uA, uL; void main(){ vec2 e = abs(vU - .5) * vec2(uL, 2.9), q = vec2(uL * .5, 1.45) - e; float b = min(q.x, q.y); vec3 c = uCor; float a = .46 + .16 * step(.5, fract((vU.x * uL + vU.y * 2.9) * .5)); if (b < .2) { c = mix(uCor, vec3(1.), .55); a = .95; } if (b < .06 || (b > .2 && b < .25)) { c = uCor * .22; a = .9; } gl_FragColor = vec4(c, a * uA); \n#include <colorspace_fragment>\n }' }));
      const painel = new THREE.Mesh(gPainel, m); painel.position.y = ALT / 2 + .15; painel.renderOrder = 3;
      const L = letreiro(), mL = D(new THREE.MeshBasicMaterial({ map: D(L.t), transparent: true, depthWrite: false, fog: false, toneMapped: false })), txt = new THREE.Mesh(gTxt, mL); txt.position.set(0, ALT / 2 + .15, .06); txt.renderOrder = 4;
      g.add(painel, txt);
      return { l, u, L, mL, txt, painel, pulo: 0, ultimo: '' };
    });
    grupos.push({ p, g, lados, postes, sumir: 0, ox: null });
  }
  // ---------- barris, caixas, gaiolas, carros e hidrantes ----------
  const perf = [[0, 0], [.3, 0], [.33, .04], [.3, .08], [.3, .28], [.34, .32], [.3, .36], [.3, .56], [.34, .6], [.3, .64], [.3, .84], [.33, .88], [.3, .92], [0, .92]].map(([x, y]) => new THREE.Vector2(x, y));
  const pB = new Pecas(); for (const [x, z, e] of [[0, 0, 1], [.5, -.25, .96], [-.46, -.35, 1.02]]) pB.por(new THREE.LatheGeometry(perf, 14), '#e0352b', { x, z, s: e * 1.15 }).por(new THREE.CylinderGeometry(.36, .36, .2, 14), '#ffc62e', { x, y: .53 * e, z, s: [e, 1, e] });
  const barril = com(pB), caixa = com(new Pecas().por(caixaRedonda(1.2, 1, 1, .1, 1), '#3fa34d').por(caixaRedonda(1.26, .16, 1.06, .05, 1), '#fbf6ea', { y: .28 }).por(caixaRedonda(.2, 1.06, 1.06, .05, 1), '#fbf6ea').por(caixaRedonda(.62, .2, 1.1, .05, 1), '#ffc62e', { y: -.12 }).por(caixaRedonda(.2, .62, 1.1, .05, 1), '#ffc62e', { y: -.12 }));
  const copa = D(new Pecas().por(new THREE.SphereGeometry(1.2, 12, 6, 0, 6.29, 0, 1.5), '#ff7a1f', { y: 2.1, s: [1, .75, 1] }).por(new THREE.SphereGeometry(1.21, 12, 6, 0, .52, 0, 1.5), '#fbf6ea', { y: 2.1, s: [1, .75, 1] }).por(new THREE.SphereGeometry(1.21, 12, 6, 2.1, .52, 0, 1.5), '#fbf6ea', { y: 2.1, s: [1, .75, 1] }).por(new THREE.SphereGeometry(1.21, 12, 6, 4.2, .52, 0, 1.5), '#fbf6ea', { y: 2.1, s: [1, .75, 1] }).pronta());
  // gaiola com soldados presos
  const pG = new Pecas().por(caixaRedonda(1.9, .16, 1.5, .05, 1), '#3a3550', { y: .08 }).por(caixaRedonda(1.9, .16, 1.5, .05, 1), '#ffc62e', { y: 1.78 }).por(caixaRedonda(.34, .3, .16, .06, 1), '#ffc62e', { y: .95, z: .76 });
  for (const x of [-.88, -.44, 0, .44, .88]) for (const z of [-.68, .68]) pG.por(new THREE.CylinderGeometry(.045, .045, 1.6, 7), '#8d97a6', { x, y: .92, z });
  for (const x of [-.88, .88]) pG.por(new THREE.CylinderGeometry(.045, .045, 1.6, 7), '#8d97a6', { x, y: .92, z: 0 });
  for (const [x, z, e] of [[-.44, .1, 1], [.42, .05, .96], [0, -.2, 1.04]]) pG.por(new THREE.SphereGeometry(.23, 12, 9), '#e8a878', { x, y: 1.06 * e, z }).por(new THREE.SphereGeometry(.27, 12, 7, 0, 6.29, 0, 1.6), '#1f8fa8', { x, y: 1.1 * e, z }).por(caixaRedonda(.38, .5, .3, .12, 1), '#1f86a0', { x, y: .66, z }).por(caixaRedonda(.34, .34, .28, .1, 1), '#c79a5c', { x, y: .32, z }).por(new THREE.SphereGeometry(.045, 7, 5), '#1d1822', { x: x - .08, y: 1.07 * e, z: z + .2 }).por(new THREE.SphereGeometry(.045, 7, 5), '#1d1822', { x: x + .08, y: 1.07 * e, z: z + .2 });
  const gaiola = com(pG), cxArma = com(new Pecas().por(caixaRedonda(1.6, .95, 1.1, .1, 1), '#c98a1f', { y: .5 }).por(caixaRedonda(1.68, .2, 1.18, .06, 1), '#3a3550', { y: .92 }).por(caixaRedonda(1.68, .14, 1.18, .05, 1), '#3a3550', { y: .1 }).por(caixaRedonda(.18, 1, 1.18, .05, 1), '#3a3550', { x: .5, y: .5 }).por(caixaRedonda(.18, 1, 1.18, .05, 1), '#3a3550', { x: -.5, y: .5 }).por(caixaRedonda(.36, .26, .1, .05, 1), '#ffe27a', { y: .62, z: .56 }).por(new THREE.CylinderGeometry(.06, .06, .7, 8).rotateZ(Math.PI / 2), '#8d97a6', { y: 1.06 }));
  const hid = com(new Pecas().por(new THREE.CylinderGeometry(.3, .34, .16, 14), '#8d97a6', { y: .08 }).por(new THREE.CylinderGeometry(.24, .26, .8, 14), '#e8352b', { y: .5 }).por(new THREE.SphereGeometry(.27, 14, 7, 0, 6.29, 0, 1.6), '#e8352b', { y: .88 }).por(new THREE.CylinderGeometry(.08, .08, .16, 8), '#ffc62e', { y: 1.16 }).por(new THREE.CylinderGeometry(.13, .13, .72, 12).rotateZ(Math.PI / 2), '#ffc62e', { y: .62 }).por(new THREE.CylinderGeometry(.14, .14, .2, 12).rotateX(Math.PI / 2), '#8fd0ee', { y: .6, z: .28 }));
  const CC = ['#d63a2c', '#2d7bd0', '#f2b51d', '#3fa34d', '#e8662a', '#7a4fc0'], carros = [], carro = i => carros[i % 6] ??= com(pecasCarro(CC[i % 6]));
  const rotulo = (w = 160, h = 80) => { const L = letreiro(w, h), mL = D(new THREE.SpriteMaterial({ map: D(L.t), depthWrite: false, fog: false, toneMapped: false })), s = new THREE.Sprite(mL); s.renderOrder = 4; return { L, s }; };
  const barris = S.barris.map((b, i) => {
    const g = new THREE.Group(); g.position.set(b.x, 0, -b.d); g.visible = false; cena.add(g); let pq = null, duplo = false, y = 1.6;
    if (b.tipo === 'reforco' && b.da?.tipo === 'especial') { cxArma(g); pq = new THREE.Mesh(copa, mObj); g.add(pq); y = 1.6; }
    else if (b.tipo === 'reforco') { const m = caixa(g); m.position.y = .5; pq = new THREE.Mesh(copa, mObj); g.add(pq); y = 1.5; }
    else if (b.tipo === 'gaiola') { gaiola(g); duplo = true; y = 2.55; } else if (b.tipo === 'caixa') { cxArma(g); duplo = true; y = 1.95; }
    else if (b.tipo === 'carro') { carro(i)(g); y = 2; } else if (b.tipo === 'hidrante') { hid(g); y = 1.75; } else barril(g);
    const { L, s } = duplo ? rotulo(256, 160) : rotulo(); s.position.y = y; if (duplo) s.scale.set(1.9, 1.19, 1); else s.scale.set(1.3, .65, 1); g.add(s);
    return { b, g, L, pq, s, duplo, ultimo: '' };
  });
  // ---------- muros e carros na pista ----------
  const obras = new Map();
  function obra(o) {
    const g = new THREE.Group(); cena.add(g); let L = null, s = null, n = obras.size;
    if (o.tipo === 'carro') { const m = carro(n + 1)(g); m.rotation.y = (o.caiu ? .35 : .12) * (n % 2 ? 1 : -1) + (n % 3 === 0 ? Math.PI : 0); g.position.set(o.x, 0, -o.d); ({ L, s } = rotulo()); s.position.y = 2; s.scale.set(1.3, .65, 1); g.add(s); }
    else if (o.tipo === 'escombro') { const P = new Pecas(); for (const [x, y, z, r, c] of [[0, .5, 0, .85, '#6a5560'], [.55, .35, .3, .5, '#8a7078'], [-.55, .3, .2, .5, '#57444e'], [.1, 1.1, -.1, .45, '#8a7078'], [-.3, .9, .4, .34, '#ff7a1e']]) P.por(new THREE.DodecahedronGeometry(r, 0), c, { x, y, z, ry: x * 5 }); com(P)(g); g.position.set(o.x, 0, -o.d); ({ L, s } = rotulo()); s.position.y = 1.9; s.scale.set(1.3, .65, 1); g.add(s); }
    else if (o.tipo === 'muralha') { // muralha comprida de concreto, com faixa amarela e preta no alto e blocos marcados
      const P = new Pecas(), c = o.d1 - o.d0, w = o.x1 - o.x0;
      P.por(caixaRedonda(w + .5, .3, c, .06, 1), '#7d7488', { y: .15 }).por(caixaRedonda(w, 1.9, c, .1, 1), '#b9aecb', { y: 1.15 }).por(caixaRedonda(w + .06, .22, c, .05, 1), '#ffc62e', { y: 2.06 });
      for (let k = 0; k < Math.min(c, 180) / 3; k++) P.por(caixaChanfro(w + .08, 1.7, .08, .02), '#8f859e', { y: 1.1, z: c / 2 - k * 3 }).por(caixaChanfro(w + .1, .23, .9, .02), '#1d1822', { y: 2.06, z: c / 2 - 1.2 - k * 3 });
      com(P)(g); g.position.set(o.x, 0, -(o.d0 + o.d1) / 2);
    }
    else { // canteiro: cavaletes listrados na frente e do lado, cones e material dentro
      const P = new Pecas(), w = o.x1 - o.x0, c = o.d1 - o.d0, dentro = o.x0 < -5 ? 1 : -1, xi = dentro > 0 ? o.x1 : o.x0, cava = (x, z, ry, l) => { P.por(caixaChanfro(l, .3, .1, .025), '#ff7a1f', { x, y: .95, z, ry }).por(caixaChanfro(l, .3, .1, .025), '#fbf6ea', { x, y: .5, z, ry }); for (let k = 0; k < 3; k++) { const q = (k - 1) * l * .32; P.por(caixaChanfro(l * .13, .31, .115, .025), '#fbf6ea', { x: x + Math.cos(ry) * q, y: .95, z: z - Math.sin(ry) * q, ry }).por(caixaChanfro(l * .13, .31, .115, .025), '#ff7a1f', { x: x + Math.cos(ry) * q, y: .5, z: z - Math.sin(ry) * q, ry }); } for (const q of [-.44, .44]) P.por(caixaChanfro(.1, 1.2, .3, .025), '#3a3550', { x: x + Math.cos(ry) * q * l, y: .6, z: z - Math.sin(ry) * q * l, ry }); };
      const nf = Math.max(1, Math.round(w / 2)); for (let k = 0; k < nf; k++) cava(o.x0 + w * (k + .5) / nf, c / 2 - .15, 0, w / nf * .92);
      const nl = Math.round(c / 2.2); for (let k = 0; k < nl; k++) cava(xi - dentro * .1, c / 2 - .5 - (c - .8) * (k + .5) / nl, Math.PI / 2, (c - .8) / nl * .9);
      for (let k = 0; k < 3; k++) P.por(new THREE.ConeGeometry(.22, .62, 12), '#ff7a1f', { x: xi - dentro * .55, y: .33, z: c / 2 - 1 - k * (c - 2) / 2.2 }).por(new THREE.CylinderGeometry(.12, .155, .13, 12), '#fbf6ea', { x: xi - dentro * .55, y: .36, z: c / 2 - 1 - k * (c - 2) / 2.2 });
      const xm = (o.x0 + o.x1) / 2 - dentro * w * .1; P.por(new THREE.SphereGeometry(1.1, 14, 7, 0, 6.29, 0, 1.57), '#e0b46a', { x: xm, z: c * .14, s: [1.1, .75, 1] }).por(new THREE.SphereGeometry(.8, 12, 6, 0, 6.29, 0, 1.57), '#c99a52', { x: xm - dentro * .7, z: -c * .16, s: [1, .7, 1] }); for (const [a, b] of [[0, .2], [.42, .2], [.21, .55]]) P.por(new THREE.CylinderGeometry(.2, .2, c * .4, 12).rotateX(Math.PI / 2), '#8d97a6', { x: xm - dentro * (.6 - a), y: b, z: -c * .28 });
      com(P)(g); g.position.set(0, 0, -(o.d0 + o.d1) / 2);
    }
    const r = { o, g, L, s, ultimo: '', vivo: true }; obras.set(o, r); return r;
  }
  // ---------- vãos: buraco na pista que mostra o rio lá embaixo ----------
  const NV = 8, gV = D(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), mV = D(new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, uniforms: { tRuido: { value: ruido }, uAgua: { value: new THREE.Color('#2f8fb0') }, uConc: { value: new THREE.Color('#b9aecb') } },
    vertexShader: 'attribute vec4 aV; varying vec3 vP; varying vec4 vV; void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vP = w.xyz; vV = aV; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D tRuido; uniform vec3 uAgua, uConc; varying vec3 vP; varying vec4 vV; void main(){
      float n = texture2D(tRuido, vP.xz * .12).r * .7 + texture2D(tRuido, vP.xz * .5).g * .3; vec2 q = min(vP.xz - vV.xz, vV.yw - vP.xz); float b = min(q.x, q.y) - (n - .3) * 1.1; if (b < 0.) discard;
      if (b < .12) { gl_FragColor = vec4(.07, .05, .1, 1.); } else if (b < .34) { gl_FragColor = vec4(uConc * .8, 1.); } else {
        vec3 d = normalize(vP - cameraPosition); float tx = d.x > 0. ? (vV.y - vP.x) / d.x : (vV.x - vP.x) / min(d.x, -1e-4), tz = d.z > 0. ? (vV.w - vP.z) / d.z : (vV.z - vP.z) / min(d.z, -1e-4), t = min(tx, tz), y = t * -d.y;
        vec3 c; if (y < 1.35) { float l = tx < tz ? .5 : .72; c = uConc * l * (1. - y * .28); if (abs(y - .55) < .06) c = vec3(.75, .22, .12); } else if (y < 2.3 ) c = vec3(.2, .13, .26) * (tx < tz ? .8 : 1.1); else { float r = texture2D(tRuido, (vP.xz + d.xz / -d.y * 20.) * vec2(.02, .05)).r; c = uAgua * (r > .56 ? .95 : r > .46 ? .75 : .62); }
        gl_FragColor = vec4(c, 1.); }
      \n#include <colorspace_fragment>\n }` }));
  const aV = new THREE.InstancedBufferAttribute(new Float32Array(NV * 4), 4).setUsage(THREE.DynamicDrawUsage); gV.setAttribute('aV', aV);
  const vaos = new THREE.InstancedMesh(gV, mV, NV); vaos.frustumCulled = false; vaos.renderOrder = 1; vaos.count = 0; cena.add(vaos); lixo.push(vaos); const Mx = new THREE.Matrix4();
  // ---------- placas de gelo: azul liso com riscos claros ----------
  const NG = 12, gG = D(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), mG = D(new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), tRuido: { value: ruido } },
    vertexShader: 'attribute vec4 aV; varying vec3 vP; varying vec4 vV;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vP = w.xyz; vV = aV; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n }',
    fragmentShader: 'uniform sampler2D tRuido; varying vec3 vP; varying vec4 vV;\n#include <common>\n#include <fog_pars_fragment>\nvoid main(){ float n = texture2D(tRuido, vP.xz * .09).r; vec2 q = min(vP.xz - vV.xz, vV.yw - vP.xz); float b = min(q.x, q.y) - n * 1.3 + .25; if (b < 0.) discard; vec3 c = mix(vec3(.16, .52, .86), vec3(.3, .7, .97), step(.5, texture2D(tRuido, vP.xz * .03 + .3).r)); float ri = fract((vP.x * .8 + vP.z * .5) * .22 + n * .12); c = mix(c, vec3(.82, .96, 1.), step(.86, ri) * .75); float ra = abs(texture2D(tRuido, vP.xz * .05 + .6).r - .5); c = mix(c, vec3(.9, .98, 1.), (1. - smoothstep(.0, .012, ra)) * .8); if (b < .16) c = vec3(.96, .99, 1.); if (b < .05) c = vec3(.1, .3, .55); gl_FragColor = vec4(c, .94);\n#include <colorspace_fragment>\n#include <fog_fragment>\n }' }));
  const aG = new THREE.InstancedBufferAttribute(new Float32Array(NG * 4), 4).setUsage(THREE.DynamicDrawUsage); gG.setAttribute('aV', aG);
  const gelos = new THREE.InstancedMesh(gG, mG, NG); gelos.frustumCulled = false; gelos.renderOrder = 1; gelos.count = 0; cena.add(gelos); lixo.push(gelos);
  return {
    corAgua(c) { mV.uniforms.uAgua.value.set(c.agua); mV.uniforms.uConc.value.set(c.conc); },
    atualizar(dt, t, d) {
      for (const o of grupos) {
        const p = o.p, perto = p.d - d; o.g.visible = perto < 120 && perto > -20 && o.sumir < 1; if (!o.g.visible) continue; longe(o.g, perto);
        if (p.usado >= 0) o.sumir = Math.min(1, o.sumir + dt * 2.2);
        if (o.ox !== p.ox) { o.ox = p.ox; o.postes.forEach((q, i) => { q.position.x = S.borda(p, i); }); o.lados.forEach((k, i) => { const a = S.borda(p, i), b = S.borda(p, i + 1), w = Math.max(.5, b - a - .3); k.painel.position.x = k.txt.position.x = (a + b) / 2; k.painel.scale.x = k.u.uL.value = w; k.esc = Math.min(1, w / 3.3); }); }
        o.lados.forEach((k, i) => {
          const tx = texto(k.l), bom = S.bom(k.l), ouro = k.l.tipo === 'arma' || k.l.tipo === 'cadencia' || k.l.tipo === 'especial';
          if (tx !== k.ultimo) { if (k.ultimo) k.pulo = 1; k.ultimo = tx; k.L.escrever(tx, legenda(k.l), k.l.tipo === 'especial' ? k.l.arma : undefined); }
          const c = ouro ? OURO : bom ? AZUL : VERM; k.u.uCor.value.lerp(c, k.pronto ? Math.min(1, dt * 6) : 1); k.pronto = true;
          k.pulo = Math.max(0, k.pulo - dt * 5); const a = p.usado < 0 ? 1 : p.usado === i ? 1 - o.sumir : Math.max(0, .5 - o.sumir); k.u.uA.value = a; k.mL.opacity = a;
          const e = (1 + k.pulo * .14 + (p.usado === i ? o.sumir * .5 : 0)) * k.esc; k.txt.scale.set(e, e, 1);
        });
      }
      for (const o of barris) {
        const b = o.b, perto = b.d - d; o.g.visible = b.vivo && perto < 92 && perto > -15; if (!o.g.visible) continue; longe(o.g, perto); o.g.position.set(b.x, b.alt || 0, -b.d); if (o.pq) o.pq.visible = b.alt > 0;
        if (b.tipo === 'carro') { const v = b.voa; if (v) { const k = Math.min(1, v.t / v.dur), r = v.fica ? (1 - k) * 1.2 : (1 - k) * 7; o.g.children[0].rotation.set(r * .7, r * .5 + .4, r * .3); } }
        const hp = String(Math.max(1, Math.ceil(b.vida))), v = b.reforco ? '+' + b.reforco : hp;
        if (v !== o.ultimo) { o.ultimo = v; if (o.duplo) o.L.escrever(b.da.tipo === 'sinal' ? 'HELI' : b.da.tipo === 'arma' ? 'ARMA' : b.da.tipo === 'cadencia' ? '+' + b.da.v + '%' : '+' + b.da.v, hp, b.da.tipo === 'especial' ? b.da.arma : undefined); else o.L.escrever(v); }
        o.g.scale.setScalar(1 + b.dano * .05);
      }
      for (const o of S.blocos) { const r = obras.get(o) || obra(o), perto = o.d0 - d; r.vivo = t; r.g.visible = perto < 92; longe(r.g, perto); if (r.L) { const v = String(Math.max(1, Math.ceil(o.vida))); if (v !== r.ultimo) { r.ultimo = v; r.L.escrever(v); } r.g.scale.setScalar(1 + o.dano * .03); } }
      for (const r of obras.values()) if (r.vivo !== t) r.g.visible = false;
      let kg = 0; for (const v of S.gelos) { if (kg >= NG || v.d0 > d + 110) continue; const q = Math.min(1, v.t * 4, Math.max(0, (v.dur - v.t) * 2)), w = (v.x1 - v.x0 + .8) * q, h = (v.d1 - v.d0 + .8) * q, x = (v.x0 + v.x1) / 2, dd = (v.d0 + v.d1) / 2; Mx.makeScale(w, 1, h).setPosition(x, .018, -dd); gelos.setMatrixAt(kg, Mx); aG.array.set([x - w / 2, x + w / 2, -dd - h / 2, -dd + h / 2], kg * 4); kg++; } gelos.count = kg; gelos.visible = kg > 0; gelos.instanceMatrix.needsUpdate = aG.needsUpdate = true;
      let k = 0; for (const v of S.vaos) { if (k >= NV) break; const q = Math.min(1, v.t * 4, Math.max(0, (v.dur - v.t) * 2)), w = (v.x1 - v.x0) * q, h = (v.d1 - v.d0) * q; Mx.makeScale(w, 1, h).setPosition(v.x, .025, -v.d); vaos.setMatrixAt(k, Mx); aV.array.set([v.x - w / 2, v.x + w / 2, -v.d - h / 2, -v.d + h / 2], k * 4); k++; } vaos.count = k; vaos.visible = k > 0; vaos.instanceMatrix.needsUpdate = aV.needsUpdate = true;
    },
    dispose() { for (const o of lixo) o.dispose(); for (const o of [...grupos, ...barris, ...obras.values()]) o.g.removeFromParent(); vaos.removeFromParent(); gelos.removeFromParent(); },
  };
}
