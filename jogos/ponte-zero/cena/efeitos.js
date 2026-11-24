// Efeitos: rastros dos tiros, brilho na boca do cano, faíscas, sangue, fumaça, manchas no chão.
// Nada pisca sozinho: todo efeito nasce de um tiro, acerto ou explosão e some suavemente.
import * as THREE from 'three';

const NP = 1400;
export function criarEfeitos(cena, ruido, maxTiros) {
  // ---------- rastros ----------
  const gT = new THREE.InstancedBufferGeometry(), q = [];
  for (const [ax, ay] of [[1, 0], [0, 1]]) q.push([ax, ay, -1], [-ax, -ay, -1], [-ax, -ay, 1], [ax, ay, -1], [-ax, -ay, 1], [ax, ay, 1]);
  gT.setAttribute('position', new THREE.Float32BufferAttribute(q.flat(), 3));
  const aT = new THREE.InstancedBufferAttribute(new Float32Array(maxTiros * 4), 4); aT.setUsage(THREE.DynamicDrawUsage); gT.setAttribute('aT', aT); gT.instanceCount = 0;
  const mT = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uCor: { value: new THREE.Color(1, .62, .22) }, uTam: { value: new THREE.Vector2(.028, .62) } },
    vertexShader: 'attribute vec4 aT; uniform vec2 uTam; varying vec2 vU; varying float vA; void main(){ vU = vec2(position.x + position.y, position.z); vA = aT.w; vec3 p = vec3(position.x * uTam.x, position.y * uTam.x, 0.); float z = position.z * uTam.y; p.z = -z; p.x += z * sin(aT.z); p += vec3(aT.x, 1.36, aT.y); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }',
    fragmentShader: 'uniform vec3 uCor; varying vec2 vU; varying float vA; void main(){ float l = 1. - abs(vU.x), c = smoothstep(-1., .9, vU.y) * (1. - smoothstep(.9, 1., vU.y)); gl_FragColor = vec4(mix(uCor, vec3(1., .9, .7), pow(l, 3.) * c) * l * l * c * 4.2 * vA, 1.); }',
  });
  const tiros = new THREE.Mesh(gT, mT); tiros.frustumCulled = false; tiros.renderOrder = 5; cena.add(tiros);

  // ---------- brilho na boca do cano ----------
  const gB = new THREE.InstancedBufferGeometry(); gB.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const aB = new THREE.InstancedBufferAttribute(new Float32Array(110 * 4), 4); aB.setUsage(THREE.DynamicDrawUsage); gB.setAttribute('aB', aB); gB.instanceCount = 0;
  const mB = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'attribute vec4 aB; varying vec2 vU; varying float vA; void main(){ vU = position.xy; vA = aB.w; vec4 c = viewMatrix * vec4(aB.xyz, 1.); c.xy += position.xy * (.1 + .1 * aB.w); gl_Position = projectionMatrix * c; }',
    fragmentShader: 'varying vec2 vU; varying float vA; void main(){ float r = length(vU), a = max(0., 1. - r); gl_FragColor = vec4(vec3(1., .6, .25) * (a * a * 1.1 + pow(a, 6.) * 1.6) * vA, 1.); }',
  });
  const bocas = new THREE.Mesh(gB, mB); bocas.frustumCulled = false; bocas.renderOrder = 6; cena.add(bocas); let nb = 0;

  // ---------- partículas ----------
  const gP = new THREE.BufferGeometry(), pos = new Float32Array(NP * 3), cor = new Float32Array(NP * 4), ext = new Float32Array(NP * 2);
  gP.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); gP.setAttribute('aC', new THREE.BufferAttribute(cor, 4).setUsage(THREE.DynamicDrawUsage)); gP.setAttribute('aE', new THREE.BufferAttribute(ext, 2).setUsage(THREE.DynamicDrawUsage));
  const mP = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: { uAlt: { value: 800 }, tRuido: { value: ruido } },
    vertexShader: 'attribute vec4 aC; attribute vec2 aE; varying vec4 vC; varying vec2 vE; uniform float uAlt; void main(){ vC = aC; vE = aE; vec4 p = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * p; gl_PointSize = aE.x * uAlt * projectionMatrix[1][1] / -p.z; }',
    // aE.y: 0 = luz (soma), 1 = matéria (cobre), 2 = fumaça
    fragmentShader: 'varying vec4 vC; varying vec2 vE; uniform sampler2D tRuido; void main(){ vec2 u = gl_PointCoord * 2. - 1.; float r = dot(u, u); if (r > 1.) discard; float a = vC.a * (1. - r); if (vE.y > 1.5) { a *= smoothstep(.2, .75, texture2D(tRuido, gl_PointCoord * .45 + vC.r + vC.a * .2).r + .3 * (1. - r)); } else if (vE.y > .5) a = vC.a * smoothstep(1., .55, r); gl_FragColor = vec4(vC.rgb * a, vE.y > .5 ? a : 0.); }',
  });
  const pontos = new THREE.Points(gP, mP); pontos.frustumCulled = false; pontos.renderOrder = 4; cena.add(pontos);
  const P = Array.from({ length: NP }, () => ({ v: 0 })); let prox = 0;
  function particula(x, y, z, vx, vy, vz, vida, tam, cresce, r, g, b, a, tipo, grav) { const p = P[prox]; prox = (prox + 1) % NP; Object.assign(p, { x, y, z, vx, vy, vz, v: vida, vt: vida, tam, cresce, r, g, b, a, tipo, grav }); }
  const R = (a = 1) => (Math.random() - .5) * 2 * a;

  // ---------- manchas no chão ----------
  const NM = 110, gM = new THREE.PlaneGeometry(1, 1); gM.rotateX(-Math.PI / 2);
  const mM = new THREE.MeshStandardMaterial({ color: '#2a0605', roughness: .25, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  mM.onBeforeCompile = sh => { sh.uniforms.tRuido = { value: ruido }; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUm; varying float vS;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvUm = position.xz; vS = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .21;'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; varying vec2 vUm; varying float vS;').replace('#include <color_fragment>', 'float rr = length(vUm) * 2.; diffuseColor.a = smoothstep(.0, .14, texture2D(tRuido, vUm * .55 + vS).r * 1.25 - rr * .72 - .08) * .72;'); };
  const manchas = new THREE.InstancedMesh(gM, mM, NM); manchas.frustumCulled = false; manchas.receiveShadow = true; manchas.renderOrder = 1; manchas.count = 0; cena.add(manchas); let im = 0; const Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), EY = new THREE.Vector3(0, 1, 0);

  // luz das explosões
  const luzExp = new THREE.PointLight('#ff8a3a', 0, 22, 1.5); cena.add(luzExp);
  let comSangue = true;

  return {
    sangueLigado(s) { comSangue = s; manchas.visible = s; },
    sangue(x, y, z, n, forca = 1) { if (!comSangue) return this.poeira(x, y, z, n); for (let i = 0; i < n; i++) particula(x + R(.1), y + R(.15), z, R(1.6) * forca, .6 + Math.random() * 2.2 * forca, -Math.random() * 3.2 * forca, .35 + Math.random() * .35, .022 + Math.random() * .04, .02, .16, .012, .01, .9, 1, 9); particula(x, y, z, 0, .2, -.4, .3, .16, .5, .13, .012, .01, .35, 2, 0); },
    poeira(x, y, z, n) { for (let i = 0; i < Math.ceil(n / 2); i++) particula(x + R(.1), y + R(.15), z, R(.6), .4 + Math.random() * .5, R(.5), .5, .1, .4, .3, .25, .2, .3, 2, 0); },
    mancha(x, z, t) { const i = im; im = (im + 1) % NM; Q.setFromAxisAngle(EY, Math.random() * 6.28); Mx.compose(new THREE.Vector3(x, .012 + i * .00008, z), Q, new THREE.Vector3(t, 1, t)); manchas.setMatrixAt(i, Mx); manchas.count = Math.min(NM, Math.max(manchas.count, i + 1)); manchas.instanceMatrix.needsUpdate = true; },
    faisca(x, y, z, n, azul) { for (let i = 0; i < n; i++) particula(x, y, z, R(3), 1 + Math.random() * 3, Math.random() * 3.5, .18 + Math.random() * .25, .014 + Math.random() * .014, 0, azul ? .3 : 2.2, azul ? 1.1 : 1.2, azul ? 2.6 : .4, 1, 0, 8); },
    explosao(x, z) {
      for (let i = 0; i < 34; i++) { const a = Math.random() * 6.28, f = 1 + Math.random() * 3.4; particula(x + R(.3), .5 + R(.3), z + R(.3), Math.cos(a) * f, 1 + Math.random() * 4, Math.sin(a) * f, .5 + Math.random() * .4, .35 + Math.random() * .4, 1.2, 2.4, .85 + Math.random() * .3, .18, .75, 0, -1); }
      for (let i = 0; i < 22; i++) { const a = Math.random() * 6.28, f = .4 + Math.random() * 1.8; particula(x + R(.5), .6, z + R(.5), Math.cos(a) * f, 1 + Math.random() * 2.2, Math.sin(a) * f, 1.4 + Math.random() * 1.2, .5 + Math.random() * .5, 1.1, .09, .075, .065, .6, 2, -.3); }
      for (let i = 0; i < 46; i++) { const a = Math.random() * 6.28, f = 3 + Math.random() * 7; particula(x, .6, z, Math.cos(a) * f, 2 + Math.random() * 6, Math.sin(a) * f, .5 + Math.random() * .6, .02 + Math.random() * .03, 0, 2.6, 1.3, .4, 1, 0, 11); }
      luzExp.position.set(x, 1.6, z); luzExp.intensity = 90;
    },
    chegada(x, z, bom) { for (let i = 0; i < 9; i++) particula(x + R(.3), .1 + Math.random() * 1.6, z + R(.3), 0, 1 + Math.random(), 0, .5 + Math.random() * .3, .03, 0, bom ? .3 : 2, bom ? 1.2 : .3, bom ? 2.4 : .2, .9, 0, 0); },
    portal(x, z, larg, bom) { for (let i = 0; i < 60; i++) particula(x + R(larg), .2 + Math.random() * 2.8, z + R(.1), R(.6), R(.6), -1 - Math.random() * 3, .5 + Math.random() * .4, .02 + Math.random() * .025, 0, bom ? .3 : 2.2, bom ? 1.1 : .35, bom ? 2.4 : .25, 1, 0, 0); },
    boca(x, y, z, f) { if (nb < 110) aB.array.set([x, y, z, f], nb++ * 4); },
    fecharBocas() { gB.instanceCount = nb; aB.needsUpdate = true; nb = 0; },
    tamanhoTiro(a) { mT.uniforms.uTam.value.set(a === 2 ? .042 : .036, a === 2 ? .85 : a === 1 ? .6 : .5); },
    altura(px) { mP.uniforms.uAlt.value = px / 2; },
    atualizar(dt, S, base) {
      let n = 0; for (const t of S.tiros) { if (n >= maxTiros) break; aT.array.set([t.x, -t.d, Math.atan2(t.vx, t.vel), Math.min(1, t.resta / 5)], n++ * 4); }
      gT.instanceCount = n; aT.clearUpdateRanges(); aT.addUpdateRange(0, n * 4); aT.needsUpdate = true;
      for (let i = 0; i < NP; i++) {
        const p = P[i], o = i * 4; if (p.v <= 0) { ext[i * 2] = 0; cor[o + 3] = 0; pos[i * 3 + 1] = -99; continue; }
        p.v -= dt; p.vy -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.tipo === 2) { p.vx *= 1 - dt * 1.2; p.vz *= 1 - dt * 1.2; } if (p.y < .02 && p.grav > 0) { p.y = .02; p.vx = p.vz = p.vy = 0; }
        const k = Math.max(0, p.v / p.vt); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; cor[o] = p.r; cor[o + 1] = p.g; cor[o + 2] = p.b; cor[o + 3] = p.a * (p.tipo === 1 ? Math.min(1, k * 2) : k); ext[i * 2] = p.tam + p.cresce * (1 - k); ext[i * 2 + 1] = p.tipo;
      }
      gP.attributes.position.needsUpdate = gP.attributes.aC.needsUpdate = gP.attributes.aE.needsUpdate = true;
      luzExp.intensity = Math.max(0, luzExp.intensity - dt * 150);
    },
    dispose() { for (const o of [gT, mT, gB, mB, gP, mP, gM, mM]) o.dispose(); manchas.dispose(); for (const o of [tiros, bocas, pontos, manchas, luzExp]) o.removeFromParent(); },
  };
}
