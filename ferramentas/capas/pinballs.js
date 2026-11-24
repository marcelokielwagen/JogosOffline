// As capas dos dois pinballs: cada uma com o desenho da sua mesa.
import * as THREE from 'three';
import { V, sorte, entre, mat, verniz, metal, luz, tela, malha, esfera, caixa, letras, relevo, estudio, fotografar, camera } from './base.js';
import { ruido, criarPlaneta, criarCometa } from '../../jogos/pinball-show/mesa/espaco.js';
import { criarAstronauta, criarNave } from '../../jogos/pinball-show/mesa/astronauta.js';

const tubo = (pts, r, m, n = 240, fechado = false) => malha(new THREE.TubeGeometry(pts.getPointAt ? pts : new THREE.CatmullRomCurve3(pts, fechado), n, r, 16, fechado), m);
const mistura = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), faixa = (v, a, b) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const pintar = (w, h, cor, linear) => tela(w, h, c => { const im = c.createImageData(w, h); for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) { const p = cor(x, y); im.data[k] = p[0]; im.data[k + 1] = p[1]; im.data[k + 2] = p[2]; im.data[k + 3] = p.length > 3 ? p[3] : 255; } c.putImageData(im, 0, 0); }, linear);

// ---------- Espaço ----------
function ceu(W, H, o) {
  const n = ruido(W, H, 3, 6, o.s1), m = ruido(W, H, 4, 6, o.s2), d = ruido(W, H, 8, 5, o.s3);
  return tela(W, H, c => {
    const im = c.createImageData(W, H);
    for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
      let p = mistura(o.alto, o.baixo, y / H);
      const a = faixa(n[i], .42, .74), b = faixa(m[i], .46, .74), e = faixa(d[i], .46, .66);
      p = p.map((v, k) => v + o.n1[k] * a * (.35 + .65 * d[i]) * o.f + o.n2[k] * b * (.3 + .7 * n[i]) * o.f);
      p = mistura(p, o.alto, e * .34 * (1 - a * .4));
      const k = i * 4; im.data[k] = p[0]; im.data[k + 1] = p[1]; im.data[k + 2] = p[2]; im.data[k + 3] = 255;
    }
    c.putImageData(im, 0, 0); c.globalCompositeOperation = 'lighter';
    if (o.galaxia) espiral(c, ...o.galaxia);
    for (let i = 0; i < W * H / 480; i++) { const x = sorte() * W, y = sorte() * H, r = sorte() ** 9 * 2.1 + .35, k = entre(.25, 1); c.fillStyle = ['rgba(255,255,255,', 'rgba(190,215,255,', 'rgba(255,225,190,'][Math.floor(sorte() * 3)] + k + ')'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (let i = 0; i < o.brilhos; i++) { const x = sorte() * W, y = sorte() * H * .8, t = entre(5, 15); const g = c.createRadialGradient(x, y, 0, x, y, t); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.16, 'rgba(200,220,255,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - t, y - t, t * 2, t * 2); c.strokeStyle = 'rgba(220,235,255,.5)'; c.lineWidth = .8; c.beginPath(); c.moveTo(x - t * 1.5, y); c.lineTo(x + t * 1.5, y); c.moveTo(x, y - t * 1.5); c.lineTo(x, y + t * 1.5); c.stroke(); }
  });
}
function espiral(c, cx, cy, R, achat, giro) {
  c.save(); c.translate(cx, cy); c.rotate(giro); c.scale(1, achat);
  for (let i = 0; i < 26000; i++) {
    const t = sorte() ** .75, braco = Math.floor(sorte() * 2), a = braco * Math.PI + t * 5.2 + (sorte() + sorte() - 1) * (.9 - t * .35), r = R * (.06 + t * .94) + (sorte() - .5) * R * .1;
    const x = Math.cos(a) * r, y = Math.sin(a) * r, q = sorte() ** 4 * 2.2 + .5; c.fillStyle = t < .25 ? `rgba(255,220,170,${entre(.1, .5)})` : sorte() < .14 ? `rgba(255,90,190,${entre(.15, .5)})` : `rgba(130,${Math.floor(entre(150, 220))},255,${entre(.07, .42)})`; c.beginPath(); c.arc(x, y, q, 0, 7); c.fill();
  }
  for (let i = 0; i < 260; i++) { const t = sorte(), a = (i % 2) * Math.PI + t * 5.2 + (sorte() - .5) * .5, r = R * (.08 + t * .9), x = Math.cos(a) * r, y = Math.sin(a) * r, q = R * entre(.05, .16), g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, i % 5 ? 'rgba(70,110,255,.10)' : 'rgba(255,60,170,.11)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R * .46); g.addColorStop(0, 'rgba(255,248,225,1)'); g.addColorStop(.14, 'rgba(255,214,150,.8)'); g.addColorStop(.45, 'rgba(255,140,110,.24)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * .5, 0, 7); c.fill(); c.restore();
}
const aura = (r, cor, f = 1, larg = 1.16, pot = 2.6) => { const m = malha(new THREE.SphereGeometry(r * larg, 128, 96), new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(cor) }, f: { value: f }, p: { value: pot } }, vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix * normal); vec4 q = modelViewMatrix * vec4(position,1.); v = normalize(-q.xyz); gl_Position = projectionMatrix * q; }', fragmentShader: 'uniform vec3 c; uniform float f, p; varying vec3 n; varying vec3 v; void main(){ float k = pow(clamp(-dot(normalize(n), normalize(v)), 0., 1.), p); gl_FragColor = vec4(c * k * f, 1.); }', side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); m.castShadow = m.receiveShadow = false; return m; };
const fulgor = (cor, t, f = 1) => { const x = tela(256, 256, c => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, '#fff'); g.addColorStop(.2, 'rgba(255,255,255,.45)'); g.addColorStop(.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: x, color: new THREE.Color(cor).multiplyScalar(f), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); s.scale.setScalar(t); return s; };
function planetaFaixas(r, cores, s) {
  const W = 1024, H = 512, n = ruido(W, H, 4, 6, s), q = cores.length;
  const t = pintar(W, H, (x, y) => { const v = n[y * W + x], f = ((y + (v - .5) * 70) / H * 15 + 60) % q, i = Math.floor(f), k = f - i; const c = mistura(cores[i], cores[(i + 1) % q], k * k * (3 - 2 * k)); return c.map(u => Math.min(255, u * (.78 + v * .46))); });
  const g = new THREE.Group(); g.add(esfera(r, mat({ map: t, roughness: .8 }), 0, 0, 0)); return g;
}
function planetaRocha(r, a, b, s, relevoF = 3) {
  const W = 1024, H = 512, n = ruido(W, H, 8, 6, s), m = ruido(W, H, 4, 4, s + 9), cr = Array.from({ length: 60 }, () => [sorte() * W, entre(.12, .88) * H, entre(5, 34)]), alt = new Float32Array(W * H);
  for (let i = 0; i < alt.length; i++) alt[i] = n[i] * .6 + m[i] * .4;
  for (const [cx, cy, cr2] of cr) for (let y = Math.max(0, Math.floor(cy - cr2 * 1.4)); y < Math.min(H, cy + cr2 * 1.4); y++) for (let x = Math.floor(cx - cr2 * 1.4); x < cx + cr2 * 1.4; x++) { const d = Math.hypot(x - cx, y - cy) / cr2, j = y * W + (x + W) % W; if (d < 1) alt[j] -= .16 * (1 - d * d * d); else if (d < 1.35) alt[j] += .1 * (1.35 - d) / .35; }
  const map = pintar(W, H, (x, y) => mistura(a, b, faixa(alt[y * W + x], .25, .7))), bump = pintar(W, H, (x, y) => { const v = Math.max(0, Math.min(255, alt[y * W + x] * 255)); return [v, v, v]; }, true);
  const g = new THREE.Group(); g.add(esfera(r, mat({ map, bumpMap: bump, bumpScale: relevoF, roughness: .95 }), 0, 0, 0)); return g;
}
function anel(r1, r2, cor1, cor2, s) {
  const g = new THREE.RingGeometry(r1, r2, 220, 1), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - r1) / (r2 - r1), .5);
  const t = pintar(1024, 2, x => { const k = x / 1024, v = .55 + .25 * Math.sin(k * 70 + s) * Math.sin(k * 31) + .2 * Math.sin(k * 190), vao = (k > .6 && k < .66) || (k > .83 && k < .845) ? .05 : 1; return [...mistura(cor1, cor2, k), Math.max(0, Math.min(1, v * vao * Math.min(1, (1 - k) * 12) * Math.min(1, k * 9))) * 245]; });
  const m = malha(g, mat({ map: t, transparent: true, side: THREE.DoubleSide, roughness: .8, depthWrite: false, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .16 })); m.castShadow = false; return m;
}
// trilho de arame: dois tubos lado a lado, travessas e apoio
function trilho(pts, larg, r, m, o = {}) {
  const g = new THREE.Group(), c = new THREE.CatmullRomCurve3(pts, !!o.fechado), n = o.n || 260, A = [], B = [], C = [];
  const lado = o.lado || (t => { const T = c.getTangentAt(t); return V(0, 1, 0).cross(T).normalize(); });
  for (let i = 0; i <= n; i++) { const t = i / n, p = c.getPointAt(t), l = lado(t, p, c.getTangentAt(t)), T = c.getTangentAt(t), b = T.clone().cross(l).normalize(); A.push(p.clone().addScaledVector(l, larg / 2)); B.push(p.clone().addScaledVector(l, -larg / 2)); C.push(p.clone().addScaledVector(b, (o.fundo ?? -.7) * larg)); }
  for (const L of [A, B]) g.add(tubo(L, r, m, n * 2)); g.add(tubo(C, r * .75, o.m2 || m, n * 2));
  const passo = o.passo || 8; for (let i = passo / 2; i < n; i += passo) { const k = Math.round(i), meio = C[k]; g.add(tubo([A[k], A[k].clone().lerp(meio, .62).addScaledVector(A[k].clone().sub(B[k]), .12), meio, B[k].clone().lerp(meio, .62).addScaledVector(B[k].clone().sub(A[k]), .12), B[k]], r * .6, m, 16)); }
  return g;
}
const cromo = () => metal('#f4f6fb', .03);
const degrade = (...c) => tela(16, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); c.forEach(([p, cor]) => g.addColorStop(p, cor)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
// título em camadas: contorno de neon, base escura e letra com degradê
function titulo(txt, larg, o) {
  const g = new THREE.Group(), base = { alt: 1, tam: 200, estilo: 'italic', fonte: '"Segoe UI Black","Arial Black",sans-serif', espaco: o.espaco || 4 };
  const t = degrade(...o.cores.map(([p, c]) => [.22 + p * .53, c])), f = letras(txt, { ...base, prof: .12, chanfro: .05, frente: mat({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: o.emi ?? .32, roughness: .18, metalness: .25, clearcoat: 1, clearcoatRoughness: .04 }), lado: metal(o.lado, .2) }); f.position.z = .12;
  const b = letras(txt, { ...base, engorda: 24, prof: .16, chanfro: .03, frente: verniz(o.fundo, { roughness: .2 }) }); b.position.z = -.06;
  const n = letras(txt, { ...base, engorda: 36, prof: .04, chanfro: .02, frente: luz(o.neon, o.neonF || 1.5) }); n.position.z = -.14; n.castShadow = n.receiveShadow = false;
  g.add(f, b, n); f.geometry.computeBoundingBox(); const bb = f.geometry.boundingBox, e = larg / (bb.max.x - bb.min.x); g.scale.setScalar(e); g.userData.alt = (bb.max.y - bb.min.y) * e; return g;
}

// ---------- Pinball Galáxia ----------
function arteMesa() {
  const W = 1024, H = 2048;
  return tela(W, H, c => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#12186e'); g.addColorStop(.5, '#1c0f5c'); g.addColorStop(1, '#0a0834'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) { const x = sorte() * W, y = sorte() * H, r = entre(90, 320), q = c.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, ['rgba(255,50,160,.13)', 'rgba(40,160,255,.15)', 'rgba(140,60,255,.16)'][i % 3]); q.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = q; c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${sorte() * .9})`; c.beginPath(); c.arc(sorte() * W, sorte() * H, sorte() ** 5 * 4 + .8, 0, 7); c.fill(); }
    // órbitas e planetas da missão
    c.lineWidth = 5; for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(70,220,255,${.85 - i * .11})`; c.beginPath(); c.ellipse(W / 2, 980, 130 + i * 72, 92 + i * 54, 0, 0, 7); c.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; c.strokeStyle = 'rgba(255,190,70,.5)'; c.lineWidth = 7; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * 64, 980 + Math.sin(a) * 46); c.lineTo(W / 2 + Math.cos(a) * (i % 2 ? 98 : 120), 980 + Math.sin(a) * (i % 2 ? 70 : 88)); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    { const q = c.createRadialGradient(W / 2, 980, 4, W / 2, 980, 66); q.addColorStop(0, '#fff8d8'); q.addColorStop(.5, '#ffc23a'); q.addColorStop(1, '#f0600a'); c.fillStyle = q; c.beginPath(); c.ellipse(W / 2, 980, 62, 46, 0, 0, 7); c.fill(); }
    [['#ff5a3a', 202, -.5], ['#58c8ff', 274, .9], ['#c8ccd8', 346, 2.5], ['#ffb25a', 418, 3.9], ['#4a6cff', 490, -1.2]].forEach(([cor, r, a], i) => { const x = W / 2 + Math.cos(a) * r, y = 980 + Math.sin(a) * (92 + (r - 130) * .75), q = c.createRadialGradient(x - 10, y - 10, 3, x, y, 36); q.addColorStop(0, '#fff'); q.addColorStop(.3, cor); q.addColorStop(1, '#100828'); c.fillStyle = q; c.beginPath(); c.arc(x, y, 34, 0, 7); c.fill(); });
    // setas e luzes acesas
    const seta = (x, y, a, cor) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = cor; c.shadowColor = cor; c.shadowBlur = 34; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(0, -60 - k * 66); c.lineTo(34, -16 - k * 66); c.lineTo(0, -30 - k * 66); c.lineTo(-34, -16 - k * 66); c.fill(); } c.restore(); };
    seta(230, 1460, -.3, '#ff3cb4'); seta(794, 1460, .3, '#35e0ff'); seta(512, 1420, 0, '#ffd23a');
    for (let i = 0; i < 7; i++) { const x = 512 + (i - 3) * 82, y = 1600 + Math.abs(i - 3) * -22; c.fillStyle = ['#ff3a5a', '#ff9a2a', '#ffe23a', '#4aff7a', '#3ae0ff', '#6a7aff', '#ff4ad0'][i]; c.shadowColor = c.fillStyle; c.shadowBlur = 30; c.beginPath(); c.arc(x, y, 25, 0, 7); c.fill(); } c.shadowBlur = 0;
  });
}
function foguete() {
  const g = new THREE.Group(), branco = verniz('#f6f6f2', { roughness: .22 }), verm = verniz('#e5212f', { roughness: .18 }), aco = metal('#c9d0dc', .2);
  const perfil = [[.24, -1], [.36, -.8], [.45, -.4], [.48, 0], [.46, .4], [.38, .8], [.27, 1.1]].map(p => new THREE.Vector2(...p));
  g.add(malha(new THREE.LatheGeometry(new THREE.SplineCurve(perfil).getPoints(60), 96), branco));
  g.add(malha(new THREE.LatheGeometry(new THREE.SplineCurve([[.27, 1.1], [.18, 1.34], [.08, 1.54], [.0, 1.66]].map(p => new THREE.Vector2(...p))).getPoints(40), 96), verm));
  for (const [y, r] of [[1.1, .275], [-.62, .41]]) { const a = malha(new THREE.TorusGeometry(r, .035, 20, 96), aco, 0, y, 0); a.rotation.x = Math.PI / 2; g.add(a); }
  g.add(malha(new THREE.CylinderGeometry(.452, .435, .16, 96), verm, 0, -.42, 0));
  { const j = malha(new THREE.TorusGeometry(.19, .05, 24, 80), aco, 0, .42, .43); g.add(j); const v = malha(new THREE.SphereGeometry(.18, 48, 32).scale(1, 1, .35), mat({ color: '#0f5cc8', roughness: .04, clearcoat: 1, emissive: '#1a7aff', emissiveIntensity: .5 }), 0, .42, .42); g.add(v); }
  const s = new THREE.Shape(); s.moveTo(0, .1); s.bezierCurveTo(.3, 0, .56, -.3, .58, -.86); s.bezierCurveTo(.42, -.62, .2, -.55, 0, -.56);
  for (let i = 0; i < 4; i++) { const q = new THREE.Group(), m = malha(new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 5, curveSegments: 24 }), verm, .36, -.42, -.025); q.add(m); q.rotation.y = i * Math.PI / 2 + .5; g.add(q); }
  g.add(malha(new THREE.CylinderGeometry(.2, .3, .26, 60, 1, true), metal('#6a6f7a', .3, { side: THREE.DoubleSide }), 0, -1.1, 0));
  // chama
  const chama = (r, L, cor, k) => { const geo = new THREE.LatheGeometry(new THREE.SplineCurve([[r * .7, 0], [r, -L * .18], [r * .62, -L * .5], [r * .24, -L * .8], [0, -L]].map(p => new THREE.Vector2(...p))).getPoints(50), 64), p = geo.attributes.position, cor2 = []; for (let i = 0; i < p.count; i++) { const t = Math.pow(Math.max(0, 1 + p.getY(i) / L), 1.2); cor2.push(t, t, t); } geo.setAttribute('color', new THREE.Float32BufferAttribute(cor2, 3)); const m = malha(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, -1.16, 0); m.castShadow = false; g.add(m); };
  chama(.34, 2.1, '#ff5a10', .9); chama(.26, 1.6, '#ffb030', 1.1); chama(.15, 1.0, '#fff2d0', 1.6); const f = fulgor('#ff8a2a', 2.2, .8); f.position.y = -1.5; g.add(f);
  for (let i = 0; i < 60; i++) { const t = sorte(), p = malha(new THREE.SphereGeometry(entre(.008, .03), 10, 8), luz(['#ffb040', '#ff7020', '#fff0c0'][i % 3], 2.4), entre(-.3, .3) * (.4 + t), -1.4 - t * 2.6, entre(-.3, .3) * (.4 + t)); p.castShadow = false; g.add(p); }
  return g;
}
export function pinballGalaxia(W, H, rapido) {
  const s = new THREE.Scene(); s.background = ceu(W, H, { s1: 91, s2: 37, s3: 58, alto: [6, 6, 34], baixo: [26, 8, 62], n1: [40, 60, 210], n2: [190, 30, 130], f: .62, brilhos: 16, galaxia: [W * .24, H * .36, W * .52, .42, -.42] });
  // mesa inclinada, sumindo no espaço
  const t = new THREE.Group(); s.add(t); t.position.set(0, -2.35, 2.2); t.rotation.x = .24;
  const arte = arteMesa(), L = 11, LG = 5.6;
  const campo = malha(new THREE.PlaneGeometry(LG, L), mat({ map: arte, emissive: 0xffffff, emissiveMap: arte, emissiveIntensity: .5, roughness: .16, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: .5 })); campo.rotation.x = -Math.PI / 2; campo.position.z = -L / 2 + 1.6; t.add(campo);
  for (const k of [-1, 1]) {
    t.add(caixa(.3, .62, L, .06, metal('#39406a', .28), k * (LG / 2 + .1), .2, -L / 2 + 1.6, 4));
    const ne = malha(new THREE.CapsuleGeometry(.05, L - .4, 12, 24), luz(k < 0 ? '#ff2fa8' : '#22d4ff', 3.2), k * (LG / 2 + .04), .56, -L / 2 + 1.6); ne.rotation.x = Math.PI / 2; ne.castShadow = false; t.add(ne);
  }
  // arco do fundo
  { const pts = []; for (let i = 0; i <= 60; i++) { const a = Math.PI * i / 60; pts.push(V(Math.cos(a) * LG / 2, .56, -L + 1.7 - Math.sin(a) * 1.5)); } const a = tubo(pts, .05, luz('#b46bff', 3)); a.castShadow = false; t.add(a); const m = tubo(pts.map(p => p.clone().setY(.2)), .16, metal('#39406a', .28)); t.add(m); }
  // cogumelos (para-choques)
  const cogumelo = (x, z, cor, e) => {
    const g = new THREE.Group(); g.add(malha(new THREE.CylinderGeometry(.5, .58, .2, 80), verniz('#f2f4fa'), 0, .1, 0), malha(new THREE.CylinderGeometry(.36, .36, .5, 60), mat({ color: cor, emissive: cor, emissiveIntensity: .8, roughness: .3, transparent: true, opacity: .95 }), 0, .4, 0));
    const a = malha(new THREE.TorusGeometry(.56, .05, 20, 90), cromo(), 0, .24, 0); a.rotation.x = Math.PI / 2; g.add(a); const b = malha(new THREE.TorusGeometry(.47, .04, 20, 90), luz(cor, 2.6), 0, .56, 0); b.rotation.x = Math.PI / 2; b.castShadow = false; g.add(b);
    const tampa = malha(new THREE.LatheGeometry([[0, .16], [.2, .15], [.42, .1], [.56, .02], [.6, -.06], [.55, -.1], [0, -.1]].reverse().map(p => new THREE.Vector2(...p)), 96), verniz('#ffffff', { roughness: .15, color: cor }), 0, .72, 0); g.add(tampa);
    const es = relevo(300, 300, (c, w) => { c.translate(w / 2, w / 2); c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 56 : 128, an = i * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.fill(); }, { alt: .78, prof: .05, chanfro: .02, frente: verniz('#fff', { emissive: '#fff', emissiveIntensity: .35 }) }); es.rotation.x = -Math.PI / 2; es.position.y = .88; g.add(es);
    g.position.set(x, 0, z); g.scale.setScalar(e); t.add(g); const f = fulgor(cor, 2.6 * e, .34); f.position.set(x, .5, z); t.add(f);
  };
  cogumelo(-1.25, -3.1, '#ff2f78', 1.05); cogumelo(1.3, -3.4, '#1fa8ff', 1.05); cogumelo(.05, -4.7, '#ffb01f', 1.05);
  // palhetas
  for (const k of [-1, 1]) {
    const f = new THREE.Shape(), r1 = .27, r2 = .15, C = 1.55; f.absarc(0, 0, r1, Math.PI / 2, Math.PI * 1.5); f.lineTo(C, -r2); f.absarc(C, 0, r2, -Math.PI / 2, Math.PI / 2); f.lineTo(0, r1);
    const g = new THREE.Group(), geo = (p, b) => new THREE.ExtrudeGeometry(f, { depth: p, bevelEnabled: true, bevelSize: b, bevelThickness: .04, bevelSegments: 6, curveSegments: 40 });
    const a = malha(geo(.2, .02), verniz('#fbfbff', { roughness: .16 })); a.rotation.x = -Math.PI / 2; a.position.y = .2; g.add(a); const b = malha(geo(.16, .07), verniz('#e5162e', { roughness: .4, clearcoat: .4 })); b.rotation.x = -Math.PI / 2; b.position.y = .2; b.scale.z = .8; g.add(b); g.add(malha(new THREE.CylinderGeometry(.13, .15, .1, 50), verniz('#e5162e'), 0, .47, 0));
    g.position.set(k * 1.95, 0, .28); g.rotation.y = k > 0 ? Math.PI - .3 : .3; if (k < 0) g.rotation.y = .3; t.add(g);
    // estilingues
    const e = new THREE.Shape(); e.moveTo(0, 0); e.lineTo(0, 1.5); e.lineTo(.72, .1); e.closePath(); const m = malha(new THREE.ExtrudeGeometry(e, { depth: .3, bevelEnabled: true, bevelSize: .08, bevelThickness: .05, bevelSegments: 6 }), verniz(k < 0 ? '#ff2f5c' : '#2a6cff', { emissive: k < 0 ? '#ff1040' : '#1040ff', emissiveIntensity: .3 })); m.rotation.x = -Math.PI / 2; m.scale.x = -k; if (k > 0) m.scale.x = -1; m.material.side = THREE.DoubleSide; m.position.set(k * 2.2, .08, -.75); t.add(m);
  }
  // Saturno, planetas e lua
  const sat = planetaFaixas(1.42, [[250, 222, 170], [226, 178, 112], [255, 238, 200], [204, 142, 88], [240, 200, 140]], 51); sat.position.set(.92, 1.0, -4.2); sat.rotation.set(.15, 0, .3); s.add(sat); { const a = anel(1.8, 2.95, [255, 226, 170], [214, 150, 110], 1); a.rotation.set(-1.2, 0, 0); sat.add(a); sat.add(aura(1.42, '#ffb060', 1.1)); }
  const marte = planetaRocha(.42, [120, 40, 22], [240, 120, 70], 71); marte.position.set(-2.05, -.02, -1.8); s.add(marte); marte.add(aura(.42, '#ff7040', .8));
  const net = planetaFaixas(.5, [[40, 80, 220], [70, 130, 255], [30, 60, 190], [110, 170, 255]], 33); net.position.set(-2.55, 2.35, -4); s.add(net); net.add(aura(.5, '#4a8cff', 1.2));
  const lua = planetaRocha(.3, [80, 82, 96], [215, 216, 226], 19); lua.position.set(2.2, 2.0, -2); s.add(lua);
  // trilho cromado que sobe da mesa e dá a volta em Saturno
  const c0 = sat.position, volta = []; for (let i = 0; i <= 16; i++) { const a = -.35 - i / 16 * 5.4; volta.push(V(c0.x + Math.cos(a) * 2.1, c0.y - .55 + Math.sin(a) * .3 + i * .06, c0.z - Math.sin(a) * 2.1)); }
  const caminho = [V(2.0, -2.6, 2.4), V(2.05, -1.9, .6), V(2.35, -.9, -1.6), ...volta];
  s.add(trilho(caminho, .34, .04, cromo(), { n: 420, passo: 9, m2: metal('#8fb0ff', .12) }));
  const curva = new THREE.CatmullRomCurve3(caminho), bolaT = esfera(.24, cromo(), 0, 0, 0); bolaT.position.copy(curva.getPointAt(.5)).add(V(0, .17, 0)); s.add(bolaT);
  // a bola grande, saltando entre as palhetas
  const bola = esfera(.56, cromo(), .12, -1.5, 2.15); s.add(bola);
  { const f = fulgor('#7ad0ff', 2.2, .28); f.position.set(.12, -1.5, 1.5); s.add(f); }
  const fog = foguete(); fog.position.set(-1.28, .55, .6); fog.rotation.set(.1, .35, -.42); fog.scale.setScalar(.74); s.add(fog);
  for (let i = 0; i < 26; i++) { const p = malha(new THREE.DodecahedronGeometry(entre(.03, .12), 1), mat({ color: '#8a7f9a', roughness: .95, flatShading: true }), entre(-3, 3), entre(-1, 3), entre(-5, 1)); p.rotation.set(sorte() * 6, sorte() * 6, 0); s.add(p); }
  // título
  const g1 = titulo('GALÁXIA', 4.2, { cores: [[0, '#fff6c8'], [.35, '#ffd23a'], [.52, '#ff9a1a'], [.56, '#c93a00'], [.8, '#ff7a1a'], [1, '#ffd060']], lado: '#ff9a2a', fundo: '#2a0a4a', neon: '#36c8ff' }); g1.position.set(0, 2.05, 1.4); g1.rotation.set(.06, 0, .035); s.add(g1);
  const g2 = titulo('PINBALL', 2.0, { cores: [[0, '#ffffff'], [.5, '#bcd4ff'], [.54, '#5a78c8'], [1, '#e8f2ff']], lado: '#c8d8ff', fundo: '#14104a', neon: '#ff3cb4', espaco: 18 }); g2.position.set(-.1, 2.8, 1.35); g2.rotation.z = .035; s.add(g2);
  const c = camera(W, H, 36, [0, .95, 11], [0, .25, 0]);
  const est = estudio([[0xff4fb4, 5, -6, 2, 1, 2, 7], [0x40c8ff, 5, 6, 2, 1, 2, 7], [0xfff2d8, 9, -2, 7, 5, 4, 3], [0x8a5cff, 2, 0, 3, -8, 10, 5], [0xffffff, .5, 0, 1, 10, 10, 5]], 0x0b0c2c);
  return fotografar(s, c, { raio: 6.5, alvo: V(0, 0, -.8), abertura: .04, foco: 9, estudio: est, chaves: [{ cor: 0xfff0d4, k: 3.1, pos: [-3.2, 4, 5], suave: .16 }, { cor: 0x38b8ff, k: 2, pos: [5, 1.5, -2], suave: .3 }, { cor: 0xff3ca8, k: 1.5, pos: [-5, 0, -1.5], suave: .3 }], domo: { ceu: 0x6a7aff, chao: 0x5a1a8a, k: .5 }, bloom: { f: .22, r: .6, l: 1.05 }, contraste: 1.12, espelhos: [{ malha: bola, k: 1.25 }, { malha: bolaT, k: 1.2 }], vinheta: .42, saturacao: 1.16 }, W, H, rapido);
}

// ---------- Galatic Pinball ----------
function terra(r) {
  const W = 2048, H = 1024, n = ruido(W, H, 4, 7, 21), d = ruido(W, H, 16, 5, 77), nu = ruido(W, H, 6, 7, 133), nv = ruido(W, H, 12, 5, 12), g = new THREE.Group();
  const rep = t => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(3, 2); return t; };
  const mapa = rep(pintar(W, H, (x, y) => { const v = n[y * W + x] * .8 + d[y * W + x] * .2; return v < .56 ? mistura([4, 28, 110], [20, 130, 215], faixa(v, .38, .56)) : v < .568 ? [206, 196, 150] : v < .66 ? mistura([40, 130, 66], [104, 124, 70], faixa(v, .57, .66)) : mistura([118, 110, 84], [240, 244, 250], faixa(v, .66, .74)); }));
  const brilho = rep(pintar(W, H, (x, y) => { const v = n[y * W + x] * .8 + d[y * W + x] * .2 < .56 ? 70 : 220; return [v, v, v]; }, true));
  g.add(malha(new THREE.SphereGeometry(r, 256, 192), mat({ map: mapa, roughnessMap: brilho, roughness: 1 })));
  const nuvem = rep(pintar(W, H, (x, y) => { const v = nu[y * W + x] * .75 + nv[y * W + x] * .25; return [255, 255, 255, faixa(v, .53, .7) * 240]; }));
  const m = malha(new THREE.SphereGeometry(r * 1.006, 256, 192), mat({ map: nuvem, transparent: true, depthWrite: false, roughness: 1, emissive: 0x7fb4ff, emissiveMap: nuvem, emissiveIntensity: .3 })); m.castShadow = false; g.add(m); return g;
}
export function galaticPinball(W, H, rapido) {
  const larga = W > H, s = new THREE.Scene();
  s.background = ceu(W, H, { s1: 23, s2: 64, s3: 85, alto: [14, 4, 46], baixo: [60, 10, 92], n1: [210, 30, 150], n2: [30, 90, 230], f: .74, brilhos: 18 });
  // Terra embaixo, com a atmosfera acesa
  const T = new THREE.Group(), R = 13; T.position.set(larga ? 1.5 : 0, -15.2, -5); const te = terra(R); te.rotation.x = -1.15; te.rotation.y = 2.1; T.add(te, aura(R, '#3aa8ff', 1.5, 1.05, 2.2)); s.add(T);
  // planeta com anéis
  const pl = planetaFaixas(.92, [[255, 190, 120], [226, 116, 84], [255, 226, 170], [186, 70, 96], [246, 150, 110]], 45); pl.position.set(larga ? -4.9 : 2.35, larga ? 2.0 : 1.05, -5); pl.rotation.set(.2, 0, -.35); s.add(pl); { const a = anel(1.16, 1.95, [255, 206, 170], [255, 110, 170], 2); a.rotation.set(-1.25, 0, 0); pl.add(a); pl.add(aura(.92, '#ff8a6a', 1.2)); }
  const lua = planetaRocha(.26, [90, 80, 110], [220, 210, 226], 29); lua.position.set(larga ? -2.6 : -2.25, larga ? 2.5 : 2.4, -2.5); s.add(lua);
  // ônibus espacial
  const nave = criarNave(); nave.g.scale.setScalar(larga ? .027 : .031); nave.g.position.set(larga ? 3.1 : -.15, larga ? 1.75 : 2.35, -3.6); nave.g.rotation.set(.5, .34, .3); nave.chamas.forEach(f => f.scale.set(1.2, 1.2, 1.2)); s.add(nave.g);
  // astronauta em hang loose
  const ast = criarAstronauta(), ea = larga ? .0435 : .038; ast.g.scale.setScalar(ea); ast.g.position.set(larga ? 1.95 : .05, larga ? -.1 : .42, .6); ast.g.rotation.set(-.08, .22, .13); s.add(ast.g);
  let visor; ast.cab.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) if (m.color && m.color.getHex() === 0xffb23a) visor = m; }); visor.emissiveIntensity = .12; visor.roughness = .02;
  s.updateMatrixWorld(true);
  // cabo
  { const a = nave.g.localToWorld(nave.escotilha.clone()), b = ast.g.localToWorld(V(10, 14, -20)), m = a.clone().lerp(b, .5), fio = tela(64, 64, c => { c.fillStyle = '#f2efe6'; c.fillRect(0, 0, 64, 64); c.strokeStyle = '#d49a2a'; c.lineWidth = 12; for (const k of [-32, 0, 32, 64]) { c.beginPath(); c.moveTo(k - 10, 74); c.lineTo(k + 74, -10); c.stroke(); } }); fio.wrapS = fio.wrapT = THREE.RepeatWrapping; fio.repeat.set(60, 1);
    s.add(tubo([a, a.clone().add(V(.5, -.35, .7)), m.clone().add(V(1.15, .1, .3)), b.clone().add(V(.75, -.1, -.2)), b], .045, verniz(0xffffff, { map: fio, roughness: .5 }), 300)); }
  // looping: trilho cromado em volta do astronauta, com a bola descendo
  const cx = larga ? 1.95 : .05, cy = larga ? 0 : .55, Rl = larga ? 2.3 : 1.95, pts = [], N = 40;
  for (let i = 0; i <= N; i++) { const a = -2.3 + i / N * 4.5; pts.push(V(cx + Math.cos(a) * Rl, cy + Math.sin(a) * Rl * .3 - .75 + i / N * .5, .5 - Math.sin(a) * 1.8)); }
  const ini = [V(cx - (larga ? 8 : 5), cy - (larga ? 2.1 : 1.75), 3.1), V(cx - 2.9, cy - 1.7, 2.75)], fim = [V(cx - 2.6, cy + .25, -1.5), V(cx - 4.2, cy + .9, -2.2), V(cx - (larga ? 9.5 : 6), cy + (larga ? 2.4 : 1.5), larga ? -3.6 : -3)];
  const cam1 = [...ini, ...pts, ...fim], m1 = cromo();
  s.add(trilho(cam1, .42, .05, m1, { n: 520, passo: 8, m2: luz('#ff2fa8', 1.5) }));
  const cr = new THREE.CatmullRomCurve3(cam1);
  const bola = esfera(.5, cromo(), 0, 0, 0); { let tb = 0, melhor = -9; for (let k = 0; k < 1; k += .002) { const p = cr.getPointAt(k), v = p.z + p.x * .35; if (p.x > cx && v > melhor && p.x < cx + 1.6) { melhor = v; tb = k; } } bola.position.copy(cr.getPointAt(tb)).add(V(0, .36, 0)); } s.add(bola);
  { const f = fulgor('#ff4fc0', 2.4, .34); f.position.copy(bola.position).add(V(0, 0, -.6)); s.add(f); }
  // cometa
  { const co = criarCometa(17); co.atualizar(3.1, .55, true, 0); co.g.traverse(o => { if (o.isPoints) o.material.size *= .02; if (o.isSprite) o.visible = false; }); co.g.scale.setScalar(.02); co.g.position.set(larga ? -1.6 : -2.15, larga ? 1.3 : .95, -1.6); co.g.rotation.set(-.5, 2.5, .3); s.add(co.g); }
  for (let i = 0; i < 24; i++) { const p = malha(new THREE.DodecahedronGeometry(entre(.02, .09), 1), mat({ color: '#9a86a8', roughness: .95, flatShading: true }), entre(-4, 4), entre(-1.5, 3), entre(-4, 1)); p.rotation.set(sorte() * 6, sorte() * 6, 0); s.add(p); }
  // título
  const g1 = titulo('GALATIC', larga ? 3.75 : 3.72, { cores: [[0, '#ffe0f4'], [.3, '#ff5cc0'], [.52, '#ff2f9a'], [.56, '#8a1ad0'], [.78, '#ff8a3a'], [1, '#ffe66a']], lado: '#ff7ad0', fundo: '#22064a', neon: '#2fe0ff', neonF: 1.5 });
  const g2 = titulo('PINBALL', larga ? 2.8 : 2.7, { cores: [[0, '#f0ffff'], [.4, '#5ae8ff'], [.52, '#1aa8ff'], [.56, '#1c3ad0'], [.8, '#4ad0ff'], [1, '#e0fbff']], lado: '#8ad8ff', fundo: '#10064a', neon: '#ff3cb4', neonF: 1.5, espaco: 10 });
  if (larga) { g1.position.set(-1.75, -.12, 2); g2.position.set(-1.65, -.9, 2.1); g1.rotation.set(0, .16, .04); g2.rotation.set(0, .16, .04); } else { g1.position.set(0, -1.28, 2.2); g2.position.set(.1, -1.98, 2.3); g1.rotation.set(-.08, 0, .04); g2.rotation.set(-.08, 0, .04); }
  s.add(g1, g2);
  const c = larga ? camera(W, H, 33, [0, .25, 10.4], [0, .15, 0]) : camera(W, H, 36, [0, .25, 10.2], [0, .15, 0]);
  const est = estudio([[0xff3fb0, 7, -6, 1, 0, 3, 7], [0x2fd8ff, 7, 6, 1, 0, 3, 7], [0xfff2dc, 9, 2, 7, 5, 4, 3], [0x3a8cff, 2.2, 0, -7, 0, 10, 8], [0xffffff, .5, 0, 1, 10, 10, 4]], 0x14082c);
  return fotografar(s, c, { raio: 6.5, alvo: V(larga ? .6 : 0, 0, -1), abertura: .035, foco: 9.2, estudio: est, chaves: [{ cor: 0xfff2dc, k: 2.3, pos: [2.6, 4, 5], suave: .16 }, { cor: 0xff3fb0, k: 2.6, pos: [-5, 1.4, -1.6], suave: .3 }, { cor: 0x2fd0ff, k: 2.6, pos: [5, .6, -2], suave: .3 }], domo: { ceu: 0x8a6aff, chao: 0x2a6adf, k: .5 }, bloom: { f: .2, r: .6, l: 1.05 }, contraste: 1.12, espelhos: [{ malha: bola, k: 1.25 }, { malha: ast.cab, materiais: [visor], escondidos: [ast.g], k: 1.7 }], vinheta: .42, saturacao: 1.14 }, W, H, rapido);
}
