// Mede os sons fabricados (pico, volume médio, duração, grave/agudo, saturação). Uso: node ferramentas/ponte-zero/medir-som.mjs [pasta para gravar .wav]
import fs from 'node:fs'; import path from 'node:path';
import { SONS, MUSICAS, fazerSom, fazerEco, TAXA, TAXA_MUSICA } from '../../jogos/ponte-zero/audio/sintese.js';
const pasta = process.argv[2], db = v => v > 0 ? (20 * Math.log10(v)).toFixed(1) : '-inf';
function wav(nome, canais, sr) { const n = canais[0].length, c = canais.length, b = Buffer.alloc(44 + n * c * 2); b.write('RIFF'); b.writeUInt32LE(36 + n * c * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(c, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * c * 2, 28); b.writeUInt16LE(c * 2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * c * 2, 40); for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, canais[k][i])) * 32767), 44 + (i * c + k) * 2); fs.writeFileSync(path.join(pasta, nome + '.wav'), b); }
function medir(x, sr) {
  let pico = 0, e = 0, cheio = 0, dc = 0, nan = 0; for (const v of x) { if (!isFinite(v)) nan++; const a = Math.abs(v); pico = Math.max(pico, a); e += v * v; dc += v; if (a > .995) cheio++; }
  // parte mais forte (janela de 50 ms) e energia em grave/médio/agudo com filtros de um polo
  const j = Math.round(.05 * sr); let mj = 0, s = 0; for (let i = 0; i < x.length; i++) { s += x[i] * x[i]; if (i >= j) s -= x[i - j] ** 2; mj = Math.max(mj, s / j); }
  const ka = 1 - Math.exp(-2 * Math.PI * 180 / sr), kb = 1 - Math.exp(-2 * Math.PI * 2500 / sr); let a = 0, b = 0, g = 0, md = 0, ag = 0; for (const v of x) { a += (v - a) * ka; b += (v - b) * kb; g += a * a; md += (b - a) ** 2; ag += (v - b) ** 2; } const t = g + md + ag || 1;
  return { seg: (x.length / sr).toFixed(2), pico: pico.toFixed(2), rms: db(Math.sqrt(e / x.length)), forte: db(Math.sqrt(mj)), dc: (dc / x.length).toFixed(4), cheio, nan, 'grave%': Math.round(g / t * 100), 'médio%': Math.round(md / t * 100), 'agudo%': Math.round(ag / t * 100) };
}
const T = {}, t0 = performance.now(); for (const n in SONS) { const c = [fazerSom(n)].flat(); T[n] = medir(c[0], TAXA); if (pasta) wav(n, c, TAXA); }
if (pasta) wav('eco', fazerEco(), TAXA); const t1 = performance.now();
for (const n in MUSICAS) { const { E, D, seg } = MUSICAS[n](); T['música ' + n] = { ...medir(E, TAXA_MUSICA), seg: seg.toFixed(2) }; if (pasta) wav('musica-' + n, [E, D], TAXA_MUSICA); }
console.table(T); console.log(`sons em ${Math.round(t1 - t0)} ms, músicas em ${Math.round(performance.now() - t1)} ms`);
