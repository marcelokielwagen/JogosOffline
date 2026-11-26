// Keepsake Hunt, Fase 3: só sobe a versão do modo offline (não há arquivo novo). Rodar uma vez, na hora de publicar, depois de git fetch.   node registrar3.mjs [pasta do site]
import { readFileSync, writeFileSync } from 'node:fs';
const R = (process.argv[2] || 'C:/Users/Minhoca/Projetos/JogosOffline').replace(/\/?$/, '/'), s = readFileSync(R + 'sw.js', 'utf8'), v = s.match(/jogos-offline-v(\d+)/);
if (!v || !s.includes("'./jogos/keepsake-hunt/")) throw new Error('sw.js diferente do esperado');
writeFileSync(R + 'sw.js', s.replace(/jogos-offline-v\d+/, 'jogos-offline-v' + (+v[1] + 1))); console.log('versão', v[1], '->', +v[1] + 1);
