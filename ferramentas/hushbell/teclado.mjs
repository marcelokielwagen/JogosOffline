// Joga o nível 1 só com o teclado: Tab escolhe a peça, E gira, setas andam (uma casa por toque), e chega ao sino.
import { abrir, dorme } from '../nascente/nav.mjs';
const p = await abrir({ w: 1280, h: 760, url: '/jogos/hushbell/index.html#manifest' }), ok = (n, b, x = '') => console.log(b ? 'ok   ' : 'FALHA', n, x);
const H = x => p.av(`(()=>{const H=__hushbell;return ${x}})()`), espera = async (c, s = 10) => { for (let i = 0; i < s * 10; i++) { if (await H(c)) return true; await dorme(100); } return false; };
const tecla = async (key, code = key) => { for (const type of ['keyDown', 'keyUp']) await p.cmd('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: { Tab: 9, Enter: 13, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ArrowLeft: 37 }[key] || key.toUpperCase().charCodeAt(0) }); await dorme(60); };
const anda = async (k, n) => { for (let i = 0; i < n; i++) { await tecla(k); await espera('!H.andar.andando()', 5); } return H('H.andar.no.id'); };
await dorme(2500); await tecla('Enter'); ok('Enter começa o jogo', await espera('H.nivel===0&&!H.viagem', 12));
await dorme(3600); ok('mãozinha aparece no nível 1', await p.av(`document.getElementById('dica').classList.contains('ver')`)); ok('peça brilha antes do 1º giro', await H('H.mundo.pecas[0].mat.userData.uRealce.value') > .05);
await tecla('Tab'); await tecla('e', 'KeyE'); await espera('!H.mundo.pecas[0].soltando', 4); ok('E gira a escada', await H('H.mundo.pecas[0].rot') === 0);
ok('mãozinha some depois do giro', !(await p.av(`document.getElementById('dica').classList.contains('ver')`)) || (await dorme(1200), !(await p.av(`document.getElementById('dica').classList.contains('ver')`))));
ok('setas sobem até o patamar', await anda('ArrowUp', 5) === 'c0,3,-2', await H('H.andar.no.id'));
ok('seta para a direita: na ponte', await anda('ArrowRight', 1) === 'c1,3,-2');
await tecla('Tab'); await tecla('e', 'KeyE'); await espera('!H.mundo.pecas[1].soltando', 4); ok('Tab troca de peça e E gira a ponte com o sino', await H('H.mundo.pecas[1].rot') === 0 && await H('H.andar.no.id') === 'c1,3,-2');
ok('setas atravessam a ilusão', await anda('ArrowRight', 5) === 'c9,6,1', await H('H.andar.no.id')); ok('chegou', await espera('H.venceu', 4));
await tecla('ArrowUp'); ok('seta sem caminho não faz nada', await H('H.andar.no.id') === 'c9,6,1');
console.log('erros:', [...new Set(p.erros)].join('\n') || 'nenhum'); p.fim();
