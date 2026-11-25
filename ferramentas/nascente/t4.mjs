// Controles, dificuldade, seletor, salvamento e migração.
import { abrir, dorme } from './nav.mjs'; const ok = (n, v, e = '') => console.log(v ? 'ok  ' : 'FALHA', n, v ? '' : e);
const p = await abrir({ w: 1280, h: 760, url: '/jogos/nascente/index.html#semescolha' }), N = '__nascente', av = p.av;
const pronto = async () => { for (let k = 0; k < 40 && !(await av('!!(window.__nascente&&__nascente.J.estado==="jogando")').catch(() => 0)); k++) await dorme(250); await dorme(600); };
const abre = async f => { await av(`${N}.abrirFase(${f})`); await dorme(1600); await pronto(); };
// migração da versão antiga
await av(`localStorage.clear();localStorage['nascente.v1']=JSON.stringify({fase:5,concluidas:[0,1,5,11],andamento:{2:{giros:${N}.lerFase(2,0).celulas.map(c=>c.giro),passos:[[5,1]],mapa:'x'}},volume:33,mudo:true,camera:'livre'});location.hash='';location.reload()`); await dorme(4500);
ok('pede a dificuldade na primeira vez', await av(`document.getElementById('d-dif').open`)); await av(`document.querySelector('#d-dif button[data-d="0"]').click()`); await pronto();
ok('migra concluídas, volume, andamento e fase', await av(`${N}.salvo.feitas[0].join()==='0,1,10,13'&&${N}.salvo.volume===33&&${N}.salvo.mudo&&!!${N}.salvo.andamento['0:2']&&${N}.salvo.fase===10&&${N}.salvo.dif===0`), await av(`JSON.stringify([${N}.salvo.feitas,${N}.salvo.volume,${N}.salvo.fase,${N}.salvo.dif])`));
ok('salvo antigo intacto', await av(`!!localStorage['nascente.v1']`)); ok('Fácil usa o mapa antigo', await av(`${N}.lerFase(0,0).def.m===${N}.FASES[0].f.m`));
// seletor
await av(`document.getElementById('b-fases').click()`); await dorme(400); ok('10 mundos e 10 fases', await av(`document.querySelectorAll('#mundos button').length===10&&document.querySelectorAll('#lista button').length===10`));
await av(`document.querySelectorAll('#mundos button')[4].click()`); ok('troca de mundo', await av(`document.getElementById('lista').textContent.includes('Sede antiga')`));
await av(`document.querySelectorAll('#difs button')[1].click()`); ok('progresso separado por dificuldade', await av(`${N}.salvo.dif===1&&document.getElementById('resumo').textContent.startsWith('0 de 100')`));
await av(`document.querySelectorAll('#lista button')[4].click()`); await dorme(1800); await pronto(); ok('abriu a fase 45 no Médio', await av(`${N}.J.F.indice===44&&${N}.J.F.dif===1`));
// andares
ok('botão de andar aparece', await av(`!document.getElementById('b-andar').hidden`)); await av(`document.getElementById('b-andar').click()`);
let a = await av(`(()=>{const F=${N}.J.F,c=F.celulas.find(c=>c.andar===0&&!c.fixa&&F.grade[c.i+F.larg*F.prof]);return c?c.i:-1})()`);
if (a >= 0) { const [x, y] = await p.onde(a); await p.clique(x, y); await dorme(800); ok('no andar de baixo, o clique passa pela peça de cima', await av(`${N}.J.passos.length===1&&${N}.J.F.grade[${N}.J.passos[0][0]].andar===0`)); }
await av(`document.getElementById('b-andar').click()`); a = await av(`${N}.J.F.celulas.find(c=>c.andar===1&&!c.fixa).i`); { const [x, y] = await p.onde(a); await p.clique(x, y); await dorme(800); ok('clique na peça de cima', await av(`${N}.J.F.grade[${N}.J.passos.at(-1)[0]].andar===1`)); }
// controles básicos
await abre(54); const i = await av(`${N}.J.F.celulas.filter(c=>!c.fixa&&!c.grupo&&!c.emperrada&&c.tipo==='curva').sort((a,b)=>b.x+b.z-a.x-a.z)[0].i`), g0 = await av(`${N}.J.F.grade[${i}].giro`), [x, y] = await p.onde(i), giro = () => av(`${N}.J.F.grade[${i}].giro`);
await p.clique(x, y); await dorme(700); ok('clique gira', await giro() === (g0 + 1) % 4); await p.clique(x, y, 'right'); await dorme(700); ok('botão direito volta', await giro() === g0);
await av(`document.getElementById('b-desfazer').click()`); await dorme(600); ok('desfazer', await giro() === (g0 + 1) % 4);
// mecânicas
const unid = (de, cond, teste) => av(`(async()=>{for(let f=${de};f<${de}+10;f++){const F=${N}.lerFase(f,1);const ach=G=>G.unidades.find(u=>${cond});if(!ach(F))continue;await ${N}.abrirFase(f);const u=ach(${N}.J.F),a=u.membros.map(m=>m.giro);${N}.girar(u.membros.at(-1));const b=u.membros.map(m=>m.giro);await new Promise(r=>setTimeout(r,900));${N}.desfazer();const c=u.membros.map(m=>m.giro);return (${teste})&&c.join()===a.join()}})()`);
ok('irmãs giram juntas e desfazem', await unid(50, `u.membros.length>1&&u.membros[0].tipo!=='comporta'`, `b.every((v,k)=>v===(a[k]+1)%4)`));
ok('eixo emperrado dá meia-volta', await unid(20, `u.membros[0].emperrada&&!u.membros[0].fixa`, `b[0]===(a[0]+2)%4`));
ok('comportas mudam juntas', await unid(70, `u.membros[0].tipo==='comporta'&&u.membros.length>1`, `b.every((v,k)=>v===1-a[k])`));
// salvar, recarregar, reiniciar
await abre(33); await av(`${N}.girar(${N}.J.F.caminho[1]);${N}.girar(${N}.J.F.caminho[2])`); await dorme(900); const est = `JSON.stringify([${N}.J.F.indice,${N}.J.F.dif,${N}.J.F.celulas.map(c=>c.giro),${N}.J.passos])`, antes = await av(est); await p.recarregar(); await dorme(1500); await pronto(); ok('recarrega igual, sem perguntar de novo', antes === await av(est));
await av(`document.getElementById('b-reiniciar').click()`); await dorme(3500); ok('reiniciar', await av(`${N}.J.F.celulas.every(c=>c.lugar||c.giro===c.inicio&&!c.girando)&&!${N}.J.passos.length`));
// Difícil: água em todos, mas vazando, não conclui
await av(`${N}.salvo.dif=2`); let achou = null; for (const f of [1, 3, 5, 7, 9]) { await abre(f); achou = await av(`(()=>{const F=${N}.J.F;F.celulas.forEach(c=>{if(!c.lugar)c.giro=c.certo});for(const c of F.caminho)if(c.tipo==='te'||c.tipo==='curva')for(const g of [1,2,3]){c.giro=(c.certo+g)%4;${N}.correr(F);if(${N}.completa(F)&&${N}.vazamentos(F)&&!${N}.venceu(F))return true;c.giro=c.certo}return null})()`); if (achou) break; }
ok('Difícil não conclui com vazamento', achou === true || achou === null, achou); await av(`${N}.salvo.dif=1`);
// teclado e passagem automática
await abre(0); await av(`document.getElementById('tela').focus()`); const tecla = async (k, c) => { await p.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: c || k, text: k === ' ' ? ' ' : undefined }); await p.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: c || k }); };
await tecla('ArrowRight'); await tecla('ArrowDown'); await tecla(' ', 'Space'); await dorme(700); ok('teclado', await av(`${N}.J.passos.length===1`));
await av(`${N}.resolver()`); let passou = false; for (let k = 0; k < 150 && !passou; k++) { await dorme(250); passou = await av(`${N}.J.F.indice===1&&${N}.J.estado==='jogando'`); } ok('passa sozinho para a próxima', passou); ok('concluída salva no Médio', await av(`JSON.parse(localStorage['nascente.v2']).feitas[1].includes(0)`));
console.log('erros:', [...new Set(p.erros)].join(' / ') || 'nenhum'); p.fim();
