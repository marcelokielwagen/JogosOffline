// Regras do jogo, sem desenho: pelotão, tiros, zumbis, portões e barris.
// Coordenadas: x = lado (metros), d = distância ao longo da ponte (cresce para a frente).
import { ARMAS, ZUMBIS, PISTA, VELOCIDADE, FRENTE, TRAS, MAX_SOLDADOS } from '../dados/balanco.js';

const limita = (v, a, b) => v < a ? a : v > b ? b : v;

// vagas da formação, do centro para fora (favo de mel, mais largo que fundo)
export const VAGAS = (() => {
  const r = [], P = .66;
  for (let l = -9; l <= 9; l++) for (let c = -9; c <= 9; c++) { const x = (c + (l & 1 ? .5 : 0)) * P, y = l * P * .9; r.push([x, y, x * x * .72 + y * y]); }
  return r.sort((a, b) => a[2] - b[2] || a[0] - b[0]).slice(0, MAX_SOLDADOS);
})();

export const MAX_ZUMBIS = 320, MAX_TIROS = 640;

export function criarSimulacao(trecho, { aoEvento = () => {}, sorte = Math.random, melhorias = {}, maxZumbis = 150, maxSoldados = MAX_SOLDADOS } = {}) {
  const S = {
    trecho, d: 0, frente: 0, x: 0, alvoX: 0, alvoFrente: 0, estado: 'jogando', tempo: 0, mortos: 0, arma: 0, cadenciaExtra: 1, n: 0, perdidos: 0,
    soldados: [], caidos: [], zumbis: [], tiros: [], portoes: [], barris: [],
    multDano: 1 + (melhorias.dano || 0), multCad: 1 + (melhorias.cadencia || 0),
  };
  const livresZ = [], livresT = [];
  for (let i = 0; i < MAX_ZUMBIS; i++) livresZ.push({ id: i });
  for (let i = 0; i < MAX_TIROS; i++) livresT.push({});
  let proximaHorda = 0; const fila = [];

  // ---------- soldados ----------
  function novoSoldado(perto) {
    const v = VAGAS[S.soldados.length]; if (!S.tempo) perto = null;
    S.soldados.push({ x: perto ? perto.x + (sorte() - .5) * .3 : S.x + v[0], d: perto ? perto.d + (sorte() - .5) * .3 : S.d + v[1], vx: 0, semente: sorte(), fase: sorte(), espera: sorte() * .4, nasceu: S.tempo, inclina: 0 });
  }
  function somar(q) {
    const antes = S.n; S.n = Math.max(0, S.n + q);
    if (q > 0) while (S.soldados.length < Math.min(S.n, maxSoldados)) novoSoldado(S.soldados[Math.floor(sorte() * Math.max(1, Math.min(antes, S.soldados.length)))]);
    else while (S.soldados.length > Math.min(S.n, maxSoldados)) derrubar(S.soldados.length - 1, false);
    if (S.n <= 0) perder();
    return S.n - antes;
  }
  function derrubar(i, conta = true) {
    const s = S.soldados[i]; if (!s) return;
    S.caidos.push({ x: s.x, d: s.d, semente: s.semente, t: 0, quem: 'soldado' });
    if (conta) { S.n--; S.perdidos++; }
    // o último soldado assume a vaga de quem caiu
    const u = S.soldados.pop(); if (u !== s) S.soldados[i] = u;
    if (S.n > S.soldados.length && S.soldados.length < maxSoldados && S.n > 0) novoSoldado(S.soldados[0]);
    aoEvento('soldado', s);
    if (S.n <= 0) perder();
  }
  function perder() { if (S.estado === 'jogando') { S.n = 0; S.estado = 'derrota'; aoEvento('derrota'); } }

  // ---------- zumbis ----------
  function nascer(tipo, x, d) {
    const z = livresZ.pop(); if (!z) return false;
    const T = ZUMBIS[tipo];
    Object.assign(z, { tipo, T, x, d, vida: T.vida, vel: T.vel * (.85 + sorte() * .3), fase: sorte(), semente: sorte(), jeito: sorte() < .5 ? 0 : 1, dano: 0, recuo: 0, ang: 0, morto: false, esc: T.escala * (.94 + sorte() * .12) });
    S.zumbis.push(z); return true;
  }
  function matar(z, dir) {
    if (z.morto) return;
    z.morto = true; S.mortos += z.T.pontos;
    S.caidos.push({ x: z.x, d: z.d, semente: z.semente, t: 0, quem: 'zumbi', jeito: dir ?? (sorte() < .7 ? 0 : 1), ang: z.ang, esc: z.esc, vel: 1.2 + sorte() * 1.6 });
    aoEvento('morte', z);
    const A = ARMAS[S.arma]; if (S.mortos >= A.meta && S.arma < ARMAS.length - 1) evoluir('meta');
  }
  function evoluir(como) {
    if (S.arma >= ARMAS.length - 1) { S.cadenciaExtra *= 1.15; aoEvento('cadencia'); return; }
    S.arma++; aoEvento('arma', { arma: ARMAS[S.arma], como });
  }
  function ferir(z, dano, dx) { z.vida -= dano; z.dano = 1; z.recuo = Math.min(.5, z.recuo + (z.tipo === 'blindado' ? .02 : .1)); if (z.vida <= 0) matar(z, dx); }

  // ---------- portões e barris ----------
  const lerPortao = t => t[0] === '+' ? { tipo: 'soma', v: +t.slice(1) } : t[0] === '-' ? { tipo: 'soma', v: -t.slice(1) } : t[0] === '*' ? { tipo: 'vezes', v: +t.slice(1) } : t[0] === '/' ? { tipo: 'divide', v: +t.slice(1) } : t[0] === 'a' ? { tipo: 'arma' } : t[0] === 'c' ? { tipo: 'cadencia', v: 25 } : { tipo: 'tiro', v: +t.slice(1), pancadas: 0 };
  for (const p of trecho.portoes) S.portoes.push({ d: p.d, lados: [lerPortao(p.e), lerPortao(p.f)], usado: -1 });
  for (const [d, x] of trecho.barris) S.barris.push({ d, x, vida: 120, max: 120, vivo: true, dano: 0 });
  const bom = l => l.tipo === 'soma' || l.tipo === 'tiro' ? l.v >= 0 : l.tipo !== 'divide';
  function passar(p) {
    const k = S.x < 0 ? 0 : 1, l = p.lados[k]; p.usado = k;
    let q = 0;
    if (l.tipo === 'soma' || l.tipo === 'tiro') q = somar(l.v);
    else if (l.tipo === 'vezes') q = somar(S.n * (l.v - 1));
    else if (l.tipo === 'divide') q = somar(Math.ceil(S.n / l.v) - S.n);
    else if (l.tipo === 'arma') evoluir('portao');
    else S.cadenciaExtra *= 1 + l.v / 100;
    aoEvento('portao', { p, k, l, q, bom: bom(l) });
  }
  function estourar(b) {
    b.vivo = false; aoEvento('barril', b);
    for (const z of S.zumbis) { const r = Math.hypot(z.x - b.x, z.d - b.d); if (r < 4.2) ferir(z, 140 * (1 - r / 5.5), 0); }
    for (const o of S.barris) if (o.vivo && Math.hypot(o.x - b.x, o.d - b.d) < 4) o.vida = Math.min(o.vida, 1);
  }

  // ---------- tiros ----------
  function atirar(s, A) {
    const t = livresT.pop(); if (!t) return;
    const extra = S.n / S.soldados.length, m = mirar(s, A), a = (m ? limita((m.x - s.x) / Math.max(3, m.d - s.d - .75), -.2, .2) : 0) + (sorte() - .5) * 2 * A.abre;
    Object.assign(t, { x: s.x - .05, d: s.d + .75, x0: s.x, vx: a * A.vel, vel: A.vel, resta: A.alcance, dano: A.dano * S.multDano * extra, passa: A.atravessa, morto: false, ultimo: null });
    S.tiros.push(t); s.tiro = S.tempo;
    aoEvento('tiro', s);
  }

  // ajuda de mira: cada soldado prefere o zumbi mais próximo num cone estreito à frente
  const miras = [];
  function mirar(s, A) {
    let melhor = null, nota = 1e9;
    for (const z of miras) { if (z.morto) continue; const dd = z.d - s.d; if (dd < .5 || dd > A.alcance) continue; const ang = Math.abs(z.x - s.x) / dd; if (ang > .2) continue; const q = dd * (1 + ang * 4); if (q < nota) { nota = q; melhor = z; } }
    return melhor;
  }

  // grade para achar zumbis perto rapidamente
  const CEL = 1.5, grade = new Map(), chave = (x, d) => Math.floor((x + 20) / CEL) * 4096 + Math.floor(d / CEL);
  function montarGrade() { for (const l of grade.values()) l.length = 0; for (const z of S.zumbis) { const k = chave(z.x, z.d); let l = grade.get(k); if (!l) grade.set(k, l = []); l.push(z); } if (grade.size > 3000) grade.clear(); }
  function perto(x, d, fn) { const i = Math.floor((x + 20) / CEL), j = Math.floor(d / CEL); for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { const l = grade.get(a * 4096 + b); if (l) for (const z of l) if (fn(z)) return true; } return false; }

  // ---------- passo ----------
  function passo(dt) {
    S.tempo += dt;
    if (S.estado === 'jogando') {
      S.d += VELOCIDADE * dt;
      if (S.d >= trecho.comprimento) { S.estado = 'vitoria'; aoEvento('vitoria'); }
    } else if (S.estado === 'vitoria') S.d += VELOCIDADE * .5 * dt;
    // meia largura do pelotão, para ninguém sair da pista
    let meia = 0; const nv = S.soldados.length; for (let i = 0; i < nv; i++) meia = Math.max(meia, Math.abs(VAGAS[i][0]));
    const lim = Math.max(.6, PISTA + .5 - meia);
    S.alvoX = limita(S.alvoX, -lim, lim); S.alvoFrente = limita(S.alvoFrente, TRAS, FRENTE);
    S.x += (S.alvoX - S.x) * Math.min(1, dt * 14); S.frente += (S.alvoFrente - S.frente) * Math.min(1, dt * 10);
    const A = ARMAS[S.arma], cad = A.cadencia * S.multCad * S.cadenciaExtra, centro = S.d + S.frente;
    let frenteMax = -1e9;
    for (let i = 0; i < S.soldados.length; i++) {
      const s = S.soldados[i], v = VAGAS[i], ax = S.x + v[0], ad = centro + v[1], k = Math.min(1, dt * 11), x0 = s.x;
      s.x += (ax - s.x) * k; s.d += (ad - s.d) * k; s.vx = (s.x - x0) / Math.max(dt, .001); s.inclina += (limita(s.vx * .05, -.35, .35) - s.inclina) * Math.min(1, dt * 8); s.fase += dt * (1.45 + s.semente * .12);
      if (s.d > frenteMax) frenteMax = s.d;
      if (S.estado !== 'derrota') { s.espera -= dt; if (s.espera <= 0) { s.espera += 1 / cad; if (s.espera < -.1) s.espera = 0; if (temAlvo(A, s)) atirar(s, A); } }
    }
    // hordas entram quando chegam perto
    while (proximaHorda < trecho.hordas.length && trecho.hordas[proximaHorda][0] < S.d + 62) { const [d, t, q, l, p] = trecho.hordas[proximaHorda++]; for (let i = 0; i < q; i++) fila.push([t, (sorte() - .5) * l, d + 8 + (sorte() - .5) * p]); }
    while (fila.length && S.zumbis.length < maxZumbis) { const [t, x, d] = fila.shift(); nascer(t, limita(x, -PISTA, PISTA), Math.max(d, S.d + 45)); }
    montarGrade();
    moverZumbis(dt, frenteMax, centro);
    moverTiros(dt);
    for (const p of S.portoes) if (p.usado < 0 && centro >= p.d && S.estado === 'jogando') passar(p);
    for (const b of S.barris) { b.dano = Math.max(0, b.dano - dt * 5); if (b.vivo && b.vida <= 0) estourar(b); if (b.vivo) for (let i = S.soldados.length - 1; i >= 0; i--) { const s = S.soldados[i]; if (Math.abs(s.x - b.x) < .65 && Math.abs(s.d - b.d) < .65) { derrubar(i); b.vida -= 60; break; } } }
    for (let i = S.caidos.length - 1; i >= 0; i--) { const c = S.caidos[i]; c.t += dt; if (c.vel) { c.d += c.vel * Math.max(0, .5 - c.t) * dt * (c.jeito ? -1 : 2); } if (c.t > 6 || c.d < S.d - 14) { S.caidos[i] = S.caidos[S.caidos.length - 1]; S.caidos.pop(); } }
  }
  // só atira se houver algo na frente (evita barulho à toa)
  let alvoAte = 0, alvoTem = false;
  function temAlvo(A) {
    if (S.tempo < alvoAte) return alvoTem;
    alvoAte = S.tempo + .12; const c = S.d + S.frente; alvoTem = false;
    miras.length = 0; for (const z of S.zumbis) if (z.d > c - 1.5 && z.d < c + A.alcance + 4) miras.push(z);
    if (miras.length > 48) { miras.sort((a, b) => a.d - b.d); miras.length = 48; }
    for (const z of S.zumbis) if (z.d - c < A.alcance + 2 && z.d > c - 2) { alvoTem = true; return true; }
    for (const p of S.portoes) if (p.usado < 0 && p.d - c < A.alcance && p.lados.some(l => l.tipo === 'tiro')) { alvoTem = true; return true; }
    for (const b of S.barris) if (b.vivo && b.d > c && b.d - c < A.alcance && Math.abs(b.x - S.x) < 2.5) { alvoTem = true; return true; }
    return false;
  }
  function moverZumbis(dt, frenteMax, centro) {
    for (let i = S.zumbis.length - 1; i >= 0; i--) {
      const z = S.zumbis[i];
      if (z.morto || z.d < S.d - 12) { S.zumbis[i] = S.zumbis[S.zumbis.length - 1]; S.zumbis.pop(); livresZ.push(z); continue; }
      z.dano = Math.max(0, z.dano - dt * 7);
      const dist = z.d - centro; let vx = 0, vd = -z.vel;
      if (S.soldados.length && dist < 16) { // persegue o soldado mais próximo
        let m = null, md = 1e9; const passoBusca = S.soldados.length > 30 ? 3 : 1;
        for (let k = (z.id % passoBusca); k < S.soldados.length; k += passoBusca) { const s = S.soldados[k], q = (s.x - z.x) ** 2 + (s.d - z.d) ** 2; if (q < md) { md = q; m = s; } }
        const l = Math.sqrt(md) || 1, f = limita(1.3 - dist / 16, .15, 1), dx = (m.x - z.x) / l, dd = (m.d - z.d) / l;
        vx = dx * z.vel * f * 1.2; vd = -z.vel * (1 - f) + dd * z.vel * f;
      } else vx = Math.sin(S.tempo * .8 + z.semente * 40) * .25;
      if (S.estado === 'derrota') { vd = -z.vel * .6; }
      z.recuo = Math.max(0, z.recuo - dt * 1.6); const fr = 1 - z.recuo;
      // afasta dos vizinhos
      let ex = 0, ed = 0; perto(z.x, z.d, o => { if (o === z || o.morto) return; const dx = z.x - o.x, dd = z.d - o.d, r = z.T.raio + o.T.raio, q = dx * dx + dd * dd; if (q < r * r && q > 1e-6) { const l = Math.sqrt(q), f = (r - l) / l; ex += dx * f; ed += dd * f; } });
      z.x = limita(z.x + vx * fr * dt + ex * Math.min(.5, dt * 6), -PISTA - .6, PISTA + .6); z.d += vd * fr * dt + ed * Math.min(.5, dt * 6);
      z.ang += (Math.atan2(vx, -vd) - z.ang) * Math.min(1, dt * 6);
      z.fase += dt * (z.tipo === 'corredor' ? 1.55 : z.vel * .42) * (.5 + fr * .5);
      if (z.d < frenteMax + 1 && S.estado === 'jogando') for (let k = S.soldados.length - 1; k >= 0; k--) {
        const s = S.soldados[k]; if ((s.x - z.x) ** 2 + (s.d - z.d) ** 2 < (z.T.raio + .32) ** 2) {
          if (z.tipo === 'blindado') { for (let q = 0; q < z.T.custo && S.n > 0; q++) derrubar(Math.min(k, S.soldados.length - 1)); } else derrubar(k);
          matar(z, 1); break;
        }
      }
    }
  }
  function moverTiros(dt) {
    for (let i = S.tiros.length - 1; i >= 0; i--) {
      const t = S.tiros[i], d0 = t.d; t.d += t.vel * dt; t.x += t.vx * dt; t.resta -= t.vel * dt;
      // zumbis no caminho deste passo
      for (let c = d0; c <= t.d + .75 && !t.morto; c += 1.2) perto(t.x, Math.min(c, t.d), z => {
        if (z.morto || z === t.ultimo) return;
        if (Math.abs(z.x - t.x) < z.T.raio * 1.05 && z.d > d0 - .5 && z.d < t.d + .35) { aoEvento('acerto', { x: t.x, d: z.d, z }); ferir(z, t.dano); t.ultimo = z; if (t.passa-- <= 0) { t.morto = true; return true; } }
      });
      if (!t.morto) for (const b of S.barris) if (b.vivo && Math.abs(b.x - t.x) < .45 && b.d > d0 - .4 && b.d < t.d + .3) { b.vida -= t.dano; b.dano = 1; t.morto = true; aoEvento('faisca', { x: t.x, d: b.d - .4 }); break; }
      if (!t.morto) for (const p of S.portoes) if (p.usado < 0 && p.d > d0 && p.d <= t.d) { const l = p.lados[t.x < 0 ? 0 : 1]; if (l.tipo === 'tiro') { l.pancadas += t.dano; const ganho = Math.floor(l.pancadas / 40); if (ganho) { l.pancadas -= ganho * 40; const era = l.v; l.v = Math.min(30, l.v + ganho); p.mudou = true; if (era < 0 && l.v >= 0) aoEvento('virou', { p, k: t.x < 0 ? 0 : 1 }); } t.morto = true; aoEvento('faiscaPortao', { x: t.x, d: p.d, bom: l.v >= 0 }); } }
      if (t.morto || t.resta <= 0) { S.tiros[i] = S.tiros[S.tiros.length - 1]; S.tiros.pop(); livresT.push(t); }
    }
  }
  somar(trecho.inicio + (melhorias.soldados || 0));
  return Object.assign(S, {
    passo, somar, evoluir, bom,
    mover(dx, dd) { S.alvoX += dx; S.alvoFrente += dd; },
  });
}
