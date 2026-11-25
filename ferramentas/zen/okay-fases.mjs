// Escolhe a tentativa de cada fase do Ricochet Zen (grava a tabela) e confere as 150 fases e a física.
//   node okay-fases.mjs escolher   |   node okay-fases.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), ARQ = RAIZ + '/jogos/zen/okay_game.js';
globalThis.window = globalThis;
const nucleo = fs.readFileSync(RAIZ + '/jogos/zen/index.html', 'utf8').match(/window\.Zen = \{[\s\S]*?\n\};/)[0]; (0, eval)(nucleo);
let fonte = fs.readFileSync(ARQ, 'utf8'); (0, eval)(fonte);
let K = Zen.jogos.okay; const G = Math.PI / 180, limpa = (F, ang) => K.simular(F, Math.cos(ang), Math.sin(ang)).fim === 'limpou';

// folga (graus em volta da solução em que ainda limpa) e quanto da volta inteira resolve
function folga(F) { const a0 = Math.atan2(F.mira[1], F.mira[0]); let d = 0, e = 0; while (d < 12 && limpa(F, a0 + (d + .05) * G)) d += .05; while (e < 12 && limpa(F, a0 - (e + .05) * G)) e += .05; return d + e; }
function sorte(F, passo = .5) { let n = 0, t = 0; for (let a = 0; a < 360; a += passo) { t++; if (limpa(F, a * G)) n++; } return n / t; }
// folga mínima em graus e sorte máxima
const META = { facil: f => [f < 11 ? 2.4 : f < 31 ? 1.8 : 1.4, f < 4 ? .25 : .1], medio: f => [f < 26 ? 1 : .8, .03], dificil: f => [f < 26 ? .8 : .7, .012] };
function avalia(F, dif, f) {
  if (!F) return 'não montou';
  const S = K.simular(F, ...F.mira); if (S.fim !== 'limpou') return 'mira não limpa';
  const [min, max] = META[dif](f), w = folga(F); if (w < min) return 'pouca folga';
  // a folga tem de existir dos dois lados da mira? Não: basta a janela ser larga. Mas a sorte não pode resolver.
  const s = sorte(F); if (s > max) return 'sorte'; return '';
}
if (process.argv[2] === 'escolher') {
  for (const dif of Zen.DIFS) {
    let tab = '', pior = 0; const motivos = {};
    for (let f = 1; f <= 50; f++) { let k = 0; for (; k < 46656; k++) { const m = avalia(K.gerar(dif, f, k), dif, f); if (!m) break; motivos[m] = (motivos[m] || 0) + 1; } if (k === 46656) { console.log('SEM OPÇÃO', dif, f); k = 0; } pior = Math.max(pior, k); tab += k.toString(36).padStart(3, '0'); }
    console.log(dif, 'maior tentativa', pior, JSON.stringify(motivos));
    fonte = fonte.replace(new RegExp(`(\\n  ${dif}: ')[0-9a-z]*'`), (_, p) => p + tab + "'");
  }
  fs.writeFileSync(ARQ, fonte); (0, eval)(fonte); K = Zen.jogos.okay;
}
/* ---------- conferência ---------- */
let ruins = 0, pior = 0; const erro = (...x) => { if (++ruins < 25) console.log('FALHA', ...x); }, vistas = new Set();
let lanc = 0, ricos = 0, fundo = 0, difPasso = 0;
for (const dif of Zen.DIFS) {
  const res = [];
  for (let f = 1; f <= 50; f++) {
    const t0 = performance.now(), F = K.gerar(dif, f); pior = Math.max(pior, performance.now() - t0);
    const nome = dif + ' ' + f; if (!F) { erro(nome, 'não montou'); continue; }
    const s = JSON.stringify(F); if (s !== JSON.stringify(K.gerar(dif, f))) erro(nome, 'não se repete igual'); if (vistas.has(s)) erro(nome, 'repetida'); vistas.add(s);
    const S = K.simular(F, ...F.mira); if (S.fim !== 'limpou') erro(nome, 'a mira guardada não limpa');
    if (F.formas.some(q => q.v.some(([x, y]) => x < 40 || y < 40 || x > K.LARG - 40 || y > K.ALT - 40))) erro(nome, 'forma fora da tela');
    // nenhuma forma encosta em outra nem na bola parada
    F.formas.forEach((q, i) => { if (K.distancia(q, F.x, F.y) < K.R + 60) erro(nome, 'forma em cima da bola'); F.formas.forEach((w, j) => { if (j > i) for (let k = 0; k < 24; k++) { const u = k * 15 * G; let x = q.x, y = q.y; /* ponto da borda de q */ let lo = 0, hi = 400; for (let z = 0; z < 24; z++) { const m = (lo + hi) / 2; if (K.distancia(q, x + Math.cos(u) * m, y + Math.sin(u) * m) < 0) lo = m; else hi = m; } if (K.distancia(w, x + Math.cos(u) * lo, y + Math.sin(u) * lo) < 2) { erro(nome, 'formas encostadas'); break; } } }); });
    // física: atira para 72 lados; em cada passo a bola não pode estar dentro de nada, e o caminho tem de ser contínuo
    for (let a = 0; a < 360; a += 5) {
      const L = K.lancar(F.formas, F.x, F.y, Math.cos(a * G), Math.sin(a * G)); lanc++; let x = L.x, y = L.y;
      while (!L.fim) {
        K.passo(L); const d = Math.hypot(L.x - x, L.y - y); if (d > K.PASSO + 1e-6) erro(nome, 'pulo', d);
        // confere também pontos no meio do passo
        for (const u of [.25, .5, .75, 1]) F.formas.forEach((q, k) => { if (L.vivo[k]) { const p = K.R - K.distancia(q, x + (L.x - x) * u, y + (L.y - y) * u); if (p > fundo && L.eventos.every(e => Math.hypot(e.x - L.x, e.y - L.y) > K.PASSO * 1.01)) fundo = p; } });
        if (Math.abs(L.dx * L.dx + L.dy * L.dy - 1) > 1e-9) erro(nome, 'mudou de velocidade'); x = L.x; y = L.y;
      }
      ricos += L.ric; for (let i = 0; i < L.eventos.length; i++) { const e = L.eventos[i], q = F.formas[e.k], g = Math.abs(K.distancia(q, e.x, e.y) - K.R); if (g > 1e-3) erro(nome, 'toque fora do lugar', g); }
      // com passo 8 vezes menor, as primeiras batidas são as mesmas?
      const M = K.lancar(F.formas, F.x, F.y, Math.cos(a * G), Math.sin(a * G)); while (!M.fim) K.passo(M, K.PASSO / 8);
      if (L.eventos.slice(0, 3).some((e, i) => !M.eventos[i] || M.eventos[i].k !== e.k)) difPasso++;
    }
    res.push({ w: folga(F), s: sorte(F), n: F.alvos, b: F.formas.length - F.alvos, ric: S.ric });
  }
  const med = (k, i) => res.slice(i, i + 10).reduce((s, x) => s + x[k], 0) / 10, gr = [0, 10, 20, 30, 40], mn = k => Math.min(...res.map(x => x[k]));
  console.log(dif.padEnd(8), 'alvos', gr.map(i => med('n', i).toFixed(1)).join(' '), '| barreiras', gr.map(i => med('b', i).toFixed(1)).join(' '), '| ricochetes', gr.map(i => med('ric', i).toFixed(1)).join(' '), '| folga em graus: menor', mn('w').toFixed(2), 'média', (res.reduce((s, x) => s + x.w, 0) / 50).toFixed(2), '| sorte máx', (Math.max(...res.map(x => x.s)) * 100).toFixed(1) + '%');
}
console.log(`${lanc} lançamentos, ${ricos} ricochetes | bola dentro de algo: no máximo ${fundo.toFixed(5)} unidade | batidas que mudam com passo 8x menor: ${difPasso} | pior tempo para criar: ${pior.toFixed(1)} ms`);
console.log(ruins ? ruins + ' problemas' : '150 fases: todas montam, têm solução, não se repetem e a física está exata');
