// Efeitos do Galatic Pinball: só aparecem quando a bola bate ou completa alguma coisa (explosões de cor, ondas no chão,
// anéis, rastro da bola, fogos e um tremor leve). Nada pisca sozinho: o dono achou luz piscando muito incômoda.
import * as THREE from 'three';

// Cores de cada fase: [principal, segunda, terceira]
export const PALETAS = [
  [0xff7a1a, 0xffd23a, 0xff2f6a],   // decolagem
  [0x1fd0ff, 0x4a6aff, 0x35ffd0],   // órbita
  [0xff3a1a, 0xffa01a, 0xff2fd0],   // meteoros
  [0x9a5cff, 0x2ff0ff, 0xff5cf0],   // caminhada
  [0x2fff8a, 0x1fd0ff, 0xf0ff4a],   // resgate
  [0xff2fa0, 0xffd23a, 0x1fd0ff],   // reentrada
];
const VIVAS = [0xff2fa0, 0x1fd0ff, 0xffd23a, 0x35ff9a, 0xff6a2a, 0x9a5cff, 0xffffff];

export function criarEfeitos(cena, P, W, H) {
  const aleat = (a, b) => a + Math.random() * (b - a), cor = new THREE.Color();
  let paleta = PALETAS[0].map(c => new THREE.Color(c)), alvo = paleta.map(c => c.clone());

  // ---------- Partículas ----------
  const N = 1100, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), tam = new Float32Array(N), vel = new Float32Array(N * 3), vida = new Float32Array(N), total = new Float32Array(N).fill(1), cbase = new Float32Array(N * 3), tbase = new Float32Array(N), grav = new Float32Array(N);
  const gp = new THREE.BufferGeometry();
  gp.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gp.setAttribute('cor', new THREE.BufferAttribute(col, 3)); gp.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  const matP = new THREE.ShaderMaterial({
    uniforms: { escala: { value: 1000 } },
    vertexShader: 'attribute vec3 cor; attribute float tam; varying vec3 c; uniform float escala; void main(){ c = cor; vec4 p = modelViewMatrix * vec4(position, 1.); gl_PointSize = tam * escala / max(1., -p.z); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'varying vec3 c; void main(){ float d = length(gl_PointCoord - .5) * 2.; float k = max(0., 1. - d); gl_FragColor = vec4(c * (k * k + pow(k, 6.) * 1.5), 1.); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const pontos = new THREE.Points(gp, matP); pontos.frustumCulled = false; pontos.renderOrder = 7; pontos.userData.movel = true; cena.add(pontos);
  let prox = 0;
  function solta(x, y, z, vx, vy, vz, hex, t, s, g) {
    const i = prox; prox = (prox + 1) % N;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    cor.setHex(hex); cbase[i * 3] = cor.r; cbase[i * 3 + 1] = cor.g; cbase[i * 3 + 2] = cor.b; vida[i] = total[i] = t; tbase[i] = s; grav[i] = g;
  }
  // explosão de cor num ponto
  function estourar(v, n = 24, f = 120, cores = null, s = 9, g = 160) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, u = Math.random() * 1.6 - .4, q = Math.sqrt(Math.max(0, 1 - u * u * .4)), k = f * aleat(.35, 1);
      const h = cores ? cores[i % cores.length] : i % 2 ? VIVAS[(Math.random() * 7) | 0] : paleta[i % 3].getHex();
      solta(v.x, v.y, v.z, Math.cos(a) * q * k, u * k + f * .35, Math.sin(a) * q * k, h, aleat(.35, .9), s * aleat(.6, 1.3), g);
    }
  }
  const rastro = (v, hex, s) => { for (let i = 0; i < 2; i++) solta(v.x + aleat(-2, 2), v.y + aleat(-2, 2), v.z + aleat(-2, 2), aleat(-5, 5), aleat(0, 8), aleat(-5, 5), hex, aleat(.2, .42), s, 0); };

  // ---------- Anéis de choque ----------
  const geoA = new THREE.RingGeometry(.88, 1, 56), aneis = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(geoA, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.visible = false; m.userData.movel = true; m.renderOrder = 6; cena.add(m); return { m, t: 9, r: 60 }; });
  let proxA = 0;
  function anel(v, hex, r = 60) { const a = aneis[proxA]; proxA = (proxA + 1) % aneis.length; a.t = 0; a.r = r; a.m.position.copy(v); a.m.material.color.setHex(hex); a.m.visible = true; }

  // ---------- Chão vivo: ondas de luz que nascem em cada batida ----------
  const IMP = 8, imp = Array.from({ length: IMP }, () => new THREE.Vector4(0, 0, -9, 0)); let proxI = 0;
  const uC = { t: { value: 0 }, c1: { value: paleta[0] }, c2: { value: paleta[1] }, c3: { value: paleta[2] }, imp: { value: imp } };
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(330, 900), new THREE.ShaderMaterial({
    uniforms: uC, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec2 m; void main(){ m = vec2(position.x, -position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec2 m; uniform float t; uniform vec3 c1, c2, c3; uniform vec4 imp[${IMP}];
      void main(){
        vec3 c = vec3(0.);
        for (int i = 0; i < ${IMP}; i++) { float d = t - imp[i].z; if (d < 1.1) { float k = length(m - imp[i].xy); float w = exp(-abs(k - d * 260.) * .09) * (1. - d / 1.1); float arco = atan(m.y - imp[i].y, m.x - imp[i].x); vec3 cw = mix(mix(c1, c2, sin(arco * 2. + d * 5.) * .5 + .5), c3, sin(arco * 3. - d * 4.) * .5 + .5); c += cw * w * min(1.2, imp[i].w) * .8 + c2 * exp(-k * .05) * max(0., .4 - d) * min(1., imp[i].w) * .7; } }
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  chao.rotation.x = -Math.PI / 2; chao.position.copy(P(185, 470, 1.2)); chao.userData.movel = true; chao.renderOrder = 1; cena.add(chao);
  function impacto(x, y, f = 1, t = uC.t.value) { imp[proxI].set(x - 185, y - 470, t, f); proxI = (proxI + 1) % IMP; }

  // ---------- Fundo: nebulosa viva e estrelas em velocidade ----------
  const uF = { t: { value: 0 }, c1: { value: paleta[0] }, c2: { value: paleta[1] } };
  const fundo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: uF, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 v; void main(){ v = position.xy; gl_Position = vec4(position.xy, .9999, 1.); }',
    fragmentShader: 'varying vec2 v; uniform float t; uniform vec3 c1, c2; void main(){ vec2 q = v * 2.2; float n = sin(q.x * 1.7 + t * .25) + sin(q.y * 2.1 - t * .2) + sin((q.x + q.y) * 2.6 + t * .3 + sin(q.x * 3. - t * .4)) + sin(length(q) * 3. - t * .5); n = n * .125 + .5; vec3 c = mix(vec3(.03, .02, .10), c1 * .12, smoothstep(.35, .95, n)) + c2 * .06 * smoothstep(.6, 1., sin(n * 9. + t * .2) * .5 + .5); gl_FragColor = vec4(c * .9, 1.); }',
  }));
  fundo.frustumCulled = false; fundo.renderOrder = -20; fundo.userData.movel = true; cena.add(fundo);
  const NE = 520, pe = new Float32Array(NE * 3), fe = new Float32Array(NE); for (let i = 0; i < NE; i++) { const a = Math.random() * 6.283, r = 270 + Math.random() * 700; pe[i * 3] = Math.cos(a) * r; pe[i * 3 + 1] = Math.sin(a) * r * .7 + 60; pe[i * 3 + 2] = 0; fe[i] = Math.random(); }
  const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pe, 3)); ge.setAttribute('f', new THREE.BufferAttribute(fe, 1));
  const uE = { t: { value: 0 }, escala: matP.uniforms.escala, c: { value: paleta[1] } };
  const estrelas = new THREE.Points(ge, new THREE.ShaderMaterial({ uniforms: uE, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'attribute float f; uniform float t, escala; varying float k; void main(){ float u = fract(f + t * (.06 + f * .05)); vec4 p = modelViewMatrix * vec4(position.x, position.y, -1500. + u * 2300., 1.); k = smoothstep(0., .2, u) * smoothstep(1., .85, u); gl_PointSize = (2. + f * 5.) * escala / max(1., -p.z); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'uniform vec3 c; varying float k; void main(){ float d = max(0., 1. - length(gl_PointCoord - .5) * 2.); gl_FragColor = vec4(mix(vec3(1.), c, .4) * d * d * k * 1.5, 1.); }' }));
  estrelas.frustumCulled = false; estrelas.userData.movel = true; estrelas.renderOrder = -10; cena.add(estrelas);

  // quem pediu menos movimento no aparelho recebe tremores bem fracos
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches ? .15 : 1;

  // ---------- Fogos e tremor ----------
  const fila = []; let tremor = 0, tinha = false;
  const tremer = f => { tremor = Math.min(4, tremor + f * calmo * .6); };
  function fogos(n, agora) { for (let i = 0; i < n; i++) fila.push({ t: agora + i * .16 + Math.random() * .2, v: P(aleat(30, 370), aleat(20, 420), aleat(120, 240)) }); }
  return {
    estourar, anel, impacto, rastro, tremer, fogos, paleta,
    fase(i) { PALETAS[i].forEach((h, k) => alvo[k].setHex(h)); },
    atualizar(t, dt, altura) {
      uC.t.value = t; chao.visible = imp.some(v => t - v.z < 1.15); uF.t.value = uE.t.value = t * .6; matP.uniforms.escala.value = altura;
      paleta.forEach((c, k) => c.lerp(alvo[k], Math.min(1, dt * 1.6)));
      for (let i = fila.length - 1; i >= 0; i--) if (t > fila[i].t) { estourar(fila[i].v, 46, 190, null, 11, 120); fila.splice(i, 1); }
      let vivas = 0;
      for (let i = 0; i < N; i++) {
        if (vida[i] <= 0) { if (tam[i]) { tam[i] = 0; } continue; }
        vivas++;
        vida[i] -= dt; const k = Math.max(0, vida[i] / total[i]), fr = 1 - 1.8 * dt;
        vel[i * 3] *= fr; vel[i * 3 + 1] = vel[i * 3 + 1] * fr - grav[i] * dt; vel[i * 3 + 2] *= fr;
        for (let e = 0; e < 3; e++) { pos[i * 3 + e] += vel[i * 3 + e] * dt; col[i * 3 + e] = cbase[i * 3 + e] * k * 1.5; }
        tam[i] = tbase[i] * (.4 + .6 * k);
      }
      if (vivas || tinha) gp.attributes.position.needsUpdate = gp.attributes.cor.needsUpdate = gp.attributes.tam.needsUpdate = true;
      pontos.visible = vivas > 0; tinha = vivas > 0;
      for (const a of aneis) if (a.m.visible) { a.t += dt; const u = a.t / .55; if (u >= 1) { a.m.visible = false; continue; } a.m.scale.setScalar(6 + a.r * (1 - (1 - u) * (1 - u))); a.m.material.opacity = (1 - u) * .9; }
      tremor *= Math.exp(-dt * 6);
      return tremor > .05 ? tremor : 0;
    },
  };
}
