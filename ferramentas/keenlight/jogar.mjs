// Joga o Nível 1 inteiro com cliques de verdade: node jogar.mjs pasta [movel]
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2] || '.', movel = process.argv[3] === 'movel';
const p = movel ? await abrir({ w: 390, h: 844, movel: true, dpr: 2, url: '/jogos/keenlight/index.html#manifest' }) : await abrir({ w: 1280, h: 760, url: '/jogos/keenlight/index.html#manifest' });
await dorme(3500); await p.av(`localStorage.clear();document.getElementById('bJogar').click()`); await dorme(1500);
const K = '__keenlight', clicar = (x, y) => movel ? p.toque(x, y) : p.clique(x, y);
// 1) gaveta da esquerda aberta com clique na frente dela
await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='chave');const g=it.dentro[0].raiz;${K}.vista.focar(g.getWorldPosition(new ${K}.THREE.Vector3()),1.6);return 0})()`);
await dorme(1800);
const pos = await p.av(`(()=>{const g=${K}.itens.find(i=>i.id==='chave').dentro[0].raiz,v=g.getWorldPosition(new ${K}.THREE.Vector3());v.z+=.015;v.project(${K}.camera);return[(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]})()`);
await clicar(...pos); await dorme(900);
console.log('gaveta abriu com clique:', await p.av(`${K}.itens.find(i=>i.id==='chave').dentro[0].aberto`));
await p.foto(d + '/gaveta.png');
// 2) acha cada item: abre o que precisar, mira a câmera e clica onde ele aparece
const ids = await p.av(`${K}.itens.map(i=>i.id)`);
const vistas = { dado: [.0, .02, .9], chave: [0, .75, .9], moeda: [-.3, .85, .9], ferradura: [0, .15, 1], relogio: [-.1, .05, 1], concha: [.6, .2, 1], oculos: [-.2, .6, 1], tesoura: [-.35, .35, .9], borboleta: [.4, .1, 1], peao: [.3, .3, 1], anel: [-.3, .7, .9], pena: [0, .2, 1] };
for (const id of ids) {
  const [az, el, dist] = vistas[id] || [0, .3, 1];
  await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='${id}');(it.dentro||[]).forEach(x=>x.aberto=true)})()`); await dorme(700);
  await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='${id}');const c=new ${K}.THREE.Box3().setFromObject(it.obj).getCenter(new ${K}.THREE.Vector3());${K}.vista.A.az=${az};${K}.vista.A.el=${el};${K}.vista.focar(c,${dist});${K}.vista.A.dist=${dist}})()`);
  await dorme(2200);
  const [x, y] = await p.av(`${K}.ondeEsta('${id}')`);
  await clicar(x, y); await dorme(300);
  const ok = await p.av(`${K}.itens.find(i=>i.id==='${id}').achado`);
  if (!ok) { await p.foto(d + `/falhou-${id}.png`); }
  console.log(id.padEnd(10), ok ? 'achado' : 'NAO ACHOU', `(${x | 0}, ${y | 0})`);
  if (id === 'relogio') { await dorme(250); await p.foto(d + '/brilho.png'); }
  if (ids.indexOf(id) === 5) {
    // 3) anti-chute: 4 cliques no teto
    await p.av(`${K}.vista.centro()`); await dorme(1500);
    for (let i = 0; i < 4; i++) { await clicar((movel ? 60 : 300) + i * (movel ? 80 : 200), movel ? 230 : 80); await dorme(150); }
    await dorme(400); console.log('lupa embaçou:', await p.av(`${K}.J.embacadas`) === 1); await p.foto(d + '/embacado.png'); await dorme(3800);
    // 4) dica
    await p.av(`${K}.J.carga=1;document.getElementById('bLupa').click()`); await dorme(1500);
    console.log('dica usada:', await p.av(`${K}.J.dicas`) === 1); await p.foto(d + '/dica.png');
  }
}
await dorme(3000); await p.foto(d + '/fim.png');
console.log('fim aberto:', await p.av(`!document.getElementById('fim').hidden`), await p.av(`document.getElementById('resumo').innerText.split(String.fromCharCode(10)).join(' ')`));
console.log('salvo:', await p.av(`localStorage.getItem('keenlight.v1')`));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
