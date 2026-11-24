// Chefes gigantes: corpo, poses calculadas na hora (com passagem suave de uma para outra), placas soltas e reações.
import * as THREE from 'three';
import { NB, montar, escrever, pernas, ANDA, CORRE, mistura } from './animacoes.js';
import { paleta, materialDesenho, contorno, Pecas, caixaRedonda } from './desenho.js';
import { materialPersonagem, contornoPersonagem, sombraPersonagem } from './personagens.js';
import { CHEFES } from '../dados/balanco.js';

const CORES = {
  cancela: { pele: '#8db456', calca: '#39406e', couro: '#4a2c1c', unha: '#4e5a2a' },
  operario: { pele: '#6fa79c', roupa: '#3a6bc0', calca: '#5b4a3c', cabelo: '#3b2314', couro: '#5a3420', unha: '#3c5a54' },
  sirene: { pele: '#a07fd0', roupa: '#4b2740', cabelo: '#2a1826', unha: '#3a2352', boca: '#8c1535' },
  carcaca: { pele: '#c17a48', roupa: '#3b4e5c', calca: '#4c3a34', couro: '#3a2a26', unha: '#5a3620', olho: '#ffe9a0' },
};
const TOCA = [[2, 0, 0, -.36], [0, 0, 0, -.24], [3, 0, .2, -.2], [11, 0, 0, .12], [14, 0, 0, .12]];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), sen = (f, a = 1, o = 0) => Math.sin((f * a + o) * Math.PI * 2), suave = t => t * t * (3 - 2 * t), limita = (v, a, b) => v < a ? a : v > b ? b : v;
const PARADO = { E: [10, 22, 0, 10], D: [4, 20, 0, 12] }, AGACHA = { E: [52, 70, 12, 14], D: [44, 64, 12, 16] };
// mãos livres
const maos = (e, d, polo = .6) => ({ E: { ref: 'peito', mao: e, polo: [1, -polo, -.4] }, D: { ref: 'peito', mao: d, polo: [-1, -polo, -.4] } });
// duas mãos na arma, ou só a direita
const DIR = { ref: 'arma', mao: [0, 0, -.04], dir: [.2, -.2, 1], palma: [.9, 0, -.2], polo: [-1, -.6, -.2] };
const naArma = (a, z = .3) => ({ D: DIR, E: { ref: 'arma', mao: [0, 0, z], dir: [-.2, .2, .9], palma: [-.5, .8, 0], polo: [1, -.6, 0] } });

// poses de cada chefe. c = estado na simulação, f = passo, t = tempo, k = andamento do estado (0 a 1)
const POSES = {
  comArma(c, f, t, k, A) {
    const r = sen(t * .55), anda = c.estado === 'anda' && c.vel > 0, livre = [.52, .62, .26 + sen(f) * .22];
    const base = { pelve: [6, anda ? sen(f) * 7 : 0, anda ? sen(f, 1, .25) * 6 : 0], coluna: [8 + r * 1.5, anda ? -sen(f) * 5 : 0, 0], peito: [8 + r * 2, 0, 0], cabeca: [-14 + r * 2, sen(t * .21) * 10, 0], pernas: anda ? pernas(ANDA, f, .95) : PARADO, desl: V(anda ? sen(f, 1, .25) * .05 : 0, 0, 0), voo: 0, arma: { pos: A.pos, rot: [A.rot[0] + r * 2, A.rot[1], A.rot[2]] }, bracos: { D: DIR, E: { ref: 'peito', mao: livre, polo: [1, -.5, -.4] } } };
    switch (c.estado) {
      case 'cai': return { ...base, pelve: [-8, 0, 0], peito: [-10, 0, 0], pernas: AGACHA, arma: { pos: [-.35, 1.65, .1], rot: [-120, 0, 0] }, bracos: naArma(1) };
      case 'ruge': case 'tonto': if (c.estado === 'ruge') return { ...base, pelve: [-6, 0, 0], coluna: [-8, 0, 0], peito: [-14 + sen(t, 5) * 1.2, 0, 0], cabeca: [-24, sen(t, 4) * 3, 0], arma: { pos: [-.78, 1.25, .2], rot: [-95, -10, 18] }, bracos: { D: DIR, E: { ref: 'peito', mao: [.82, 1.3, .18], polo: [1, -.6, -.2] } } };
        return { ...base, pelve: [14, sen(t, .8) * 6, sen(t, .8) * 5], coluna: [16, 0, sen(t, .8, .2) * 6], peito: [14, 0, 0], cabeca: [16, sen(t, .9) * 14, sen(t, .9, .25) * 14], pernas: { E: [22, 40, 0, 12], D: [16, 38, 0, 14] }, arma: { pos: [-.62, .56, .3], rot: [30, 10, 0] }, bracos: { D: DIR, E: { ref: 'peito', mao: [.22, 1.25, .42], polo: [1, -.2, -.2] } } };
      case 'prepara': if (c.golpe === 'varrida') return { ...base, pelve: [8, -24, 0], coluna: [8, -20, 0], peito: [10, -24, 0], cabeca: [-14, 46, 0], pernas: { E: [26, 34, 0, 12], D: [-6, 26, 0, 16] }, arma: { pos: [-.62, .92, .16], rot: [-6, -105 - sen(t, 3) * 2, 0] }, bracos: naArma(0, .24) };
        return { ...base, pelve: [-8, 8, 0], coluna: [-8, 0, 0], peito: [-14 + sen(t, 3) * 1, 6, 0], cabeca: [4, 0, 0], pernas: { E: [20, 26, 0, 12], D: [-8, 26, 0, 14] }, arma: { pos: [-.16, 1.62, .06], rot: [-128, 4, 0] }, bracos: naArma(0, .2) };
      case 'bate': case 'volta': if (c.golpe === 'varrida') { const q = c.estado === 'bate' ? suave(limita(k * 1.4, 0, 1)) : 1; return { ...base, pelve: [12, -24 + 44 * q, 0], coluna: [10, -16 + 30 * q, 0], peito: [12, -20 + 44 * q, 0], cabeca: [-16, 30 - 50 * q, 0], pernas: { E: [18, 34, 0, 14], D: [10, 30, 0, 14] }, arma: { pos: [-.5 + .8 * q, .8, .4], rot: [10, -105 + 185 * q, 0] }, bracos: naArma(0, .24) }; }
        return { ...base, pelve: [22, 0, 0], coluna: [20, 0, 0], peito: [18, 0, 0], cabeca: [-34, 0, 0], pernas: { E: [44, 52, 6, 12], D: [10, 44, 0, 14] }, arma: { pos: [-.06, .62, .72], rot: [A.bate, 0, 0] }, bracos: naArma(0, .2) };
      case 'morre': return c.t < .9 ? { ...base, pelve: [-4, sen(t, 2) * 8, sen(t, 2) * 6], coluna: [-6, 0, 0], peito: [-10, 0, 0], cabeca: [-26, sen(t, 2.4) * 14, 10], pernas: { E: [18, 40, 0, 12], D: [10, 36, 0, 14] }, arma: { pos: [-.7, .8, .3], rot: [-40, -20, 20] }, bracos: { D: DIR, E: { ref: 'peito', mao: [.5, 1.35, .3], polo: [1, -.4, 0] } } }
        : { ...base, deitado: true, pelve: [-86, 12, 4], coluna: [-4, 4, 0], peito: [-6, 0, 0], cabeca: [14, 18, 0], pernas: { E: [24, 34, -20, 14], D: [8, 14, -20, 18] }, arma: { pos: [-1.0, .3, .2], rot: [0, 120, 80] }, bracos: maos([.95, 1.2, -.05], [-.95, 1.25, -.05], .1) };
    }
    return base;
  },
  cancela(c, f, t, k) { return POSES.comArma(c, f, t, k, { pos: [-.74, .82, .3], rot: [-72, -6, 8], bate: 20 }); },
  operario(c, f, t, k) { return POSES.comArma(c, f, t, k, { pos: [-.6, 1.0, .3], rot: [-118, -4, 12], bate: 22 }); },
  sirene(c, f, t, k) {
    const r = sen(t * .5), anda = c.estado === 'anda' && c.vel > 0;
    const base = { pelve: [10, anda ? sen(f) * 9 : 0, anda ? sen(f, 1, .25) * 6 : 0], coluna: [14 + r * 2, anda ? -sen(f) * 8 : 0, 0], peito: [14 + r * 2, 0, 0], cabeca: [-30 + r * 3, sen(t * .3) * 12, sen(t * .23) * 10], pernas: anda ? pernas(ANDA, f, 1.1) : { E: [16, 34, 0, 8], D: [2, 28, 0, 9] }, desl: V(), voo: 0, bracos: maos([.44, .78 + sen(f) * .08, .4 - sen(f) * .16], [-.44, .78 - sen(f) * .08, .4 + sen(f) * .16]) };
    switch (c.estado) {
      case 'cai': return { ...base, pernas: { E: [62, 84, 10, 10], D: [52, 76, 10, 12] }, bracos: maos([.6, 1.75, .1], [-.6, 1.75, .1], .1) };
      case 'ruge': return { ...base, pelve: [4, 0, 0], coluna: [-4, 0, 0], peito: [-12 + sen(t, 6) * 1.4, 0, 0], cabeca: [-20, sen(t, 5) * 5, 0], bracos: maos([.78, 1.32, .22], [-.78, 1.32, .22], .5) };
      case 'tonto': return { ...base, coluna: [24, 0, sen(t, .8) * 8], peito: [20, 0, 0], cabeca: [10, sen(t, .9) * 18, sen(t, .9, .25) * 18], bracos: maos([.2, 1.45, .3], [-.2, 1.45, .3], .2) };
      case 'prepara': if (c.golpe === 'grito') return { ...base, pelve: [-6, 0, 0], coluna: [-14, 0, 0], peito: [-18, 0, 0], cabeca: [-14 + sen(t, 4) * 2, 0, 0], bracos: maos([.5, 1.05, -.12], [-.5, 1.05, -.12], .2) };
        return { ...base, pelve: [-4, 14, 0], coluna: [-8, 10, 0], peito: [-10, 16, 0], cabeca: [-6, -20, 0], bracos: maos([.5, .95, .3], [-.42, 1.92, .0], .2) };
      case 'bate': case 'volta': if (c.golpe === 'grito') return { ...base, pelve: [16, 0, 0], coluna: [18, 0, 0], peito: [12 + sen(t, 9) * 1.6, 0, 0], cabeca: [-40, sen(t, 8) * 3, 0], pernas: { E: [40, 46, 0, 10], D: [-4, 34, 0, 12] }, bracos: maos([.74, 1.2, .26], [-.74, 1.2, .26], .5) };
        return { ...base, pelve: [26, -10, 0], coluna: [26, -8, 0], peito: [22, -16, 0], cabeca: [-44, 10, 0], pernas: { E: [46, 50, 4, 10], D: [0, 40, 0, 12] }, bracos: maos([.5, .8, .2], [-.06, .72, .62], .3) };
      case 'morre': return c.t < .9 ? { ...base, coluna: [-10, 0, sen(t, 2) * 8], peito: [-14, 0, 0], cabeca: [-24, sen(t, 2.5) * 20, 14], bracos: maos([.3, 1.55, .25], [-.3, 1.55, .25], .2) } : { ...base, deitado: true, pelve: [-86, 10, 4], coluna: [-2, 6, 0], peito: [-4, 0, 0], cabeca: [12, 24, 0], pernas: { E: [30, 46, -20, 12], D: [6, 12, -20, 16] }, bracos: maos([.7, 1.4, -.02], [-.72, 1.2, -.02], .1) };
    }
    return base;
  },
  carcaca(c, f, t, k) {
    const r = sen(t * .5), anda = c.estado === 'anda' && c.vel > 0;
    const base = { pelve: [4, anda ? sen(f) * 8 : 0, anda ? sen(f, 1, .25) * 9 : 0], coluna: [4 + r, anda ? -sen(f) * 6 : 0, anda ? -sen(f, 1, .25) * 4 : 0], peito: [6 + r * 2, 0, 0], cabeca: [-12 + r * 2, sen(t * .22) * 10, 0], pernas: anda ? pernas(ANDA, f, 1) : PARADO, desl: V(anda ? sen(f, 1, .25) * .06 : 0, 0, 0), voo: 0, bracos: maos([.76, .52, .3 - sen(f) * .2], [-.76, .52, .3 + sen(f) * .2]) };
    switch (c.estado) {
      case 'cai': return { ...base, pernas: AGACHA, bracos: maos([.9, 1.3, .1], [-.9, 1.3, .1], .1) };
      case 'ruge': return { ...base, pelve: [-4, 0, 0], coluna: [-8, 0, 0], peito: [-12 + sen(t, 6) * 1.2, 0, 0], cabeca: [-20, sen(t, 4) * 4, 0], bracos: maos([.92, 1.18, .3], [-.92, 1.18, .3], .4) };
      case 'tonto': return { ...base, coluna: [16, 0, sen(t, .8) * 8], cabeca: [14, sen(t, .9) * 16, sen(t, .9, .25) * 16], bracos: maos([.6, .45, .3], [-.6, .45, .3]) };
      case 'prepara': if (c.golpe === 'investida') return { ...base, pelve: [30, 0, 0], coluna: [18, 0, 0], peito: [10, sen(t, 3) * 3, 0], cabeca: [-44, 0, 0], pernas: { E: [66, 78, 14, 12], D: [10, 60, 20, 14] }, bracos: maos([.7, .42, .5], [-.7, .42, .5]) };
        if (c.golpe === 'pisao') return { ...base, pelve: [-6, 0, 10], coluna: [-6, 0, 8], peito: [-8, 0, 0], pernas: { E: [84, 96, 0, 18], D: [0, 14, 0, 14] }, bracos: maos([.95, 1.05, .1], [-.95, 1.05, .1], .3) };
        return { ...base, pelve: [-4, -22, 0], coluna: [-6, -16, 0], peito: [-8, -26, 0], cabeca: [-6, 44, 0], pernas: { E: [26, 30, 0, 12], D: [-8, 30, 0, 16] }, bracos: maos([.7, .95, .5], [-.86, 1.3, -.28], .2) };
      case 'bate': case 'volta': if (c.golpe === 'investida') return { ...base, pelve: [34, 0, 0], coluna: [20, 0, 0], peito: [14, 0, 0], cabeca: [-50, 0, 0], pernas: pernas(CORRE, t * 2.2, .9), bracos: maos([.55, .7, .62], [-.55, .7, .62]) };
        if (c.golpe === 'pisao') return { ...base, pelve: [12, 0, -4], coluna: [14, 0, 0], peito: [12, 0, 0], pernas: AGACHA, bracos: maos([.85, .5, .3], [-.85, .5, .3]) };
        return { ...base, pelve: [14, 22, 0], coluna: [12, 14, 0], peito: [12, 26, 0], cabeca: [-22, -36, 0], pernas: { E: [34, 40, 0, 12], D: [2, 34, 0, 14] }, bracos: maos([.8, .6, 0], [-.1, 1.02, .74], .3) };
      case 'morre': return c.t < .9 ? { ...base, coluna: [-8, 0, sen(t, 2) * 8], cabeca: [-22, sen(t, 2.5) * 18, 10], bracos: maos([.5, 1.3, .3], [-.5, 1.3, .3], .2) } : { ...base, deitado: true, pelve: [-84, 8, 4], coluna: [-2, 0, 0], cabeca: [14, 20, 0], pernas: { E: [34, 50, -20, 16], D: [16, 24, -20, 20] }, bracos: maos([.95, 1.0, -.05], [-.95, 1.05, -.05], .1) };
    }
    return base;
  },
};
// aproxima a pose atual da desejada
function chegar(a, b, t) {
  const r = { ...b }; for (const n of ['pelve', 'coluna', 'peito', 'cabeca']) r[n] = mistura(a[n], b[n], t); r.voo = mistura(a.voo, b.voo, t); r.desl = a.desl.clone().lerp(b.desl, t);
  const p4 = p => [p[0], p[1], p[2], p[3] ?? 0]; r.pernas = { E: mistura(p4(a.pernas.E), p4(b.pernas.E), t), D: mistura(p4(a.pernas.D), p4(b.pernas.D), t) };
  if (b.arma) r.arma = { ...b.arma, pos: mistura(a.arma.pos, b.arma.pos, t), rot: mistura(a.arma.rot, b.arma.rot, t) };
  r.bracos = {}; for (const l of ['E', 'D']) { const x = a.bracos[l], y = b.bracos[l]; r.bracos[l] = x.ref === y.ref ? { ...y, mao: mistura(x.mao, y.mao, t), polo: mistura(x.polo, y.polo, t) } : y; }
  return r;
}

// placas da Carcaça, modeladas na posição de repouso do corpo: [osso, geometria]
function placas() {
  const porta = cor => new Pecas().por(caixaRedonda(.44, .36, .06, .025, 1), cor).por(caixaRedonda(.36, .17, .05, .02, 1), '#86c9e8', { y: .13, z: .012 }).por(caixaRedonda(.1, .03, .03, .01, 1), '#2c2a33', { x: .12, y: -.05, z: .035 }).por(caixaRedonda(.44, .05, .075, .02, 1), '#2c2a33', { y: -.15 });
  const capo = cor => new Pecas().por(caixaRedonda(.56, .42, .07, .03, 1), cor).por(caixaRedonda(.12, .4, .085, .02, 1), '#fbf6ea').por(caixaRedonda(.2, .04, .1, .015, 1), '#2c2a33', { y: -.14 });
  const por = (P, o) => { const g = P.pronta(); g.applyMatrix4(new THREE.Matrix4().compose(V(...o.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r || [0, 0, 0]))), V(1, 1, 1).multiplyScalar(o.s || 1))); return g; };
  return [
    [1, por(capo('#e0352b'), { p: [0, .72, .46], r: [.08, 0, 0] })],
    [2, por(porta('#2d7bd0'), { p: [0, 1.0, .4], r: [-.3, 0, .06], s: .9 })],
    [4, por(porta('#f2b51d'), { p: [.6, 1.0, .12], r: [0, .75, -.4] })],
    [7, por(porta('#3fa34d'), { p: [-.6, 1.0, .12], r: [0, -.75, .4] })],
    [10, por(capo('#fbf6ea'), { p: [.24, .42, .2], r: [0, .2, 0], s: .55 })],
  ];
}

export class Chefe {
  constructor(cena, modelos, id, ruido, qual = 2) {
    this.id = id; this.T = CHEFES[id]; this.J = modelos[id].juntas; this.grupo = new THREE.Group(); cena.add(this.grupo);
    this.dados = new Float32Array(NB * 3 * 4); this.tex = new THREE.DataTexture(this.dados, NB * 3, 1, THREE.RGBAFormat, THREE.FloatType);
    this.mat = materialPersonagem(2, this.tex, ruido, paleta(CORES[id])); this.matC = contornoPersonagem(this.tex, this.mat.userData.u.uGiro, .03);
    const geo = modelos[id].lods[qual > 0 ? 0 : 1]; this.lixo = [this.tex, this.mat, this.matC];
    const nova = (g, m) => { const b = new THREE.BufferGeometry(); for (const k in g.attributes) b.setAttribute(k, g.attributes[k]); b.setIndex(g.index); b.setAttribute('aAnim', new THREE.InstancedBufferAttribute(new Float32Array(4), 4)); const x = new THREE.InstancedMesh(b, m, 1); x.setMatrixAt(0, new THREE.Matrix4()); x.frustumCulled = false; this.grupo.add(x); this.lixo.push(b, x); return x; };
    this.corpo = nova(geo, this.mat); this.corpo.receiveShadow = true; this.borda = nova(geo, this.matC);
    const [invis, prof] = sombraPersonagem(this.tex); this.lixo.push(invis, prof); const s = nova(modelos[id].lods[1], invis); s.castShadow = true; s.customDepthMaterial = prof; s.renderOrder = -1;
    this.anim = this.corpo.geometry.attributes.aAnim;
    // placas soltas
    this.placas = []; if (this.T.placas) { const m = materialDesenho({ side: THREE.DoubleSide }, { ruido }), mc = contorno({ esp: .03 }); this.lixo.push(m, mc); for (const [o, g] of placas()) { const p = new THREE.Mesh(g, m), b = new THREE.Mesh(g, mc); p.castShadow = true; p.add(b); p.matrixAutoUpdate = false; this.grupo.add(p); this.lixo.push(g); this.placas.push({ o, p, solta: null }); } }
    // sombra redonda no chão
    const gS = new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), mS = new THREE.MeshBasicMaterial({ color: '#150c1c', transparent: true, opacity: .34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); this.chao = new THREE.Mesh(gS, mS); this.chao.renderOrder = 1; cena.add(this.chao); this.lixo.push(gS, mS);
    this.pose = null; this.t = 0; this.M = new THREE.Matrix4(); this.base = new THREE.Vector3(); this.grupo.visible = this.chao.visible = false;
  }
  #gravar(pose) {
    this.mats = montar(this.J, pose, TOCA); escrever(this.dados, 0, this.mats); this.tex.needsUpdate = true;
    for (const q of this.placas) if (!q.solta) { q.p.matrix.copy(this.mats[q.o]); q.p.matrixWorldNeedsUpdate = true; }
  }
  // ponto do osso no mundo (para efeitos)
  ponto(osso, x, y, z) { const v = V(x, y, z); if (this.mats) v.applyMatrix4(this.mats[osso]); return v.applyMatrix4(this.grupo.matrixWorld); }
  // solta uma placa: sai voando e cai no chão
  soltar(i) { const q = this.placas[i]; if (!q || q.solta) return; q.p.matrix.decompose(q.p.position, q.p.quaternion, q.p.scale); q.p.matrixAutoUpdate = true; q.solta = { vx: (i % 2 ? 1 : -1) * (.5 + Math.random() * .5), vy: .9, vz: .5 + Math.random() * .4, t: 0, g: V(Math.random(), Math.random(), Math.random()).multiplyScalar(6) }; }
  atualizar(dt, S) {
    const c = S.chefe; this.grupo.visible = this.chao.visible = !!c && c.id === this.id; if (!this.grupo.visible) return;
    this.t += dt; const k = c.dur ? limita(c.t / c.dur, 0, 1) : limita(c.t / .85, 0, 1), alvo = POSES[this.id](c, c.passo, this.t, k);
    const vel = c.estado === 'bate' ? 20 : c.estado === 'prepara' ? 5 : c.estado === 'morre' ? 4.2 : 6.5; this.pose = this.pose ? chegar(this.pose, alvo, Math.min(1, dt * vel)) : alvo;
    this.#gravar(this.pose);
    const e = this.T.escala, tre = c.estado === 'morre' && c.t < 2.4 ? Math.sin(this.t * 46) * .05 : 0, some = S.luta === 'morre' ? Math.max(0, c.t - 3.4) : 0;
    this.grupo.position.set(c.x + tre, c.alt - some * 2.2, -c.d); this.grupo.scale.setScalar(e); this.grupo.updateMatrixWorld();
    const r = this.T.raio * 1.15 * (1 - Math.min(.5, c.alt / 40)); this.chao.position.set(c.x, .03, -c.d); this.chao.scale.set(r, 1, r); this.chao.material.opacity = .34 * Math.max(0, 1 - some);
    this.anim.array[2] = c.dano; this.anim.needsUpdate = true;
    for (const q of this.placas) if (q.solta) { const s = q.solta, p = q.p; s.t += dt; s.vy -= 2.6 * dt; p.position.x += s.vx * dt; p.position.y += s.vy * dt; p.position.z += s.vz * dt; if (p.position.y < .04 && s.vy < 0) { p.position.y = .04; s.vy *= -.35; s.vx *= .5; s.vz *= .5; s.g.multiplyScalar(.4); } p.rotateX(s.g.x * dt); p.rotateY(s.g.y * dt); p.rotateZ(s.g.z * dt); p.visible = s.t < 3.5; }
  }
  // para a vitrine: mostra uma pose parada
  teste(estado, k, ang) { const [e, g] = estado.split(':'); const c = { estado: e, golpe: g, t: e === 'morre' ? 2 : 0, vel: e === 'anda' ? 1 : 0 }; this.#gravar(POSES[this.id](c, k, 0, k)); this.grupo.visible = true; this.grupo.rotation.y = ang; this.grupo.scale.setScalar(1); this.grupo.updateMatrixWorld(); }
  dispose() { for (const o of this.lixo) o.dispose(); this.grupo.removeFromParent(); this.chao.removeFromParent(); }
}
