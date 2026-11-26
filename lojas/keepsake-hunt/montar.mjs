// Keepsake Hunt: monta a pasta www do aplicativo a partir do jogo do site.   node montar.mjs
// Copia o jogo, tira o que só faz sentido no site (link "Todos os jogos", suíte, ícone da suíte) e põe o provedor das lojas.
// Depois: npx cap sync (veja LEIAME.md).
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), JOGO = path.resolve(AQUI, '../../jogos/keepsake-hunt'), WWW = path.join(AQUI, 'www');
rmSync(WWW, { recursive: true, force: true }); mkdirSync(WWW, { recursive: true });
let h = readFileSync(path.join(JOGO, 'index.html'), 'utf8'); const crlf = h.includes('\r\n'); h = h.replaceAll('\r\n', '\n');
const troca = (a, b) => { if (!h.includes(a)) throw new Error('não achei: ' + a); h = h.replace(a, b); };
troca('<script src="../../js/suite.js"></script>\n', '');
troca('<link rel="icon" href="../../icones/icone-192.png">\n', '<link rel="icon" href="icone.png">\n');
troca('<a href="../../index.html">Todos os jogos</a>', '');
troca('</body>', '<script src="provedor-capacitor.js"></script>\n</body>');
if (/\.\.\/\.\.\//.test(h)) throw new Error('sobrou link para fora do jogo: ' + h.match(/.{40}\.\.\/\.\.\/.{40}/)[0]);
writeFileSync(path.join(WWW, 'index.html'), crlf ? h.replaceAll('\n', '\r\n') : h);
cpSync(path.join(JOGO, 'privacidade.html'), path.join(WWW, 'privacidade.html')); cpSync(path.join(JOGO, 'arte'), path.join(WWW, 'arte'), { recursive: true }); cpSync(path.join(AQUI, 'provedor-capacitor.js'), path.join(WWW, 'provedor-capacitor.js'));
const ic = path.join(AQUI, 'imagens', 'icone-512.png'); if (existsSync(ic)) cpSync(ic, path.join(WWW, 'icone.png'));
console.log('www pronta:', WWW);
