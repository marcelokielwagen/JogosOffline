// Joga um nível 3D tentando alguns ângulos para cada objeto: node jogar3d.mjs pasta nivel [movel]
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2] || '.', n = +(process.argv[3] || 4), movel = process.argv[4] === 'movel', K = '__keenlight';
const p = movel ? await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/jogos/keenlight/index.html#manifest' }) : await abrir({ w: 1280, h: 760, url: '/jogos/keenlight/index.html#manifest' });
await dorme(3500); await p.av(`localStorage.clear();${K}.ficha.abertos=[1,2,3,4,5];${K}.jogarNivel(${n})`); await dorme(3000);
await p.foto(`${d}/n${n + 1}-visao.png`);
console.log(await p.av(`new Promise(r=>{let k=0,t=performance.now();const f=()=>{if(++k<40)requestAnimationFrame(f);else r(Math.round(40000/(performance.now()-t))+' quadros/s, '+${K}.R.info.render.calls+' desenhos')};f()})`));
const clicar = (x, y) => movel ? p.toque(x, y) : p.clique(x, y);
const ids = await p.av(`${K}.itens.map(i=>i.id)`); let ok = 0;
const vistas = [[0, .25, 1], [.5, .2, 1], [-.5, .2, 1], [0, .7, .9], [0, -.1, 1.4], [.75, .2, 1.3], [-.7, .5, 1.3]];
for (const id of ids) {
  await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='${id}');(it.dentro||[]).forEach(x=>x.aberto=true)})()`); await dorme(700);
  let achou = false;
  for (const [az, el, dist] of vistas) {
    await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='${id}'),v=${K}.vista;const c=new ${K}.THREE.Box3().setFromObject(it.obj).getCenter(new ${K}.THREE.Vector3());v.A.az=${az};v.A.el=${el};v.A.alvo.copy(c);v.A.dist=${dist}})()`); await dorme(1600);
    const [x, y] = await p.av(`${K}.ondeEsta('${id}')`); if (x < 0 || y < 60 || x > (movel ? 390 : 1280) || y > (movel ? 700 : 660)) continue;
    await clicar(x, y); await dorme(250);
    if (await p.av(`${K}.itens.find(i=>i.id==='${id}').achado`)) { achou = true; console.log(id.padEnd(12), 'achado', `(vista ${az},${el})`); break; }
  }
  if (achou) ok++; else { console.log(id.padEnd(12), 'NAO ACHOU'); await p.foto(`${d}/n${n + 1}-falhou-${id}.png`); }
  if (id === 'chave') await p.foto(`${d}/n${n + 1}-nicho.png`);
}
console.log(`achados ${ok}/${ids.length}`); await dorme(2600);
console.log('fim aberto:', await p.av(`!document.getElementById('fim').hidden`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
