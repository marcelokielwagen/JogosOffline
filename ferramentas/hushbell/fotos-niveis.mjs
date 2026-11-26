// Uma foto de cada nível (e da viagem entre eles).   node fotos-niveis.mjs pasta [celular]
import { abrir, dorme } from '../nascente/nav.mjs';
const [d, cel] = process.argv.slice(2), movel = !!cel, p = await abrir({ w: movel ? 390 : 1280, h: movel ? 844 : 760, movel, url: '/jogos/hushbell/index.html#manifest' });
await dorme(2500);
for (let i = 0; i < 5; i++) { await p.av(`__hushbell.irPara(${i})`); await dorme(1700); if (!i) await p.foto(`${d}/viagem.png`); for (let k = 0; k < 40 && await p.av('!!__hushbell.viagem'); k++) await dorme(150); await dorme(900); await p.foto(`${d}/${movel ? 'c' : ''}nivel${i + 1}.png`); }
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
