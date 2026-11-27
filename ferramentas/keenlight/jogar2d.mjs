// Joga os níveis 2D (praia e galeria) com cliques de verdade: node jogar2d.mjs pasta [movel]
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2] || '.', movel = process.argv[3] === 'movel';
const p = movel ? await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/jogos/keenlight/index.html#manifest' }) : await abrir({ w: 1280, h: 760, url: '/jogos/keenlight/index.html#manifest' });
await dorme(3500); await p.av('localStorage.clear();__keenlight.ficha.abertos=[1,2,3,4,5]');
const clicar = (x, y) => movel ? p.toque(x, y) : p.clique(x, y), K = '__keenlight';
for (const n of (process.env.NIVEIS || "1,2").split(",").map(Number)) {
  const t0 = Date.now(); await p.av(`${K}.jogarNivel(${n})`);
  for (let i = 0; i < 80 && !(await p.av(`${K}.J.estado==='jogando'&&${K}.J.n===${n}`)); i++) await dorme(250);
  console.log(`nível ${n + 1} pronto em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await dorme(1500); await p.foto(`${d}/n${n + 1}-visao.png`);
  console.log(await p.av(`new Promise(r=>{let k=0,t=performance.now();const f=()=>{if(++k<40)requestAnimationFrame(f);else r(Math.round(40000/(performance.now()-t))+' quadros/s')};f()})`));
  const ids = await p.av(`${K}.itens.map(i=>i.id)`); let ok = 0;
  for (const id of ids) {
    await p.av(`(()=>{const v=${K}.vista,it=${K}.itens.find(i=>i.id==='${id}');v.focar(it.x,it.y,${movel ? 1.1 : 1.2})})()`); await dorme(1300);
    if (ids.indexOf(id) < 2) await p.foto(`${d}/n${n + 1}-perto-${id}.png`);
    const [x, y] = await p.av(`${K}.ondeEsta('${id}')`); await clicar(x, y); await dorme(250);
    const a = await p.av(`${K}.itens.find(i=>i.id==='${id}').achado`); if (a) ok++; else { console.log('  NAO ACHOU', id, x | 0, y | 0); await p.foto(`${d}/n${n + 1}-falhou-${id}.png`); }
  }
  console.log(`  achados ${ok}/${ids.length}`);
  await dorme(2600); console.log('  fim aberto:', await p.av(`!document.getElementById('fim').hidden`)); await p.foto(`${d}/n${n + 1}-fim.png`);
  await p.av(`document.getElementById('fim').hidden=true`);
}
await p.av(`document.getElementById('bInicio').click()`); await dorme(1500); await p.foto(`${d}/abertura.png`);
console.log('salvo:', await p.av(`localStorage.getItem('keenlight.v1')`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
