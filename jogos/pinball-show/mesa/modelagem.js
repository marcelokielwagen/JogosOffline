// Ferramentas de modelagem por código: tubos de grossura variável, tornos, caixas arredondadas e junção de malhas.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const suave = t => t * t * (3 - 2 * t);

// ---------- Ferramentas de modelagem ----------
// Tubo de grossura variável ao longo de uma curva, com pontas arredondadas (braços, pernas, mechas de cabelo)
export function membro(pts, raios, material, o = {}) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => Array.isArray(p) ? V(...p) : p), false, 'catmullrom', .5);
  const n = o.n || 14, seg = o.seg || 10, pos = [], idx = [], uv = [];
  const fr = c.computeFrenetFrames(n, false);
  const raio = t => {
    const f = t * (raios.length - 1), i = Math.min(raios.length - 2, Math.floor(f)), k = suave(f - i);
    return raios[i] + (raios[i + 1] - raios[i]) * k;
  };
  const capas = 3;
  const anel = (centro, N, B, r, v) => {
    for (let s = 0; s <= seg; s++) {
      const a = s / seg * Math.PI * 2, x = Math.cos(a) * r * (o.achat || 1), y = Math.sin(a) * r;
      pos.push(centro.x + N.x * x + B.x * y, centro.y + N.y * x + B.y * y, centro.z + N.z * x + B.z * y); uv.push(s / seg, v);
    }
  };
  let linhas = 0;
  const p0 = c.getPointAt(0), p1 = c.getPointAt(1);
  for (let k = 0; k < capas; k++) { const a = k / capas * Math.PI / 2; anel(p0.clone().addScaledVector(fr.tangents[0], -raio(0) * Math.cos(a)), fr.normals[0], fr.binormals[0], Math.max(.01, raio(0) * Math.sin(a)), 0); linhas++; }
  for (let i = 0; i <= n; i++) { const t = i / n; anel(c.getPointAt(t), fr.normals[i], fr.binormals[i], Math.max(.01, raio(t) * (o.anel ? o.anel(t) : 1)), t); linhas++; }
  for (let k = capas - 1; k >= 0; k--) { const a = k / capas * Math.PI / 2; anel(p1.clone().addScaledVector(fr.tangents[n], raio(1) * Math.cos(a)), fr.normals[n], fr.binormals[n], Math.max(.01, raio(1) * Math.sin(a)), 1); linhas++; }
  for (let i = 0; i < linhas - 1; i++) for (let s = 0; s < seg; s++) {
    const a = i * (seg + 1) + s, b = a + seg + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.castShadow = true; m.receiveShadow = true;
  return m;
}
// Pilha de elipses na vertical (tronco, saia, casaco). aneis: [y, rx, rz, x, z]; onda(ang, t) muda o raio
export function torno(aneis, material, o = {}) {
  const n = o.n || 26, seg = o.seg || 32, pos = [], idx = [], uv = [];
  const pega = (t, e) => {
    const f = t * (aneis.length - 1), i = Math.min(aneis.length - 2, Math.floor(f)), u = f - i;
    const a = aneis[Math.max(0, i - 1)][e] || 0, b = aneis[i][e] || 0, c = aneis[i + 1][e] || 0, d = aneis[Math.min(aneis.length - 1, i + 2)][e] || 0;
    return .5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u);
  };
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    for (let s = 0; s <= seg; s++) {
      const a = s / seg * Math.PI * 2, k = o.onda ? o.onda(a, t) : 1;
      pos.push(pega(t, 3) + Math.sin(a) * pega(t, 1) * k, pega(t, 0), pega(t, 4) + Math.cos(a) * pega(t, 2) * k); uv.push(s / seg, t);
    }
  }
  for (let i = 0; i < n; i++) for (let s = 0; s < seg; s++) { const a = i * (seg + 1) + s, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // fecha em cima e embaixo
  if (o.fecha !== false) for (const [linha, sinal] of [[0, 1], [n, -1]]) {
    const c = pos.length / 3, t = linha / n; pos.push(pega(t, 3), pega(t, 0), pega(t, 4)); uv.push(.5, t);
    for (let s = 0; s < seg; s++) { const a = linha * (seg + 1) + s; sinal > 0 ? idx.push(c, a, a + 1) : idx.push(c, a + 1, a); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  // anéis que aumentam ou diminuem em y: o sentido das faces muda
  if (aneis[0][0] > aneis[aneis.length - 1][0]) for (let i = 0; i < idx.length; i += 3) { const k = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = k; }
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.castShadow = true; m.receiveShadow = true;
  return m;
}
// Junta num objeto só as malhas paradas que usam o mesmo material (deixa o desenho bem mais leve)
export function fundir(grupo) {
  const lotes = new Map();
  for (const m of grupo.children) {
    if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || m.children.length || m.userData.movel) continue;
    const k = m.material.uuid + m.castShadow + m.renderOrder + (m.geometry.attributes.uv && m.material.map ? 'u' : '') + (m.geometry.attributes.color ? 'c' : '');
    if (!lotes.has(k)) lotes.set(k, []);
    lotes.get(k).push(m);
  }
  for (const lista of lotes.values()) {
    if (lista.length < 2 || lista[0].geometry.attributes.color) continue;
    const comUv = lista.every(m => m.geometry.attributes.uv), pos = [], nor = [], uv = [], idx = [], v = new THREE.Vector3(), mn = new THREE.Matrix3();
    for (const m of lista) {
      m.updateMatrix(); mn.getNormalMatrix(m.matrix);
      const g = m.geometry, p = g.attributes.position, n = g.attributes.normal, base = pos.length / 3;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrix); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(mn).normalize(); nor.push(v.x, v.y, v.z);
        if (comUv) uv.push(g.attributes.uv.getX(i), g.attributes.uv.getY(i));
      }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(base + g.index.getX(i)); else for (let i = 0; i < p.count; i++) idx.push(base + i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    if (comUv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const novo = new THREE.Mesh(g, lista[0].material);
    novo.castShadow = lista[0].castShadow; novo.receiveShadow = lista[0].receiveShadow; novo.renderOrder = lista[0].renderOrder;
    lista.forEach(m => { grupo.remove(m); m.geometry.dispose(); });
    grupo.add(novo);
  }
}
export const bola = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; return m; };
export const caixaArred = (w, h, d, r, mat) => {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
  s.absarc(x, y, r, 0, Math.PI / 2); s.absarc(-x, y, r, Math.PI / 2, Math.PI); s.absarc(-x, -y, r, Math.PI, Math.PI * 1.5); s.absarc(x, -y, r, Math.PI * 1.5, Math.PI * 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: r * .3, bevelSize: r * .3, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
};
export function tela(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

