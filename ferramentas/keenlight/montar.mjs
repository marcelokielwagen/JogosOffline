// Junta as partes de fonte/ e o Three.js num arquivo só, que abre sem internet e até com dois cliques.   node montar.mjs
import { readFileSync as le, writeFileSync } from 'node:fs'; import { fileURLToPath } from 'node:url'; import path from 'node:path';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.join(AQUI, '../..'), f = n => le(path.join(AQUI, 'fonte', n), 'utf8');
let three = le(path.join(RAIZ, 'lib/three/three.module.min.js'), 'utf8');
const i = three.lastIndexOf('export{'), fim = three.indexOf('}', i);
const nomes = three.slice(i + 7, fim).split(',').map(s => { const [a, b] = s.trim().split(' as '); return `${b || a}:${a}`; });
three = `const THREE=(()=>{${three.slice(0, i)};return{${nomes.join(',')}};})();`.replace(/<\/script/g, '<\/script');
const partes = ['texturas.js', 'pecas.js', 'som.js', 'quarto.js', 'praia.js', 'galeria.js', 'noir.js', 'biblioteca.js', 'cozinha.js', 'jogo.js'].map(n => `/* ===== ${n} ===== */\n${f(n)}`).join('\n');
const html = f('pagina.html').replace('/*ESTILO*/', () => f('estilo.css')).replace('/*THREE*/', () => three).replace('/*JOGO*/', () => partes);
writeFileSync(path.join(RAIZ, 'jogos/keenlight/index.html'), html); console.log('jogos/keenlight/index.html', (html.length / 1024).toFixed(0) + ' KB');
