import {abrir,dorme} from './nav.mjs'; const ok=(n,v,e='')=>console.log(v?'ok  ':'FALHA',n,e);
const p=await abrir({w:1280,h:760}); const N='__nascente'; await dorme(2500);
// clique real na peça certa
const i=await p.av(`${N}.J.F.caminho[0].i`), g0=await p.av(`${N}.J.F.grade[${i}].giro`); let [x,y]=await p.onde(i);
await p.clique(x,y); await dorme(120); ok('clique gira 90',await p.av(`${N}.J.F.grade[${i}].giro`)===(g0+1)%4);
await dorme(700); ok('giro termina',await p.av(`!${N}.J.F.grade[${i}].girando`));
await p.clique(x,y,'right'); await dorme(600); ok('botao direito volta',await p.av(`${N}.J.F.grade[${i}].giro`)===g0);
await p.cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await dorme(300); ok('realce',await p.av(`!!${N}.J.sobre`));
await p.av(`document.getElementById('b-desfazer').click()`); await dorme(500); ok('desfazer',await p.av(`${N}.J.F.grade[${i}].giro`)===(g0+1)%4);
// arrastar não gira peça
await p.cmd('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); for(let k=1;k<8;k++)await p.cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+k*14,y,button:'left',buttons:1}); await p.cmd('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+98,y,button:'left',clickCount:1}); await dorme(900);
ok('arrastar so move camera',await p.av(`${N}.J.F.grade[${i}].giro`)===(g0+1)%4); 
await p.av(`${N}.Cam.trocar('livre')`); ok('zoom',await (async()=>{await p.cmd('Input.dispatchMouseEvent',{type:'mouseWheel',x:600,y:400,deltaX:0,deltaY:-400});await dorme(400);return await p.av(`${N}.Cam.quer.zoom<1`)})()); 
// salvar e recarregar
await p.av(`${N}.abrirFase(4)`); await dorme(2200); const c=await p.av(`${N}.J.F.caminho[2].i`); await p.av(`${N}.girar(${N}.J.F.grade[${c}]);${N}.girar(${N}.J.F.caminho[1]);document.getElementById('volume').value=33;document.getElementById('volume').oninput({target:document.getElementById('volume')});document.getElementById('mudo').click()`); await dorme(600);
const antes=await p.av(`JSON.stringify([${N}.J.F.indice,${N}.J.F.celulas.map(c=>c.giro),${N}.J.passos])`); await p.recarregar(); await dorme(1500); for(let k=0;k<30&&!(await p.av('!!(window.__nascente&&__nascente.J.estado==="jogando")').catch(()=>0));k++)await dorme(250);
ok('recarregou igual',antes===await p.av(`JSON.stringify([${N}.J.F.indice,${N}.J.F.celulas.map(c=>c.giro),${N}.J.passos])`)); ok('som salvo',await p.av(`${N}.salvo.volume===33&&${N}.salvo.mudo===true`)); ok('camera salva',await p.av(`${N}.Cam.modo==='livre'`));
await p.av(`document.getElementById('b-desfazer').click()`); await dorme(500); ok('desfazer apos recarregar',await p.av(`${N}.J.passos.length===1`));
await p.av(`document.getElementById('b-reiniciar').click()`); await dorme(1600); ok('reiniciar',await p.av(`${N}.J.F.celulas.every(c=>c.lugar||c.giro===c.inicio&&Math.abs(((c.vis-c.giro)%4+4)%4)<.001)&&!${N}.J.passos.length`));
// dica: resolve a fase só com dicas
for(let f of [4,11]){ await p.av(`${N}.abrirFase(${f})`); await dorme(2400); let n=0; while(await p.av(`${N}.J.estado`)==='jogando'&&n++<60){await p.av(`document.getElementById('b-dica').click()`);await dorme(450);} for(let k=0;k<40&&await p.av(`${N}.J.estado`)!=='florido';k++)await dorme(250); ok('so com dicas fase '+(f+1),await p.av(`${N}.J.estado`)==='florido','toques '+n); }
ok('concluidas salvas',await p.av(`JSON.parse(localStorage['nascente.v1']).concluidas.join()`)==='4,11');
await p.av(`${N}.abrirFase(0)`); await dorme(2400); await p.av(`${N}.resolver()`); let passou=false; for(let k=0;k<110&&!passou;k++){await dorme(250);passou=await p.av(`${N}.J.F.indice===1&&${N}.J.estado==='jogando'`);} ok('passa sozinho para a proxima',passou);
// teclado
await p.av(`document.getElementById('tela').focus()`); const tecla=async(k,code)=>{await p.cmd('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:code||k,text:k===' '?' ':undefined});await p.cmd('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:code||k});};
await tecla('ArrowRight'); await tecla('ArrowRight'); await tecla(' ','Space'); await dorme(500); ok('teclado',await p.av(`!!${N}.J.cursor&&${N}.J.passos.length===1`));
// corte de água: desligar esvazia
await p.av(`${N}.resolver()`); await dorme(2600); const ch=await p.av(`${N}.J.cheios`); await p.av(`${N}.girar(${N}.J.F.caminho[1])`); await dorme(2500); ok('cortar esvazia',await p.av(`${N}.J.cheios`)<ch||await p.av(`${N}.J.estado`)==='florido',ch+'->'+await p.av(`${N}.J.cheios`));
// 60 quadros
await p.av(`${N}.abrirFase(11)`); await dorme(3500); await p.av(`${N}.resolver()`); await dorme(4000); console.log('quadros/s fase 12:',await p.av(`new Promise(r=>{let n=0,t=performance.now();(function f(){n++;performance.now()-t<3000?requestAnimationFrame(f):r(Math.round(n/3))})()})`),'ratio',await p.av(`${N}.R.getPixelRatio()`));
console.log('erros:',p.erros.join('\n')||'nenhum'); p.fim();
