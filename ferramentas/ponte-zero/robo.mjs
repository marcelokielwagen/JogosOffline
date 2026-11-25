// Robô que joga a simulação sem tela, para conferir o equilíbrio. Uso: node ferramentas/ponte-zero/robo.mjs [partidas] [nível ou 0] [1 = detalhe] [modos, com vírgula] [dificuldade 0..2]
import { criarSimulacao } from '../../jogos/ponte-zero/nucleo/simulacao.js';
import { NIVEIS, DIFICULDADES } from '../../jogos/ponte-zero/dados/balanco.js';

// desvia das marcas, dos vãos e dos obstáculos: procura o lugar menos perigoso
function fugir(S, correndo) {
  const c = S.d + S.frente; let melhor = null;
  for (let x = -4.5; x <= 4.5; x += .75) for (const f of correndo ? [0] : [0, -2.5, -5, 2]) {
    let custo = Math.abs(x - S.x) * .03 + Math.abs(f) * .02;
    const raio = Math.min(3.4, .4 + Math.sqrt(S.soldados.length) * .36) * S.aperto, d = S.d + f;
    for (const m of S.marcas) { if (correndo && Math.abs((m.forma === 'faixa' ? m.d0 : m.d) - c) > 30) continue; const dd = correndo ? (m.forma === 'faixa' ? Math.max(m.d0 + 1, d) : m.d) : d; if (m.forma === 'faixa') { const ox = Math.max(0, Math.min(x + raio, m.x + m.larg / 2) - Math.max(x - raio, m.x - m.larg / 2)) / (2 * raio), od = Math.max(0, Math.min(dd + raio, m.d1) - Math.max(dd - raio, m.d0)) / (2 * raio); custo += ox * od * (m.t / m.dur > .3 || m.dur < 2 ? 1 : .5) * Math.max(.6, 3 - m.dur + m.t); } else { const q = Math.hypot(x - m.x, dd - m.d); custo += Math.max(0, 1 - q / (m.r + raio)) * 1.6; } }
    for (const b of S.buracos) custo += Math.max(0, 1 - Math.hypot(x - b.x, d - b.d) / (b.r + raio * .6)) * .8;
    for (const o of [...S.blocos, ...S.vaos]) if (o.d1 > c - 1 && o.d0 < c + (correndo ? 24 : 2)) { custo += x > o.x0 - .3 && x < o.x1 + .3 ? 3 : Math.max(0, Math.min(x + raio, o.x1) - Math.max(x - raio, o.x0)) * .25; }
    if (!melhor || custo < melhor.custo) melhor = { x, f, custo };
  }
  return melhor;
}
export function piloto(S, modo, rnd, q) {
  const c = S.d + S.frente, p = S.portoes.find(p => p.usado < 0); let alvo = 0, frente = S.luta ? 0 : 1;
  const val = l => l.tipo === 'soma' ? l.v : l.tipo === 'tiro' ? Math.min(30, l.v + 16) : l.tipo === 'vezes' ? S.n * (l.v - 1) : l.tipo === 'divide' ? -S.n / 2 : l.tipo === 'arma' ? (S.arma < 2 ? 25 : 4) : l.tipo === 'especial' ? l.v * [8, 9, 5][l.arma - 3] : 8;
  if (modo === 'parado') return;
  if (modo === 'acaso') { if (q % 60 === 1) S.zz = (rnd() - .5) * 8; alvo = S.zz || 0; }
  else if (S.luta === 'luta') { const r = fugir(S); if (modo === 'bom' || modo === 'medio' && S.marcas.some(m => m.t > .6)) { alvo = r.x; frente = r.f; if (!S.marcas.length) { const b = S.barris.find(b => b.vivo && (b.tipo === 'reforco' || b.tipo === 'hidrante')); alvo = b ? b.x : S.chefe.x * .5; if (S.vaos.length) alvo = r.x; } } }
  else if (modo !== 'ruim' && (S.blocos.some(o => o.d1 > c - 1 && o.d0 < c + (modo === 'medio' ? 13 : 20)) || S.vaos.some(o => o.d1 > c - 1 && o.d0 < c + 20) || S.marcas.length && (modo === 'bom' || S.marcas.some(m => m.t > .5))) && !(p && p.d - c < 8)) alvo = fugir(S, true).x;
  else if (p && p.d - c < (modo === 'medio' ? 14 : 22)) { const vs = p.lados.map(val); let k = vs.indexOf(Math.max(...vs)); if (modo === 'medio' && (p.erra ??= rnd()) < .22) k = (k + 1) % vs.length; if (modo === 'ruim') k = vs.indexOf(Math.min(...vs)); alvo = (Math.max(-4.6, S.borda(p, k)) + Math.min(4.6, S.borda(p, k + 1))) / 2; }
  else {
    let m = null; for (const z of S.zumbis) if (z.d > c && z.d - c < 26 && !z.entra && (!m || z.d < m.d)) m = z; if (m && modo !== 'ruim') alvo = m.x * (modo === 'medio' ? .6 : 1);
    const cx = modo === 'bom' || modo === 'medio' && q % 600 < 300 ? S.barris.find(b => b.vivo && (b.tipo === 'gaiola' || b.tipo === 'caixa') && b.d > c && b.d - c < 24) : null; if (cx && !(m && m.d - c < 7)) alvo = cx.x;
    for (const b of S.barris) if (b.vivo && b.tipo === 'barril' && b.d > c && b.d - c < 4 && Math.abs(b.x - alvo) < 2.2) alvo = b.x > 0 ? b.x - 3 : b.x + 3;
  }
  const v = modo === 'medio' ? .09 : .14; S.alvoX += Math.max(-v, Math.min(v, alvo - S.alvoX)); if (S.luta) S.alvoFrente += Math.max(-v, Math.min(v, frente - S.alvoFrente));
}
export function jogar(nivel, modo, seed, melhorias = {}, dif = 0) {
  let s = seed; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ev = {}; const S = criarSimulacao(NIVEIS[nivel], { sorte: rnd, melhorias, dif: DIFICULDADES[dif], aoEvento: n => { ev[n] = (ev[n] || 0) + 1; } }); let q = 0, maxZ = 0, maxT = 0, pior = 0, nC = 0, tC = 0, nM = 0, tM = 0, tMf = 0, nMf = 0, log = [];
  while (S.estado === 'jogando' && q < 60 * 260) { q++; piloto(S, modo, rnd, q); const a = performance.now(); S.passo(1 / 60); pior = Math.max(pior, performance.now() - a); maxZ = Math.max(maxZ, S.zumbis.length); maxT = Math.max(maxT, S.tiros.length); if (S.chefe?.meio && !tM) { tM = S.tempo; nM = S.n; } if (S.meioFeito && tM && !tMf) { tMf = S.tempo; nMf = S.n; } if (S.luta && !S.chefe.meio && !tC) { tC = S.tempo; nC = S.n; } if (q % 600 === 0) log.push(S.n); }
  return { nivel: nivel + 1, modo, estado: S.estado, d: S.d | 0, nChefe: nC, nM, nMf, tMeio: tMf ? +(tMf - tM).toFixed(1) : 0, ev, n: S.n, esp: S.esp, arma: S.arma, tLuta: tC ? +(S.tempo - tC).toFixed(1) : 0, vida: S.chefe ? +(S.chefe.vida / S.chefe.max).toFixed(2) : 1, dist: S.chefe ? +(S.chefe.d - S.d).toFixed(1) : 0, mortos: S.mortos, perd: S.perdidos, tempo: S.tempo | 0, maxZ, maxT, pior: pior.toFixed(1), log: log.join() };
}
if (process.argv[1]?.endsWith('robo.mjs')) {
  const N = +(process.argv[2] || 3), so = +(process.argv[3] || 0), modos = process.argv[5] ? process.argv[5].split(',') : ['bom', 'medio', 'acaso', 'ruim', 'parado'];
  // prêmios que o jogador já teria ao chegar em cada nível
  const PR = [{ soldados: 2 }, { dano: .1 }, { cadencia: .1 }, { bazuca: 1 }, { cadencia: .1 }, { chamas: 1 }, { soldados: 3 }, { bazuca: 1 }, { dano: .1 }];
  for (let k = 0; k < NIVEIS.length; k++) { if (so && so !== k + 1) continue; const mel = {}; PR.slice(0, k).forEach(p => { for (const n in p) mel[n] = (mel[n] || 0) + p[n]; });
    for (const m of modos) { const R = []; for (let i = 1; i <= N; i++) R.push(jogar(k, m, i * 77 + k, mel, +(process.argv[6] || 0))); if (process.argv[4] === '1') R.forEach(r => console.log(JSON.stringify(r))); const v = R.filter(r => r.estado === 'vitoria'), md = (f, l = v) => l.length ? (l.reduce((a, r) => a + r[f], 0) / l.length).toFixed(1) : '-', ch = R.filter(r => r.nChefe), me = R.filter(r => r.tMeio); console.log(`nível ${k + 1} ${m.padEnd(6)} venceu ${v.length}/${N} | meio ${me.length}: ${md('nM', me)}→${md('nMf', me)} em ${md('tMeio', me)}s | chefe ${ch.length} com ${md('nChefe', ch)} | fim ${md('n')} | luta ${md('tLuta')}s a ${md('dist')}m | perdas ${md('perd')} | parou ${R.filter(r => r.estado !== 'vitoria').map(r => r.d).join(' ')}`); } }
}
