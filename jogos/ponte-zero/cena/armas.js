// Modelos das armas (inventadas, sem marca), gordinhas como num desenho, presos ao osso "arma" do soldado.
// Sistema da arma: +z = cano, y = para cima, origem na empunhadura. Peças nas costas usam o osso do peito (2).
import * as THREE from 'three';
import { MAT as T, caixaChanfro } from './desenho.js';

// junta várias peças numa geometria só, no formato dos personagens (aB = ossos + material, aW = pesos + sombra)
class Arma {
  constructor() { this.p = []; this.n = []; this.m = []; this.o = []; this.i = []; }
  juntar(g, mat, osso = 16) {
    const b = this.p.length / 3, p = g.attributes.position, n = g.attributes.normal;
    for (let k = 0; k < p.count; k++) { this.p.push(p.getX(k), p.getY(k), p.getZ(k)); this.n.push(n.getX(k), n.getY(k), n.getZ(k)); this.m.push(mat); this.o.push(osso); }
    if (g.index) for (const x of g.index.array) this.i.push(b + x); else for (let k = 0; k < p.count; k++) this.i.push(b + k);
    g.dispose(); return this;
  }
  caixa(x, y, z, w, h, d, mat, { r = Math.min(w, h, d) * .3, rx = 0, ry = 0, rz = 0, osso } = {}) { const g = caixaChanfro(w, h, d, r); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz); g.translate(x, y, z); return this.juntar(g, mat, osso); }
  // cano de z0 a z1 (cone se r2 for diferente); as pontas são fechadas
  cano(z0, z1, r, y, mat, r2 = r, { lados = 9, x = 0, osso } = {}) { const g = new THREE.CylinderGeometry(r2, r, z1 - z0, lados); g.rotateX(Math.PI / 2); g.translate(x, y, (z0 + z1) / 2); return this.juntar(g, mat, osso); }
  // cilindro em pé
  tubo(x, y0, y1, z, r, mat, r2 = r, { lados = 10, osso } = {}) { const g = new THREE.CylinderGeometry(r2, r, y1 - y0, lados); g.translate(x, (y0 + y1) / 2, z); return this.juntar(g, mat, osso); }
  bola(x, y, z, r, mat, { sy = 1, sz = 1, osso } = {}) { const g = new THREE.SphereGeometry(r, 9, 6); g.scale(1, sy, sz); g.translate(x, y, z); return this.juntar(g, mat, osso); }
  pronta() {
    const g = new THREE.BufferGeometry(), nv = this.p.length / 3, aB = new Uint8Array(nv * 4), aW = new Uint8Array(nv * 4);
    for (let k = 0; k < nv; k++) { aB.set([this.o[k], this.o[k], this.o[k], this.m[k]], k * 4); aW.set([255, 0, 0, 255], k * 4); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(aB, 4)); g.setAttribute('aW', new THREE.BufferAttribute(aW, 4, true)); g.setIndex(this.i);
    return g;
  }
}

const pistola = () => new Arma().caixa(0, .035, .07, .062, .07, .3, T.metal).caixa(0, -.06, -.03, .055, .15, .075, T.madeira, { rx: .22 }).caixa(0, -.005, .07, .05, .05, .2, T.preto).cano(.21, .25, .022, .04, T.preto).caixa(0, .08, .18, .02, .025, .03, T.lenco).pronta();
const submetralhadora = () => new Arma().caixa(0, .03, .06, .08, .1, .36, T.metal).caixa(0, -.07, -.04, .055, .15, .07, T.preto, { rx: .22 }).caixa(0, -.14, .12, .055, .26, .075, T.amarelo, { rx: -.16 }).caixa(0, .025, -.22, .06, .085, .2, T.preto).cano(.23, .43, .032, .035, T.cano).cano(.36, .43, .044, .035, T.preto).caixa(0, .1, .04, .045, .045, .16, T.preto).pronta();
const fuzil = () => new Arma().caixa(0, .035, .05, .085, .115, .38, T.metal).caixa(0, -.07, -.04, .058, .15, .07, T.preto, { rx: .22 }).caixa(0, -.12, .14, .058, .21, .095, T.preto, { rx: -.25 }).caixa(0, .02, -.26, .07, .12, .26, T.madeira).caixa(0, .04, .36, .075, .085, .26, T.madeira).cano(.46, .72, .024, .045, T.cano).cano(.68, .78, .04, .045, T.preto).cano(-.06, .16, .038, .135, T.preto).cano(.15, .18, .048, .135, T.visor).caixa(0, .095, .05, .03, .04, .06, T.preto).pronta();
// metralhadora giratória: seis canos que rodam, tambor de munição nas costas
const metralhadora = () => {
  const a = new Arma().caixa(0, .02, -.06, .17, .17, .24, T.amarelo).caixa(0, .02, -.2, .09, .09, .1, T.preto).caixa(0, .15, .06, .04, .04, .2, T.preto).caixa(0, .1, -.02, .035, .12, .04, T.preto).caixa(0, .1, .13, .035, .12, .04, T.preto).cano(.04, .12, .085, .02, T.cano).caixa(-.13, -.02, -.06, .1, .14, .16, T.metal);
  for (let k = 0; k < 6; k++) { const q = k / 6 * Math.PI * 2; a.cano(.12, .66, .026, .02 + Math.sin(q) * .055, T.gira, .026, { x: Math.cos(q) * .055, lados: 6 }); }
  a.cano(.36, .42, .088, .02, T.metal).cano(.58, .63, .088, .02, T.metal);
  return a.cano(-.46, -.3, .13, .84, T.amarelo, .13, { osso: 2, lados: 12 }).cano(-.475, -.28, .05, .84, T.preto, .05, { osso: 2 }).pronta();
};
// bazuca: tubo no ombro com bocal largo, foguetes de reserva nas costas
const bazuca = () => {
  const a = new Arma().cano(-.52, .5, .085, 0, T.vermelho, .085, { lados: 12 }).cano(.46, .66, .09, 0, T.metal, .13, { lados: 12 }).cano(-.66, -.48, .13, 0, T.metal, .088, { lados: 12 }).cano(-.14, -.06, .098, 0, T.branco, .098, { lados: 12 }).cano(.24, .32, .098, 0, T.branco, .098, { lados: 12 }).cano(.62, .66, .1, 0, T.preto, .1).cano(.63, .74, .075, 0, T.amarelo, .012).caixa(0, -.14, 0, .055, .16, .075, T.preto, { rx: .15 }).caixa(0, -.13, .18, .055, .14, .06, T.preto).caixa(.12, .06, .14, .06, .07, .12, T.preto).cano(.2, .215, .026, .06, T.visor, .026, { x: .12 });
  for (const x of [-.1, 0, .1]) a.tubo(x, .84, 1.16, -.33, .045, T.branco, .045, { osso: 2, lados: 8 }).tubo(x, 1.16, 1.29, -.33, .045, T.vermelho, .006, { osso: 2, lados: 8 }).tubo(x, .8, .86, -.33, .065, T.vermelho, .05, { osso: 2, lados: 8 });
  return a.pronta();
};
// lança-chamas: bico com chama piloto e dois tanques nas costas
const lancaChamas = () => {
  const a = new Arma().cano(-.12, .34, .05, .02, T.metal).cano(.3, .5, .034, .02, T.cano).cano(.48, .58, .05, .02, T.preto, .075).caixa(0, -.06, -.06, .055, .14, .07, T.preto, { rx: .22 }).caixa(0, .02, .2, .1, .11, .14, T.laranja).cano(.34, .52, .016, -.045, T.metal).bola(0, -.03, .55, .028, T.brilho, { sz: 1.4 }).caixa(0, .1, .02, .035, .035, .16, T.preto);
  for (const x of [-.085, .085]) a.tubo(x, .8, 1.1, -.35, .085, T.laranja, .085, { osso: 2, lados: 12 }).bola(x, 1.1, -.35, .085, T.laranja, { sy: .6, osso: 2 }).bola(x, .8, -.35, .085, T.laranja, { sy: .6, osso: 2 }).tubo(x, .9, .96, -.35, .091, T.branco, .091, { osso: 2, lados: 12 }).tubo(x, 1.13, 1.19, -.35, .025, T.metal, .025, { osso: 2 });
  return a.caixa(0, 1.18, -.35, .2, .03, .035, T.metal, { osso: 2 }).pronta();
};
// na mesma ordem de ARMAS em dados/balanco.js
export const MODELOS = [pistola, submetralhadora, fuzil, metralhadora, bazuca, lancaChamas];
// ponta do cano (z, y) no sistema da arma, para o brilho e os projéteis
export const BOCA = { pistola: [.26, .04], curta: [.44, .035], longa: [.8, .045], quadril: [.68, .02], ombro: [.72, 0], jato: [.6, .02] };

// projétil da bazuca (aponta para -z, o rumo da ponte)
export function foguete() {
  const g = [], P = (geo, cor, z) => { geo.rotateX(-Math.PI / 2); geo.translate(0, 0, z); g.push([geo, cor]); };
  P(new THREE.CylinderGeometry(.085, .085, .5, 10), '#fbf6ea', 0); P(new THREE.ConeGeometry(.085, .26, 10), '#e0352b', -.38); P(new THREE.CylinderGeometry(.092, .092, .09, 10), '#e0352b', .08); P(new THREE.CylinderGeometry(.06, .085, .1, 10), '#4a525f', .29);
  for (let k = 0; k < 4; k++) { const b = new THREE.BoxGeometry(.2, .16, .02); b.rotateX(Math.PI / 2); b.translate(.13, 0, 0); b.rotateY(k * Math.PI / 2); P(b, '#e0352b', .2); }
  return g;
}
