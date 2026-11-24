// Movimentos dos personagens: calcula a posição de cada osso, quadro a quadro, e grava numa textura.
// A placa de vídeo lê essa textura, então centenas de personagens se mexem quase de graça.
import * as THREE from 'three';

export const NB = 17; // 16 ossos do corpo + a arma
const PAI = [-1, 0, 1, 2, 2, 4, 5, 2, 7, 8, 0, 10, 11, 0, 13, 14, -1];
const NOME = ['pelve', 'coluna', 'peito', 'cabeca', 'bracoE', 'antebracoE', 'maoE', 'bracoD', 'antebracoD', 'maoD', 'coxaE', 'canelaE', 'peE', 'coxaD', 'canelaD', 'peD', 'arma'];
const G = Math.PI / 180, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), EX = V(1, 0, 0), EY = V(0, 1, 0), EZ = V(0, 0, 1);

// curvas de marcha (graus, de 10 em 10% do passo), baseadas em medidas reais de caminhada e corrida
export const ANDA = { q: [25, 22, 14, 5, -4, -10, -8, 8, 22, 29], j: [5, 15, 16, 9, 5, 8, 25, 55, 60, 32], t: [0, -5, 3, 7, 10, 8, -15, -10, 2, 3] };
export const CORRE = { q: [38, 33, 20, 4, -10, -17, -8, 16, 40, 48], j: [18, 38, 36, 24, 18, 30, 68, 98, 88, 46], t: [5, 14, 20, 6, -18, -24, -10, 0, 5, 8] };
function curva(a, f) { f = ((f % 1) + 1) % 1 * 10; const i = Math.floor(f), t = f - i, p = k => a[(i + k + 10) % 10], [p0, p1, p2, p3] = [p(-1), p(0), p(1), p(2)]; return p1 + .5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0))); }
export const pernas = (c, f, esc = 1, escD = esc) => ({
  E: [curva(c.q, f) * esc, curva(c.j, f) * (.35 + .65 * esc), curva(c.t, f) * esc],
  D: [curva(c.q, f + .5) * escD, curva(c.j, f + .5) * (.35 + .65 * escD), curva(c.t, f + .5) * escD],
});
export const euler = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x * G, y * G, z * G, 'YXZ'));
function base(dir, aux) { const x = dir.clone().normalize(), z = new THREE.Vector3().crossVectors(x, aux).normalize(), y = new THREE.Vector3().crossVectors(z, x); return new THREE.Matrix4().makeBasis(x, y, z); }
const giro = (d0, a0, d1, a1) => new THREE.Quaternion().setFromRotationMatrix(base(d1, a1).multiply(base(d0, a0).transpose()));

// Aplica uma pose e devolve as 17 matrizes (osso em repouso -> osso na pose).
export function montar(J, pose, TOCA = []) {
  const R = [], P = [], repouso = NOME.map(n => V(...J[n]));
  const osso = (i, qLocal) => {
    const p = PAI[i];
    if (p < 0) { R[i] = qLocal.clone(); P[i] = repouso[i].clone().add(pose.desl || V()); return; }
    R[i] = R[p].clone().multiply(qLocal);
    P[i] = repouso[i].clone().sub(repouso[p]).applyQuaternion(R[p]).add(P[p]);
  };
  const q = new THREE.Quaternion();
  osso(0, euler(...(pose.pelve || [0, 0, 0]))); osso(1, euler(...(pose.coluna || [0, 0, 0]))); osso(2, euler(...(pose.peito || [0, 0, 0]))); osso(3, euler(...(pose.cabeca || [0, 0, 0])));
  for (const [l, s, i] of [['E', 1, 10], ['D', -1, 13]]) {
    const [a, j, t, abre = 0] = pose.pernas[l];
    osso(i, q.clone().setFromAxisAngle(EZ, s * (abre - 4) * G).multiply(new THREE.Quaternion().setFromAxisAngle(EX, -a * G)));
    osso(i + 1, new THREE.Quaternion().setFromAxisAngle(EX, j * G));
    osso(i + 2, new THREE.Quaternion().setFromAxisAngle(EX, -t * G).multiply(new THREE.Quaternion().setFromAxisAngle(EZ, s * 3 * G)));
  }
  // encosta o ponto mais baixo no chão (sola dos pés e, se estiver deitado, o corpo todo)
  const sola = -J.peE[1], toca = [[12, V(0, sola, -.06)], [12, V(0, sola, .16)], [15, V(0, sola, -.06)], [15, V(0, sola, .16)]];
  if (pose.deitado) for (const [i, x, y, z] of TOCA) toca.push([i, V(x, y, z)]);
  let baixo = 9; for (const [i, o] of toca) baixo = Math.min(baixo, o.clone().applyQuaternion(R[i]).add(P[i]).y);
  const sobe = -baixo + (pose.voo || 0); for (const p of P) if (p) p.y += sobe;
  // arma e braços por alcance (a mão vai ao alvo, o cotovelo se ajusta)
  let arma = null;
  if (pose.arma) { arma = { r: euler(...pose.arma.rot), p: V(...pose.arma.pos) }; if (pose.arma.preso) { const off = arma.p.clone().sub(repouso[2]); arma.p.copy(off.applyQuaternion(R[2]).add(P[2])); arma.r.premultiply(R[2]); } else arma.p.y += sobe * .75; }
  R[16] = arma ? arma.r : new THREE.Quaternion(); P[16] = arma ? arma.p : V();
  for (const [l, s, i] of [['E', 1, 4], ['D', -1, 7]]) {
    const b = pose.bracos[l];
    P[i] = repouso[i].clone().sub(repouso[2]).applyQuaternion(R[2]).add(P[2]);
    const u0 = repouso[i + 1].clone().sub(repouso[i]), f0 = repouso[i + 2].clone().sub(repouso[i + 1]), l1 = u0.length(), l2 = f0.length(), n0 = new THREE.Vector3().crossVectors(u0, f0).normalize();
    let alvo = V(...b.mao); const naArma = b.ref === 'arma';
    if (naArma) alvo.applyQuaternion(R[16]).add(P[16]); else if (b.ref === 'peito') { alvo.sub(repouso[2]).applyQuaternion(R[2]).add(P[2]); } else alvo.y += sobe;
    let dirMao = V(...(b.dir || [0, 0, 1])), palma = V(...(b.palma || [0, -1, 0]));
    const quad = naArma ? R[16] : R[2]; dirMao.applyQuaternion(quad).normalize(); palma.applyQuaternion(quad).normalize();
    const S = P[i], d = alvo.clone().sub(S), dist = Math.min(d.length(), (l1 + l2) * .995); d.normalize();
    const polo = V(...b.polo).applyQuaternion(R[2]); polo.addScaledVector(d, -polo.dot(d)).normalize();
    const ca = THREE.MathUtils.clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1), sa = Math.sqrt(1 - ca * ca);
    const cot = S.clone().addScaledVector(d, l1 * ca).addScaledVector(polo, l1 * sa), mao = S.clone().addScaledVector(d, dist);
    const u = cot.clone().sub(S), f = mao.clone().sub(cot), n = new THREE.Vector3().crossVectors(u, f).normalize();
    R[i] = giro(u0, n0, u, n); P[i + 1] = cot; R[i + 1] = giro(f0, n0, f, n); P[i + 2] = mao;
    const m0 = V(...J['dedos' + l]).sub(repouso[i + 2]);
    R[i + 2] = b.dir ? giro(m0, V(...J['palma' + l]), dirMao, palma) : R[i + 1].clone();
  }
  return R.map((r, i) => { const m = new THREE.Matrix4().makeRotationFromQuaternion(r); const t = P[i].clone().sub((i === 16 ? V() : repouso[i]).clone().applyQuaternion(r)); return m.setPosition(t); });
}

const sen = (f, a = 1, o = 0) => Math.sin((f * a + o) * Math.PI * 2);
export const mistura = (a, b, t) => Array.isArray(a) ? a.map((x, i) => mistura(x ?? 0, b[i] ?? 0, t)) : typeof a === 'number' ? a + (b - a) * t : a;

// pontos do corpo que encostam no chão quando o personagem cai: [osso, x, y, z]
const TOCAS = {
  soldado: [[3, 0, .22, -.2], [3, 0, .2, .2], [3, .2, .2, 0], [3, -.2, .2, 0], [2, 0, .06, -.3], [2, 0, 0, .16], [0, 0, 0, -.13], [0, 0, 0, .14], [11, 0, 0, .09], [14, 0, 0, .09]],
  zumbi: [[3, 0, .22, -.15], [3, 0, .2, .2], [3, .17, .2, 0], [3, -.17, .2, 0], [2, 0, .06, -.13], [2, 0, 0, .13], [0, 0, 0, -.12], [0, 0, 0, .12], [11, 0, 0, .07], [14, 0, 0, .07]],
  gordo: [[3, 0, .3, -.1], [3, 0, .1, .25], [2, 0, .06, -.22], [1, 0, .05, .33], [1, 0, .05, -.22], [0, 0, 0, -.22], [11, 0, 0, .1], [14, 0, 0, .1]],
};

// ---------- soldado ----------
// pegadas: posição da arma no corpo e das mãos na arma (no sistema da arma, +z = cano). torce = giro do peito
export const PEGADAS = {
  pistola: { pos: [0, .9, .34], d: [-.02, -.045, -.04], e: [.05, -.055, -.03], dDir: [.1, -.1, 1], eDir: [-.45, -.1, .9], poloE: [.7, -.8, .1], poloD: [-.7, -.8, .1], torce: 0, palmaE: [-.9, .1, -.2] },
  curta: { pos: [-.085, .86, .2], d: [-.02, -.05, -.03], e: [.02, -.035, .19], dDir: [.1, -.25, 1], eDir: [-.5, .25, .85], poloE: [.6, -1, 0], torce: -16 },
  longa: { pos: [-.09, .87, .16], d: [-.02, -.05, -.03], e: [.025, -.035, .24], dDir: [.1, -.25, 1], eDir: [-.55, .25, .8], poloE: [.55, -1, 0], torce: -20 },
  quadril: { pos: [-.1, .7, .2], d: [-.02, .0, -.16], e: [.02, .15, .06], dDir: [.1, .1, 1], eDir: [-.7, -.2, .6], poloE: [.8, -.4, 0], torce: -14, palmaE: [0, -1, 0], rot: [3, 0, 0] },
  ombro: { pos: [-.17, 1.09, .12], d: [.02, -.13, .0], e: [.06, -.12, .17], dDir: [.2, .6, .9], eDir: [-.5, .6, .6], poloE: [.6, -1, 0], poloD: [-.9, -.8, 0], torce: -10, palmaE: [-.3, .9, .1], inclina: 8 },
  jato: { pos: [-.09, .73, .2], d: [-.02, -.035, -.06], e: [.02, -.02, .2], dDir: [.1, -.1, 1], eDir: [-.5, .25, .8], poloE: [.6, -1, 0], torce: -14 },
};
const bracosNaArma = pg => ({ D: { ref: 'arma', mao: pg.d, dir: pg.dDir, palma: [.9, 0, -.2], polo: pg.poloD || [-.75, -.75, -.2] }, E: { ref: 'arma', mao: pg.e, dir: pg.eDir, palma: pg.palmaE || [-.35, .9, .1], polo: pg.poloE } });
function soldadoCorre(f, peg) {
  const pg = PEGADAS[peg], r = pg.rot || [0, 0, 0];
  return {
    pelve: [12, sen(f) * 8, sen(f, 1, .25) * 4], coluna: [4, -sen(f) * 6, 0], peito: [2, -sen(f) * 5 + pg.torce, 0], cabeca: [-14, sen(f) * 3 - pg.torce * .8, pg.inclina || 0],
    pernas: pernas(CORRE, f, .95), voo: Math.max(0, sen(f, 2, -.12)) * .06, desl: V(sen(f, 1, .1) * .016, 0, 0),
    arma: { pos: [pg.pos[0] + sen(f, 1, .2) * .012, pg.pos[1] + sen(f, 2, .1) * .016, pg.pos[2] + sen(f, 2) * .006], rot: [r[0] + sen(f, 2, .3) * 2, sen(f) * 2, 0] },
    bracos: bracosNaArma(pg),
  };
}
// parado, joelhos flexionados e mirando (luta com o chefe e tela inicial)
function soldadoMira(f, peg) {
  const pg = PEGADAS[peg], r = pg.rot || [0, 0, 0], b = sen(f);
  return {
    pelve: [5, -14, 0], coluna: [4 + b * .8, 5, 0], peito: [3 + b * 1.2, pg.torce + 8, 0], cabeca: [-9 - b, -pg.torce * .8 + 2, pg.inclina || 0],
    pernas: { E: [26, 30, 0, 9], D: [-8, 22, 0, 12] }, voo: 0, desl: V(0, 0, 0),
    arma: { pos: [pg.pos[0], pg.pos[1] - .03 + b * .006, pg.pos[2] + .01], rot: [r[0] + b * .8, 0, 0] }, bracos: bracosNaArma(pg),
  };
}
function soldadoMorre(f, peg) {
  const a = soldadoCorre(.1, peg), t = Math.min(1, f * 1.15), k = t * t * (3 - 2 * t), pr = PEGADAS[peg].pos, b = { pelve: [-84, 14, 8], coluna: [-4, 8, 4], peito: [-4, 4, 0], cabeca: [14, 25, 0], pernas: { E: [18, 26, -30, 12], D: [4, 12, -30, 18] } };
  const meio = Math.sin(Math.PI * Math.min(1, t * 1.1));
  return {
    deitado: true, pelve: mistura(a.pelve, b.pelve, k), coluna: mistura(a.coluna, b.coluna, k), peito: mistura(a.peito, b.peito, k), cabeca: mistura(a.cabeca, b.cabeca, k),
    pernas: { E: mistura([...a.pernas.E, 0], b.pernas.E, k).map((x, i) => x + [45, 60, 0, 0][i] * meio), D: mistura([...a.pernas.D, 0], b.pernas.D, k).map((x, i) => x + [30, 50, 0, 0][i] * meio) }, voo: meio * .25,
    arma: { pos: [pr[0], pr[1] + meio * .1, pr[2]], rot: [-k * 40, k * 20, k * 50], preso: true },
    bracos: { D: { ref: 'peito', mao: mistura([-.14, .9, .3], [-.42, 1.1, .06], k), polo: [-1, -.3, 0] }, E: { ref: 'peito', mao: mistura([.06, .9, .34], [.42, 1.14, .08], k), polo: [1, -.3, 0] } },
  };
}
// comemoração: pula com a arma para o alto
function soldadoComemora(f) {
  const p = Math.max(0, sen(f, 2, -.05)), g = sen(f);
  return {
    pelve: [2 - p * 4, g * 8, 0], coluna: [-2, 0, g * 4], peito: [-6 - p * 6, 0, g * 4], cabeca: [-8 - p * 8, g * 8, -g * 6], pernas: { E: [10 + p * 16, 18 + (1 - p) * 26, 0, 8], D: [4 + p * 10, 18 + (1 - p) * 26 + p * 40, 0, 10] }, voo: p * .2,
    arma: { pos: [-.3, 1.24 + p * .04, .06], rot: [-60 - p * 12, 0, 14], preso: true },
    bracos: { D: { ref: 'arma', mao: [-.02, -.05, -.03], dir: [.1, -.25, 1], palma: [.9, 0, -.2], polo: [-1, 0, -.2] }, E: { ref: 'peito', mao: [.36, 1.22 + p * .1, .08], polo: [1, -.2, -.2] } },
  };
}

// ---------- zumbi ----------
// B = ajuste das mãos para cada corpo
const BR = { zumbi: { x: 0, y: 0, z: 0 }, gordo: { x: .13, y: -.02, z: .08 } };
const pos3 = (B, x, y, z) => [x + Math.sign(x) * B.x, y + B.y, z + B.z];
function zumbiAnda(f, v, B) {
  const s = v ? -1 : 1; // v=1 espelha o jeito de mancar
  return {
    pelve: [10 + sen(f, 2) * 3, sen(f) * 9, sen(f, 1, .25) * 8 * s], coluna: [12 + sen(f, 2, .2) * 4, -sen(f) * 6, 5 * s + sen(f, 1, .1) * 8], peito: [10, -sen(f, 1, .1) * 8, 4 * s], cabeca: [-20 + sen(f, 2, .3) * 7, 10 * s + sen(f, 1, .4) * 12, 18 * s + sen(f, 1, .6) * 6],
    pernas: v ? pernas(ANDA, f, .6, 1.1) : pernas(ANDA, f, 1.05, .55), desl: V(sen(f, 1, .25) * .045, 0, 0), voo: 0,
    bracos: {
      E: { ref: 'peito', mao: v ? pos3(B, .26 + sen(f) * .05, .64 + sen(f, 1, .3) * .05, .16) : pos3(B, .17 + sen(f, 1, .2) * .06, .96 + sen(f, 1, .1) * .08, .46 + sen(f, 2) * .03), polo: [.8, -.6, -.1] },
      D: { ref: 'peito', mao: v ? pos3(B, -.16 + sen(f, 1, .5) * .06, 1.0 + sen(f, 1, .3) * .08, .46) : pos3(B, -.2 + sen(f, 1, .4) * .05, .84 + sen(f, 1, .6) * .08, .42 + sen(f, 2, .4) * .04), polo: [-.8, -.6, -.1] },
    },
  };
}
function zumbiCorre(f, B) {
  return {
    pelve: [24, sen(f) * 14, sen(f, 1, .25) * 6], coluna: [10, -sen(f) * 9, 4], peito: [8, -sen(f) * 9, 0], cabeca: [-38, sen(f, 1, .3) * 10, 10],
    pernas: pernas(CORRE, f, 1.05, .95), voo: Math.max(0, sen(f, 2, -.12)) * .07, desl: V(0, 0, 0),
    bracos: { E: { ref: 'peito', mao: pos3(B, .22, .94 + sen(f) * .18, .38 - sen(f) * .16), polo: [1, -.4, -.2] }, D: { ref: 'peito', mao: pos3(B, -.22, .94 - sen(f) * .18, .38 + sen(f) * .16), polo: [-1, -.4, -.2] } },
  };
}
function zumbiMorre(f, tras, B) {
  const a = zumbiAnda(.1, tras ? 0 : 1, B), t = Math.min(1, f * 1.2), k = tras ? 1 - (1 - t) ** 2.2 : t * t * (3 - 2 * t), meio = Math.sin(Math.PI * t), s = tras ? -1 : 1;
  const b = { pelve: [s * 86, 12 * s, 10], coluna: [s * -3, 10, 0], peito: [s * -4, 8, 4], cabeca: [tras ? 10 : -20, 35, 0], E: [tras ? 12 : 6, 24, -25, 10], D: [tras ? 30 : -6, tras ? 50 : 8, -25, 16] };
  return {
    deitado: true, pelve: mistura(a.pelve, b.pelve, k), coluna: mistura(a.coluna, b.coluna, k), peito: mistura(a.peito, b.peito, k), cabeca: mistura(a.cabeca, b.cabeca, k).map((x, i) => i === 0 && tras ? x - 25 * meio : x), voo: tras ? meio * .22 : 0,
    pernas: { E: mistura([...a.pernas.E, 0], b.E, k).map((x, i) => x + (tras ? [45, 50, 0, 0] : [30, 75, 0, 0])[i] * meio), D: mistura([...a.pernas.D, 0], b.D, k).map((x, i) => x + (tras ? [30, 55, 0, 0] : [10, 70, 0, 0])[i] * meio) },
    bracos: { E: { ref: 'peito', mao: mistura(a.bracos.E.mao, tras ? pos3(B, .46, 1.12, .02) : pos3(B, .34, 1.26, .1), k), polo: [1, -.3, 0] }, D: { ref: 'peito', mao: mistura(a.bracos.D.mao, tras ? pos3(B, -.43, .95, .05) : pos3(B, -.38, 1.1, .1), k), polo: [-1, -.3, 0] } },
  };
}

// ---------- textura ----------
const zumbis = B => [['anda0', 28, f => zumbiAnda(f, 0, B)], ['anda1', 28, f => zumbiAnda(f, 1, B)], ['corre', 22, f => zumbiCorre(f, B)], ['morre0', 22, f => zumbiMorre(f, true, B)], ['morre1', 22, f => zumbiMorre(f, false, B)]];
const LISTA = {
  soldado: [...Object.keys(PEGADAS).flatMap(p => [['corre_' + p, 22, f => soldadoCorre(f, p)], ['mira_' + p, 14, f => soldadoMira(f, p)], ['morre_' + p, 18, f => soldadoMorre(f, p)]]), ['comemora', 28, soldadoComemora]],
  zumbi: zumbis(BR.zumbi), gordo: zumbis(BR.gordo),
};
export function gravarMovimentos(nome, J) {
  const clipes = {}; let total = 0;
  for (const [n, q] of LISTA[nome]) { clipes[n] = { ini: total, n: q }; total += q; }
  const dados = new Float32Array(NB * 3 * total * 4);
  for (const [n, q, fn] of LISTA[nome]) for (let k = 0; k < q; k++) escrever(dados, clipes[n].ini + k, montar(J, fn(n.startsWith('morre') ? k / (q - 1) : k / q), TOCAS[nome]));
  const tex = new THREE.DataTexture(dados, NB * 3, total, THREE.RGBAFormat, THREE.FloatType);
  tex.needsUpdate = true;
  return { tex, clipes };
}
// grava as 17 matrizes de uma pose na linha "q" da textura
export function escrever(dados, q, mats) { mats.forEach((m, b) => { const e = m.elements, o = (q * NB * 3 + b * 3) * 4; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) dados[o + r * 4 + c] = e[c * 4 + r]; }); }
