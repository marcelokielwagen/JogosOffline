// Mede a música: entra com um clique, troca de tema por modo e amostra o volume (RMS) e os passos do sequenciador.   node musica.mjs
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ url: '/jogos/ticos-crown/index.html#manifest' }), av = p.av;
await dorme(1500); const [bx, by] = await av(`(()=>{const r=document.getElementById('bJogar').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
await p.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 300, button: 'left', clickCount: 1 }); await p.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 300, button: 'left', clickCount: 1 });
await av('__tico.irInicio()'); await dorme(1500);
const mede = async n => { let m = 0; for (let i = 0; i < 6; i++) { await dorme(250); m = Math.max(m, await av('__tico.Som.medir()')); } console.log(n.padEnd(10), 'tema', await av('__tico.Som.tema'), 'passos', await av('__tico.Som.passos'), 'volume', m.toFixed(3)); };
await mede('mapa');
for (const [n, nome] of [[1, 'joias'], [4, 'resgate'], [6, 'arremesso'], [8, 'pintura']]) { await av(`localStorage.clear();__tico.S.nivel=22;__tico.abrirNivel(${n})`); await dorme(300); await av('__tico.comecarNivel()'); await dorme(1500); await mede(nome); }
console.log('estado do áudio:', await av('(window.__tico&&1)?"ok":"?"'));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
