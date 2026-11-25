// Regras do iPhone simuladas: só libera ao soltar o dedo, interrupção por ligação, áudio travado, segundo plano, abrir no mudo.
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 390, h: 844, movel: true, url: '/ferramentas/zen/ouvir.html#manifest' }), est = () => p.av('Zen.Audio.estado'), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x), toque = () => p.toque(195, 60);
// precisa entrar antes do audio.js, senão o jogo recebe o gesto antes do simulador
await p.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `window.__g=0;for(const e of ['touchend','click','keydown'])addEventListener(e,()=>{__g=1;setTimeout(()=>__g=0)},{capture:true})` });
await p.cmd('Page.reload'); await dorme(1200);
await p.av(`(()=>{Zen.Audio.ajustar({mudo:true});
 const AC=window.AudioContext;window.__n=0;window.__trava=false;window.AudioContext=class extends AC{constructor(){super();__n++;super.suspend()}
  get state(){return __trava&&__n===1?'running':this.inter?'interrupted':super.state} get currentTime(){return __trava&&__n===1?9:super.currentTime}
  resume(){if(!__g)return new Promise(()=>{});this.inter=false;return super.resume()}};})()`);
await toque(); await dorme(400); ok('no mudo, nem cria o áudio', await est() === 'parado');
await p.av('Zen.Audio.ajustar({mudo:false})'); await toque(); await dorme(600); ok('toca no primeiro toque', await est() === 'running', await est());
await p.av('Zen.Audio.contexto.inter=true'); await toque(); await dorme(400); ok('volta depois de uma ligação', await est() === 'running');
await p.av('__trava=true'); await toque(); await dorme(2700); await toque(); await dorme(600); ok('áudio travado é refeito', await p.av('__n') === 2 && await est() === 'running');
await dorme(3500); for (let i = 0; i < 3; i++) { await toque(); await dorme(250); } ok('não refaz sem precisar', await p.av('__n') === 2);
await p.av(`Object.defineProperty(document,'hidden',{get:()=>window.__h,configurable:true});__h=true;document.dispatchEvent(new Event('visibilitychange'))`); await dorme(400); ok('cala em segundo plano', await est() === 'suspended');
await p.av(`__h=false;document.dispatchEvent(new Event('visibilitychange'))`); await toque(); await dorme(400); ok('volta do segundo plano', await est() === 'running');
ok('sem erros', !p.erros.length, p.erros[0] || ''); p.fim();
