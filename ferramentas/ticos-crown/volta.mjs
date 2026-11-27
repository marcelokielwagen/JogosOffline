// Confere as trocas de modo: resgate -> joias e arremesso -> joias -> menu, sem erros e com o rei no lugar.   node volta.mjs pasta
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 1280, h: 760, url: '/jogos/ticos-crown/index.html#manifest' }), d = process.argv[2];
const vai = async n => { await p.av(`__tico.abrirNivel(${n})`); await dorme(400); await p.av('__tico.comecarNivel()'); await dorme(2200); };
await dorme(1500); await p.av('localStorage.clear();__tico.S.nivel=22'); await vai(4); await vai(6); await vai(8); await vai(7); await p.foto(d + '/volta-joias.png');
const j = await p.av('(()=>{const j=__tico.existeJogada();return j&&j.a?[j.a.r,j.a.c,j.b.r,j.b.c]:null})()'); await p.av(`__tico.tentarTroca(__tico.celula(${j[0]},${j[1]}),__tico.celula(${j[2]},${j[3]}))`); await dorme(2000);
console.log('jogadas no nível 7 depois de 1 troca:', await p.av('__tico.T.jogadas'), 'modo', await p.av('__tico.T.modo'));
await p.av('__tico.irInicio()'); await dorme(1500); await p.foto(d + '/volta-inicio.png');
console.log('erros:', p.erros.join('\n') || 'nenhum'); p.fim();
