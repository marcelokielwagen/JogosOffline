// Procura o teto piscando (superfícies coladas): câmera embaixo da mesa olhando para cima, nos dois níveis 3D.
// node teto.mjs pasta [antes|depois]
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2] || '.', tag = process.argv[3] || 'x', K = '__keenlight';
const p = await abrir({ w: 1280, h: 760, url: '/jogos/keenlight/index.html#manifest' }); await dorme(4000);
await p.av(`localStorage.clear();${K}.ficha.abertos=[1,2,3,4,5]`);
const vistas = { 0: [[-.3, .1, .45], [-.3, .3, .5], [-3.0, .2, .4], [2.0, .4, 1.0]], 4: [[-.2, .15, .5], [-.2, .3, .6], [-3.0, .3, .2], [1.6, .3, 1.2]] };
for (const n of [0, 4]) {
  await p.av(`${K}.jogarNivel(${n})`); await dorme(3500);
  for (const [i, [x, y, z]] of vistas[n].entries()) {
    for (const [az, el] of [[0, -.45], [.6, -.35], [-.6, -.5]]) {
      await p.av(`(()=>{const v=${K}.vista;v.A.alvo.set(${x},${y},${z});v.A.az=${az};v.A.el=${el};v.A.dist=.35})()`); await dorme(1300);
      await p.foto(`${d}/${tag}-n${n + 1}-${i}-${az}.png`);
    }
  }
  await p.av(`document.getElementById('bMenu').click()`); await dorme(600);
}
console.log('erros:', [...new Set(p.erros)].join(' | ') || 'nenhum'); p.fim();
