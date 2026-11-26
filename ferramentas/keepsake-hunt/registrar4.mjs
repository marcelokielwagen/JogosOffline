// Keepsake Hunt, Fase 4: põe a página de privacidade no modo offline e sobe a versão do sw.js. Rodar na hora de publicar, depois de git fetch.   node registrar4.mjs [pasta do site]
import { readFileSync, writeFileSync } from 'node:fs';
const R = (process.argv[2] || 'C:/Users/Minhoca/Projetos/JogosOffline').replace(/\/?$/, '/'); let s = readFileSync(R + 'sw.js', 'utf8'); const v = s.match(/jogos-offline-v(\d+)/);
if (!v || !s.includes("'./jogos/keepsake-hunt/index.html'")) throw new Error('sw.js diferente do esperado');
if (!s.includes('keepsake-hunt/privacidade.html')) s = s.replace("'./jogos/keepsake-hunt/index.html'", "'./jogos/keepsake-hunt/index.html', './jogos/keepsake-hunt/privacidade.html'");
writeFileSync(R + 'sw.js', s.replace(/jogos-offline-v\d+/, 'jogos-offline-v' + (+v[1] + 1))); console.log('versão', v[1], '->', +v[1] + 1);
