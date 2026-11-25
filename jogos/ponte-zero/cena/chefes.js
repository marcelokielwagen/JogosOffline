// Chefes e meio-chefes: corpo, poses calculadas na hora (com passagem suave de uma para outra), placas soltas e reações.
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
  afogada: { pele: '#58c4b4', roupa: '#8a5cc8', calca: '#5b3a92', cabelo: '#1f7a4a', couro: '#2d5a50', unha: '#1c5a52', madeira: '#d8b878', metal: '#7a8796', branco: '#f2eaff', boca: '#5a1a4a' },
  guindaste: { pele: '#d8582e', calca: '#4a3a52', couro: '#3a3040', amarelo: '#ffc21f', visor: '#8fe0ff', unha: '#4a2a1c' },
  fornalha: { pele: '#c4382e', calca: '#3a2a3c', couro: '#5a3226', metal: '#56608a', cano: '#b0563a', brilho: '#ffb01e', osso: '#f0d9a8', amarelo: '#ffc62e' },
  mae: { pele: '#b45ad0', calca: '#9a8cb4', couro: '#3a2450', osso: '#cfc3dc', vermelho: '#e8452f', cabelo: '#3a1c5a', unha: '#5a2080', brilho: '#ffd23a', cano: '#3c3452', boca: '#8a1040', olho: '#fff6c0' },
  fiscal: { pele: '#b9c44e', roupa: '#2f5fc4', calca: '#26345e', couro: '#2a2030', unha: '#5a6a2a', cabelo: '#4a2a18' },
  arauto: { pele: '#c98ae0', roupa: '#c4283e', calca: '#3a1a4a', couro: '#2a1830', unha: '#5a2a7a', cabelo: '#f2e6c8', amarelo: '#ffcf3a' },
  britadeira: { pele: '#e0a05a', calca: '#3f5f8a', couro: '#7a4424', unha: '#6a4a20', madeira: '#5a3a20' },
  fundidor: { pele: '#d05a44', calca: '#3a3456', couro: '#6a4038', unha: '#4a1a18', madeira: '#2a1c1c', metal: '#6a7284' },
  motoqueiro: { capacete: '#e8352b', roupa: '#4a48b8', calca: '#34306a', colete: '#262250', couro: '#1c1620', pele: '#8ac05a', visor: '#ffd98a', unha: '#3a4a2a' },
  mergulhador: { capacete: '#d89a2e', roupa: '#1f8f8a', calca: '#17686a', colete: '#c47a24', couro: '#4a3020', pele: '#7ac0d0', visor: '#bdf5e8', metal: '#b8862c', unha: '#2a5a6a' },
  tampa: { pele: '#7fb06a', roupa: '#8a4a30', calca: '#4a3a52', couro: '#3a2a26', metal: '#7d8798', cano: '#545e70', unha: '#3a5a2a' },
  estivador: { pele: '#d0785e', roupa: '#24568c', calca: '#2a3450', couro: '#4a3020', metal: '#c4542e', cano: '#8a3420', unha: '#6a2a1c' },
};
const COR = new THREE.Color();
const TOCA = [[2, 0, 0, -.36], [0, 0, 0, -.24], [3, 0, .2, -.2], [11, 0, 0, .12], [14, 0, 0, .12]];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), sen = (f, a = 1, o = 0) => Math.sin((f * a + o) * Math.PI * 2), suave = t => t * t * (3 - 2 * t), limita = (v, a, b) => v < a ? a : v > b ? b : v;
const PARADO = { E: [10, 22, 0, 10], D: [4, 20, 0, 12] }, AGACHA = { E: [52, 70, 12, 14], D: [44, 64, 12, 16] };
// mãos livres
const maosBase = (e, d, polo = .6) => ({ E: { ref: 'peito', mao: e, polo: [1, -polo, -.4] }, D: { ref: 'peito', mao: d, polo: [-1, -polo, -.4] } }), maos = maosBase;
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
  afogada(c, f, t, k) {
    const A = { pos: [-.66, .92, .24], rot: [-62, -6, 8], bate: 22 };
    if (c.estado === 'mergulha' || c.estado === 'emerge') { const b = POSES.comArma({ ...c, estado: 'anda', vel: 0 }, f, t, k, A), sobe = c.estado === 'emerge'; return { ...b, pelve: [sobe ? -6 : 24, 0, 0], coluna: [sobe ? -10 : 16, 0, 0], peito: [sobe ? -10 : 14, 0, 0], cabeca: [sobe ? -10 : -20, 0, 0], pernas: AGACHA, bracos: { D: DIR, E: { ref: 'peito', mao: sobe ? [.7, 1.6, .1] : [.5, .8, .6], polo: [1, -.4, 0] } } }; }
    const b = POSES.comArma(c, f, t, k, A); if (c.golpe !== 'enxurrada' && c.golpe !== 'ondas' || c.estado !== 'prepara' && c.estado !== 'bate') return b;
    const q = c.estado === 'prepara', l = c.lado || 1; return { ...b, pelve: [q ? -6 : 12, 0, 0], coluna: [q ? -8 : 12, l * (q ? 14 : -14), 0], peito: [q ? -12 : 10, l * (q ? 16 : -20), 0], cabeca: [q ? -8 : -26, 0, 0], arma: { pos: [-.7, q ? 1.2 : .8, .2], rot: [q ? -110 : -30, 0, 10] }, bracos: { D: DIR, E: { ref: 'peito', mao: q ? [.74, 1.74, -.05] : [.3, .86, .66], polo: [1, -.3, -.2] } } };
  },
  guindaste(c, f, t, k) {
    const A = { pos: [-.74, .84, .3], rot: [-58, -6, 8], bate: 26 }, b = POSES.comArma(c, f, t, k, A);
    if ((c.golpe === 'carro' || c.golpe === 'carros') && (c.estado === 'prepara' || c.estado === 'bate')) { const q = c.estado === 'prepara'; return { ...b, pelve: [q ? -8 : 12, q ? -20 : 18, 0], coluna: [q ? -6 : 10, q ? -12 : 12, 0], peito: [q ? -8 : 12, q ? -22 : 24, 0], cabeca: [q ? -4 : -22, q ? 40 : -34, 0], pernas: { E: [26, 30, 0, 12], D: [-8, 30, 0, 16] }, arma: { pos: q ? [-.72, 1.5, -.1] : [-.3, 1.1, .7], rot: [q ? -150 : -20, 0, 0] } }; }
    return b;
  },
  fiscal(c, f, t, k) { return POSES.comArma(c, f, t, k, { pos: [-.62, .92, .26], rot: [-76, -6, 8], bate: 20 }); },
  arauto(c, f, t, k) {
    const b = POSES.comArma(c, f, t, k, { pos: [-.62, .92, .26], rot: [-82, -6, 8], bate: 20 });
    if (c.golpe === 'grito' && (c.estado === 'prepara' || c.estado === 'bate')) return { ...b, pelve: [-4, 0, 0], coluna: [-6, 0, 0], peito: [-10, 0, 0], cabeca: [-10, 0, 0], arma: { pos: [-.16, 1.42, .34], rot: [-14, 4, 0] }, bracos: { D: { ...DIR, mao: [0, 0, .1] }, E: { ref: 'arma', mao: [0, 0, .32], dir: [-.2, .2, .9], palma: [-.5, .8, 0], polo: [1, -.6, 0] } } };
    return b;
  },
  britadeira(c, f, t, k) { return POSES.comArma(c, f, t, k, { pos: [-.56, .72, .46], rot: [38, -4, 6], bate: 70 }); },
  fundidor(c, f, t, k) { return POSES.comArma(c, f, t, k, { pos: [-.72, .7, .34], rot: [-96, -6, 10], bate: 24 }); },
  motoqueiro(c, f, t, k) {
    const b = POSES.comArma(c, f, t, k, { pos: [-.6, .86, .28], rot: [-70, -6, 8], bate: 20 });
    if (c.golpe === 'investida' && (c.estado === 'prepara' || c.estado === 'bate')) return { ...b, pelve: [28, 0, 0], coluna: [16, 0, 0], peito: [10, sen(t, 3) * 3, 0], cabeca: [-42, 0, 0], pernas: c.estado === 'bate' ? pernas(CORRE, t * 2.4, 1) : { E: [66, 78, 14, 12], D: [10, 60, 20, 14] }, arma: { pos: [-.5, .9, -.1], rot: [-150, -20, 0] } };
    return b;
  },
  estivador(c, f, t, k) { return POSES.comArma(c, f, t, k, { pos: [-.66, .7, .34], rot: [-64, -6, 8], bate: 24 }); },
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
  carcaca(c, f, t, k) { return POSES.maosLivres(c, f, t, k, 1, 0); },
  fornalha(c, f, t, k) { return POSES.maosLivres(c, f, t, k, .96, .05); },
  mae(c, f, t, k) { return POSES.maosLivres(c, f, t, k, .96, .17); },
  tampa(c, f, t, k) { return POSES.maosLivres(c, f, t, k, .9, -.02); },
  mergulhador(c, f, t, k) { return POSES.maosLivres(c, f, t, k, .78, .12); },
  // W e H ajustam a largura e a altura das mãos a cada corpo
  maosLivres(c, f, t, k, W, H) {
    const maos = (e, d, polo) => maosBase([e[0] * W, e[1] + H, e[2]], [d[0] * W, d[1] + H, d[2]], polo);
    const r = sen(t * .5), anda = c.estado === 'anda' && c.vel > 0;
    const base = { pelve: [4, anda ? sen(f) * 8 : 0, anda ? sen(f, 1, .25) * 9 : 0], coluna: [4 + r, anda ? -sen(f) * 6 : 0, anda ? -sen(f, 1, .25) * 4 : 0], peito: [6 + r * 2, 0, 0], cabeca: [-12 + r * 2, sen(t * .22) * 10, 0], pernas: anda ? pernas(ANDA, f, 1) : PARADO, desl: V(anda ? sen(f, 1, .25) * .06 : 0, 0, 0), voo: 0, bracos: maos([.76, .52, .3 - sen(f) * .2], [-.76, .52, .3 + sen(f) * .2]) };
    switch (c.estado) {
      case 'cai': return { ...base, pernas: AGACHA, bracos: maos([.9, 1.3, .1], [-.9, 1.3, .1], .1) };
      case 'ruge': return { ...base, pelve: [-4, 0, 0], coluna: [-8, 0, 0], peito: [-12 + sen(t, 6) * 1.2, 0, 0], cabeca: [-20, sen(t, 4) * 4, 0], bracos: maos([.92, 1.18, .3], [-.92, 1.18, .3], .4) };
      case 'tonto': return { ...base, coluna: [16, 0, sen(t, .8) * 8], cabeca: [14, sen(t, .9) * 16, sen(t, .9, .25) * 16], bracos: maos([.6, .45, .3], [-.6, .45, .3]) };
      case 'prepara': if (['pente', 'desaba', 'garra', 'brasa', 'convoca', 'ondas'].includes(c.golpe)) return { ...base, pelve: [-8, 0, 0], coluna: [-10, 0, 0], peito: [-14 + sen(t, 4) * 1.2, 0, 0], cabeca: [-4, 0, 0], pernas: { E: [20, 28, 0, 14], D: [-6, 28, 0, 16] }, bracos: maos([c.golpe === 'convoca' ? .9 : .36, 1.72, .12], [c.golpe === 'convoca' ? -.9 : -.36, 1.72, .12], .1) };
        if (c.golpe === 'bafo') return { ...base, pelve: [-8, 0, 0], coluna: [-14, 0, 0], peito: [-18, 0, 0], cabeca: [-10 + sen(t, 4) * 2, 0, 0], bracos: maos([.8, .8, -.2], [-.8, .8, -.2], .2) };
        if (c.golpe === 'investida') return { ...base, pelve: [30, 0, 0], coluna: [18, 0, 0], peito: [10, sen(t, 3) * 3, 0], cabeca: [-44, 0, 0], pernas: { E: [66, 78, 14, 12], D: [10, 60, 20, 14] }, bracos: maos([.7, .42, .5], [-.7, .42, .5]) };
        if (c.golpe === 'pisao') return { ...base, pelve: [-6, 0, 10], coluna: [-6, 0, 8], peito: [-8, 0, 0], pernas: { E: [84, 96, 0, 18], D: [0, 14, 0, 14] }, bracos: maos([.95, 1.05, .1], [-.95, 1.05, .1], .3) };
        return { ...base, pelve: [-4, -22, 0], coluna: [-6, -16, 0], peito: [-8, -26, 0], cabeca: [-6, 44, 0], pernas: { E: [26, 30, 0, 12], D: [-8, 30, 0, 16] }, bracos: maos([.7, .95, .5], [-.86, 1.3, -.28], .2) };
      case 'bate': case 'volta': if (['pente', 'desaba', 'garra', 'brasa', 'convoca', 'ondas'].includes(c.golpe)) return { ...base, pelve: [22, 0, 0], coluna: [20, 0, 0], peito: [18, 0, 0], cabeca: [-40, 0, 0], pernas: { E: [44, 52, 6, 14], D: [10, 44, 0, 16] }, bracos: maos([.34, .5, .72], [-.34, .5, .72], .4) };
        if (c.golpe === 'bafo') return { ...base, pelve: [14, sen(t, .9) * 14, 0], coluna: [16, 0, 0], peito: [12 + sen(t, 9), 0, 0], cabeca: [-38, 0, 0], pernas: { E: [40, 46, 0, 14], D: [-4, 34, 0, 16] }, bracos: maos([.86, .7, .1], [-.86, .7, .1], .4) };
        if (c.golpe === 'investida') return { ...base, pelve: [34, 0, 0], coluna: [20, 0, 0], peito: [14, 0, 0], cabeca: [-50, 0, 0], pernas: pernas(CORRE, t * 2.2, .9), bracos: maos([.55, .7, .62], [-.55, .7, .62]) };
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
function placas(id) {
  const porta = cor => new Pecas().por(caixaRedonda(.44, .36, .06, .025, 1), cor).por(caixaRedonda(.36, .17, .05, .02, 1), '#86c9e8', { y: .13, z: .012 }).por(caixaRedonda(.1, .03, .03, .01, 1), '#2c2a33', { x: .12, y: -.05, z: .035 }).por(caixaRedonda(.44, .05, .075, .02, 1), '#2c2a33', { y: -.15 });
  const capo = cor => new Pecas().por(caixaRedonda(.56, .42, .07, .03, 1), cor).por(caixaRedonda(.12, .4, .085, .02, 1), '#fbf6ea').por(caixaRedonda(.2, .04, .1, .015, 1), '#2c2a33', { y: -.14 });
  const por = (P, o) => { const g = P.pronta(); g.applyMatrix4(new THREE.Matrix4().compose(V(...o.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r || [0, 0, 0]))), V(1, 1, 1).multiplyScalar(o.s || 1))); return g; };
  if (id === 'mae') {
    const laje = (w, h) => { const P = new Pecas().por(caixaRedonda(w, h, .09, .025, 1), '#d8cde6').por(caixaRedonda(w * .9, h * .88, .05, .02, 1), '#5a5078', { z: .04 }).por(caixaRedonda(w * .1, h * .24, .03, .01, 1), '#ffd24a', { y: h * .28, z: .062 }).por(caixaRedonda(w * .1, h * .24, .03, .01, 1), '#ffd24a', { y: -h * .06, z: .062 }).por(caixaRedonda(w * .1, h * .12, .03, .01, 1), '#ffd24a', { y: -h * .36, z: .062 }).por(caixaRedonda(w * .34, h * .3, .1, .02, 1), '#b9aecb', { x: w * .36, y: -h * .4, rz: .5 }); [[-.3, -.5, .05], [-.12, -.52, -.12], [.08, -.5, .2]].forEach(([x, y, r]) => P.por(new THREE.CylinderGeometry(.013, .013, h * .4, 6), '#e8452f', { x: x * w, y: y * h, rz: r })); return P; };
    return [[2, por(laje(.56, .34), { p: [0, 1.14, .31], r: [-.1, 0, .05] })], [0, por(laje(.5, .36), { p: [0, .5, .47], r: [-.16, 0, 0] })], [4, por(laje(.36, .3), { p: [.53, 1.34, .06], r: [0, .5, -.6] })], [7, por(laje(.36, .3), { p: [-.53, 1.34, .06], r: [0, -.5, .6] })], [5, por(laje(.22, .34), { p: [.84, .8, .14], r: [0, .5, -.5] })], [8, por(laje(.22, .34), { p: [-.84, .8, .14], r: [0, -.5, .5] })]];
  }
  return [
    [1, por(capo('#e0352b'), { p: [0, .72, .46], r: [.08, 0, 0] })],
    [2, por(porta('#2d7bd0'), { p: [0, 1.0, .4], r: [-.3, 0, .06], s: .9 })],
    [4, por(porta('#f2b51d'), { p: [.6, 1.0, .12], r: [0, .75, -.4] })],
    [7, por(porta('#3fa34d'), { p: [-.6, 1.0, .12], r: [0, -.75, .4] })],
    [10, por(capo('#fbf6ea'), { p: [.24, .42, .2], r: [0, .2, 0], s: .55 })],
  ];
}

// enfeites e armas dos meio-chefes: [osso, peças na posição de repouso]. O osso 16 é a mão da arma (+z = ponta)
const LAT = Math.PI / 2, cilX = (r, h, n = 14) => new THREE.CylinderGeometry(r, r, h, n).rotateX(LAT), esf = (r, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b), cx = caixaRedonda;
const ENFEITES = {
  fiscal: () => [
    [3, new Pecas().por(esf(.2, 16, 8), '#244a9c', { y: 1.56, z: .08, s: [1, .55, 1] }).por(new THREE.CylinderGeometry(.19, .19, .07, 18), '#1a1c34', { y: 1.54, z: .08 }).por(cx(.3, .025, .17, .01, 1), '#1a1c34', { y: 1.53, z: .28, rx: .2 }).por(esf(.045, 10, 8), '#ffc62e', { y: 1.6, z: .275, s: [1, 1, .4] })],
    [16, new Pecas().por(cilX(.04, 1.5), '#fbf6ea', { z: .3 }).por(cilX(.044, .2), '#e0352b', { z: .1 }).por(cilX(.044, .2), '#e0352b', { z: .55 }).por(new THREE.CylinderGeometry(.34, .34, .06, 8).rotateY(Math.PI / 8).rotateZ(LAT), '#fbf6ea', { z: 1.2 }).por(new THREE.CylinderGeometry(.29, .29, .075, 8).rotateY(Math.PI / 8).rotateZ(LAT), '#e0352b', { z: 1.2 }).por(cx(.09, .34, .1, .02, 1), '#fbf6ea', { z: 1.2 })],
    [2, new Pecas().por(esf(.06, 12, 8), '#ffc62e', { x: .16, y: 1.02, z: .21, s: [1, 1, .6] }).por(cx(.16, .1, .06, .02, 1), '#1a1c34', { x: -.2, y: .98, z: .2 }).por(cx(.02, .16, .02, .008, 1), '#1a1c34', { x: -.25, y: 1.1, z: .2 })],
  ],
  arauto: () => [
    [3, new Pecas().por(cx(.5, .16, .22, .07, 1), '#3a1a5a', { y: 1.62, z: .08 }).por(cx(.4, .09, .16, .04, 1), '#3a1a5a', { y: 1.72, z: .08 }).por(cx(.52, .05, .24, .02, 1), '#ffcf3a', { y: 1.55, z: .08 }).por(esf(.06, 10, 8), '#ffcf3a', { y: 1.63, z: .2, s: [1, 1, .4] }).por(esf(.1, 10, 8), '#ff3d6a', { x: .16, y: 1.82, z: .02, s: [.6, 1.5, .6], rz: -.4 }).por(esf(.1, 10, 8), '#ff7a3a', { x: .0, y: 1.88, z: .02, s: [.6, 1.6, .6] }).por(esf(.1, 10, 8), '#ff3d6a', { x: -.16, y: 1.82, z: .02, s: [.6, 1.5, .6], rz: .4 })],
    [16, new Pecas().por(cilX(.032, 1.5), '#ffcf3a', { z: .35 }).por(new THREE.CylinderGeometry(.22, .05, .34, 16).rotateX(LAT), '#ffcf3a', { z: 1.25 }).por(new THREE.TorusGeometry(.21, .03, 8, 18), '#e8862a', { z: 1.42 }).por(cx(.03, .52, .46, .01, 1), '#7a2fb0', { y: -.3, z: .68 }).por(cx(.04, .1, .46, .01, 1), '#ffcf3a', { y: -.58, z: .68 }).por(cx(.045, .2, .16, .01, 1), '#ffcf3a', { y: -.28, z: .68 })],
  ],
  britadeira: () => [
    [3, new Pecas().por(esf(.195, 16, 8), '#ffc21f', { y: 1.25, z: .24, s: [1, .8, 1] }).por(cx(.3, .03, .16, .012, 1), '#ffc21f', { y: 1.24, z: .44, rx: .15 }).por(cx(.06, .05, .36, .02, 1), '#e8962a', { y: 1.39, z: .22 }).por(cilX(.08, .07, 12), '#2c2a33', { x: .19, y: 1.15, z: .25, ry: LAT }).por(cilX(.08, .07, 12), '#2c2a33', { x: -.19, y: 1.15, z: .25, ry: LAT })],
    [16, new Pecas().por(cx(.24, .24, .5, .06, 1), '#ff8a1f', { z: .2 }).por(cx(.27, .1, .3, .03, 1), '#2c2a33', { z: .2 }).por(cx(.56, .07, .07, .03, 1), '#2c2a33', { z: -.08 }).por(cilX(.09, .22), '#8d97a6', { z: .55 }).por(cilX(.055, .42), '#5d6675', { z: .82 }).por(new THREE.ConeGeometry(.075, .28, 10).rotateX(LAT), '#c9d2de', { z: 1.15 }).por(cilX(.04, .5), '#2c2a33', { y: .16, z: .1 })],
  ],
  fundidor: () => [
    [3, new Pecas().por(cx(.34, .38, .16, .07, 1), '#3f4658', { y: 1.2, z: .4 }).por(cx(.24, .09, .05, .02, 1), '#ffb03a', { y: 1.25, z: .48 }).por(new THREE.TorusGeometry(.19, .03, 8, 18).rotateX(LAT), '#2a2030', { y: 1.22, z: .26 }).por(new THREE.ConeGeometry(.05, .2, 8), '#e8d8b0', { x: .2, y: 1.36, z: .26, rz: -.5 }).por(new THREE.ConeGeometry(.05, .2, 8), '#e8d8b0', { x: -.2, y: 1.36, z: .26, rz: .5 })],
    [16, new Pecas().por(cilX(.055, 1.3), '#5a3a2a', { z: .28 }).por(cx(.36, .66, .36, .06, 1), '#4a5164', { z: 1.0 }).por(cx(.39, .16, .39, .05, 1), '#ff8a1e', { y: .25, z: 1.0 }).por(cx(.39, .16, .39, .05, 1), '#ff8a1e', { y: -.25, z: 1.0 }).por(cx(.32, .68, .32, .04, 1), '#ffd24a', { z: 1.0 })],
  ],
  motoqueiro: () => {
    const m = new Pecas(); for (let i = 0; i < 5; i++) { const a = -.5 + i * .42; m.por(new THREE.ConeGeometry(.06, .26, 8), '#ffd21f', { y: 1.45 + Math.cos(a) * .3, z: .06 - Math.sin(a) * .3, rx: -a }); }
    const o = s => { const q = new Pecas(); for (const [x, z] of [[.36, .06], [.36, -.08], [.3, 0]]) q.por(new THREE.ConeGeometry(.04, .17, 8), '#d8dfe8', { x: s * x, y: 1.32, z, rz: -s * .5 }); return q; };
    return [[3, m.por(cx(.06, .03, .4, .012, 1), '#fbf6ea', { x: .1, y: 1.66, z: .08, rz: -.4 }).por(cx(.06, .03, .4, .012, 1), '#fbf6ea', { x: -.1, y: 1.66, z: .08, rz: .4 })], [4, o(1)], [7, o(-1)],
      [16, new Pecas().por(cilX(.045, 1.2), '#8d97a6', { z: .3 }).por(new THREE.TorusGeometry(.3, .1, 10, 22).rotateY(LAT), '#2c2a33', { z: 1.05 }).por(new THREE.TorusGeometry(.2, .03, 8, 18).rotateY(LAT), '#d8dfe8', { z: 1.05 }).por(cx(.03, .04, .4, .01, 1), '#d8dfe8', { z: 1.05 }).por(cx(.03, .4, .04, .01, 1), '#d8dfe8', { z: 1.05 }).por(cilX(.07, .12).rotateY(LAT), '#e0352b', { z: 1.05 })]];
  },
  mergulhador: () => {
    const m = new Pecas(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; m.por(esf(.032, 8, 6), '#8a5a1c', { x: Math.sin(a) * .19, y: 1.43 + Math.cos(a) * .15, z: .3 - Math.abs(Math.sin(a)) * .06 }); }
    for (const x of [-.07, .07]) m.por(new THREE.CylinderGeometry(.015, .015, .26, 8), '#8a5a1c', { x, y: 1.43, z: .335 }); m.por(cx(.36, .028, .03, .01, 1), '#8a5a1c', { y: 1.43, z: .335 });
    for (const s of [1, -1]) m.por(cilX(.08, .08, 12), '#8a5a1c', { x: s * .23, y: 1.46, z: .06, ry: LAT }).por(cilX(.055, .09, 12), '#bdf5e8', { x: s * .235, y: 1.46, z: .06, ry: LAT });
    return [[3, m.por(new THREE.CylinderGeometry(.05, .07, .1, 10), '#8a5a1c', { y: 1.69, z: .05 })],
      [2, new Pecas().por(new THREE.CylinderGeometry(.11, .11, .5, 14), '#ffc62e', { x: .13, y: 1.02, z: -.27 }).por(new THREE.CylinderGeometry(.11, .11, .5, 14), '#ffc62e', { x: -.13, y: 1.02, z: -.27 }).por(esf(.11), '#e8962a', { x: .13, y: 1.27, z: -.27, s: [1, .6, 1] }).por(esf(.11), '#e8962a', { x: -.13, y: 1.27, z: -.27, s: [1, .6, 1] }).por(cx(.42, .07, .3, .03, 1), '#4a3020', { y: 1.08, z: -.2 }).por(new THREE.TorusGeometry(.22, .035, 8, 18, 4), '#2c2a33', { x: .06, y: 1.3, z: -.16, rz: .4 })],
      [12, new Pecas().por(cx(.22, .06, .52, .03, 1), '#ff8a1f', { x: .18, y: .05, z: .2 })], [15, new Pecas().por(cx(.22, .06, .52, .03, 1), '#ff8a1f', { x: -.18, y: .05, z: .2 })]];
  },
  tampa: () => {
    const disco = (x, y, z, rx, ry) => { const q = new Pecas().por(new THREE.CylinderGeometry(.3, .3, .07, 20).rotateX(LAT), '#5d6678').por(new THREE.TorusGeometry(.25, .025, 6, 20), '#9aa5b8', { z: .04 }); for (let k = 0; k < 3; k++) q.por(cx(.4, .035, .05, .012, 1), '#707b8e', { z: .035, rz: k * Math.PI / 3 }); const g = q.pronta(); g.rotateX(rx).rotateY(ry).translate(x, y, z); return g; };
    return [[3, new Pecas().por(new THREE.ConeGeometry(.15, .36, 14), '#ff6a1f', { y: 1.42, z: .32, rx: -.15 }).por(new THREE.CylinderGeometry(.075, .1, .08, 14), '#fbf6ea', { y: 1.43, z: .32, rx: -.15 }).por(cx(.36, .04, .36, .02, 1), '#ff6a1f', { y: 1.255, z: .33, rx: -.15 })], [5, disco(.84, .62, .14, 0, .9)], [8, disco(-.84, .62, .14, 0, -.9)], [2, disco(0, .98, .33, -.25, 0)]];
  },
  estivador: () => {
    const c = new Pecas().por(cx(.86, .56, .4, .04, 1), '#1f78c8', { y: 1.2, z: -.5 }); for (let k = 0; k < 6; k++) c.por(cx(.05, .5, .42, .015, 1), '#155a9c', { x: -.35 + k * .14, y: 1.2, z: -.5 }); c.por(cx(.9, .06, .44, .02, 1), '#ffc62e', { y: 1.48, z: -.5 }).por(cx(.9, .06, .44, .02, 1), '#ffc62e', { y: .92, z: -.5 });
    const h = new Pecas().por(cilX(.045, .8), '#8a5a30', { z: .12 }).por(cx(.1, .1, .16, .03, 1), '#2c2a33', { z: .56 }); h.por(new THREE.TorusGeometry(.2, .05, 8, 18, 4.2).rotateY(LAT), '#c9d2de', { z: .84, rx: 1.2 });
    return [[2, c], [3, new Pecas().por(esf(.185, 16, 8), '#e0352b', { y: 1.2, z: .33, s: [1, .62, 1] }).por(new THREE.TorusGeometry(.17, .04, 8, 18).rotateX(LAT), '#c4281f', { y: 1.19, z: .33 }).por(esf(.05, 10, 8), '#fbf6ea', { y: 1.33, z: .32 })], [16, h]];
  },
};

export class Chefe {
  constructor(cena, modelos, id, ruido, qual = 2) {
    this.id = id; this.T = CHEFES[id]; const corpo = this.T.corpo || id, M0 = modelos[corpo]; this.J = M0.juntas; this.grupo = new THREE.Group(); cena.add(this.grupo);
    this.dados = new Float32Array(NB * 3 * 4); this.tex = new THREE.DataTexture(this.dados, NB * 3, 1, THREE.RGBAFormat, THREE.FloatType);
    this.mat = materialPersonagem(2, this.tex, ruido, paleta(CORES[id])); this.matC = contornoPersonagem(this.tex, this.mat.userData.u.uGiro, .03);
    const geo = M0.lods[qual > 0 ? 0 : 1]; this.lixo = [this.tex, this.mat, this.matC];
    const nova = (g, m) => { const b = new THREE.BufferGeometry(); for (const k in g.attributes) b.setAttribute(k, g.attributes[k]); b.setIndex(g.index); b.setAttribute('aAnim', new THREE.InstancedBufferAttribute(new Float32Array(4), 4)); const x = new THREE.InstancedMesh(b, m, 1); x.setMatrixAt(0, new THREE.Matrix4()); x.frustumCulled = false; this.grupo.add(x); this.lixo.push(b, x); return x; };
    this.corpo = nova(geo, this.mat); this.corpo.receiveShadow = true; this.borda = nova(geo, this.matC);
    const [invis, prof] = sombraPersonagem(this.tex); this.lixo.push(invis, prof); const s = nova(M0.lods[1], invis); s.castShadow = true; s.customDepthMaterial = prof; s.renderOrder = -1;
    this.anim = this.corpo.geometry.attributes.aAnim;
    // placas soltas e enfeites
    this.pal = this.mat.userData.u.uPal.value; this.pal0 = this.pal.map(v => v.clone());
    this.placas = []; const pecas = this.T.placas ? placas(id) : ENFEITES[id]?.().map(([o, g]) => [o, g.pronta ? g.pronta() : g]); if (pecas) { const m = materialDesenho({ side: THREE.DoubleSide }, { ruido }), mc = contorno({ esp: .03 }); this.lixo.push(m, mc); for (const [o, g] of pecas) { const p = new THREE.Mesh(g, m), b = new THREE.Mesh(g, mc); p.frustumCulled = b.frustumCulled = false; p.castShadow = true; p.add(b); p.matrixAutoUpdate = false; this.grupo.add(p); this.lixo.push(g); this.placas.push({ o, p, solta: null }); } }
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
    const c = S.chefe; this.grupo.visible = this.chao.visible = !!c && c.id === this.id; if (!this.grupo.visible) { this.pose = null; return; }
    this.t += dt; const k = c.dur ? limita(c.t / c.dur, 0, 1) : limita(c.t / .85, 0, 1), alvo = POSES[this.id](c, c.passo, this.t, k);
    const vel = c.estado === 'bate' ? 20 : c.estado === 'prepara' ? 5 : c.estado === 'morre' ? 4.2 : 6.5; this.pose = this.pose ? chegar(this.pose, alvo, Math.min(1, dt * vel)) : alvo;
    this.#gravar(this.pose);
    const e = this.T.escala, tre = c.estado === 'morre' && c.t < 2.4 ? Math.sin(this.t * 46) * .05 : 0, some = S.luta === 'morre' ? Math.max(0, c.t - 3.4) : 0;
    const fimMeio = c.meio && S.luta === 'morre' ? Math.max(0, c.t - 1) * 2.6 : 0; this.grupo.position.set(c.x + tre, c.alt - some * 2.2 - fimMeio, -c.d); const gira = c.estado === 'mergulha' ? c.lado * 1.15 : c.estado === 'emerge' ? -c.lado * .9 * (1 - k) : 0; this.grupo.rotation.y += (gira - this.grupo.rotation.y) * Math.min(1, dt * 6); if (c.alt < -10) this.grupo.visible = false;
    this.#tons(c, dt); this.grupo.scale.setScalar(e); this.grupo.updateMatrixWorld();
    const r = this.T.raio * 1.15 * (1 - Math.min(.5, c.alt / 40)); this.chao.position.set(c.x, .03, -c.d); this.chao.scale.set(r, 1, r); this.chao.material.opacity = .34 * Math.max(0, 1 - some);
    this.anim.array[2] = c.dano; this.anim.needsUpdate = true;
    for (const q of this.placas) if (q.solta) { const s = q.solta, p = q.p; s.t += dt; s.vy -= 2.6 * dt; p.position.x += s.vx * dt; p.position.y += s.vy * dt; p.position.z += s.vz * dt; if (p.position.y < .04 && s.vy < 0) { p.position.y = .04; s.vy *= -.35; s.vx *= .5; s.vz *= .5; s.g.multiplyScalar(.4); } p.rotateX(s.g.x * dt); p.rotateY(s.g.y * dt); p.rotateZ(s.g.z * dt); p.visible = s.t < 3.5; }
  }
  // a Fornalha apaga quando leva água; a Mãe da Ponte muda de cor a cada etapa
  #tons(c, dt) {
    if (!this.T.quente && !this.T.etapas) return; const k = Math.min(1, dt * 3), B = this.pal[25], P = this.pal[0], alvo = (v, h) => { COR.set(h); v.x += (COR.r - v.x) * k; v.y += (COR.g - v.y) * k; v.z += (COR.b - v.z) * k; };
    if (this.T.quente) { alvo(B, c.frio > 0 ? '#4fa8d8' : '#ffb01e'); alvo(P, c.frio > 0 ? '#6a6888' : '#c4382e'); } else { alvo(B, ['#ffd23a', '#ff7a1e', '#ff2a6a'][c.etapa]); alvo(P, ['#b45ad0', '#c4508e', '#d8403f'][c.etapa]); }
  }
  // para a vitrine: mostra uma pose parada
  teste(estado, k, ang) { const [e, g] = estado.split(':'); const c = { estado: e, golpe: g, t: e === 'morre' ? 2 : 0, vel: e === 'anda' ? 1 : 0 }; this.#gravar(POSES[this.id](c, k, 0, k)); this.grupo.visible = true; this.grupo.rotation.y = ang; this.grupo.scale.setScalar(1); this.grupo.updateMatrixWorld(); }
  dispose() { for (const o of this.lixo) o.dispose(); this.grupo.removeFromParent(); this.chao.removeFromParent(); }
}
