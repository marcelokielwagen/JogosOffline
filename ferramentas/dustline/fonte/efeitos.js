/* Efeitos: poeira levantada pelas rodas, marcas de pneu no chão e o clima de cada pista (névoa, poeira dourada,
   pétalas, neve, folhas). Tudo em "piscinas" de tamanho fixo: o mais velho é reaproveitado, nada cresce sem parar. */
function criarPoeira(n = 520) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), dados = new Float32Array(n * 2), vel = new Float32Array(n * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDados', new THREE.BufferAttribute(dados, 2));   // idade (0..1, >=1 morta), tamanho
  for (let i = 0; i < n; i++) dados[i * 2] = 1;
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uCor: { value: new THREE.Color() }, uEscala: { value: 400 }, fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1 } }, fog: true,
    vertexShader: `attribute vec2 aDados;uniform float uEscala;varying float vA;
#include <fog_pars_vertex>
void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.);float t=aDados.x;vA=t>=1.?0.:(1.-t)*(1.-t)*smoothstep(0.,.08,t);gl_PointSize=aDados.y*(.4+t*1.8)*uEscala/-mvPosition.z;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform vec3 uCor;varying float vA;
#include <fog_pars_fragment>
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,d)*vA*.55;if(a<.01)discard;gl_FragColor=vec4(uCor*(1.-d*.25),a);
#include <fog_fragment>
}` });
  const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = 3; let prox = 0, vida = new Float32Array(n).fill(1);
  return { malha: m, cor: c => mat.uniforms.uCor.value.set(c),
    soltar(x, y, z, vx, vz, tam, dur) { const i = prox++ % n; pos.set([x, y, z], i * 3); vel.set([vx + (Math.random() - .5) * 1.4, .6 + Math.random() * 1.4, vz + (Math.random() - .5) * 1.4], i * 3); dados[i * 2] = 0; dados[i * 2 + 1] = tam; vida[i] = dur; },
    quadro(dt) { for (let i = 0; i < n; i++) { if (dados[i * 2] >= 1) continue; dados[i * 2] = Math.min(1, dados[i * 2] + dt / vida[i]); const k = Math.exp(-dt * 1.6); vel[i * 3] *= k; vel[i * 3 + 1] = vel[i * 3 + 1] * k + dt * .25; vel[i * 3 + 2] *= k; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt; }
      g.attributes.position.needsUpdate = g.attributes.aDados.needsUpdate = true; },
    limpar() { for (let i = 0; i < n; i++) dados[i * 2] = 1; } };
}
// marcas de pneu: faixas finas coladas no chão, uma por roda de trás
function criarMarcas(n = 1600) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 4 * 3), alfa = new Float32Array(n * 4), idx = [];
  for (let i = 0; i < n; i++) { const a = i * 4; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aAlfa', new THREE.BufferAttribute(alfa, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, uniforms: { uCor: { value: new THREE.Color() } },
    vertexShader: 'attribute float aAlfa;varying float vA;void main(){vA=aAlfa;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform vec3 uCor;varying float vA;void main(){gl_FragColor=vec4(uCor,vA);}' });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1; let prox = 0; const ult = [null, null];
  return { malha: m, cor: c => mat.uniforms.uCor.value.set(c),
    // r: roda (0/1), p: posição, rumo do carro, forca 0..1 (0 = levanta o pneu e quebra a marca)
    marcar(r, x, y, z, rumo, forca) {
      if (forca < .05) { ult[r] = null; return; }
      const lx = Math.cos(rumo) * .14, lz = -Math.sin(rumo) * .14, novo = [x - lx, y, z - lz, x + lx, y, z + lz], a = ult[r];
      if (a && Math.hypot(x - a.x, z - a.z) < .35) return;
      if (a && Math.hypot(x - a.x, z - a.z) < 3) { const i = prox++ % n, o = i * 12; pos.set([...a.p, ...novo], o); alfa.fill(Math.min(.42, forca * .45), i * 4, i * 4 + 4); alfa[i * 4] *= .9; g.attributes.position.needsUpdate = g.attributes.aAlfa.needsUpdate = true; }
      ult[r] = { x, z, p: novo };
    },
    limpar() { alfa.fill(0); ult[0] = ult[1] = null; g.attributes.aAlfa.needsUpdate = true; } };
}
// clima: partículas que acompanham a câmera (caem, flutuam ou deslizam com o vento)
const CLIMAS = {
  nevoa: { n: 220, cor: '#fffaf0', tam: 1.4, cai: -.05, vento: .3, gira: 0, alfa: .55 },
  poeira: { n: 220, cor: '#ffe2b0', tam: .9, cai: -.08, vento: .5, gira: 0, alfa: .7 },
  petalas: { n: 320, cor: '#f6c2cf', tam: 1.5, cai: .9, vento: 1.4, gira: 1, alfa: .95 },
  neve: { n: 900, cor: '#ffffff', tam: 1.2, cai: 1.6, vento: .6, gira: 0, alfa: .95 },
  folhas: { n: 200, cor: '#e48a3c', tam: 1.9, cai: .8, vento: 1.6, gira: 1, alfa: .95 }
};
function criarClima() {
  const N = 900, g = new THREE.BufferGeometry(), base = new Float32Array(N * 3), f = new Float32Array(N);
  for (let i = 0; i < N; i++) { base.set([Math.random(), Math.random(), Math.random()], i * 3); f[i] = Math.random(); }
  g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aF', new THREE.BufferAttribute(f, 1));
  const U = { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uTam: { value: 1 }, uCai: { value: 1 }, uVento: { value: 1 }, uGira: { value: 0 }, uAlfa: { value: 1 }, uCor: { value: new THREE.Color() }, uEscala: { value: 400 } };
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: U,
    vertexShader: `attribute float aF;uniform float uT,uTam,uCai,uVento,uGira,uEscala;uniform vec3 uC;varying float vA,vR;
void main(){vec3 b=position;b.y=fract(b.y-uT*uCai*(.05+.04*aF)/1.);b.x=fract(b.x+uT*uVento*(.012+.01*aF)+sin(uT*.7+aF*30.)*.004);
vec3 w=uC+(b-.5)*vec3(140.,60.,140.);vec4 mv=modelViewMatrix*vec4(w,1.);vA=smoothstep(.0,.15,b.y)*smoothstep(1.,.85,b.y)*smoothstep(150.,40.,-mv.z);vR=uT*uGira*(1.+aF*2.)+aF*6.;
gl_PointSize=uTam*(.6+aF*.8)*uEscala/-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 uCor;uniform float uAlfa,uGira;varying float vA,vR;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=mat2(c,-s,s,c)*p;
float d=uGira>.5?length(p*vec2(1.,2.2)):length(p);float a=smoothstep(.5,.25,d)*vA*uAlfa;if(a<.01)discard;gl_FragColor=vec4(uCor,a);}` });
  const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = 6;
  return { malha: m, usar(tipo) { const c = CLIMAS[tipo] || CLIMAS.nevoa; g.setDrawRange(0, Math.min(N, Som.pequeno ? Math.round(c.n * .6) : c.n)); U.uTam.value = c.tam; U.uCai.value = c.cai; U.uVento.value = c.vento; U.uGira.value = c.gira; U.uAlfa.value = c.alfa; U.uCor.value.set(c.cor); },
    quadro(t, centro, escala) { U.uT.value = t; U.uC.value.copy(centro); U.uEscala.value = escala; } };
}
