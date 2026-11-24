// Planetas e cometa do Galatic Pinball (texturas e relevo criados por código, sem arquivos externos).
import * as THREE from 'three';

// ---------- Ruído suave (para nuvens, continentes e rochas) ----------
function grade(semente) {
  let s = semente; const v = new Float32Array(65536);
  for (let i = 0; i < v.length; i++) { s = (s * 16807) % 2147483647; v[i] = s / 2147483647; }
  return v;
}
// camadas de ruído que se repetem na horizontal (para embrulhar a esfera sem emenda)
export function ruido(w, h, escala, oitavas, semente) {
  const g = grade(semente), out = new Float32Array(w * h), sv = t => t * t * (3 - 2 * t);
  let amp = 1, soma = 0;
  for (let o = 0; o < oitavas; o++, amp *= .55) {
    const nx = escala << o, ny = Math.max(1, (escala << o) >> 1); soma += amp;
    for (let y = 0; y < h; y++) {
      const fy = y / h * ny, y0 = Math.floor(fy), ty = sv(fy - y0);
      for (let x = 0; x < w; x++) {
        const fx = x / w * nx, x0 = Math.floor(fx), tx = sv(fx - x0), x1 = (x0 + 1) % nx;
        const p = (a, b) => g[(a * 157 + b * 4093 + o * 911) & 65535];
        out[y * w + x] += amp * ((p(x0, y0) * (1 - tx) + p(x1, y0) * tx) * (1 - ty) + (p(x0, y0 + 1) * (1 - tx) + p(x1, y0 + 1) * tx) * ty);
      }
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= soma;
  return out;
}
function textura(w, h, cor, linear) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = cor(x, y), k = (y * w + x) * 4; im.data[k] = p[0]; im.data[k + 1] = p[1]; im.data[k + 2] = p[2]; im.data[k + 3] = p.length > 3 ? p[3] : 255; }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); if (!linear) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping; return t;
}
const mistura = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const faixa = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));

// borda luminosa da atmosfera
function atmosfera(r, cor, forca = 1) {
  return new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 40, 30), new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(cor) }, f: { value: forca } },
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix * normal); vec4 p = modelViewMatrix * vec4(position,1.); v = normalize(-p.xyz); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'uniform vec3 c; uniform float f; varying vec3 n; varying vec3 v; void main(){ float k = pow(clamp(dot(n, v) * -1. , 0., 1.), 1.6); gl_FragColor = vec4(c * k * f * 1.6, k); }',
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
}

export function criarPlaneta(tipo, r) {
  const g = new THREE.Group(), W = 512, H = 256, geo = new THREE.SphereGeometry(r, 56, 40);
  if (tipo === 'azul') {
    const n = ruido(W, H, 4, 6, 21), d = ruido(W, H, 12, 4, 77);
    const mar = [12, 46, 120], raso = [34, 120, 176], areia = [196, 172, 116], mata = [58, 128, 70], rocha = [112, 92, 78], gelo = [240, 248, 255];
    const mapa = textura(W, H, (x, y) => {
      const v = n[y * W + x] * .8 + d[y * W + x] * .2, lat = Math.abs(y / H - .5) * 2;
      let c = v < .5 ? mistura(mar, raso, faixa(v, .36, .5)) : v < .53 ? areia : v < .64 ? mistura(mata, rocha, faixa(v, .55, .64)) : mistura(rocha, gelo, faixa(v, .64, .72));
      return mistura(c, gelo, faixa(lat + d[y * W + x] * .25, .92, 1.02));
    });
    const alt = textura(W, H, (x, y) => { const v = Math.max(.5, n[y * W + x]) * 255; return [v, v, v]; }, true);
    const brilho = textura(W, H, (x, y) => { const v = n[y * W + x] * .8 + d[y * W + x] * .2 < .5 ? 70 : 225; return [v, v, v]; }, true);
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: mapa, bumpMap: alt, bumpScale: 2.4, roughnessMap: brilho, roughness: 1, emissive: 0xffffff, emissiveMap: mapa, emissiveIntensity: .16 })));
    const nu = ruido(W, H, 6, 6, 133);
    const nuvem = textura(W, H, (x, y) => [255, 255, 255, faixa(nu[y * W + x], .5, .72) * 235]);
    const nuvens = new THREE.Mesh(new THREE.SphereGeometry(r * 1.025, 48, 36), new THREE.MeshStandardMaterial({ map: nuvem, transparent: true, depthWrite: false, roughness: 1 }));
    g.add(nuvens); g.userData.nuvens = nuvens;
    g.add(atmosfera(r, 0x58b8ff, 1.1));
  } else {
    const n = ruido(W, H, 4, 6, 51), cores = [[238, 196, 140], [206, 128, 84], [246, 222, 180], [170, 84, 64], [226, 160, 108], [250, 232, 204]];
    const mapa = textura(W, H, (x, y) => {
      const torce = (n[y * W + x] - .5) * 34, f = ((y + torce) / H * 13 + 40) % 6, i = Math.floor(f), t = f - i;
      let c = mistura(cores[i % 6], cores[(i + 1) % 6], t * t * (3 - 2 * t));
      // grande mancha de tempestade
      const dx = (x - 300) / 46, dy = (y - 160) / 20, m = Math.exp(-(dx * dx + dy * dy) * 1.4); c = mistura(c, [190, 66, 44], m);
      const k = .82 + n[y * W + x] * .36; return c.map(v => Math.min(255, v * k));
    });
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: mapa, roughness: .85, emissive: 0xffffff, emissiveMap: mapa, emissiveIntensity: .16 })));
    g.add(atmosfera(r, 0xffb070, .8));
    const a = textura(512, 4, x => { const t = x / 512, f = .5 + .5 * Math.sin(t * 60) * Math.sin(t * 23 + 1), v = t > .6 && t < .66 ? 0 : f; return [235 - t * 40, 200 - t * 50, 160 - t * 30, Math.max(0, v) * 220 * Math.min(1, (1 - t) * 8) * Math.min(1, t * 10)]; });
    const ra = new THREE.RingGeometry(r * 1.22, r * 1.52, 96, 1), p = ra.attributes.position, uv = ra.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) / r - 1.22) / .3, .5);
    const anel = new THREE.Mesh(ra, new THREE.MeshStandardMaterial({ map: a, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: .9, emissive: 0xffd0a0, emissiveMap: a, emissiveIntensity: .25 }));
    anel.rotation.set(-1.25, .25, 0); g.add(anel);
  }
  g.children[0].castShadow = true;
  g.rotation.z = .35;
  return g;
}

// ---------- Cometa ----------
const brilhoTex = () => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
export function criarCometa(raio) {
  const g = new THREE.Group(), tex = brilhoTex();
  // rocha irregular com crateras
  const geo = new THREE.IcosahedronGeometry(raio, 5), p = geo.attributes.position, v = new THREE.Vector3(), cor = [], c = new THREE.Color();
  const crateras = Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, y = 1 - (i + .5) / 14 * 2, q = Math.sqrt(1 - y * y); return { d: new THREE.Vector3(Math.cos(a) * q, y, Math.sin(a) * q), r: .2 + (i * 37 % 10) / 10 * .22 }; });
  const onda = (x, y, z) => Math.sin(x * 2.1 + y * 1.3) * Math.cos(z * 2.4 - y) * .5 + Math.sin(x * 4.7 - z * 3.9) * Math.cos(y * 5.1) * .28 + Math.sin(x * 9.3 + y * 8.1) * Math.cos(z * 10.7) * .16 + Math.sin(x * 19 + z * 17) * Math.cos(y * 21) * .07;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let k = 1 + onda(v.x, v.y, v.z) * .17;
    for (const q of crateras) { const d = v.angleTo(q.d) / q.r; if (d < 1.25) k += d < 1 ? -.09 * (1 - d * d) : .03 * (1.25 - d) / .25; }
    c.setHSL(.6 + onda(v.z, v.x, v.y) * .03, .16, Math.max(.1, .34 + (k - 1) * 1.5)); cor.push(c.r, c.g, c.b);
    p.setXYZ(i, v.x * raio * k, v.y * raio * k, v.z * raio * k);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3)); geo.computeVertexNormals();
  const rocha = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: .05, flatShading: true })); rocha.castShadow = true; g.add(rocha);
  // miolo em brasa: aparece nas partes fundas e cresce a cada batida
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(raio, 32, 24), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff7a1a, emissiveIntensity: 2.4 })); g.add(miolo);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x66c8ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(raio * 5); g.add(halo);
  // cauda de poeira e gás
  const N = 320, pos = new Float32Array(N * 3), cores = new Float32Array(N * 3), sem = Array.from({ length: N }, () => [Math.random(), Math.random() * 6.28, Math.sqrt(Math.random()), Math.random()]);
  const gp = new THREE.BufferGeometry(); gp.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gp.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  const cauda = new THREE.Points(gp, new THREE.PointsMaterial({ map: tex, size: 13, transparent: true, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false })); cauda.frustumCulled = false; g.add(cauda);
  // explosão
  const E = 260, epos = new Float32Array(E * 3), ecor = new Float32Array(E * 3), evel = [];
  for (let i = 0; i < E; i++) { const a = Math.random() * 6.28, y = Math.random() * 1.3 - .3, q = 1 - Math.abs(y) * .4, s = 60 + Math.random() * 260; evel.push([Math.cos(a) * q * s, y * s + 60, Math.sin(a) * q * s]); }
  const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(epos, 3)); ge.setAttribute('color', new THREE.BufferAttribute(ecor, 3));
  const fogo = new THREE.Points(ge, new THREE.PointsMaterial({ map: tex, size: 22, transparent: true, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false })); fogo.frustumCulled = false; fogo.visible = false;
  const pedras = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(raio * .26, 1), new THREE.MeshStandardMaterial({ color: 0x4a4e5c, roughness: .9, flatShading: true, emissive: 0xff5a10, emissiveIntensity: .5 }), 26); pedras.visible = false; pedras.castShadow = true; pedras.frustumCulled = false;
  const pvel = Array.from({ length: 26 }, () => { const a = Math.random() * 6.28, s = 60 + Math.random() * 150; return [Math.cos(a) * s, 120 + Math.random() * 200, Math.sin(a) * s, Math.random() * 8]; });
  const onda2 = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); onda2.rotation.x = -Math.PI / 2; onda2.visible = false;
  const efeitos = new THREE.Group(); efeitos.add(fogo, pedras, onda2);
  let tExp = -1; const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), um = new THREE.Vector3(), p3 = new THREE.Vector3();

  return {
    g, efeitos,
    explodir(t) { tExp = t; efeitos.position.copy(g.position); fogo.visible = pedras.visible = onda2.visible = true; },
    clarao: t => tExp < 0 ? 0 : Math.max(0, 1 - (t - tExp) * 2),
    // dano 0..1, vivo, pancada 0..1
    atualizar(t, dano, vivo, pancada) {
      g.visible = vivo;
      rocha.rotation.set(t * .5, t * .7, 0); miolo.rotation.copy(rocha.rotation);
      miolo.scale.setScalar(.86 + dano * .13 + pancada * .03); miolo.material.emissiveIntensity = 1.4 + dano * 2 + pancada * 3;
      halo.material.color.setHSL(.56 - dano * .5, .9, .6); halo.material.opacity = .34 + pancada * .4 + dano * .16;
      if (vivo) {
        for (let i = 0; i < N; i++) {
          const [a, b, r, f] = sem[i], u = (a + t * (.35 + f * .3)) % 1, larg = raio * (.75 + u * 1.1) * r;
          pos[i * 3] = Math.cos(b + u * 2) * larg + Math.sin(t * .9) * -22 * u; pos[i * 3 + 1] = Math.sin(b + u * 2) * larg * .8 + u * 26; pos[i * 3 + 2] = -u * 92;
          const k = (1 - u) * (1 - u) * .34; cores[i * 3] = k * (i % 3 ? .45 : 1) + dano * k * .5; cores[i * 3 + 1] = k * (i % 3 ? .8 : .85); cores[i * 3 + 2] = k * (i % 3 ? 1.2 : .6);
        }
        gp.attributes.position.needsUpdate = gp.attributes.color.needsUpdate = true;
      }
      if (tExp >= 0) {
        const d = t - tExp;
        if (d > 2.2 || d < 0) { tExp = -1; fogo.visible = pedras.visible = onda2.visible = false; return; }
        const freio = 1 - Math.exp(-d * 2.4), vida = Math.max(0, 1 - d / 1.7);
        for (let i = 0; i < E; i++) { for (let k = 0; k < 3; k++) epos[i * 3 + k] = evel[i][k] * freio * .55 - (k === 1 ? d * d * 26 : 0); const q = vida * vida * (.5 + (i % 5) * .12); ecor[i * 3] = q * 1.4; ecor[i * 3 + 1] = q * (.45 + (i % 4) * .18); ecor[i * 3 + 2] = q * (i % 4 ? .15 : 1); }
        ge.attributes.position.needsUpdate = ge.attributes.color.needsUpdate = true;
        for (let i = 0; i < 26; i++) { const w = pvel[i]; p3.set(w[0] * d, Math.max(-raio, w[1] * d - 300 * d * d), w[2] * d); e3.set(w[3] * d, w[3] * d * 1.3, 0); q4.setFromEuler(e3); um.setScalar(Math.max(.01, Math.min(1, (2.2 - d) * 1.4))); m4.compose(p3, q4, um); pedras.setMatrixAt(i, m4); }
        pedras.instanceMatrix.needsUpdate = true;
        onda2.scale.setScalar(20 + d * 260); onda2.material.opacity = Math.max(0, 1 - d * 1.6); onda2.position.y = -raio + 3;
      }
    },
  };
}
