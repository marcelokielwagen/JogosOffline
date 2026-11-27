'use strict';
// Base: ajudantes, animações por tempo, renderizador, reflexos (ambiente), partículas e confete.
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a);
const pega = l => l[Math.floor(Math.random() * l.length)];
const Ease = {
  lin: t => t, out: t => 1 - (1 - t) ** 3, inn: t => t * t, inOut: t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  back: t => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
  el: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * 2.0944) + 1,
};
const VEL = { v: 1 }; // velocidade do tempo (os testes aceleram)
const Anim = {
  l: [],
  add(dur, fn, ease = Ease.lin) { return new Promise(res => { if (dur <= 0) { fn(1, 1); res(); return; } this.l.push({ t: 0, dur, fn, ease, res }); }); },
  tick(dt) { const l = this.l; for (let i = l.length - 1; i >= 0; i--) { const a = l[i]; if (!a) continue; a.t += dt; const k = Math.min(1, a.t / a.dur); a.fn(a.ease(k), k); if (k >= 1) { l.splice(l.indexOf(a), 1); a.res(); } } },
};
const espera = s => Anim.add(s, () => {});

// ---------- renderizador ----------
let R;
try { R = new THREE.WebGLRenderer({ canvas: $('#tela'), antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('#semgl').hidden = false; throw e; }
R.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.08;
R.autoClear = false; R.setClearColor(0x000000, 0);

// reflexos: uma "sala" de luzes coloridas vira o mapa de ambiente que faz as joias e o ouro brilharem
const ENV = (() => {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x2a1a52);
  const painel = (cor, int, w, h, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(int), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); s.add(m); };
  painel(0xffffff, 5, 7, 2.2, [0, 6, 3]); painel(0xffd27a, 3, 3, 6, [-6, 1, 2]); painel(0x7fb4ff, 2.6, 3, 6, [6, 1, 1]);
  painel(0xff7ab0, 1.6, 9, 2, [0, -5, 2]); painel(0xffffff, 6, 1.4, 1.4, [2.5, 3, 6]); painel(0xb98cff, 1.5, 8, 8, [0, 0, -8]);
  const pm = new THREE.PMREMGenerator(R), t = pm.fromScene(s, .02).texture; pm.dispose(); return t;
})();

// ---------- texturas simples ----------
function texCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const TEX_PONTO = texCanvas(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const TEX_BRILHO = texCanvas(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 14); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff'; for (const [w, h] of [[3, 30], [30, 3]]) { g.beginPath(); g.ellipse(32, 32, w, h, 0, 0, Math.PI * 2); g.fill(); }
});
const TEX_CACO = texCanvas(32, 32, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(16, 2); g.lineTo(29, 20); g.lineTo(12, 30); g.lineTo(3, 14); g.closePath(); g.fill(); });

// ---------- partículas (pontos com tamanho e transparência próprios) ----------
class Particulas {
  constructor(cena, max, tex, aditivo = true) {
    this.max = max; this.p = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3); this.cor = new Float32Array(max * 3); this.tam = new Float32Array(max); this.alfa = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('cor', new THREE.BufferAttribute(this.cor, 3));
    g.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1)); g.setAttribute('alfa', new THREE.BufferAttribute(this.alfa, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { mapa: { value: tex }, escala: { value: 300 } },
      vertexShader: 'attribute vec3 cor;attribute float tam;attribute float alfa;varying vec3 vC;varying float vA;uniform float escala;void main(){vC=cor;vA=alfa;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=tam*escala/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform sampler2D mapa;varying vec3 vC;varying float vA;void main(){vec4 t=texture2D(mapa,gl_PointCoord);gl_FragColor=vec4(vC*t.rgb,t.a*vA);}',
      transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.obj = new THREE.Points(g, this.mat); this.obj.frustumCulled = false; this.obj.renderOrder = 20; cena.add(this.obj); this.g = g;
  }
  emitir(x, y, z, o = {}) {
    if (this.p.length >= this.max) this.p.shift();
    const c = o.cor || [1, 1, 1];
    this.p.push({ x, y, z, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, vida: o.vida || .6, t: 0, tam: o.tam ?? .2, tamF: o.tamF ?? 0, r: c[0], g: c[1], b: c[2], grav: o.grav || 0, arr: o.arr ?? 1.5 });
  }
  explosao(x, y, z, n, o = {}) { // várias partículas numa bola
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = rnd(-.6, .9), v = rnd(o.v0 || 1, o.v1 || 4); this.emitir(x, y, z, { ...o, vx: Math.cos(a) * Math.cos(e) * v, vy: Math.sin(a) * Math.cos(e) * v + (o.sobe || 0), vz: Math.sin(e) * v * .6, vida: rnd(o.vida0 || .4, o.vida1 || .9) }); }
  }
  tick(dt) {
    let i = 0; const P = this.p;
    for (let j = 0; j < P.length; j++) {
      const q = P[j]; q.t += dt; if (q.t >= q.vida) continue;
      q.vy -= q.grav * dt; const a = Math.exp(-q.arr * dt); q.vx *= a; q.vy *= a; q.vz *= a;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      const k = q.t / q.vida;
      this.pos[i * 3] = q.x; this.pos[i * 3 + 1] = q.y; this.pos[i * 3 + 2] = q.z;
      this.cor[i * 3] = q.r; this.cor[i * 3 + 1] = q.g; this.cor[i * 3 + 2] = q.b;
      this.tam[i] = lerp(q.tam, q.tamF, k); this.alfa[i] = k < .08 ? k / .08 : 1 - (k - .08) / .92;
      P[i++] = q;
    }
    P.length = i; this.g.setDrawRange(0, i);
    for (const n of ['position', 'cor', 'tam', 'alfa']) this.g.attributes[n].needsUpdate = true;
  }
}
const corRGB = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

// ---------- camada de cima (tela inteira, em pixels): confete ----------
const cenaOver = new THREE.Scene(), camOver = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
const Confete = (() => {
  const MAX = 320, m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), MAX);
  m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3); m.count = 0; m.frustumCulled = false; cenaOver.add(m);
  const P = [], d = new THREE.Object3D(), c = new THREE.Color();
  const CORES = [0xffd34d, 0xff2f55, 0x2f7bff, 0x1fcf6c, 0xa64dff, 0xff7ac0, 0xffffff];
  function add(x, y, vx, vy) { if (P.length >= MAX) P.shift(); P.push({ x, y, vx, vy, rot: rnd(0, 6), vr: rnd(-8, 8), giro: rnd(0, 6), vg: rnd(6, 14), t: 0, vida: rnd(2.2, 3.6), w: rnd(9, 14), h: rnd(5, 8), cor: pega(CORES) }); }
  return {
    explodir(x, y, n = 80, forca = 700) { for (let i = 0; i < n; i++) { const a = rnd(Math.PI * .1, Math.PI * .9), v = rnd(.4, 1) * forca; add(x, y, Math.cos(a) * v, Math.sin(a) * v); } },
    chuva(W, H, n = 120) { for (let i = 0; i < n; i++) add(rnd(-W / 2, W / 2), H / 2 + rnd(10, 300), rnd(-60, 60), rnd(-200, -50)); },
    tick(dt) {
      let i = 0;
      for (let j = 0; j < P.length; j++) {
        const q = P[j]; q.t += dt; if (q.t > q.vida) continue;
        q.vy -= 900 * dt; const a = Math.exp(-2.2 * dt); q.vx *= a; q.vy = Math.max(q.vy * a, -260); q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; q.giro += q.vg * dt;
        d.position.set(q.x, q.y, 0); d.rotation.set(0, 0, q.rot); d.scale.set(q.w * Math.cos(q.giro) + .01, q.h, 1); d.updateMatrix();
        m.setMatrixAt(i, d.matrix); c.setHex(q.cor).multiplyScalar(.75 + .25 * Math.abs(Math.cos(q.giro))); m.setColorAt(i, c);
        P[i++] = q;
      }
      P.length = i; m.count = i; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    },
  };
})();

// áreas da tela (em px CSS, y a partir do topo): personagem e tabuleiro
const L = { W: innerWidth, H: innerHeight, rei: { x: 0, y: 0, w: 1, h: 1 }, tab: { x: 0, y: 0, w: 1, h: 1 }, paisagem: false };
