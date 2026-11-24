// Modelos das armas (genéricas, sem marca), feitos por código e presos ao osso "arma" do soldado.
// Sistema da arma: +z = cano, y = para cima, origem na empunhadura.
import * as THREE from 'three';

const METAL = 5, POLIMERO = 3, MADEIRA = 10, LENTE = 7;

// junta várias peças numa geometria só, no formato dos personagens (aB = ossos + material, aW = pesos + sombra)
class Pecas {
  constructor() { this.p = []; this.n = []; this.m = []; this.i = []; }
  juntar(g, mat) {
    const b = this.p.length / 3, p = g.attributes.position, n = g.attributes.normal;
    for (let k = 0; k < p.count; k++) { this.p.push(p.getX(k), p.getY(k), p.getZ(k)); this.n.push(n.getX(k), n.getY(k), n.getZ(k)); this.m.push(mat); }
    if (g.index) for (const x of g.index.array) this.i.push(b + x); else for (let k = 0; k < p.count; k++) this.i.push(b + k);
    g.dispose(); return this;
  }
  // bloco com perfil lateral (z,y) e largura em x, com quinas chanfradas
  perfil(pts, larg, mat, ch = .004) {
    const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, larg - ch * 2), bevelEnabled: true, bevelThickness: ch, bevelSize: ch, bevelSegments: 1, curveSegments: 4 });
    g.translate(0, 0, -(larg - ch * 2) / 2); g.rotateY(-Math.PI / 2); // forma (z,y) -> mundo
    return this.juntar(g, mat);
  }
  cano(z0, z1, r, y, mat, r2 = r, lados = 10, x = 0) { const g = new THREE.CylinderGeometry(r2, r, z1 - z0, lados); g.rotateX(Math.PI / 2); g.translate(x, y, (z0 + z1) / 2); return this.juntar(g, mat); }
  caixa(x, y, z, w, h, d, mat) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return this.juntar(g, mat); }
  pronta() {
    const g = new THREE.BufferGeometry(), nv = this.p.length / 3, aB = new Uint8Array(nv * 4), aW = new Uint8Array(nv * 4);
    for (let k = 0; k < nv; k++) { aB.set([16, 16, 16, this.m[k]], k * 4); aW.set([255, 0, 0, 235], k * 4); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(aB, 4)); g.setAttribute('aW', new THREE.BufferAttribute(aW, 4, true)); g.setIndex(this.i);
    return g;
  }
}

export function pistola() {
  return new Pecas()
    .perfil([[-.06, .012], [.135, .012], [.135, .042], [.128, .048], [-.06, .048]], .03, METAL)
    .perfil([[-.05, -.012], [.12, -.004], [.12, .01], [-.06, .01]], .027, POLIMERO)
    .perfil([[-.062, 0], [-.012, 0], [-.03, -.1], [-.085, -.1]], .032, POLIMERO)
    .perfil([[.0, -.03], [.045, -.03], [.05, -.005], [.04, -.022], [.004, -.022], [0, -.005]], .01, POLIMERO, .001)
    .cano(.135, .15, .008, .03, METAL).caixa(0, .052, .115, .004, .008, .01, METAL).caixa(0, .052, -.05, .016, .008, .008, METAL)
    .pronta();
}
export function submetralhadora() {
  return new Pecas()
    .perfil([[-.12, -.005], [.2, -.005], [.2, .062], [.18, .07], [-.11, .07], [-.12, .06]], .042, METAL)
    .perfil([[.06, -.02], [.25, -.015], [.25, .045], [.06, .04]], .05, POLIMERO)
    .perfil([[-.05, -.005], [0, -.005], [-.025, -.115], [-.075, -.115]], .034, POLIMERO)
    .perfil([[.045, -.015], [.085, -.015], [.105, -.2], [.066, -.205]], .03, METAL)
    .perfil([[-.32, -.06], [-.3, -.06], [-.28, .0], [-.12, .03], [-.12, .05], [-.32, .055]], .028, POLIMERO)
    .cano(.25, .37, .016, .03, METAL, .016).cano(.37, .385, .011, .03, METAL)
    .caixa(0, .08, .02, .03, .012, .22, METAL).perfil([[-.02, .085], [.05, .085], [.045, .125], [-.015, .125]], .034, POLIMERO).caixa(0, .107, .052, .022, .024, .003, LENTE)
    .pronta();
}
export function fuzil() {
  const p = new Pecas()
    .perfil([[-.13, -.005], [.16, -.005], [.16, .07], [-.11, .075], [-.13, .06]], .044, METAL)
    .perfil([[.16, .004], [.42, .01], [.42, .064], [.16, .072]], .05, POLIMERO)
    .perfil([[-.055, -.005], [-.005, -.005], [-.03, -.11], [-.08, -.11]], .034, POLIMERO)
    .perfil([[.04, -.012], [.1, -.012], [.112, -.09], [.135, -.17], [.08, -.185], [.055, -.1]], .028, METAL)
    .perfil([[-.36, -.085], [-.335, -.085], [-.3, -.015], [-.13, .0], [-.13, .055], [-.36, .06]], .034, POLIMERO)
    .cano(.42, .6, .0105, .042, METAL).cano(.6, .66, .016, .042, METAL).cano(.18, .4, .008, .078, METAL)
    .caixa(0, .084, .06, .022, .012, .34, METAL)
    .cano(-.06, .13, .019, .118, POLIMERO).cano(.11, .16, .019, .118, POLIMERO, .027).cano(.158, .161, .024, .118, LENTE).cano(-.1, -.06, .025, .118, POLIMERO, .02)
    .caixa(0, .096, -.02, .016, .018, .022, METAL).caixa(0, .096, .08, .016, .018, .022, METAL)
    .perfil([[.3, -.07], [.33, -.07], [.335, .0], [.29, .0]], .026, POLIMERO).caixa(0, .1, .41, .006, .03, .012, METAL);
  for (let k = 0; k < 5; k++) for (const s of [-1, 1]) p.caixa(s * .026, .038, .19 + k * .046, .004, .016, .026, METAL);
  return p.pronta();
}
// ponta do cano (z, y) no sistema da arma, para o brilho e os projéteis
export const BOCA = { pistola: [.16, .03], curta: [.39, .03], longa: [.67, .042] };
