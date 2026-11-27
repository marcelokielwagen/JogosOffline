// Balanceamento: robôs jogam os 22 níveis (joias/resgate guloso, arremesso mirando o mais baixo, pintura 2 à frente).   node todos.mjs [primeiro] [ultimo] [rodadas]
import { abrir, dorme } from '../nascente/nav.mjs';
const [a = 1, b = 22, rod = 1] = process.argv.slice(2).map(Number);
const p = await abrir({ w: 1280, h: 760, url: '/jogos/ticos-crown/index.html#manifest' }), av = p.av;
const melhor = `(()=>{const t=__tico;let best=null,bs=-1;for(const a of t.todas())for(const b of [t.celula(a.r,a.c+1),t.celula(a.r+1,a.c)]){if(!b||!a.gema||!b.gema||a.bloco||b.bloco||a.corrente||b.corrente)continue;if(a.gema.tipo!=='n')return [a.r,a.c,-1];if(b.gema.tipo!=='n')return [b.r,b.c,-1];[a.gema,b.gema]=[b.gema,a.gema];let sc=0;const vz=k=>[t.celula(k.r-1,k.c),t.celula(k.r+1,k.c),t.celula(k.r,k.c-1),t.celula(k.r,k.c+1)];const cor=(r,c)=>{const q=t.celula(r,c);return q&&q.gema&&q.gema.tipo==='n'?q.gema.cor:-1};const cria=k=>{const c=k.gema.cor;let h=1,v=1;for(let i=k.c-1;cor(k.r,i)===c;i--)h++;for(let i=k.c+1;cor(k.r,i)===c;i++)h++;for(let i=k.r-1;cor(i,k.c)===c;i--)v++;for(let i=k.r+1;cor(i,k.c)===c;i++)v++;return Math.max(h,v)+(h>=3&&v>=3?2:0)};const metaCor=new Set(t.T.metas.filter(m=>m.t==='cor'&&m.falta>0).map(m=>m.cor));for(const k of [a,b]){const m=cria(k);if(m>=3){sc+=m*(m>=4?3:1);if(metaCor.has(k.gema.cor))sc+=3;for(const q of vz(k))if(q&&(q.bloco||q.corrente))sc+=3;if(k.gelo)sc+=3;}}[a.gema,b.gema]=[b.gema,a.gema];if(sc>bs){bs=sc;best=[a.r,a.c,b.r,b.c];}}return best})()`;
await dorme(1500); await av('__tico.VEL.v=' + (process.env.VEL || 2.5));
const res = [];
for (let n = a; n <= b; n++) for (let r = 0; r < rod; r++) {
  await av(`localStorage.clear();__tico.S.nivel=22;__tico.S.vidas=5;__tico.abrirNivel(${n})`); await dorme(150); await av('__tico.comecarNivel()');
  for (let k = 0; k < 60 && !await av('__tico.T.ativo'); k++) await dorme(100);
  const modo = await av('__tico.T.modo'), ini = await av('__tico.T.jogadas'); let jog = 0;
  while (await av('__tico.T.ativo') && jog < 60) {
    for (let k = 0; k < 120 && await av('__tico.T.ocupado'); k++) await dorme(60);
    if (!await av('__tico.T.ativo')) break;
    if (modo === 'pin') await av('__tico.Pintura.jogar(__tico.Pintura.melhor())');
    else if (modo === 'arr') { const al = await av('__tico.Arremesso.alvos()'); if (!al.length) break; al.sort((x, y) => x[1] - y[1]); await av(`__tico.Arremesso.mirarEAtirar(${al[0][0]},${al[0][1] - .05},${al[0][2]})`); }
    else { const j = await av(melhor); if (!j) { await dorme(300); continue; } if (j[2] === -1) await av(`__tico.tocarEspecial(__tico.celula(${j[0]},${j[1]}))`); else await av(`__tico.tentarTroca(__tico.celula(${j[0]},${j[1]}),__tico.celula(${j[2]},${j[3]}))`); }
    jog++; await dorme(120);
  }
  for (let k = 0; k < 80 && await av('__tico.T.ocupado && __tico.T.ativo'); k++) await dorme(80);
  const venceu = await av('__tico.T.metas.every(m=>m.falta<=0)'), falta = await av('__tico.T.metas.reduce((s,m)=>s+Math.max(0,m.falta),0)');
  res.push({ n, modo, ini, jog, venceu, falta }); console.log(`nível ${String(n).padStart(2)} ${modo.padEnd(5)} limite ${String(ini).padStart(2)} usou ${String(jog).padStart(2)} -> ${venceu ? 'VENCEU (sobrou ' + (ini - jog) + ')' : 'perdeu (faltou ' + falta + ')'}`);
  await dorme(2500);
}
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
