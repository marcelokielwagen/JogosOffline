// Teste da dica (lâmpada + mãozinha + oferta do rei) e da migração do progresso salvo.   node dica.mjs pasta [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, cel] = process.argv.slice(2), movel = !!cel;
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/ticos-crown/index.html#manifest' });
const av = p.av, F = x => `${d}/${movel ? 'c' : ''}d-${x}.png`;
await dorme(1200);
// progresso antigo (v2, 22 níveis): estava no nível 8 (pintura), com estrelas de 1 a 7 e no 9
await p.cmd('Page.navigate', { url: p.base + '/css/base.css' }); await dorme(800);
await av(`localStorage.setItem('tico:v1',JSON.stringify({v:2,nivel:8,estrelas:{1:3,2:2,3:1,4:2,5:3,6:1,7:2,9:3,14:2},moedas:1040,vidas:4,vidaT:0,baus:{5:true},reforcos:{martelo:1,flecha:0,canhao:0}}))`);
await p.cmd('Page.navigate', { url: p.base + '/jogos/ticos-crown/index.html' });
await dorme(3500); console.log('progresso migrado:', await av('JSON.stringify({v:__tico.S.v,nivel:__tico.S.nivel,estrelas:__tico.S.estrelas})'));
await p.foto(F('1-mapa'));
await av('__tico.abrirNivel(1)'); await dorme(400); await av('__tico.comecarNivel()'); await dorme(2300);
await dorme(8000); await p.foto(F('2-oferta')); console.log('oferta:', await av(`document.querySelector('#reforcos button[data-r=dica]').className`), '|', await av(`document.querySelector('#balao').textContent`));
const [x, y] = await av(`(()=>{const r=document.querySelector('#reforcos button[data-r=dica]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
if (movel) await p.toque(x, y); else await p.clique(x, y); await dorme(900); await p.foto(F('3-mao'));
console.log('dicas restantes:', await av('__tico.T.dicas'), 'mão visível:', await av('!document.querySelector("#maoDica").hidden'));
const j = await av('(()=>{const j=__tico.melhorJogada();return j.a?[j.a.r,j.a.c,j.b.r,j.b.c]:null})()'); if (j) await av(`__tico.tentarTroca(__tico.celula(${j[0]},${j[1]}),__tico.celula(${j[2]},${j[3]}))`);
await dorme(300); console.log('mão some ao jogar:', await av('document.querySelector("#maoDica").hidden'));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
