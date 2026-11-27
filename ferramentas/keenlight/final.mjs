// Consolidação: abre do disco sem servidor, confere que nada vem da internet, som de cada cenário,
// duplo toque, inércia e liberação de memória.   node final.mjs pasta
import { abrir, dorme } from '../nascente/nav.mjs';
import { readFileSync } from 'node:fs';
const d = process.argv[2] || '.', K = '__keenlight';
const html = readFileSync('C:/Users/Minhoca/Projetos/JogosOffline/jogos/keenlight/index.html', 'utf8');
const externos = [...html.matchAll(/(?:src|href)\s*=\s*["'](https?:)?\/\/[^"']+/g)].map(m => m[0]);
console.log('tamanho:', (html.length / 1024).toFixed(0) + ' KB', '| links externos:', externos.length ? externos.join(' ') : 'nenhum', '| scripts de fora:', (html.match(/<script[^>]+src=/g) || []).join(' '));
// 1) aberto direto do disco (dois cliques)
let p = await abrir({ w: 1280, h: 760, url: '/jogos/keenlight/index.html#manifest' });
const pedidos = []; await p.cmd('Network.enable'); 
await p.cmd('Page.navigate', { url: 'file:///C:/Users/Minhoca/Projetos/JogosOffline/jogos/keenlight/index.html' }); await dorme(5000);
console.log('abriu do disco:', await p.av(`!!window.${K} && document.querySelectorAll('.caso').length === 6`));
// 2) som: cada cenário toca alguns segundos sem erro, inclusive a tensão do fim
await p.av(`localStorage.clear(); ${K}.ficha.abertos=[1,2,3,4,5]`); await p.clique(...await p.av(`(()=>{const r=document.getElementById('bJogar').getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]})()`)); await dorme(2500);
for (const n of ['quarto', 'praia', 'galeria', 'noir', 'biblioteca', 'cozinha']) { await p.av(`${K}.Som.ambiente('${n}'); ${K}.Som.progresso(11, 12)`); await dorme(2600); console.log('  som', n.padEnd(10), JSON.stringify(await p.av(`${K}.Som.estado`))); }
await p.av(`${K}.Som.ambiente('quarto'); ${K}.Som.progresso(0, 12)`);
// 3) duplo toque e inércia na praia; memória ao trocar de cenário
await p.av(`${K}.jogarNivel(1)`); for (let i = 0; i < 40 && !(await p.av(`${K}.J.n===1&&${K}.J.estado==='jogando'`)); i++) await dorme(250); await dorme(1500);
const z0 = await p.av(`${K}.vista.A.z`); await p.clique(640, 300); await dorme(120); await p.clique(645, 302); await dorme(700);
console.log('duplo clique aproxima:', (await p.av(`${K}.vista.A.z`)) > z0 * 1.5, '| contou erro:', await p.av(`${K}.J.erros.length`));
await p.clique(300, 500); await dorme(450); console.log('clique à toa conta erro depois de 0,28 s:', await p.av(`${K}.J.erros.length`) === 1);
await p.av(`${K}.vista.focar(1800,1500,1.1)`); await dorme(1200);
const ox0 = await p.av(`${K}.vista.A.ox`);
await p.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: 700, y: 400, button: 'left', clickCount: 1 });
for (let i = 1; i <= 6; i++) { await p.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700 - i * 40, y: 400, button: 'left', buttons: 1 }); await dorme(16); }
await p.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 460, y: 400, button: 'left', clickCount: 1 });
const ox1 = await p.av(`${K}.vista.A.ox`); await dorme(500); const ox2 = await p.av(`${K}.vista.A.ox`);
console.log('arrasto com inércia (continua andando depois de soltar):', ox2 < ox1 - 5, `(${Math.round(ox0)} → ${Math.round(ox1)} → ${Math.round(ox2)})`);
await p.av(`${K}.jogarNivel(2)`); await dorme(3500);
console.log('cenários guardados na memória:', await p.av(`Object.keys(${K}.criados).join(',')`), '(a praia foi liberada)');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
