// Fotos de um nível, do pânico (poucas jogadas) e da derrota.   node telas.mjs [nivel] [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const D='C:/Users/Minhoca/AppData/Local/Temp/claude/d5f1a2db697c38fe/6d825ba2-82fa-466c-b7f8-532189574c78/scratchpad/tico/';
const [n='6', cel] = process.argv.slice(2);
const p = await abrir({ w: cel?390:1280, h: cel?844:760, movel:!!cel, dpr:cel?2:1, url: '/jogos/ticos-crown/index.html#manifest' });
await dorme(2000); await p.av(`localStorage.clear();__tico.S.nivel=10;__tico.abrirNivel(${n})`); await dorme(500); await p.av('__tico.comecarNivel()'); await dorme(2500);
await p.foto(D+'n'+n+'.png');
await p.av('__tico.T.jogadas=3;__tico.Jogo.reagirJogada()'); await dorme(1800); await p.foto(D+'panico.png');
await p.av('__tico.T.jogadas=0;__tico.T.ocupado=true;__tico.Jogo.perder()'); await dorme(2200); await p.foto(D+'perdeu.png');
console.log('erros:', p.erros.join('\n')||'nenhum'); p.fim();
