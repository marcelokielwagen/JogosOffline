// Helicóptero de apoio: chega por trás, para no ar, solta caixas de paraquedas e, na Muralha, bombardeia a horda.
// Feito de peças simples no mesmo estilo de desenho do resto (cores lisas e contorno escuro). O nariz aponta para -z.
import * as THREE from 'three';
import { materialDesenho, contorno, Pecas, caixaRedonda } from './desenho.js';

const VERDE = '#5f8a3a', ESCURO = '#3d5a26', CINZA = '#3a3550', VIDRO = '#8fd0ee', AMARELO = '#ffc62e';

export function criarHeli(cena, ruido) {
  const lixo = [], g = new THREE.Group(), corpo = new THREE.Group(); g.add(corpo); g.visible = false; cena.add(g);
  const mat = materialDesenho({}, { ruido, borda: 1 }), mc = contorno({ esp: .035 }); lixo.push(mat, mc);
  const malha = (P, pai = corpo) => { const geo = P.pronta(), m = new THREE.Mesh(geo, mat), b = new THREE.Mesh(geo, mc); m.castShadow = true; m.add(b); pai.add(m); lixo.push(geo); return m; };
  // fuselagem, cabine de vidro, cauda, deriva e esquis
  const P = new Pecas()
    .por(new THREE.SphereGeometry(1, 20, 14), VERDE, { s: [1.1, 1.0, 1.85] })
    .por(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, 1.25), VIDRO, { y: .12, z: -.95, s: [.92, .82, 1.02], rx: -1.05 })
    .por(caixaRedonda(2.24, .2, 1.4, .08, 1), AMARELO, { y: -.1, z: .5 })
    .por(new THREE.CylinderGeometry(.2, .42, 4.2, 12).rotateX(Math.PI / 2), VERDE, { y: .32, z: 3.5 })
    .por(caixaRedonda(.14, 1.35, .95, .05, 1), ESCURO, { y: 1, z: 5.45, rx: -.25 })
    .por(caixaRedonda(1.5, .1, .55, .04, 1), ESCURO, { y: .4, z: 5.2 })
    .por(new THREE.CylinderGeometry(.16, .2, .55, 10), CINZA, { y: 1.12 })
    .por(caixaRedonda(1.1, .32, 1.5, .1, 1), ESCURO, { y: .95, z: .45 });
  for (const s of [-1, 1]) {
    P.por(caixaRedonda(.14, .14, 3.4, .06, 1), CINZA, { x: s * .95, y: -1.32, z: .1 }).por(caixaRedonda(.12, .7, .12, .04, 1), CINZA, { x: s * .82, y: -1.02, z: -.7, rz: s * .3 }).por(caixaRedonda(.12, .7, .12, .04, 1), CINZA, { x: s * .82, y: -1.02, z: .9, rz: s * .3 });
    P.por(new THREE.SphereGeometry(.2, 10, 8), '#fbf6ea', { x: s * 1.08, y: .05, z: .6, s: [.3, 1, 1] }); // estrela branca nas laterais
  }
  malha(P);
  // hélice grande (4 pás) e hélice da cauda
  const R = new Pecas().por(new THREE.CylinderGeometry(.24, .24, .14, 12), CINZA); for (const a of [0, Math.PI / 2]) R.por(caixaRedonda(9.2, .06, .34, .03, 1), '#2a2430', { ry: a });
  const rotor = malha(R); rotor.position.y = 1.42;
  const C = new Pecas().por(new THREE.CylinderGeometry(.1, .1, .12, 10).rotateZ(Math.PI / 2), CINZA); for (const a of [0, Math.PI / 2]) C.por(caixaRedonda(.06, 1.5, .18, .02, 1), '#2a2430', { rx: a });
  const cauda = malha(C); cauda.position.set(.2, 1.05, 5.6);
  // sombra redonda no chão
  const gS = new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), mS = new THREE.MeshBasicMaterial({ color: '#150c1c', transparent: true, opacity: .25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), sombra = new THREE.Mesh(gS, mS); sombra.renderOrder = 1; sombra.visible = false; cena.add(sombra); lixo.push(gS, mS);
  g.scale.setScalar(1.15);
  let giro = 0;
  return {
    atualizar(dt, S) {
      const h = S.heli, ver = !!h && h.estado !== 'fora'; g.visible = sombra.visible = ver; if (!ver) return;
      giro += dt * 34; rotor.rotation.y = giro; cauda.rotation.x = giro * 1.6;
      g.position.set(h.x, h.alt + Math.sin(S.tempo * 2.2) * .12, -h.d); corpo.rotation.set(-h.incl, 0, -h.vira);
      const k = Math.max(0, 1 - h.alt / 30); sombra.position.set(h.x, .04, -h.d); sombra.scale.setScalar(2.6 * (.6 + k * .4)); mS.opacity = .28 * k;
    },
    dispose() { for (const o of lixo) o.dispose(); g.removeFromParent(); sombra.removeFromParent(); },
  };
}
