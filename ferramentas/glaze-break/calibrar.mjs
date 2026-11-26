// Glaze Break: confere as regras e mede as 50 fases no Node, sem tela.
//   node calibrar.mjs [1-50] [--jogos=20]
// Dois jogadores simulados: "robô" (perfeito, só mira) e "pessoa" (demora a reagir, erra a previsão, dedo com velocidade limitada).
import { readFileSync } from 'node:fs';
const RAIZ = 'C:/Users/Minhoca/Projetos/JogosOffline', html = readFileSync(RAIZ + '/jogos/glaze-break/index.html', 'utf8');
export const N = new Function(html.match(/<script id="nucleo">([\s\S]*?)<\/script>/)[1] + ';return Nucleo;')();
export const mira = new Function(readFileSync(new URL('./cerebro.js', import.meta.url), 'utf8') + ';return mira;')();
const arg = k => (process.argv.find(x => x.startsWith('--' + k + '=')) || '').split('=')[1];
let ruins = 0; const ok = (c, m) => { if (!c) { ruins++; console.log('FALHOU:', m); } };

// ------------------------------------------------------------ regras
{
  // regra do esmalte: bola terracota atravessa terracota (quebra sem rebater) e rebate em ocre
  const P = new N.Partida(1); P.cel.forEach(t => { if (t) t.vivo = false; }); P.restam = 99;
  const a = P.cel[2 * 10 + 4] = { k: 'a', cor: 0, hp: 2, max: 2, i: 24, c: 4, r: 2, x: N.X0 + 4 * N.CW, y: N.Y0 + 2 * N.CH, vivo: true, bate: 0 };
  const b2 = P.cel[0 * 10 + 4] = { k: 'a', cor: 1, hp: 1, max: 1, i: 4, c: 4, r: 0, x: N.X0 + 4 * N.CW, y: N.Y0, vivo: true, bate: 0 };
  const bola = P.bolas[0]; Object.assign(bola, { presa: false, x: a.x + N.CW / 2, y: 80, dx: 0, dy: -1, cor: 0 });
  for (let i = 0; i < 120 && b2.vivo; i++) P.passo(1 / 120);
  ok(!a.vivo, 'mesma cor quebra mesmo azulejo grosso'); ok(!b2.vivo, 'segue e quebra o ocre'); ok(bola.dy > 0, 'rebate no ocre'); ok(bola.cor === 1, 'a bola pega o ocre');
  // cor diferente: rebate e só racha o grosso
  const Q = new N.Partida(1); Q.cel.forEach(t => { if (t) t.vivo = false; }); Q.restam = 99;
  const g = Q.cel[24] = { k: 'a', cor: 2, hp: 2, max: 2, i: 24, c: 4, r: 2, x: N.X0 + 4 * N.CW, y: N.Y0 + 2 * N.CH, vivo: true, bate: 0 };
  Object.assign(Q.bolas[0], { presa: false, x: g.x + N.CW / 2, y: 80, dx: 0, dy: -1, cor: 0 });
  for (let i = 0; i < 200 && Q.bolas[0].dy < 0; i++) Q.passo(1 / 120);
  ok(g.vivo && g.hp === 1 && Q.bolas[0].dy > 0 && Q.bolas[0].cor === 0, 'cor diferente rebate e racha');
  // jarro pinta os vizinhos
  const J = new N.Partida(1); J.cel.forEach(t => { if (t) t.vivo = false; }); J.restam = 99; const mk = (c, r, k, cor) => J.cel[r * 10 + c] = { k, cor, hp: 1, max: 1, i: r * 10 + c, c, r, x: N.X0 + c * N.CW, y: N.Y0 + r * N.CH, vivo: true, bate: 0 };
  const jj = mk(4, 3, 'j', 3), v1 = mk(3, 3, 'b', -1), v2 = mk(4, 2, 'a', 1), v3 = mk(6, 3, 'a', 0), v4 = mk(1, 3, 'a', 0);
  Object.assign(J.bolas[0], { presa: false, x: jj.x + N.CW / 2, y: 80, dx: 0, dy: -1, cor: -1 }); for (let i = 0; i < 200 && jj.vivo; i++) J.passo(1 / 120);
  ok(!jj.vivo && v1.k === 'a' && v1.cor === 3 && v2.cor === 3 && v3.cor === 3 && v4.cor === 0, 'jarro pinta vizinhos (não os longe)');
  // as 50 fases: medidas, dente de serra, tudo alcançável e simétrico
  for (let n = 1; n <= 50; n++) {
    const F = N.nivel(n); ok(F.total >= 12, `fase ${n} tem azulejos (${F.total})`);
    ok(F.dif === ((n - 1) % 10 === 9 ? 2 : [4, 8].includes((n - 1) % 10) ? 1 : 0), `dente de serra ${n}`);
    for (let r = 0; r < N.LIN; r++) for (let c = 0; c < 5; c++) { const a1 = F.cel[r * 10 + c], a2 = F.cel[r * 10 + 9 - c]; if (!!a1 !== !!a2 || (a1 && (a1.k !== a2.k || a1.cor !== a2.cor || a1.hp !== a2.hp))) { ok(false, `fase ${n} simétrica (${r},${c})`); r = 99; break; } }
    ok(JSON.stringify(N.nivel(n).cel) === JSON.stringify(F.cel), `fase ${n} sempre igual`);
  }
}

// ------------------------------------------------------------ jogadores simulados
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); }
export function jogar(n, { pessoa = false, semente = 1, max = 900 } = {}) {
  const P = new N.Partida(n, { tentativa: semente }), r = N.rng(semente * 977 + n), dt = 1 / 120;
  let dec = null, prox = 0, alvo = P.rq.x, erro = 0, erroMira = 0, espera = 0, vies = 0, ultQ = 0, ultT = 0;
  for (let t = 0; t < max && !P.fim; t += dt) {
    if (t >= prox) {
      // a pessoa reage a cada ~0,12 s e erra mais a previsão quando a bola está longe
      // erro de previsão sorteado a cada descida, que diminui conforme a bola chega perto
      const d0 = mira(P, N, { vies }); if (pessoa && d0.t < 9 && (!dec || dec.t >= 9 || d0.t > dec.t + .05)) { const v = P.bolas.reduce((m, b) => Math.max(m, b.v), 0), distraiu = r() < .05 + (v - 95) * .002; erro = gauss(r) * (distraiu ? 16 : 4 + (v - 95) * .12); erroMira = gauss(r) * .22; }
      dec = pessoa ? mira(P, N, { erro: erro * (.25 + .75 * Math.min(1, d0.t)), erroMira, vies }) : d0; prox = t + (pessoa ? .12 : 0); alvo = dec.x;
      // sem quebrar nada há 6 s: muda um pouco a mira (gente faz isso sem pensar)
      if (P.quebrados !== ultQ) { ultQ = P.quebrados; ultT = t; vies = 0; } else if (t - ultT > 6) { vies = (r() - .5) * .9; ultT = t; }
    }
    const vmax = pessoa ? 210 : 1e9, dx = alvo - P.rq.x; P.mover(P.rq.x + Math.max(-vmax * dt, Math.min(vmax * dt, dx)));
    if (dec && dec.lancar && P.bolas.some(b => b.presa)) { espera += dt; if (Math.abs(dx) < 1 && espera > (pessoa ? .8 : .1)) { P.lancar(); espera = 0; } }
    P.passo(dt);
  }
  return { fim: P.fim || 'tempo', tempo: P.tempo, perdidas: P.perdidas, estrelas: P.estrelas, total: P.total, veio: P.maiorVeio, pontos: P.pontos };
}
if (process.argv[1] && process.argv[1].endsWith('calibrar.mjs')) {
  const [a, b] = (process.argv.find(x => /^\d+(-\d+)?$/.test(x)) || '1-50').split('-').map(Number), J = +(arg('jogos') || 20);
  console.log('regras:', ruins ? ruins + ' falhas' : 'ok');
  console.log('fase dif linhas azulejos vel barra | robô: vence tempo perde | pessoa: vence tempo(média/máx) bolas perdidas estrelas veio');
  const soma = { v: 0, d: [0, 0, 0], q: [0, 0, 0] };
  for (let n = a; n <= (b || a); n++) {
    const F = N.nivel(n), rb = [], ps = []; for (let s = 1; s <= 3; s++) rb.push(jogar(n, { semente: s })); for (let s = 1; s <= J; s++) ps.push(jogar(n, { pessoa: true, semente: s }));
    const v = l => l.filter(x => x.fim === 'vitoria').length / l.length, med = (l, k) => l.reduce((x, y) => x + y[k], 0) / l.length, mx = (l, k) => Math.max(...l.map(y => y[k]));
    const vp = v(ps); soma.d[F.dif] += vp; soma.q[F.dif]++; if (v(rb) < 1) ruins++;
    console.log(`${String(n).padStart(2)} ${'.!X'[F.dif]} ${String(F.linhas).padStart(2)} ${String(F.total).padStart(3)} ${F.vel.toFixed(0)} ${F.raquete.toFixed(1)} | ${(v(rb) * 100).toFixed(0).padStart(3)}% ${med(rb, 'tempo').toFixed(0).padStart(3)}s ${med(rb, 'perdidas').toFixed(1)} | ${(vp * 100).toFixed(0).padStart(3)}% ${med(ps, 'tempo').toFixed(0).padStart(3)}/${mx(ps, 'tempo').toFixed(0).padStart(3)}s ${med(ps, 'perdidas').toFixed(2)} ${med(ps, 'estrelas').toFixed(1)}★ ${med(ps, 'veio').toFixed(1)}`);
  }
  console.log('pessoa vence em média: normais', (soma.d[0] / soma.q[0] * 100 || 0).toFixed(0) + '%', '| difíceis', (soma.d[1] / soma.q[1] * 100 || 0).toFixed(0) + '%', '| muito difíceis', (soma.d[2] / soma.q[2] * 100 || 0).toFixed(0) + '%');
  console.log('problemas:', ruins);
}
