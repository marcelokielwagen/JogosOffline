// Zen: contraste dos textos nas 10 paletas e fotos de cada uma.   node cores.mjs <pasta>
import { abrir, dorme } from '../nascente/nav.mjs';
const S = process.argv[2], p = await abrir({ w: 390, h: 844, movel: true, url: '/jogos/zen/index.html#manifest' }); await dorme(800);
setTimeout(() => p.fim(), 110000).unref();
console.log(await p.av(String.raw`(()=>{ const R = document.documentElement, o = {}, x = document.createElement('canvas').getContext('2d'); R.style.transition = 'none'; const t0 = R.dataset.tema, p0 = R.dataset.paleta;
  const lum = c => { x.fillStyle = c; x.fillRect(0, 0, 1, 1); const [r, g, b] = [...x.getImageData(0, 0, 1, 1).data].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
  const C = (a, b) => { a = lum(a); b = lum(b); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(1); };
  for (const t of ['noite', 'pastel']) for (let i = 0; i < 5; i++) { R.dataset.tema = t; R.dataset.paleta = i; const s = getComputedStyle(R), v = n => s.getPropertyValue(n).trim();
    o[t + i] = [C(v('--tinta'), v('--areia2')), C(v('--tinta2'), v('--areia')), C(v('--tinta2'), v('--areia2')), C(v('--luz'), v('--areia2')), C(v('--sobre'), v('--luz')), C('#fff', v(t === 'pastel' ? '--tinta2' : '--pedra')), C(v('--pedra'), v('--areia'))]; }
  R.dataset.tema = t0; R.dataset.paleta = p0; R.style.transition = ''; return 'texto, texto2, texto2 no fundo, destaque, texto do botão, dificuldade escolhida, peça\n' + Object.entries(o).map(e => e.join(' ')).join('\n'); })()`));
for (const t of ['pastel', 'noite']) for (let i = 0; i < 5; i++) {
  await p.av(`(()=>{const S=__zen.S;S.calmo=true;S.tema='${t}';S.jogo='${i % 2 ? 'okay' : 'loop'}';S.dif='medio';__zen.entrar(${i * 10 + 4})})()`); await dorme(2300);
  if (!(i % 2)) { await p.av(`(()=>{let n=0;const L=__zen.J.teste.P.filter(q=>q.tipo!=='ponte');for(const q of L.slice(0,L.length*.6|0)){const n=q.tipo==='curva'?4:2;let k=(((q.certo-q.giro)%n)+n)%n;while(k--)__zen.J.teste.girarPeca(q)}})()`); await dorme(900); }
  await p.foto(`${S}/cor-${t}-${i}.png`); await p.av('history.back()'); await dorme(900);
}
await p.av(`__zen.S.tema='pastel';__zen.S.jogo='loop';__zen.S.dif='facil';`); await p.recarregar(); await dorme(1200); await p.foto(`${S}/cor-inicio.png`); console.log(p.erros); p.fim();
