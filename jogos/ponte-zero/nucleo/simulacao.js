// Regras do jogo, sem desenho: pelotão, armas, zumbis, portões, barris e a luta com o chefe.
// Coordenadas: x = lado (metros), d = distância ao longo da ponte (cresce para a frente).
import { ARMAS, ESPECIAL, ZUMBIS, CHEFES, ARENA, PISTA, VELOCIDADE, FRENTE, TRAS, MAX_SOLDADOS } from '../dados/balanco.js';

const limita = (v, a, b) => v < a ? a : v > b ? b : v;
const BASICAS = 3; // pistola, submetralhadora e fuzil: as armas do pelotão inteiro

// vagas da formação, do centro para fora (favo de mel, mais largo que fundo)
export const VAGAS = (() => {
  const r = [], P = .7;
  for (let l = -9; l <= 9; l++) for (let c = -9; c <= 9; c++) { const x = (c + (l & 1 ? .5 : 0)) * P, y = l * P * .9; r.push([x, y, x * x * .72 + y * y]); }
  return r.sort((a, b) => a[2] - b[2] || a[0] - b[0]).slice(0, MAX_SOLDADOS);
})();

export const MAX_ZUMBIS = 320, MAX_TIROS = 640;

export function criarSimulacao(trecho, { aoEvento = () => {}, sorte = Math.random, melhorias = {}, maxZumbis = 150, maxSoldados = MAX_SOLDADOS } = {}) {
  const S = {
    trecho, d: 0, frente: 0, x: 0, alvoX: 0, alvoFrente: 0, estado: 'jogando', tempo: 0, mortos: 0, arma: 0, cadenciaExtra: 1, n: 0, perdidos: 0, esp: 0, ritmo: 1, atordoado: 0,
    soldados: [], caidos: [], zumbis: [], tiros: [], portoes: [], barris: [], marcas: [], buracos: [], chefe: null, luta: '', tLuta: 0,
    multDano: 1 + (melhorias.dano || 0), multCad: 1 + (melhorias.cadencia || 0),
  };
  const livresZ = [], livresT = [];
  for (let i = 0; i < MAX_ZUMBIS; i++) livresZ.push({ id: i });
  for (let i = 0; i < MAX_TIROS; i++) livresT.push({});
  let proximaHorda = 0; const fila = [];

  // ---------- soldados ----------
  function novoSoldado(perto, arma) {
    const v = VAGAS[S.soldados.length]; if (!S.tempo) perto = null;
    S.soldados.push({ x: perto ? perto.x + (sorte() - .5) * .3 : S.x + v[0], d: perto ? perto.d + (sorte() - .5) * .3 : S.d + v[1], vx: 0, semente: sorte(), fase: sorte(), espera: sorte() * .4, nasceu: S.tempo, inclina: 0, arma, calor: 0 });
    if (arma) S.esp++;
  }
  // tira do desenho um soldado comum, do fim da formação (especialista só se não houver outro)
  function tirarUm() { let i = S.soldados.length - 1; while (i >= 0 && S.soldados[i].arma) i--; derrubar(i < 0 ? S.soldados.length - 1 : i, false); }
  function somar(q) {
    const antes = S.n; S.n = Math.max(0, S.n + q);
    if (q > 0) while (S.soldados.length < Math.min(S.n, maxSoldados)) novoSoldado(S.soldados[Math.floor(sorte() * Math.max(1, Math.min(antes, S.soldados.length)))]);
    else while (S.soldados.length > Math.min(S.n, maxSoldados)) tirarUm();
    if (S.n <= 0) perder();
    return S.n - antes;
  }
  function especialistas(arma, q) {
    for (let i = 0; i < q; i++) {
      S.n++; if (S.soldados.length < maxSoldados) novoSoldado(S.soldados[0], arma);
      else { const s = S.soldados.find(s => !s.arma); if (s) { s.arma = arma; s.nasceu = S.tempo; S.esp++; } }
    }
    return q;
  }
  function derrubar(i, conta = true) {
    const s = S.soldados[i]; if (!s) return;
    S.caidos.push({ x: s.x, d: s.d, semente: s.semente, t: 0, quem: 'soldado', arma: s.arma });
    if (conta) { S.n--; S.perdidos++; } if (s.arma) S.esp--;
    // o último soldado assume a vaga de quem caiu
    const u = S.soldados.pop(); if (u !== s) S.soldados[i] = u;
    if (S.n > S.soldados.length && S.soldados.length < maxSoldados && S.n > 0) novoSoldado(S.soldados[0]);
    aoEvento('soldado', s);
    if (S.n <= 0) perder();
  }
  function perder() { if (S.estado === 'jogando') { S.n = 0; S.estado = 'derrota'; S.marcas.length = 0; aoEvento('derrota'); } }

  // ---------- zumbis ----------
  function nascer(tipo, x, d) {
    const z = livresZ.pop(); if (!z) return false;
    const T = ZUMBIS[tipo];
    Object.assign(z, { tipo, T, x, d, vida: T.vida, vel: T.vel * (.85 + sorte() * .3), fase: sorte(), semente: sorte(), jeito: sorte() < .5 ? 0 : 1, dano: 0, recuo: 0, ang: 0, morto: false, fogo: 0, esc: T.escala * (.94 + sorte() * .12) });
    S.zumbis.push(z); return true;
  }
  function matar(z, dir) {
    if (z.morto) return;
    z.morto = true; S.mortos += z.T.pontos;
    S.caidos.push({ x: z.x, d: z.d, semente: z.semente, t: 0, quem: 'zumbi', tipo: z.tipo, jeito: dir ?? (sorte() < .7 ? 0 : 1), ang: z.ang, esc: z.esc, vel: 1.2 + sorte() * 1.6, fogo: z.fogo > 0 });
    aoEvento('morte', z);
    if (S.arma < BASICAS - 1 && S.mortos >= ARMAS[S.arma].meta) evoluir('meta');
  }
  function evoluir(como) {
    if (S.arma >= BASICAS - 1) { S.cadenciaExtra *= 1.15; aoEvento('cadencia'); return; }
    S.arma++; aoEvento('arma', { arma: ARMAS[S.arma], como });
  }
  function ferir(z, dano, dx, leve) { z.vida -= dano; if (!leve) { z.dano = 1; z.recuo = Math.min(.5, z.recuo + (z.tipo === 'blindado' ? .02 : .1)); } if (z.vida <= 0) matar(z, dx); }
  function explodir(x, d, raio, dano, quem) {
    aoEvento('explosao', { x, d, raio, quem });
    for (const z of S.zumbis) { if (z.morto) continue; const r = Math.hypot(z.x - x, z.d - d); if (r < raio) ferir(z, dano * (1 - r / (raio * 1.35)), 0); }
    for (const o of S.barris) if (o.vivo && Math.hypot(o.x - x, o.d - d) < raio) { o.vida -= dano; o.dano = 1; }
  }

  // ---------- portões e barris ----------
  const lerPortao = t => t[0] === '+' ? { tipo: 'soma', v: +t.slice(1) } : t[0] === '-' ? { tipo: 'soma', v: -t.slice(1) } : t[0] === '*' ? { tipo: 'vezes', v: +t.slice(1) } : t[0] === '/' ? { tipo: 'divide', v: +t.slice(1) } : t[0] === 'a' ? { tipo: 'arma' } : t[0] === 'c' ? { tipo: 'cadencia', v: 25 } : ESPECIAL[t[0]] ? { tipo: 'especial', arma: ESPECIAL[t[0]], v: +t.slice(1) } : { tipo: 'tiro', v: +t.slice(1), pancadas: 0 };
  for (const p of trecho.portoes) S.portoes.push({ d: p.d, lados: [lerPortao(p.e), lerPortao(p.f)], usado: -1 });
  for (const [d, x] of trecho.barris) S.barris.push({ d, x, vida: 120, max: 120, vivo: true, dano: 0 });
  // caixas de reforço: caem durante a luta com o chefe
  for (let k = 0; k < 2; k++) S.barris.push({ d: -50, x: 0, vida: 0, max: 0, vivo: false, dano: 0, reforco: 1, alt: 0 });
  const bom = l => l.tipo === 'soma' || l.tipo === 'tiro' ? l.v >= 0 : l.tipo !== 'divide';
  function passar(p) {
    const k = S.x < 0 ? 0 : 1, l = p.lados[k]; p.usado = k;
    let q = 0;
    if (l.tipo === 'soma' || l.tipo === 'tiro') q = somar(l.v);
    else if (l.tipo === 'vezes') q = somar(S.n * (l.v - 1));
    else if (l.tipo === 'divide') q = somar(Math.ceil(S.n / l.v) - S.n);
    else if (l.tipo === 'arma') evoluir('portao');
    else if (l.tipo === 'especial') q = especialistas(l.arma, l.v);
    else S.cadenciaExtra *= 1 + l.v / 100;
    aoEvento('portao', { p, k, l, q, bom: bom(l) });
  }
  function estourar(b) {
    b.vivo = false;
    if (b.reforco) { aoEvento('reforco', { b, q: somar(b.reforco) }); return; }
    aoEvento('barril', b);
    for (const z of S.zumbis) { const r = Math.hypot(z.x - b.x, z.d - b.d); if (r < 4.2) ferir(z, 140 * (1 - r / 5.5), 0); }
    for (const o of S.barris) if (o.vivo && !o.reforco && Math.hypot(o.x - b.x, o.d - b.d) < 4) o.vida = Math.min(o.vida, 1);
  }

  // ---------- tiros ----------
  let distAlvo = 1e9, alvoAte = 0, porTiro = 1; const miras = [];
  function atirar(s, A, arma) {
    if (A.jato) return jato(s, A, arma);
    const t = livresT.pop(); if (!t) return;
    const m = mirar(s, A), a = (m ? limita((m.x - s.x) / Math.max(3, m.d - s.d - .75), -.22, .22) : 0) + (sorte() - .5) * 2 * A.abre;
    Object.assign(t, { x: s.x - .05, d: s.d + .75, x0: s.x, vx: a * A.vel, vel: A.vel, resta: alcance(A) + 2, dano: A.dano * S.multDano * (A.especial ? 1 : porTiro), passa: A.atravessa, morto: false, ultimo: null, arma, nasceu: S.tempo });
    S.tiros.push(t); s.tiro = S.tempo; s.calor = 1; s.mira = a;
    aoEvento('tiro', { s, arma });
  }
  // lança-chamas: tudo dentro do leque curto à frente queima
  function jato(s, A, arma) {
    const al = alcance(A), m = mirar(s, A); s.tiro = S.tempo; s.calor = 1; s.mira = m ? limita((m.x - s.x) / Math.max(2, m.d - s.d), -.3, .3) : 0;
    for (const z of miras) { if (z.morto) continue; const dd = z.d - s.d; if (dd < .2 || dd > al) continue; if (Math.abs(z.x - s.x - s.mira * dd) > .5 + dd * A.abre) continue; z.fogo = 2.2; ferir(z, A.dano * S.multDano, 0, true); }
    for (const b of S.barris) if (b.vivo && b.d > s.d && b.d - s.d < al && Math.abs(b.x - s.x - s.mira * (b.d - s.d)) < .6 + (b.d - s.d) * A.abre) { b.vida -= A.dano; b.dano = .4; }
    const c = S.chefe; if (c && S.luta === 'luta' && c.d - c.T.raio - s.d < al && Math.abs(c.x - s.x - s.mira * (c.d - s.d)) < c.T.raio + 1) ferirChefe(A.dano * S.multDano, true);
    aoEvento('tiro', { s, arma });
  }
  const alcance = A => S.luta && !A.jato ? Math.max(38, A.alcance) : S.luta ? A.alcance + 3 : A.alcance;
  // ajuda de mira: cada soldado prefere o alvo mais próximo num cone estreito à frente
  function mirar(s, A) {
    let melhor = null, nota = 1e9; const al = alcance(A);
    for (const z of miras) { if (z.morto) continue; const dd = z.d - s.d; if (dd < .5 || dd > al) continue; const ang = Math.abs(z.x - s.x) / dd; if (ang > .22) continue; const q = dd * (1 + ang * 4); if (q < nota) { nota = q; melhor = z; } }
    const c = S.chefe; if (c && S.luta === 'luta') { const dd = c.d - s.d; if (dd - c.T.raio < al && dd < nota + 2) melhor = { x: c.x + limita(s.x - c.x, -c.T.raio * .7, c.T.raio * .7), d: c.d }; }
    return melhor;
  }
  // a que distância está o alvo mais próximo (só atira se houver algo na frente)
  function verAlvos() {
    if (S.tempo < alvoAte) return; alvoAte = S.tempo + .12; const c = S.d + S.frente; distAlvo = 1e9;
    miras.length = 0; for (const z of S.zumbis) if (z.d > c - 1.5 && z.d < c + 42) { miras.push(z); if (z.d - c < distAlvo) distAlvo = z.d - c; }
    if (miras.length > 48) { miras.sort((a, b) => a.d - b.d); miras.length = 48; }
    for (const p of S.portoes) if (p.usado < 0 && p.d > c && p.lados.some(l => l.tipo === 'tiro')) distAlvo = Math.min(distAlvo, p.d - c + 2);
    for (const b of S.barris) if (b.vivo && b.d > c && Math.abs(b.x - S.x) < 2.5) distAlvo = Math.min(distAlvo, b.d - c + 2);
    if (S.chefe && S.luta === 'luta') distAlvo = Math.min(distAlvo, S.chefe.d - S.chefe.T.raio - c);
  }

  // grade para achar zumbis perto rapidamente
  const CEL = 1.5, grade = new Map(), chave = (x, d) => Math.floor((x + 20) / CEL) * 4096 + Math.floor(d / CEL);
  function montarGrade() { for (const l of grade.values()) l.length = 0; for (const z of S.zumbis) { const k = chave(z.x, z.d); let l = grade.get(k); if (!l) grade.set(k, l = []); l.push(z); } if (grade.size > 3000) grade.clear(); }
  function perto(x, d, fn) { const i = Math.floor((x + 20) / CEL), j = Math.floor(d / CEL); for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { const l = grade.get(a * 4096 + b); if (l) for (const z of l) if (fn(z)) return true; } return false; }

  // ---------- chefe ----------
  function chegarChefe() {
    const T = CHEFES[trecho.chefe], vida = Math.round(trecho.vida * limita(.65 + .35 * S.n / trecho.tropa, .7, 1.5)); S.luta = 'chega'; S.tLuta = 0; fila.length = 0; proximaHorda = trecho.hordas.length;
    S.chefe = { id: trecho.chefe, T, vida, max: vida, x: 0, d: S.d + ARENA.comeca, alt: 16, estado: 'cai', t: 0, fase: 0, dano: 0, passo: 0, vel: 0, golpe: null, ultimo: -1, gira: 0, placas: Array.from({ length: T.placas || 0 }, () => ({ vida: vida * .06, viva: true })), vai: 0 };
    aoEvento('chefeEntra', S.chefe);
  }
  function ferirChefe(dano, leve) {
    const c = S.chefe; if (S.luta !== 'luta' || !c || c.vida <= 0) return;
    const p = c.placas.find(p => p.viva);
    if (p) { p.vida -= dano * .65; dano *= .35; if (p.vida <= 0) { p.viva = false; aoEvento('placaCaiu', { c, i: c.placas.indexOf(p) }); if (c.estado === 'anda') muda('tonto', .7); } }
    c.vida -= dano; if (!leve) c.dano = Math.min(1, c.dano + .25);
    if (c.vida <= 0) { c.vida = 0; morrerChefe(); return; }
    const f = c.vida < c.max / 3 ? 2 : c.vida < c.max * 2 / 3 ? 1 : 0;
    if (f > c.fase) { c.fase = f; c.mudaFase = true; }
  }
  function morrerChefe() {
    S.luta = 'morre'; S.tLuta = 0; S.marcas.length = 0; S.buracos.length = 0; S.atordoado = 0; muda('morre', 9); S.mortos += 50; aoEvento('chefeMorre', S.chefe);
    for (const z of S.zumbis) if (!z.morto) { z.vida = 0; z.fogo = .3 + sorte() * 1.2; }
  }
  function muda(e, dur) { const c = S.chefe; c.estado = e; c.t = 0; c.dur = dur; }
  const marcar = m => { m.t = 0; S.marcas.push(m); aoEvento('marca', m); };
  const faixa = (x, larg, d0, d1, dur, op) => marcar({ forma: 'faixa', x, larg, d0, d1, dur, ...op });
  const circulo = (x, d, r, dur, op) => marcar({ forma: 'circulo', x, d, r, dur, ...op });
  // cada golpe marca o chão agora e bate quando o aviso acaba
  function atacar() {
    const c = S.chefe, L = c.T.golpes[c.fase]; let k = Math.floor(sorte() * L.length); if (L.length > 1 && k === c.ultimo) k = (k + 1) % L.length; c.ultimo = k;
    const g = c.golpe = L[k], av = c.T.aviso * [1, .95, .88][c.fase], px = limita(S.x, -3.6, 3.6), cen = S.d + S.frente, ate = c.d - c.T.raio;
    let total = av; c.alvo = { x: px, d: cen };
    if (g === 'porrete') faixa(px, 3.3, cen - 5, ate, av, { som: 'pancada' });
    else if (g === 'varrida') faixa(0, 10.8, cen + .3, ate, av, { som: 'varrida' });
    else if (g === 'duplo') { const s = px < 0 ? -1 : 1; faixa(s * 2.7, 5.3, cen - 5, ate, av, { som: 'pancada' }); faixa(-s * 2.7, 5.3, cen - 5, ate, av + 1.05, { som: 'pancada' }); total = av + 1.05; }
    else if (g === 'buraco') circulo(px, cen, 2.3, av, { som: 'pancada', buraco: true });
    else if (g === 'entulho') { for (let i = 0; i < 4; i++) circulo(limita(px + (sorte() - .5) * 6, -4.6, 4.6), cen + (sorte() - .4) * 5, 1.5, av + i * .28, { som: 'pedra', cai: true }); total = av + .3; }
    else if (g === 'onda') { faixa(0, 3.4, cen - 5, ate, av, { som: 'pancada' }); faixa(-3.7, 3.6, cen - 5, ate, av + .95, { som: 'onda' }); faixa(3.7, 3.6, cen - 5, ate, av + .95, { som: 'onda' }); total = av; }
    else if (g === 'grito') faixa(px, 4.4, cen - 5, ate, av, { som: 'grito', atordoa: 1.5, perda: .22, chama: 7 + c.fase * 4 });
    else if (g === 'garra') circulo(px, cen + .5, 2.5, av * .9, { som: 'pancada' });
    else if (g === 'ondas') { [-3.4, 0, 3.4].forEach((x, i) => circulo(x, cen + .5, 1.9, av + (px < 0 ? i : 2 - i) * .4, { som: 'onda' })); total = av + .4; }
    else if (g === 'placa') faixa(px, 2.5, cen - 6, ate, av, { som: 'placa', lanca: true });
    else if (g === 'investida') { const fim = Math.max(cen - 3, c.d - 12); faixa(c.x, 4.6, fim, ate, av, { som: 'pancada' }); c.vai = Math.min(8.5, Math.max(3, c.d - cen - 4.2)); }
    else if (g === 'pisao') circulo(px, cen + .6, 3, av, { som: 'pancada' });
    muda('prepara', total);
  }
  function bater(m) {
    const c = S.chefe; let dentro = 0; const alvo = [];
    for (let i = 0; i < S.soldados.length; i++) { const s = S.soldados[i]; if (m.forma === 'faixa' ? Math.abs(s.x - m.x) < m.larg / 2 && s.d > m.d0 && s.d < m.d1 : Math.hypot(s.x - m.x, s.d - m.d) < m.r) { dentro++; alvo.push(s); } }
    aoEvento('golpe', { m, dentro });
    if (dentro) { const q = Math.ceil(dentro * (m.perda ?? c.T.perda) * (S.n / S.soldados.length)); for (let k = 0; k < q && S.n > 0; k++) { const s = alvo.length ? alvo.splice(Math.floor(sorte() * alvo.length), 1)[0] : null, i = s ? S.soldados.indexOf(s) : -1; derrubar(i >= 0 ? i : S.soldados.length - 1); } if (m.atordoa && S.estado === 'jogando') { S.atordoado = m.atordoa; aoEvento('atordoado'); } }
    for (const z of S.zumbis) if (!z.morto && (m.forma === 'faixa' ? Math.abs(z.x - m.x) < m.larg / 2 && z.d > m.d0 && z.d < m.d1 : Math.hypot(z.x - m.x, z.d - m.d) < m.r) && !m.atordoa) ferir(z, 60, 0);
    if (m.buraco) { if (S.buracos.length > 2) S.buracos.shift(); S.buracos.push({ x: m.x, d: m.d, r: 1.45, t: 0, dur: 11, espera: 0 }); }
    if (m.chama) for (let i = 0; i < m.chama; i++) nascer('corredor', limita((sorte() - .5) * 10, -PISTA, PISTA), c.d + 1 + sorte() * 7);
  }
  function passoChefe(dt, frenteMax) {
    const c = S.chefe, T = c.T; S.tLuta += dt; c.t += dt; c.dano = Math.max(0, c.dano - dt * 4); S.atordoado = Math.max(0, S.atordoado - dt); let anda = 0;
    if (S.luta === 'chega') {
      if (c.estado === 'cai') { c.alt = Math.max(0, 16 * (1 - (c.t / .85) ** 2)); if (c.t >= .85) { c.alt = 0; muda('ruge', 1.9); aoEvento('chefePousa', c); } }
      else if (c.t >= c.dur) { S.luta = 'luta'; muda('anda', 1.1); }
      return;
    }
    if (S.luta === 'morre') { if (S.tLuta > 4.2 && S.estado === 'jogando') { S.estado = 'vitoria'; aoEvento('vitoria'); } return; }
    const ritmo = [1, 1.06, 1.14][c.fase];
    if (c.estado === 'anda') {
      anda = T.vel * ritmo; const dx = limita(S.x * .55 - c.x, -1, 1); c.x += dx * dt * 1.2;
      if (c.mudaFase) { c.mudaFase = false; muda('tonto', 1.5); aoEvento('fase', c); for (let i = 0; i < 8 + c.fase * 5; i++) nascer('comum', limita((sorte() - .5) * 10, -PISTA, PISTA), c.d + 1 + sorte() * 6); const b = S.barris.filter(b => b.reforco)[c.fase - 1]; if (b) Object.assign(b, { x: S.x > 0 ? -2.6 : 2.6, d: S.d + 9, alt: 9, vida: 90, max: 90, vivo: true, reforco: 5 + Math.floor(S.n * .12) }); }
      else if (c.t >= c.dur) atacar();
    } else if (c.estado === 'prepara') { if (c.t >= c.dur) muda('bate', c.golpe === 'investida' ? .55 : .4); }
    else if (c.estado === 'bate') { if (c.vai) { const q = c.vai * Math.sin(Math.min(1, c.t / .55) * Math.PI / 2); c.d -= q - (c.foi || 0); c.foi = q; } if (c.t >= c.dur) { c.volta = c.vai ? c.vai * .72 : 0; c.vai = 0; c.foi = 0; muda('volta', .85); } }
    else if (c.estado === 'volta') { if (c.volta) { const v = Math.min(c.volta, dt * 6.5); c.volta -= v; c.d += v; } if (c.t >= c.dur && !c.volta) muda('anda', T.pausa / ritmo); else if (c.t >= c.dur) c.t = c.dur - .01; }
    else if (c.estado === 'tonto') { if (c.t >= c.dur) muda('anda', .5); }
    c.d -= anda * dt; c.vel = anda; const p0 = Math.floor(c.passo * 2); c.passo += anda * dt * .3; if (Math.floor(c.passo * 2) !== p0) aoEvento('passoChefe', c); c.x = limita(c.x, -2.6, 2.6);
    for (let i = S.marcas.length - 1; i >= 0; i--) { const m = S.marcas[i]; m.t += dt; if (m.t >= m.dur) { S.marcas.splice(i, 1); bater(m); if (S.estado !== 'jogando') return; } }
    for (let i = S.buracos.length - 1; i >= 0; i--) { const b = S.buracos[i]; b.t += dt; b.espera -= dt; if (b.t > b.dur) { S.buracos.splice(i, 1); continue; } if (b.espera <= 0) for (let k = S.soldados.length - 1; k >= 0; k--) { const s = S.soldados[k]; if (Math.hypot(s.x - b.x, s.d - b.d) < b.r * .75) { b.espera = .45; derrubar(k); break; } } }
    if (c.estado !== 'bate' && c.estado !== 'volta' && c.d - T.raio < frenteMax + .25 && S.estado === 'jogando') { aoEvento('alcancou', c); while (S.soldados.length > 0 && S.n > 0) { S.n = S.soldados.length; derrubar(S.soldados.length - 1); } }
  }

  // ---------- passo ----------
  function passo(dt) {
    S.tempo += dt; const fim = trecho.comprimento;
    if (S.estado === 'jogando' && !S.luta) { S.ritmo = limita((fim - S.d) / 4, .12, 1); S.d += VELOCIDADE * S.ritmo * dt; if (S.d >= fim) chegarChefe(); }
    else S.ritmo = Math.max(0, S.ritmo - dt * 3);
    // meia largura do pelotão, para ninguém sair da pista
    let meia = 0; const nv = S.soldados.length; for (let i = 0; i < nv; i++) meia = Math.max(meia, Math.abs(VAGAS[i][0]));
    const lim = Math.max(.9, PISTA + .5 - meia);
    S.alvoX = limita(S.alvoX, -lim, lim); S.alvoFrente = limita(S.alvoFrente, S.luta ? -5 : TRAS, S.luta ? 5 : FRENTE);
    S.x += (S.alvoX - S.x) * Math.min(1, dt * 14); S.frente += (S.alvoFrente - S.frente) * Math.min(1, dt * (S.luta ? 7 : 10));
    const centro = S.d + S.frente; let frenteMax = -1e9; verAlvos(); porTiro = (S.n - S.esp) / Math.max(1, nv - S.esp);
    for (let i = 0; i < S.soldados.length; i++) {
      const s = S.soldados[i], v = VAGAS[i], ax = S.x + v[0], ad = centro + v[1], k = Math.min(1, dt * 11), x0 = s.x, d0 = s.d, arma = s.arma || S.arma, A = ARMAS[arma];
      s.x += (ax - s.x) * k; s.d += (ad - s.d) * k; s.vx = (s.x - x0) / Math.max(dt, .001); s.vd = (s.d - d0) / Math.max(dt, .001); s.inclina += (limita(s.vx * .05, -.35, .35) - s.inclina) * Math.min(1, dt * 8); s.fase += dt * (1.45 + s.semente * .12); s.calor = Math.max(0, s.calor - dt * 5);
      if (s.d > frenteMax) frenteMax = s.d;
      if (S.estado === 'jogando' && S.atordoado <= 0) { s.espera -= dt; if (s.espera <= 0) { s.espera += 1 / (A.cadencia * S.multCad * S.cadenciaExtra); if (s.espera < -.1) s.espera = 0; if (distAlvo < alcance(A) + 2) atirar(s, A, arma); } }
    }
    // hordas entram quando chegam perto
    while (proximaHorda < trecho.hordas.length && trecho.hordas[proximaHorda][0] < S.d + 62) { const [d, t, q, l, p] = trecho.hordas[proximaHorda++]; for (let i = 0; i < q; i++) fila.push([t, (sorte() - .5) * l, d + 8 + (sorte() - .5) * p]); }
    while (fila.length && S.zumbis.length < maxZumbis) { const [t, x, d] = fila.shift(); nascer(t, limita(x, -PISTA, PISTA), Math.max(d, S.d + 45)); }
    montarGrade();
    moverZumbis(dt, frenteMax, centro);
    moverTiros(dt);
    if (S.chefe) passoChefe(dt, frenteMax);
    for (const p of S.portoes) if (p.usado < 0 && centro >= p.d && S.estado === 'jogando') passar(p);
    for (const b of S.barris) { b.dano = Math.max(0, b.dano - dt * 5); if (b.alt) b.alt = Math.max(0, b.alt - dt * 11); if (b.vivo && b.vida <= 0) estourar(b); if (b.vivo) for (let i = S.soldados.length - 1; i >= 0; i--) { const s = S.soldados[i]; if (Math.abs(s.x - b.x) < .65 && Math.abs(s.d - b.d) < .65) { if (b.reforco) b.vida = 0; else { derrubar(i); b.vida -= 60; } break; } } }
    for (let i = S.caidos.length - 1; i >= 0; i--) { const c = S.caidos[i]; c.t += dt; if (c.vel) { c.d += c.vel * Math.max(0, .5 - c.t) * dt * (c.jeito ? -1 : 2); } if (c.t > 6 || c.d < S.d - 14) { S.caidos[i] = S.caidos[S.caidos.length - 1]; S.caidos.pop(); } }
  }
  function moverZumbis(dt, frenteMax, centro) {
    for (let i = S.zumbis.length - 1; i >= 0; i--) {
      const z = S.zumbis[i];
      if (z.morto || z.d < S.d - 12) { S.zumbis[i] = S.zumbis[S.zumbis.length - 1]; S.zumbis.pop(); livresZ.push(z); continue; }
      z.dano = Math.max(0, z.dano - dt * 7);
      if (z.fogo > 0) { z.fogo -= dt; z.vida -= 14 * S.multDano * dt; if (S.luta === 'morre') { if (z.fogo <= 0) { matar(z, 0); continue; } } else if (z.vida <= 0) { matar(z, 0); continue; } }
      const dist = z.d - centro; let vx = 0, vd = -z.vel;
      if (S.soldados.length && dist < 16) { // persegue o soldado mais próximo
        let m = null, md = 1e9; const passoBusca = S.soldados.length > 30 ? 3 : 1;
        for (let k = (z.id % passoBusca); k < S.soldados.length; k += passoBusca) { const s = S.soldados[k], q = (s.x - z.x) ** 2 + (s.d - z.d) ** 2; if (q < md) { md = q; m = s; } }
        if (m) { const l = Math.sqrt(md) || 1, f = limita(1.3 - dist / 16, .15, 1), dx = (m.x - z.x) / l, dd = (m.d - z.d) / l; vx = dx * z.vel * f * 1.2; vd = -z.vel * (1 - f) + dd * z.vel * f; }
      } else vx = Math.sin(S.tempo * .8 + z.semente * 40) * .25;
      if (S.estado === 'derrota') { vd = -z.vel * .6; }
      if (S.luta === 'morre') { vx = vd = 0; }
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
  function acertou(t, x, d, z) { const A = ARMAS[t.arma]; t.morto = true; if (A.raio) { explodir(x, d, A.raio, A.danoArea * S.multDano, 'bazuca'); } }
  function moverTiros(dt) {
    const c = S.luta === 'luta' ? S.chefe : null;
    for (let i = S.tiros.length - 1; i >= 0; i--) {
      const t = S.tiros[i], A = ARMAS[t.arma], d0 = t.d; t.d += t.vel * dt; t.x += t.vx * dt; t.resta -= t.vel * dt;
      // zumbis no caminho deste passo
      for (let q = d0; q <= t.d + .75 && !t.morto; q += 1.2) perto(t.x, Math.min(q, t.d), z => {
        if (z.morto || z === t.ultimo) return;
        if (Math.abs(z.x - t.x) < z.T.raio * 1.05 && z.d > d0 - .5 && z.d < t.d + .35) { aoEvento('acerto', { x: t.x, d: z.d, z, arma: t.arma }); ferir(z, t.dano); t.ultimo = z; if (A.raio) { acertou(t, t.x, z.d); return true; } if (t.passa-- <= 0) { t.morto = true; return true; } }
      });
      if (!t.morto && c && t.d > c.d - c.T.raio * .7 && Math.abs(t.x - c.x) < c.T.raio * 1.1) { const d = c.d - c.T.raio * .75; aoEvento('acertoChefe', { x: t.x, d, c, arma: t.arma, y: A.raio ? 2 : .8 + sorte() * c.T.altura * .55 }); ferirChefe(t.dano + (A.raio ? A.danoArea * S.multDano : 0)); acertou(t, t.x, d); }
      if (!t.morto) for (const b of S.barris) if (b.vivo && Math.abs(b.x - t.x) < .5 && b.d > d0 - .4 && b.d < t.d + .3) { b.vida -= t.dano; b.dano = 1; aoEvento('faisca', { x: t.x, d: b.d - .4, arma: t.arma }); acertou(t, t.x, b.d - .4); break; }
      if (!t.morto) for (const p of S.portoes) if (p.usado < 0 && p.d > d0 && p.d <= t.d) { const l = p.lados[t.x < 0 ? 0 : 1]; if (l.tipo === 'tiro') { l.pancadas += t.dano; const ganho = Math.floor(l.pancadas / 40); if (ganho) { l.pancadas -= ganho * 40; const era = l.v; l.v = Math.min(30, l.v + ganho); p.mudou = true; if (era < 0 && l.v >= 0) aoEvento('virou', { p, k: t.x < 0 ? 0 : 1 }); } aoEvento('faiscaPortao', { x: t.x, d: p.d, bom: l.v >= 0, arma: t.arma }); acertou(t, t.x, p.d - .3); } }
      if (!t.morto && A.raio && t.resta <= 0) acertou(t, t.x, t.d);
      if (t.morto || t.resta <= 0) { S.tiros[i] = S.tiros[S.tiros.length - 1]; S.tiros.pop(); livresT.push(t); }
    }
  }
  somar(trecho.inicio + (melhorias.soldados || 0)); if (melhorias.bazuca) especialistas(4, melhorias.bazuca);
  return Object.assign(S, {
    passo, somar, evoluir, bom, especialistas,
    mover(dx, dd) { S.alvoX += dx; S.alvoFrente += dd; },
    // para testes: leva direto à luta com o chefe
    pularParaChefe() { S.d = trecho.comprimento - .5; for (const p of S.portoes) if (p.usado < 0) p.usado = 0; for (const b of S.barris) if (!b.reforco) b.vivo = false; for (const z of S.zumbis) z.morto = true; fila.length = 0; proximaHorda = trecho.hordas.length; },
  });
}
