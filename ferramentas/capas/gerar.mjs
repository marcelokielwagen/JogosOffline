// Gera as capas 3D dos jogos (pasta capas/). Uso: node ferramentas/capas/gerar.mjs [jogo ...] [--rapido] [--saida=pasta]
// Abre o projeto num Chrome invisível, desenha cada cena em alta qualidade e grava as imagens prontas.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), rapido = args.includes('--rapido'), so = args.filter(a => !a.startsWith('--'));
const saida = (args.find(a => a.startsWith('--saida=')) || '').slice(8) || path.join(RAIZ, 'capas');
mkdirSync(saida, { recursive: true });

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript' };
const srv = createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]));
  try { if (!f.startsWith(RAIZ)) throw 0; const d = readFileSync(f); r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));

const perfil = mkdtempSync(path.join(tmpdir(), 'capas-')), porta = 9800 + Math.floor(Math.random() * 190), dorme = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
let alvo;
for (let i = 0; i < 60 && !alvo; i++) { await dorme(250); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch { /* ainda abrindo */ } }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let n = 0; const esp = {};
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id) esp[m.id]?.(m.result || m);
  else if (m.method === 'Runtime.exceptionThrown') console.log('ERRO', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Runtime.consoleAPICalled') console.log(m.params.type, m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 1500));
};
const cmd = (method, params = {}) => new Promise(r => { const id = ++n; esp[id] = r; ws.send(JSON.stringify({ id, method, params })); });
const avalia = async x => { const r = await cmd('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
await cmd('Runtime.enable');
await cmd('Page.navigate', { url: `http://127.0.0.1:${srv.address().port}/ferramentas/capas/capas.html` });
for (let i = 0; i < 40 && !(await avalia('!!window.capa').catch(() => 0)); i++) await dorme(250);

let erro = 0;
for (const nome of so.length ? so : await avalia('NOMES')) {
  const t = Date.now();
  try {
    const d = await avalia(`capa(${JSON.stringify(nome)}, ${rapido})`), b = Buffer.from(d.split(',')[1], 'base64');
    writeFileSync(path.join(saida, nome + '.webp'), b);
    console.log(nome, Math.round(b.length / 1024) + ' KB', ((Date.now() - t) / 1000).toFixed(1) + ' s');
  } catch (e) { erro = 1; console.log(nome, 'FALHOU', e.message); }
}
ws.close(); chrome.kill(); srv.close(); await dorme(700);
try { rmSync(perfil, { recursive: true, force: true }); } catch { /* o Windows apaga depois */ }
process.exit(erro);
