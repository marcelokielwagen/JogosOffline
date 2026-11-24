// Portões de energia, barris e caixas de reforço, com os números sempre iguais ao efeito real.
import * as THREE from 'three';
import { materialDesenho, contorno, Pecas, caixaRedonda } from './desenho.js';
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

export function criarPortoes(cena, S, ruido) {
  const lixo = [], D = o => (lixo.push(o), o), grupos = [];
  const gPainel = D(new THREE.PlaneGeometry(LARG - .3, ALT - .2)), gTxt = D(new THREE.PlaneGeometry(3.1, 1.94));
  const mObj = D(materialDesenho({}, { ruido, borda: 1 })), mBorda = D(contorno({ esp: .02 }));
  const com = (P, g) => { const geo = D(P.pronta()); return pai => { const m = new THREE.Mesh(geo, mObj); m.castShadow = m.receiveShadow = true; m.add(new THREE.Mesh(geo, mBorda)); pai.add(m); return m; }; };
  const poste = com(new Pecas().por(new THREE.CylinderGeometry(.16, .2, ALT + .5, 10), '#3a3550', { y: (ALT + .5) / 2 }).por(new THREE.CylinderGeometry(.36, .44, .34, 10), '#ffc62e', { y: .17 }).por(new THREE.SphereGeometry(.24, 10, 8), '#ffc62e', { y: ALT + .6 }));
  const AZUL = new THREE.Color('#1d7bff'), VERM = new THREE.Color('#ff2a1a'), OURO = new THREE.Color('#ffae0d');
  for (const p of S.portoes) {
    const g = new THREE.Group(); g.position.z = -p.d; cena.add(g);
    for (const x of [-LARG, 0, LARG]) poste(g).position.x = x;
    const lados = p.lados.map((l, k) => {
      const u = { uCor: { value: new THREE.Color() }, uA: { value: 1 } };
      const m = D(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: u, vertexShader: VERT, fragmentShader: 'varying vec2 vU; uniform vec3 uCor; uniform float uA; void main(){ vec2 e = abs(vU - .5) * vec2(4.7, 2.9), q = vec2(2.35, 1.45) - e; float b = min(q.x, q.y); vec3 c = uCor; float a = .46 + .16 * step(.5, fract((vU.x * 4.7 + vU.y * 2.9) * .5)); if (b < .2) { c = mix(uCor, vec3(1.), .55); a = .95; } if (b < .06 || (b > .2 && b < .25)) { c = uCor * .22; a = .9; } gl_FragColor = vec4(c, a * uA); \n#include <colorspace_fragment>\n }' }));
      const x = (k ? 1 : -1) * LARG / 2, painel = new THREE.Mesh(gPainel, m); painel.position.set(x, ALT / 2 + .15, 0); painel.renderOrder = 3;
      const L = letreiro(), mL = D(new THREE.MeshBasicMaterial({ map: D(L.t), transparent: true, depthWrite: false, fog: false, toneMapped: false })), txt = new THREE.Mesh(gTxt, mL); txt.position.set(x, ALT / 2 + .15, .06); txt.renderOrder = 4;
      g.add(painel, txt);
      return { l, u, L, mL, txt, pulo: 0, ultimo: '' };
    });
    grupos.push({ p, g, lados, sumir: 0 });
  }
  // barris e caixas de reforço
  const perf = [[0, 0], [.3, 0], [.33, .04], [.3, .08], [.3, .28], [.34, .32], [.3, .36], [.3, .56], [.34, .6], [.3, .64], [.3, .84], [.33, .88], [.3, .92], [0, .92]].map(([x, y]) => new THREE.Vector2(x, y));
  const pB = new Pecas(); for (const [x, z, e] of [[0, 0, 1], [.5, -.25, .96], [-.46, -.35, 1.02]]) pB.por(new THREE.LatheGeometry(perf, 14), '#e0352b', { x, z, s: e * 1.15 }).por(new THREE.CylinderGeometry(.36, .36, .2, 14), '#ffc62e', { x, y: .53 * e, z, s: [e, 1, e] });
  const barril = com(pB), caixa = com(new Pecas().por(caixaRedonda(1.2, 1, 1, .1, 1), '#3fa34d').por(caixaRedonda(1.26, .16, 1.06, .05, 1), '#fbf6ea', { y: .28 }).por(caixaRedonda(.2, 1.06, 1.06, .05, 1), '#fbf6ea').por(caixaRedonda(.62, .2, 1.1, .05, 1), '#ffc62e', { y: -.12 }).por(caixaRedonda(.2, .62, 1.1, .05, 1), '#ffc62e', { y: -.12 }));
  const copa = D(new Pecas().por(new THREE.SphereGeometry(1.2, 12, 6, 0, 6.29, 0, 1.5), '#ff7a1f', { y: 2.1, s: [1, .75, 1] }).por(new THREE.SphereGeometry(1.21, 12, 6, 0, .52, 0, 1.5), '#fbf6ea', { y: 2.1, s: [1, .75, 1] }).por(new THREE.SphereGeometry(1.21, 12, 6, 2.1, .52, 0, 1.5), '#fbf6ea', { y: 2.1, s: [1, .75, 1] }).por(new THREE.SphereGeometry(1.21, 12, 6, 4.2, .52, 0, 1.5), '#fbf6ea', { y: 2.1, s: [1, .75, 1] }).pronta());
  const barris = S.barris.map(b => {
    const g = new THREE.Group(); g.position.set(b.x, 0, -b.d); g.visible = false; cena.add(g); let pq = null; if (b.reforco) { const m = caixa(g); m.position.y = .5; pq = new THREE.Mesh(copa, mObj); g.add(pq); } else barril(g);
    const L = letreiro(160, 80), mL = D(new THREE.SpriteMaterial({ map: D(L.t), depthWrite: false, fog: false, toneMapped: false })), s = new THREE.Sprite(mL); s.position.y = b.reforco ? 1.5 : 1.6; s.scale.set(1.3, .65, 1); s.renderOrder = 4; g.add(s);
    return { b, g, L, pq, ultimo: '' };
  });
  return {
    atualizar(dt, t, d) {
      for (const o of grupos) {
        const perto = o.p.d - d; o.g.visible = perto < 120 && perto > -20 && o.sumir < 1; if (!o.g.visible) continue;
        if (o.p.usado >= 0) o.sumir = Math.min(1, o.sumir + dt * 2.2);
        o.lados.forEach((k, i) => {
          const tx = texto(k.l), bom = S.bom(k.l), ouro = k.l.tipo === 'arma' || k.l.tipo === 'cadencia' || k.l.tipo === 'especial';
          if (tx !== k.ultimo) { if (k.ultimo) k.pulo = 1; k.ultimo = tx; k.L.escrever(tx, legenda(k.l), k.l.tipo === 'especial' ? k.l.arma : undefined); }
          const c = ouro ? OURO : bom ? AZUL : VERM; k.u.uCor.value.lerp(c, k.pronto ? Math.min(1, dt * 6) : 1); k.pronto = true;
          k.pulo = Math.max(0, k.pulo - dt * 5); const a = o.p.usado < 0 ? 1 : o.p.usado === i ? 1 - o.sumir : Math.max(0, .5 - o.sumir); k.u.uA.value = a; k.mL.opacity = a;
          const e = 1 + k.pulo * .14 + (o.p.usado === i ? o.sumir * .5 : 0); k.txt.scale.set(e, e, 1);
        });
      }
      for (const o of barris) { const b = o.b, perto = b.d - d; o.g.visible = b.vivo && perto < 110 && perto > -15; if (!o.g.visible) continue; o.g.position.set(b.x, b.alt || 0, -b.d); if (o.pq) o.pq.visible = b.alt > 0; const v = b.reforco ? '+' + b.reforco : String(Math.max(1, Math.ceil(b.vida))); if (v !== o.ultimo) { o.ultimo = v; o.L.escrever(v); } o.g.scale.setScalar(1 + b.dano * .05); }
    },
    dispose() { for (const o of lixo) o.dispose(); for (const o of [...grupos, ...barris]) o.g.removeFromParent(); },
  };
}
