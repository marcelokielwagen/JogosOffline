// Robô que joga a simulação sem tela, para conferir o equilíbrio. Uso: node ferramentas/ponte-zero/robo.mjs [partidas por caso] [nível 1..4]
import { criarSimulacao } from '../../jogos/ponte-zero/nucleo/simulacao.js';
import { NIVEIS } from '../../jogos/ponte-zero/dados/balanco.js';

// desvia das marcas do chefe: procura o lugar menos marcado
function fugir(S) {
  const c = S.d + S.frente; let melhor = null;
  for (let x = -4.5; x <= 4.5; x += .75) for (const f of [0, -2.5, -5, 2]) {
    let custo = Math.abs(x - S.x) * .03 + Math.abs(f) * .02;
    const raio = Math.min(3.4, .4 + Math.sqrt(S.soldados.length) * .36), d = S.d + f;
    for (const m of S.marcas) { if (m.forma === 'faixa') { const ox = Math.max(0, Math.min(x + raio, m.x + m.larg / 2) - Math.max(x - raio, m.x - m.larg / 2)) / (2 * raio), od = Math.max(0, Math.min(d + raio, m.d1) - Math.max(d - raio, m.d0)) / (2 * raio); custo += ox * od * (m.t / m.dur > .3 || m.dur < 2 ? 1 : .5) * (3 - m.dur + m.t); } else { const q = Math.hypot(x - m.x, d - m.d); custo += Math.max(0, 1 - q / (m.r + raio)) * 1.6; } }
    for (const b of S.buracos) custo += Math.max(0, 1 - Math.hypot(x - b.x, d - b.d) / (b.r + raio * .6)) * .8;
    for (const z of S.zumbis) if (z.d - d < 5 && z.d > d) custo += 0;
    if (!melhor || custo < melhor.custo) melhor = { x, f, custo };
  }
  return melhor;
}
export function piloto(S, modo, rnd, q) {
  const c = S.d + S.frente, p = S.portoes.find(p => p.usado < 0); let alvo = 0, frente = S.luta ? 0 : 1;
  const val = l => l.tipo === 'soma' ? l.v : l.tipo === 'tiro' ? Math.min(30, l.v + 16) : l.tipo === 'vezes' ? S.n * (l.v - 1) : l.tipo === 'divide' ? -S.n / 2 : l.tipo === 'arma' ? (S.arma < 2 ? 25 : 4) : l.tipo === 'especial' ? l.v * [8, 9, 5][l.arma - 3] : 8;
  if (modo === 'parado') return;
  if (modo === 'acaso') { if (q % 60 === 1) S.zz = (rnd() - .5) * 8; alvo = S.zz || 0; }
  else if (S.luta === 'luta') { const r = fugir(S); if (modo === 'bom' || modo === 'medio' && S.marcas.some(m => m.t > .6)) { alvo = r.x; frente = r.f; if (!S.marcas.length) { const b = S.barris.find(b => b.vivo && b.reforco); alvo = b ? b.x : S.chefe.x * .5; } } }
  else if (p && p.d - c < (modo === 'medio' ? 14 : 22)) { const a = val(p.lados[0]), b = val(p.lados[1]); let esq = a > b; if (modo === 'medio' && (p.erra ??= rnd()) < .22) esq = !esq; if (modo === 'ruim') esq = !esq; alvo = esq ? -2.4 : 2.4; }
  else { let m = null; for (const z of S.zumbis) if (z.d > c && z.d - c < 26 && (!m || z.d < m.d)) m = z; if (m && modo !== 'ruim') alvo = m.x * (modo === 'medio' ? .6 : 1); for (const b of S.barris) if (b.vivo && !b.reforco && b.d > c && b.d - c < 4 && Math.abs(b.x - alvo) < 2.2) alvo = b.x > 0 ? b.x - 3 : b.x + 3; }
  const v = modo === 'medio' ? .09 : .14; S.alvoX += Math.max(-v, Math.min(v, alvo - S.alvoX)); if (S.luta) S.alvoFrente += Math.max(-v, Math.min(v, frente - S.alvoFrente));
}
export function jogar(nivel, modo, seed, melhorias = {}) {
  let s = seed; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ev = {}; const S = criarSimulacao(NIVEIS[nivel], { sorte: rnd, melhorias, aoEvento: n => { ev[n] = (ev[n] || 0) + 1; } }); let q = 0, maxZ = 0, maxT = 0, pior = 0, nC = 0, tC = 0, log = [];
  while (S.estado === 'jogando' && q < 60 * 220) { q++; piloto(S, modo, rnd, q); const a = performance.now(); S.passo(1 / 60); pior = Math.max(pior, performance.now() - a); maxZ = Math.max(maxZ, S.zumbis.length); maxT = Math.max(maxT, S.tiros.length); if (S.luta && !tC) { tC = S.tempo; nC = S.n; } if (q % 600 === 0) log.push(S.n); }
  return { nivel: nivel + 1, modo, estado: S.estado, d: S.d | 0, nChefe: nC, n: S.n, esp: S.esp, arma: S.arma, tLuta: tC ? +(S.tempo - tC).toFixed(1) : 0, vida: S.chefe ? +(S.chefe.vida / S.chefe.max).toFixed(2) : 1, dist: S.chefe ? +(S.chefe.d - S.d).toFixed(1) : 0, mortos: S.mortos, perd: S.perdidos, tempo: S.tempo | 0, maxZ, maxT, pior: pior.toFixed(1), log: log.join() };
}
if (process.argv[1]?.endsWith('robo.mjs')) {
  const N = +(process.argv[2] || 3), so = +(process.argv[3] || 0);
  for (let k = 0; k < NIVEIS.length; k++) { if (so && so !== k + 1) continue; const mel = { soldados: k > 0 ? 2 : 0, dano: k > 1 ? .1 : 0, cadencia: k > 2 ? .1 : 0 }; for (const m of ['bom', 'medio', 'acaso', 'ruim', 'parado']) { const R = []; for (let i = 1; i <= N; i++) R.push(jogar(k, m, i * 77 + k, mel)); if (process.argv[4]) R.forEach(r => console.log(JSON.stringify(r))); const v = R.filter(r => r.estado === 'vitoria'), md = (f, l = v) => l.length ? (l.reduce((a, r) => a + r[f], 0) / l.length).toFixed(1) : '-', ch = R.filter(r => r.nChefe); console.log(`nível ${k + 1} ${m.padEnd(7)} venceu ${v.length}/${N} | chegou ao chefe ${ch.length} com ${md('nChefe', ch)} | terminou com ${md('n')} | luta ${md('tLuta')} s, chefe a ${md('dist')} m | perdas ${md('perd')} | parou em ${R.filter(r => r.estado !== 'vitoria').map(r => r.d).join(' ')}`); } }
}
