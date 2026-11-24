// Gera capas/ponte-zero.webp a partir da cena do próprio jogo. Uso: node ferramentas/ponte-zero/capa.mjs [saida.webp]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), saida = process.argv[2] || path.join(RAIZ, 'capas/ponte-zero.webp');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' };
const srv = createServer((q, r) => { const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0])); try { if (!f.startsWith(RAIZ)) throw 0; const d = readFileSync(f); r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const perfil = mkdtempSync(path.join(tmpdir(), 'capa-')), porta = 9800 + Math.floor(Math.random() * 190), dorme = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=900,1100', 'about:blank'], { stdio: 'ignore' });
let alvo; for (let i = 0; i < 60 && !alvo; i++) { await dorme(250); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch { /* abrindo */ } }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r); let n = 0; const esp = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) esp[m.id]?.(m.result || m); };
const cmd = (method, params = {}) => new Promise(r => { const id = ++n; esp[id] = r; ws.send(JSON.stringify({ id, method, params })); });
const avalia = async x => { const r = await cmd('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
await cmd('Page.navigate', { url: `http://127.0.0.1:${srv.address().port}/ferramentas/ponte-zero/capa.html` });
for (let i = 0; i < 40 && !(await avalia('!!window.capa').catch(() => 0)); i++) await dorme(250);
let erro = 0; try { const b = Buffer.from((await avalia('capa()')).split(',')[1], 'base64'); writeFileSync(saida, b); console.log(saida, Math.round(b.length / 1024) + ' KB'); } catch (e) { erro = 1; console.log(e.message); }
ws.close(); chrome.kill(); srv.close(); await dorme(700); try { rmSync(perfil, { recursive: true, force: true }); } catch { /* depois */ }
process.exit(erro);
