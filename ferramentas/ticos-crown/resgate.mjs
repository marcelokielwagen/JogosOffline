// Teste do modo Resgate (entulho): abre o nível, joga sozinho, mostra a pilha descendo, o perigo, a vitória e a derrota.   node resgate.mjs pasta nivel [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, n = '4', cel] = process.argv.slice(2), movel = !!cel;
const p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, dpr: movel ? 2 : 1, url: '/jogos/ticos-crown/index.html#manifest' });
const av = p.av, F = x => `${d}/${movel ? 'c' : ''}r${n}-${x}.png`, livre = async () => { for (let k = 0; k < 80 && await av('__tico.T.ocupado'); k++) await dorme(100); };
await dorme(1500); await av(`localStorage.clear();__tico.S.nivel=14;__tico.abrirNivel(${n})`); await dorme(700); await p.foto(F('1-objetivo'));
await av('__tico.comecarNivel()'); await dorme(2600); await p.foto(F('2-inicio'));
// joga preferindo trocas perto do entulho
const melhor = `(()=>{const t=__tico,T=t.T;let best=null,bs=-1;for(const a of t.todas())for(const b of [t.celula(a.r,a.c+1),t.celula(a.r+1,a.c)]){if(!b||!a.gema||!b.gema||a.bloco||b.bloco||a.corrente||b.corrente)continue;if(a.gema.tipo!=='n'||b.gema.tipo!=='n')return [a.r,a.c,b.r,b.c];[a.gema,b.gema]=[b.gema,a.gema];let sc=0;const vz=k=>[t.celula(k.r-1,k.c),t.celula(k.r+1,k.c),t.celula(k.r,k.c-1),t.celula(k.r,k.c+1)];const cria=(k)=>{const c=k.gema.cor;let h=1,v=1;for(let i=k.c-1;t.celula(k.r,i)?.gema?.cor===c&&t.celula(k.r,i).gema.tipo==='n';i--)h++;for(let i=k.c+1;t.celula(k.r,i)?.gema?.cor===c&&t.celula(k.r,i).gema.tipo==='n';i++)h++;for(let i=k.r-1;t.celula(i,k.c)?.gema?.cor===c&&t.celula(i,k.c).gema.tipo==='n';i--)v++;for(let i=k.r+1;t.celula(i,k.c)?.gema?.cor===c&&t.celula(i,k.c).gema.tipo==='n';i++)v++;return Math.max(h,v)};for(const k of [a,b]){const m=cria(k);if(m>=3){sc+=m;for(const q of vz(k))if(q&&q.bloco)sc+=3;}}[a.gema,b.gema]=[b.gema,a.gema];if(sc>bs){bs=sc;best=[a.r,a.c,b.r,b.c];}}return bs>0?best:null})()`;
let jog = 0;
while (await av('__tico.T.ativo') && jog < 40) {
  const j = await av(melhor); if (!j) break;
  const esp = await av(`__tico.celula(${j[0]},${j[1]}).gema.tipo!=='n'`);
  if (esp) await av(`__tico.tocarEspecial(__tico.celula(${j[0]},${j[1]}))`); else await av(`__tico.tentarTroca(__tico.celula(${j[0]},${j[1]}),__tico.celula(${j[2]},${j[3]}))`);
  await livre(); jog++; if (jog === 4) await p.foto(F('3-jogando'));
  if (jog === 9) await p.foto(F('4-meio'));
}
const r = await av('JSON.stringify({jogadas:__tico.T.jogadas,entulho:__tico.T.metas[0].falta,total:__tico.Resgate.total,ativo:__tico.T.ativo})');
console.log('robô jogou', jog, 'vezes:', r); await dorme(3000); await p.foto(F('5-fim'));
// derrota forçada
await av(`__tico.abrirNivel(${n})`); await dorme(400); await av('__tico.comecarNivel()'); await dorme(2200);
await av('__tico.T.jogadas=0;__tico.T.ocupado=true;__tico.Resgate.jogada();__tico.Jogo.perder()'); await dorme(2600); await p.foto(F('6-derrota'));
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
