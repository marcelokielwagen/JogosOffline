// Keepsake Hunt: coloca a lista de objetos (atlas.json, feita por gerar-arte.mjs) dentro do index.html.   node montar.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const R = 'C:/Users/Minhoca/Projetos/JogosOffline/', f = R + 'jogos/keepsake-hunt/index.html'; const s = readFileSync(f, 'utf8'), a = JSON.stringify(JSON.parse(readFileSync(R + 'ferramentas/keepsake-hunt/atlas.json', 'utf8')));
const i = s.indexOf('/*ATLAS*/') + 9, j = s.indexOf('/*FIM*/', i); if (i < 9 || j < 0) throw new Error('marca não achada'); writeFileSync(f, s.slice(0, i) + a + s.slice(j)); console.log('ok', a.length);
