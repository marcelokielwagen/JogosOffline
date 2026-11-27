// Testa mapa, salvamento automático, retomada, desbloqueio e conquistas: node progresso.mjs pasta
import { abrir, dorme } from '../nascente/nav.mjs';
const d = process.argv[2] || '.', K = '__keenlight', url = '/jogos/keenlight/index.html#manifest';
let p = await abrir({ w: 1280, h: 760, url }); await dorme(3500);
await p.av('localStorage.clear()'); await p.recarregar(); await dorme(4500);
await p.foto(d + '/mapa-novo.png');
console.log('trancados no começo:', await p.av(`document.querySelectorAll('.caso.trancado').length`));
const vistas = { dado: [.0, .02, .9], chave: [0, .75, .9], moeda: [-.3, .85, .9], ferradura: [0, .15, 1], relogio: [-.1, .05, 1], concha: [.6, .2, 1], oculos: [-.2, .6, 1], tesoura: [-.35, .35, .9], borboleta: [.4, .1, 1], peao: [.3, .3, 1], anel: [-.3, .7, .9], pena: [0, .2, 1] };
async function achar(id) {
  await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='${id}');(it.dentro||[]).forEach(x=>x.aberto=true)})()`); await dorme(700);
  const [az, el, dist] = vistas[id];
  await p.av(`(()=>{const it=${K}.itens.find(i=>i.id==='${id}'),v=${K}.vista;const c=new ${K}.THREE.Box3().setFromObject(it.obj).getCenter(new ${K}.THREE.Vector3());v.A.az=${az};v.A.el=${el};v.A.alvo.copy(c);v.A.dist=${dist}})()`); await dorme(2000);
  const [x, y] = await p.av(`${K}.ondeEsta('${id}')`); await p.clique(x, y); await dorme(300);
  return p.av(`${K}.itens.find(i=>i.id==='${id}').achado`);
}
await p.clique(...await p.av(`(()=>{const r=document.querySelector('.caso').getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]})()`)); await dorme(2500);
for (const id of ['relogio', 'oculos', 'peao']) console.log('  achou', id, await achar(id));
await dorme(500); console.log('salvo antes de fechar:', await p.av(`JSON.parse(localStorage.getItem('keenlight.v1')).jogo.achados.join(',')`));
// fecha e abre de novo
await p.recarregar(); await dorme(4500); await p.foto(d + '/mapa-andamento.png');
console.log('cartão diz:', await p.av(`document.querySelector('.caso em').textContent`), '| botão:', await p.av(`document.getElementById('bJogar').textContent`));
await p.av(`document.getElementById('bJogar').click()`); await dorme(2500);
console.log('retomado com achados:', await p.av(`${K}.itens.filter(i=>i.achado).map(i=>i.id).join(',')`), '| relógio escondido:', await p.av(`!${K}.itens.find(i=>i.id==='relogio').obj.visible`));
for (const id of Object.keys(vistas)) if (!(await p.av(`${K}.itens.find(i=>i.id==='${id}').achado`))) { const ok = await achar(id); if (!ok) console.log('  NAO ACHOU', id); }
await dorme(1200); await p.foto(d + '/trofeu.png'); await dorme(2500); await p.foto(d + '/fim.png');
console.log('fim:', await p.av(`document.getElementById('novasConq').innerText.split(String.fromCharCode(10)).join(' | ')`));
await p.av(`document.getElementById('bInicio').click()`); await dorme(2000); await p.foto(d + '/mapa-depois.png');
console.log('trancados depois:', await p.av(`document.querySelectorAll('.caso.trancado').length`), '| resolvidos:', await p.av(`document.querySelectorAll('.caso.resolvido').length`), '| patente:', await p.av(`document.getElementById('patente').textContent`));
await p.av(`document.getElementById('bConquistas').click()`); await dorme(800); await p.foto(d + '/conquistas.png');
await p.av(`document.querySelector('#conquistas .fechar').click()`);
await p.vp(390, 844, true, 2); await p.av('dispatchEvent(new Event("resize"))'); await dorme(1200); await p.foto(d + '/mapa-cel.png');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
