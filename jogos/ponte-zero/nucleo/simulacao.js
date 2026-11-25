// Regras do jogo, sem desenho: pelotão, armas, zumbis, portões, barris, obstáculos e as lutas com o meio-chefe e o chefe.
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

const NORMAL = { forca: 1, vida: 1, horda: 1, aviso: 1, perda: 1 };
export function criarSimulacao(trecho, { aoEvento = () => {}, sorte = Math.random, melhorias = {}, dif = null, maxZumbis = 150, maxSoldados = MAX_SOLDADOS } = {}) {
  const S = {
    trecho, d: 0, frente: 0, x: 0, alvoX: 0, alvoFrente: 0, estado: 'jogando', tempo: 0, mortos: 0, arma: 0, cadenciaExtra: 1, n: 0, perdidos: 0, esp: 0, ritmo: 1, atordoado: 0, adr: 0, adrT: 0, aperto: 1, meioFeito: !trecho.meio,
    soldados: [], caidos: [], zumbis: [], tiros: [], portoes: [], barris: [], marcas: [], buracos: [], vaos: [], gelos: (trecho.gelo || []).map(([d0, d1, x0, x1]) => ({ d0, d1, x0, x1, t: 9, dur: 1e9 })), vx: 0, blocos: [], chefe: null, luta: '', tLuta: 0,
    multDano: 1 + (melhorias.dano || 0), multCad: 1 + (melhorias.cadencia || 0),
  };
  const livresZ = [], livresT = [], Q = dif || NORMAL, forcaFim = (trecho.forca || 1) * Q.forca, pressa = (trecho.aviso || 1) * Q.aviso, mais = q => Math.max(1, Math.round(q * Q.horda));
  for (let i = 0; i < MAX_ZUMBIS; i++) livresZ.push({ id: i });
  for (let i = 0; i < MAX_TIROS; i++) livresT.push({});
  let proximaHorda = 0; const fila = [], daFrente = trecho.hordas.filter(h => h[3] !== 'L'), daLado = trecho.hordas.filter(h => h[3] === 'L').map(h => ({ h, foi: false })), perigos = (trecho.perigos || []).map(([d, tipo, x]) => ({ d, tipo, x, foi: false }));

  // ---------- soldados ----------
  function novoSoldado(perto, arma) {
    const v = VAGAS[S.soldados.length]; if (!S.tempo) perto = null;
    S.soldados.push({ x: perto ? perto.x + (sorte() - .5) * .3 : S.x + v[0], d: perto ? perto.d + (sorte() - .5) * .3 : S.d + v[1], vx: 0, semente: sorte(), fase: sorte(), espera: sorte() * .4, nasceu: S.tempo, inclina: 0, arma, calor: 0 });
    if (arma) S.esp++;
  }
  // tira do desenho um soldado comum, do fim da formação (especialista só se não houver outro)
  function tirarUm() { let i = S.soldados.length - 1; while (i >= 0 && (S.soldados[i].arma || S.soldados[i].vet)) i--; derrubar(i < 0 ? S.soldados.length - 1 : i, false); }
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
      else { const s = S.soldados.find(s => !s.arma && !s.vet); if (s) { s.arma = arma; s.nasceu = S.tempo; S.esp++; } }
    }
    return q;
  }
  function derrubar(i, conta = true, buraco = false) {
    const s = S.soldados[i]; if (!s) return;
    S.caidos.push({ x: s.x, d: s.d, semente: s.semente, t: 0, quem: 'soldado', arma: s.arma, buraco, vet: s.vet }); if (s.vet) aoEvento('vetCaiu', s);
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
    const z = livresZ.pop(); if (!z) return null;
    const T = ZUMBIS[tipo], forca = 1 + (forcaFim - 1) * limita(S.d / (trecho.meio ? trecho.meio.d * .8 : 100), .2, 1); // a horda endurece aos poucos
    Object.assign(z, { tipo, T, x, d, vida: T.vida * forca, vel: T.vel * (.85 + sorte() * .3), fase: sorte(), semente: sorte(), jeito: sorte() < .5 ? 0 : 1, dano: 0, recuo: 0, ang: 0, morto: false, fogo: 0, esc: T.escala * (.94 + sorte() * .12), escudo: (T.escudo || 0) * forca, espera: T.cospe ? .4 + sorte() * 1.4 : 0, guarda: false, gx: 0, entra: 0, lado: 0, y: 0 });
    S.zumbis.push(z); return z;
  }
  // sobe pela lateral da ponte, perto do pelotão
  function nascerLado(tipo, d, atraso = 0) { const z = nascer(tipo, 8, d); if (z) { z.lado = sorte() < .5 ? -1 : 1; z.entra = 1.15 + atraso; z.x = z.lado * 8; z.y = trecho.entraY ?? -3; } return z; }
  // tropa do chefe: escudeiros ficam na frente dele, o resto vem de trás ou das laterais
  function chamar(grupo) {
    const c = S.chefe; for (const [tipo, q0] of grupo) for (let i = 0, q = mais(q0); i < q; i++) {
      if (trecho.lateral && (tipo === 'comum' || tipo === 'corredor') && i % 2) { nascerLado(tipo, S.d + 9 + sorte() * 12, i * .12); continue; }
      const z = nascer(tipo, limita((sorte() - .5) * 9.4, -PISTA, PISTA), c.d + 1 + sorte() * 6); if (!z) return;
      if (tipo === 'escudeiro') { z.guarda = true; z.gx = q > 1 ? (i / (q - 1) - .5) * Math.min(7.6, q * 1.7) : 0; z.x = z.gx; }
    }
    aoEvento('tropa', { c, grupo });
  }
  function matar(z, dir) {
    if (z.morto) return;
    z.morto = true; S.mortos += z.T.pontos;
    S.caidos.push({ x: z.x, d: z.d, semente: z.semente, t: 0, quem: 'zumbi', tipo: z.tipo, jeito: dir ?? (sorte() < .7 ? 0 : 1), ang: z.ang, esc: z.esc, vel: 1.2 + sorte() * 1.6, fogo: z.fogo > 0 });
    aoEvento('morte', z);
    if (trecho.adrenalina && S.estado === 'jogando' && S.adrT <= 0 && z.d - S.d - S.frente < 5) { S.adr += .055 * z.T.custo; if (S.adr >= 1) { S.adr = 0; S.adrT = 5; aoEvento('adrenalina'); } }
    if (S.arma < BASICAS - 1 && S.mortos >= ARMAS[S.arma].meta) evoluir('meta');
  }
  function evoluir(como) {
    if (S.arma >= BASICAS - 1) { S.cadenciaExtra *= 1.15; aoEvento('cadencia'); return; }
    S.arma++; aoEvento('arma', { arma: ARMAS[S.arma], como });
  }
  function ferir(z, dano, dx, leve, fura = leve) {
    if (z.escudo > 0 && !fura) { z.escudo -= dano; z.dano = Math.max(z.dano, .35); if (z.escudo <= 0) aoEvento('escudo', z); return; }
    z.vida -= dano; if (!leve) { z.dano = 1; z.recuo = Math.min(.5, z.recuo + (z.tipo === 'blindado' ? .02 : .1)); } if (z.vida <= 0) matar(z, dx); }
  function explodir(x, d, raio, dano, quem) {
    aoEvento('explosao', { x, d, raio, quem });
    for (const z of S.zumbis) { if (z.morto) continue; const r = Math.hypot(z.x - x, z.d - d); if (r < raio) ferir(z, dano * (1 - r / (raio * 1.35)), 0, false, true); }
    for (const o of S.blocos) if (o.vida > 0 && Math.abs(o.x - x) < raio + 1 && d > o.d0 - raio && d < o.d1 + raio) { o.vida -= dano; o.dano = 1; }
    for (const o of S.barris) if (o.vivo && Math.hypot(o.x - x, o.d - d) < raio) { o.vida -= dano; o.dano = 1; }
  }

  // ---------- portões e barris ----------
  const lerPortao = t => t[0] === '+' ? { tipo: 'soma', v: +t.slice(1) } : t[0] === '-' ? { tipo: 'soma', v: -t.slice(1) } : t[0] === '*' ? { tipo: 'vezes', v: +t.slice(1) } : t[0] === '/' ? { tipo: 'divide', v: +t.slice(1) } : t[0] === 'a' ? { tipo: 'arma' } : t[0] === 'c' ? { tipo: 'cadencia', v: 25 } : ESPECIAL[t[0]] ? { tipo: 'especial', arma: ESPECIAL[t[0]], v: +t.slice(1) } : { tipo: 'tiro', v: +t.slice(1), pancadas: 0 };
  for (const p of trecho.portoes) S.portoes.push({ d: p.d, lados: p.l.map(lerPortao), usado: -1, anda: p.anda || 0, ox: 0 });
  for (const [d, x] of trecho.barris) S.barris.push({ tipo: 'barril', d, x, vida: 120, max: 120, vivo: true, dano: 0, raio: .5 });
  for (const [d, x, vida, da] of trecho.caixas || []) { const l = lerPortao(da); S.barris.push({ tipo: l.tipo === 'soma' ? 'gaiola' : 'caixa', d, x, vida, max: vida, vivo: true, dano: 0, raio: .95, da: l }); }
  for (const [d0, d1, x0, x1, tipo] of trecho.blocos || []) S.blocos.push({ d0, d1, x0, x1, x: (x0 + x1) / 2, d: (d0 + d1) / 2, tipo, vida: tipo === 'carro' ? 420 : 0, dano: 0, bate: 0 });
  // peças da luta: caixas de reforço, carros arremessados e hidrantes (voltam a ser usados)
  for (let k = 0; k < 2; k++) S.barris.push({ tipo: 'reforco', d: -50, x: 0, vida: 0, max: 0, vivo: false, dano: 0, reforco: 1, alt: 0, raio: .8 });
  if (trecho.chefe === 'guindaste') for (let k = 0; k < 6; k++) S.barris.push({ tipo: 'carro', d: -50, x: 0, vida: 0, max: 0, vivo: false, dano: 0, alt: 0, raio: 1.25, voa: null });
  if (CHEFES[trecho.chefe].quente) for (let k = 0; k < 2; k++) S.barris.push({ tipo: 'hidrante', d: -50, x: 0, vida: 0, max: 0, vivo: false, dano: 0, raio: .7 });
  const bom = l => l.tipo === 'soma' || l.tipo === 'tiro' ? l.v >= 0 : l.tipo !== 'divide';
  // divisões do portão: a do meio pode correr de lado
  const borda = (p, i) => i <= 0 ? -5 : i >= p.lados.length ? 5 : -5 + 10 * i / p.lados.length + p.ox;
  const ladoDe = (p, x) => { let k = 0; while (k < p.lados.length - 1 && x >= borda(p, k + 1)) k++; return k; };
  // aplica o que está escrito no portão, na caixa ou no prêmio
  function aplicar(l) {
    if (l.tipo === 'soma' || l.tipo === 'tiro') return somar(l.v);
    if (l.tipo === 'vezes') return somar(S.n * (l.v - 1));
    if (l.tipo === 'divide') return somar(Math.ceil(S.n / l.v) - S.n);
    if (l.tipo === 'especial') return especialistas(l.arma, l.v);
    if (l.tipo === 'arma') evoluir('portao'); else S.cadenciaExtra *= 1 + l.v / 100;
    return 0;
  }
  function passar(p) { const k = ladoDe(p, S.x), l = p.lados[k]; p.usado = k; const q = aplicar(l); aoEvento('portao', { p, k, l, q, bom: bom(l), x: (borda(p, k) + borda(p, k + 1)) / 2, larg: borda(p, k + 1) - borda(p, k) }); }
  function estourar(b) {
    b.vivo = false;
    if (b.tipo === 'reforco') { aoEvento('reforco', { b, q: somar(b.reforco) }); return; }
    if (b.tipo === 'gaiola') { aoEvento('resgate', { b, q: somar(b.da.v) }); return; }
    if (b.tipo === 'caixa') { aoEvento('caixa', { b, l: b.da, q: aplicar(b.da) }); return; }
    if (b.tipo === 'hidrante') { const c = S.chefe; aoEvento('hidrante', b); if (c?.T.quente) { c.frio = 7; if (c.estado === 'anda') muda('tonto', 1.1); } for (const z of S.zumbis) if (Math.hypot(z.x - b.x, z.d - b.d) < 3.5) { z.recuo = 1; z.fogo = 0; } return; }
    if (b.tipo === 'carro') { const m = S.marcas.findIndex(m => m.obj === b); if (m >= 0) S.marcas.splice(m, 1); b.voa = null; aoEvento('carroExplode', b); explodir(b.x, b.d, 3, 120, 'carro'); return; }
    aoEvento('barril', b);
    for (const z of S.zumbis) { const r = Math.hypot(z.x - b.x, z.d - b.d); if (r < 4.2) ferir(z, 140 * (1 - r / 5.5), 0, false, true); }
    for (const o of S.barris) if (o.vivo && o.tipo === 'barril' && Math.hypot(o.x - b.x, o.d - b.d) < 4) o.vida = Math.min(o.vida, 1);
  }
  // carro que voa até (x, d): pode ser explodido no ar; se chegar, esmaga quem estiver na marca
  function lancarCarro(x0, d0, alt, x, d, dur, fica) {
    const b = S.barris.find(b => b.tipo === 'carro' && !b.vivo); if (!b) return;
    const vida = fica ? 200 + S.n * 9 : 300 + S.n * 22; Object.assign(b, { vivo: true, vida, max: vida, dano: 0, x: x0, d: d0, alt, voa: { x0, d0, a0: alt, x, d, t: 0, dur, fica } });
    circulo(x, d, fica ? 2 : 2.3, dur, { som: 'pancada', obj: b, perda: .6 }); aoEvento('carroVoa', b);
  }
  function passoCarro(b, dt) { const v = b.voa; v.t += dt; const k = Math.min(1, v.t / v.dur); b.x = v.x0 + (v.x - v.x0) * k; b.d = v.d0 + (v.d - v.d0) * k; b.alt = v.x0 === v.x && v.d0 === v.d ? v.a0 * (1 - k * k) : v.a0 * (1 - k) + Math.sin(k * Math.PI) * 3.2; }

  // ---------- perigos do caminho ----------
  function soltarPerigo(p) {
    if (p.tipo === 'desaba') { const [x0, x1] = p.x < 0 ? [-5.6, -.7] : p.x > 0 ? [.7, 5.6] : [-1.9, 1.9]; faixa((x0 + x1) / 2, x1 - x0, p.d, p.d + 8, 1.35, { som: 'desaba', perda: 1, vao: { x0, x1, d0: p.d, d1: p.d + 8, dur: 99 } }); }
    else if (p.tipo === 'carro') lancarCarro(p.x, p.d, 24, p.x, p.d, 2.3, true);
    else if (p.tipo === 'meteoro') circulo(p.x, p.d, 2.1, 1.9, { som: 'fogo', cai: 'brasa', fogo: true, perda: .5, escombro: true });
    else if (p.tipo === 'bola') faixa(p.x, 2.7, p.d - 7, p.d + 15, 1.75, { som: 'pedra', bola: true, perda: .5 });
    else if (p.tipo === 'fogo') faixa(p.x, 3, p.d - 4, p.d + 4, 1.55, { som: 'fogo', perda: .4, fogo: true });
  }
  const ANTES = { desaba: 27, carro: 22, meteoro: 18, bola: 9.5, fogo: VELOCIDADE * 1.5 };

  // ---------- tiros ----------
  let distAlvo = 1e9, alvoAte = 0, porTiro = 1; const miras = [], caixasPerto = [];
  function atirar(s, A, arma) {
    if (A.jato) return jato(s, A, arma);
    const t = livresT.pop(); if (!t) return;
    const m = mirar(s, A), a = (m ? limita((m.x - s.x) / Math.max(3, m.d - s.d - .75), -.22, .22) : 0) + (sorte() - .5) * 2 * A.abre;
    Object.assign(t, { x: s.x - .05, d: s.d + .75, x0: s.x, vx: a * A.vel, vel: A.vel, resta: alcance(A) + 2, dano: A.dano * S.multDano * (A.especial ? 1 : porTiro) * (s.vet ? 2 : 1), passa: A.atravessa, morto: false, ultimo: null, arma, nasceu: S.tempo });
    S.tiros.push(t); s.tiro = S.tempo; s.calor = 1; s.mira = a;
    aoEvento('tiro', { s, arma });
  }
  // lança-chamas: tudo dentro do leque curto à frente queima
  function jato(s, A, arma) {
    const al = alcance(A), m = mirar(s, A); s.tiro = S.tempo; s.calor = 1; s.mira = m ? limita((m.x - s.x) / Math.max(2, m.d - s.d), -.3, .3) : 0;
    for (const z of miras) { if (z.morto) continue; const dd = z.d - s.d; if (dd < .2 || dd > al) continue; if (Math.abs(z.x - s.x - s.mira * dd) > .5 + dd * A.abre) continue; z.fogo = 2.2; ferir(z, A.dano * S.multDano, 0, true); }
    for (const b of S.barris) if (b.vivo && !(b.alt > 3) && b.d > s.d && b.d - s.d < al && Math.abs(b.x - s.x - s.mira * (b.d - s.d)) < b.raio + (b.d - s.d) * A.abre) { b.vida -= A.dano; b.dano = .4; }
    const c = S.chefe; if (c && S.luta === 'luta' && !c.fora && c.d - c.T.raio - s.d < al && Math.abs(c.x - s.x - s.mira * (c.d - s.d)) < c.T.raio + 1) ferirChefe(A.dano * S.multDano, true);
    aoEvento('tiro', { s, arma });
  }
  const alcance = A => S.luta && !A.jato ? Math.max(38, A.alcance) : S.luta ? A.alcance + 3 : A.alcance;
  // ajuda de mira: cada soldado prefere o alvo mais próximo num cone estreito à frente
  function mirar(s, A) {
    let melhor = null, nota = 1e9; const al = alcance(A);
    for (const z of miras) { if (z.morto) continue; const dd = z.d - s.d; if (dd < .5 || dd > al) continue; const ang = Math.abs(z.x - s.x) / dd; if (ang > .22) continue; const q = dd * (1 + ang * 4); if (q < nota) { nota = q; melhor = z; } }
    // carro no ar, hidrante, gaiola e caixa também são alvos, se não houver zumbi mais perto
    for (const b of caixasPerto) { if (!b.vivo || b.voa && b.voa.t < b.voa.dur * .32) continue; const dd = b.d - s.d; if (dd < 1 || dd > Math.min(al, b.voa ? 34 : 20)) continue; const ang = Math.abs(b.x - s.x) / dd; if (ang > .24) continue; const q = dd * (1 + ang * 4) + (b.voa ? -8 : 2); if (q < nota) { nota = q; melhor = b; } }
    const c = S.chefe; if (c && S.luta === 'luta' && !c.fora) { const dd = c.d - s.d; if (dd - c.T.raio < al && dd < nota + 2) melhor = { x: c.x + limita(s.x - c.x, -c.T.raio * .7, c.T.raio * .7), d: c.d }; }
    return melhor;
  }
  // a que distância está o alvo mais próximo (só atira se houver algo na frente)
  function verAlvos() {
    if (S.tempo < alvoAte) return; alvoAte = S.tempo + .12; const c = S.d + S.frente; distAlvo = 1e9;
    miras.length = 0; for (const z of S.zumbis) if (z.d > c - 1.5 && z.d < c + 42) { miras.push(z); if (z.d - c < distAlvo) distAlvo = z.d - c; }
    if (miras.length > 48) { miras.sort((a, b) => a.d - b.d); miras.length = 48; }
    for (const p of S.portoes) if (p.usado < 0 && p.d > c && p.lados.some(l => l.tipo === 'tiro')) distAlvo = Math.min(distAlvo, p.d - c + 2);
    caixasPerto.length = 0; for (const b of S.barris) if (b.vivo && b.d > c && b.d < c + 36) { if (b.tipo !== 'barril' && b.tipo !== 'reforco') caixasPerto.push(b); if (Math.abs(b.x - S.x) < (b.tipo === 'barril' ? 2.5 : 4.5)) distAlvo = Math.min(distAlvo, b.d - c + 2); }
    for (const o of S.blocos) if (o.vida > 0 && o.d0 > c && o.x1 > S.x - 1.5 && o.x0 < S.x + 1.5) distAlvo = Math.min(distAlvo, o.d0 - c + 2);
    if (S.chefe && S.luta === 'luta' && !S.chefe.fora) distAlvo = Math.min(distAlvo, S.chefe.d - S.chefe.T.raio - c);
  }

  // grade para achar zumbis perto rapidamente
  const CEL = 1.5, grade = new Map(), chave = (x, d) => Math.floor((x + 20) / CEL) * 4096 + Math.floor(d / CEL);
  function montarGrade() { for (const l of grade.values()) l.length = 0; for (const z of S.zumbis) { const k = chave(z.x, z.d); let l = grade.get(k); if (!l) grade.set(k, l = []); l.push(z); } if (grade.size > 3000) grade.clear(); }
  function perto(x, d, fn) { const i = Math.floor((x + 20) / CEL), j = Math.floor(d / CEL); for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { const l = grade.get(a * 4096 + b); if (l) for (const z of l) if (fn(z)) return true; } return false; }

  // ---------- chefe ----------
  let proxTropa = 10, proxHid = 2.5;
  function chegarChefe(meio) {
    const M = meio ? trecho.meio : trecho, id = meio ? M.id : M.chefe, T = CHEFES[id], rel = S.n / M.tropa, vida = Math.round(M.vida * Q.vida * (meio ? limita(.35 + .65 * rel, .5, 2.2) : limita(.5 + .5 * rel, .7, 2.6)));
    S.luta = 'chega'; S.tLuta = 0; if (!meio) { fila.length = 0; proximaHorda = daFrente.length; } proxTropa = 10;
    S.chefe = { id, T, meio: !!meio, vida, max: vida, x: 0, d: S.d + (meio ? ARENA.meio : ARENA.comeca), alt: 16, estado: 'cai', t: 0, fase: 0, etapa: 0, dano: 0, passo: 0, vel: 0, golpe: null, ultimo: -1, gira: 0, placas: Array.from({ length: T.placas || 0 }, () => ({ vida: vida * .06, viva: true })), vai: 0, fora: false, frio: 0, lado: 1 };
    aoEvento('chefeEntra', S.chefe);
  }
  function ferirChefe(dano, leve) {
    const c = S.chefe; if (S.luta !== 'luta' || !c || c.vida <= 0 || c.fora) return; if (c.T.quente && c.frio <= 0) dano *= c.T.quente;
    const p = c.T.etapas ? null : c.placas.find(p => p.viva);
    if (p) { p.vida -= dano * .65; dano *= .35; if (p.vida <= 0) { p.viva = false; aoEvento('placaCaiu', { c, i: c.placas.indexOf(p) }); if (c.estado === 'anda') muda('tonto', .7); } }
    c.vida -= dano; if (!leve) c.dano = Math.min(1, c.dano + .25);
    if (c.vida <= 0) {
      if (c.T.etapas && c.etapa < c.T.etapas - 1) { c.etapa++; c.fase = c.etapa; c.vida = c.max; c.mudaFase = true; S.marcas.length = 0; const k = c.placas.length / (c.T.etapas - 1); for (let i = Math.round(k * (c.etapa - 1)); i < Math.round(k * c.etapa); i++) { c.placas[i].viva = false; aoEvento('placaCaiu', { c, i }); } muda('anda', 9); c.vai = 0; aoEvento('etapa', c); return; }
      c.vida = 0; morrerChefe(); return;
    }
    const nF = c.T.golpes.length, f = c.T.etapas ? c.etapa : Math.min(nF - 1, Math.floor((1 - c.vida / c.max) * nF));
    if (f > c.fase) { c.fase = f; c.mudaFase = true; }
  }
  function morrerChefe() {
    S.luta = 'morre'; S.tLuta = 0; S.marcas.length = 0; S.buracos.length = 0; S.atordoado = 0; muda('morre', 9); S.mortos += S.chefe.meio ? 12 : 50; aoEvento('chefeMorre', S.chefe); for (const b of S.barris) if (b.tipo === 'carro' || b.tipo === 'hidrante') b.vivo = false;
    if (S.chefe.meio) { const l = lerPortao(trecho.meio.premio); aoEvento('premioMeio', { c: S.chefe, l, q: aplicar(l) }); }
    for (const z of S.zumbis) if (!z.morto) { z.vida = 0; z.fogo = .3 + sorte() * 1.2; }
  }
  function muda(e, dur) { const c = S.chefe; c.estado = e; c.t = 0; c.dur = dur; }
  const marcar = m => { m.t = 0; S.marcas.push(m); aoEvento('marca', m); };
  const faixa = (x, larg, d0, d1, dur, op) => marcar({ forma: 'faixa', x, larg, d0, d1, dur, ...op });
  const circulo = (x, d, r, dur, op) => marcar({ forma: 'circulo', x, d, r, dur, ...op });
  // cada golpe marca o chão agora e bate quando o aviso acaba
  function atacar() {
    const c = S.chefe, L = c.T.golpes[c.fase]; let k = Math.floor(sorte() * L.length); if (L.length > 1 && k === c.ultimo) k = (k + 1) % L.length; c.ultimo = k;
    const g = c.golpe = L[k], av = c.T.aviso * [1, .95, .88][c.fase] * pressa, px = limita(S.x, -3.6, 3.6), cen = S.d + S.frente, ate = c.d - c.T.raio;
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
    else if (g === 'enxurrada') { const s = px < 0 ? -1 : 1; c.lado = s; faixa(s * 2.7, 5.3, cen - 5, ate, av, { som: 'agua' }); if (c.fase) { faixa(-s * 2.7, 5.3, cen - 5, ate, av + 1.2, { som: 'agua' }); total = av + 1.2; } }
    else if (g === 'mergulho') { c.lado = c.x > 0 ? 1 : -1; muda('mergulha', .95); return; }
    else if (g === 'carro' || g === 'carros') { const q = g === 'carro' ? 1 + (c.fase > 0) : 3; for (let i = 0; i < q; i++) lancarCarro(c.x - 1.5, c.d - 1.5, 7, i ? limita(px + (sorte() < .5 ? -1 : 1) * 3.2, -3.8, 3.8) : px, cen + (i ? (sorte() - .5) * 4 : .3), av + 1.1 + i * .55, false); total = .55; }
    else if (g === 'brasa') { const q = c.meio ? 3 : 5; for (let i = 0; i < q; i++) circulo(i ? limita(px + (sorte() - .5) * 7, -4.4, 4.4) : px, cen + (i ? (sorte() - .4) * 6 : 0), 1.5, av + i * .26, { som: 'fogo', cai: 'brasa', fogo: true }); total = av + .4; }
    else if (g === 'bafo') { const s = px < 0 ? -1 : 1; [-3.3, 0, 3.3].forEach((x, i) => faixa(-x * s, 3.2, cen - 6, ate, av + i * .55, { som: 'fogo', fogo: true, perda: .42 })); total = av + .7; }
    else if (g === 'pente') [-3.7, 0, 3.7].forEach(x => faixa(x, 2, cen - 5, ate, av, { som: 'pancada', perda: .4 }));
    else if (g === 'desaba') { if (S.vaos.some(v => v.dur < 50)) { circulo(px, cen + .5, 2.6, av, { som: 'pancada' }); c.golpe = 'garra'; } else { const s = px < 0 ? -1 : 1, x0 = s < 0 ? -5.6 : .7, x1 = s < 0 ? -.7 : 5.6; faixa((x0 + x1) / 2, x1 - x0, cen - 4, cen + 6, av + .15, { som: 'desaba', perda: 1, vao: { x0, x1, d0: cen - 4, d1: cen + 6, dur: 9 } }); total = av + .15; } }
    else if (g === 'convoca') total = 1.2;
    else if (g === 'gelo') { const q = 2 + c.fase; for (let i = 0; i < q; i++) circulo(i ? limita(px + (sorte() - .5) * 8, -4, 4) : px, cen + (i ? (sorte() - .4) * 6 : .2), 1.9, av + i * .3, { som: 'gelo', atordoa: .7, perda: .28, gelo: true }); total = av + .3; }
    else if (g === 'bolas') { const L = [-3.3, 0, 3.3], a = L.reduce((m, x, i) => Math.abs(x - px) < Math.abs(L[m] - px) ? i : m, 0), b = (a + 1 + Math.floor(sorte() * 2)) % 3; [a, b].slice(0, c.fase ? 2 : 1).forEach((k, i) => faixa(L[k], 3.1, cen - 6, ate, av + i * .55, { som: 'pedra', bola: true })); total = av + .3; }
    else if (g === 'raio') { const q = c.meio ? 3 : 4 + c.fase; for (let i = 0; i < q; i++) circulo(i ? limita(px + (sorte() - .5) * 8, -4.5, 4.5) : px, cen + (i ? (sorte() - .45) * 7 : .2), 1.6, av + i * .24, { som: 'raio', raio: true }); total = av + .35; }
    else if (g === 'pocas') { const s = sorte() < .5 ? 1 : -1; for (const [x, d] of [[-3.1, -2.6], [2.9, -2.2], [-2.6 * s, 2.6], [3.1 * s, 3.2], [0, .4]]) circulo(x, cen + d, 1.95, av + .5, { som: 'raio', raio: true, poca: true }); total = av + .5; }
    muda('prepara', total);
  }
  function bater(m) {
    const c = S.chefe; let dentro = 0; const alvo = [];
    if (m.obj) { m.obj.vivo = false; const v = m.obj.voa; m.obj.voa = null; if (v?.fica) S.blocos.push({ d0: m.d - 2.2, d1: m.d + 2.2, x0: m.x - 1, x1: m.x + 1, x: m.x, d: m.d, tipo: 'carro', caiu: true, vida: 300, dano: 0, bate: 0 }); else aoEvento('explosao', { x: m.x, d: m.d, raio: 2.6, quem: 'carro' }); }
    for (let i = 0; i < S.soldados.length; i++) { const s = S.soldados[i]; if (m.forma === 'faixa' ? Math.abs(s.x - m.x) < m.larg / 2 && s.d > m.d0 && s.d < m.d1 : Math.hypot(s.x - m.x, s.d - m.d) < m.r) { dentro++; alvo.push(s); } }
    aoEvento('golpe', { m, dentro });
    if (dentro) { const q = Math.min(m.max ?? 999, Math.ceil(dentro * Math.min(1, (m.perda ?? c?.T.perda ?? .5) * (m.vao ? 1 : Q.perda)) * (S.n / S.soldados.length))); for (let k = 0; k < q && S.n > 0; k++) { const s = alvo.length ? alvo.splice(Math.floor(sorte() * alvo.length), 1)[0] : null, i = s ? S.soldados.indexOf(s) : -1; derrubar(i >= 0 ? i : S.soldados.length - 1, true, !!m.vao); } if (m.atordoa && S.estado === 'jogando') { S.atordoado = m.atordoa; aoEvento('atordoado'); } }
    for (const z of S.zumbis) if (!z.morto && (m.forma === 'faixa' ? Math.abs(z.x - m.x) < m.larg / 2 && z.d > m.d0 && z.d < m.d1 : Math.hypot(z.x - m.x, z.d - m.d) < m.r) && !m.atordoa) { if (m.vao) sumir(z); else if (m.som !== 'gosma') ferir(z, 60, 0, false, true); }
    if (m.gelo) { S.gelos.push({ d0: m.d - 1.9, d1: m.d + 1.9, x0: m.x - 1.9, x1: m.x + 1.9, t: 0, dur: 9 }); if (S.gelos.length > 9) S.gelos.splice(S.gelos.findIndex(g => g.dur < 99), 1); }
    if (m.escombro) S.blocos.push({ d0: m.d - 1, d1: m.d + 1, x0: m.x - 1, x1: m.x + 1, x: m.x, d: m.d, tipo: 'escombro', vida: 240, dano: 0, bate: 0 });
    if (m.vao) S.vaos.push({ ...m.vao, t: 0, espera: 0, x: (m.vao.x0 + m.vao.x1) / 2, d: (m.vao.d0 + m.vao.d1) / 2 });
    if (m.buraco) { if (S.buracos.length > 2) S.buracos.shift(); S.buracos.push({ x: m.x, d: m.d, r: 1.45, t: 0, dur: 11, espera: 0 }); }
    if (m.chama) for (let i = 0; i < m.chama; i++) nascer('corredor', limita((sorte() - .5) * 10, -PISTA, PISTA), c.d + 1 + sorte() * 7);
  }
  // zumbi que cai no vão da ponte
  function sumir(z) { if (z.morto) return; z.morto = true; S.mortos += z.T.pontos; S.caidos.push({ x: z.x, d: z.d, semente: z.semente, t: 0, quem: 'zumbi', tipo: z.tipo, jeito: 0, ang: z.ang, esc: z.esc, vel: 0, buraco: true }); aoEvento('caiu', z); }
  function passoMarcas(dt) {
    for (let i = S.marcas.length - 1; i >= 0; i--) { const m = S.marcas[i]; if (!m) continue; m.t += dt; if (m.t >= m.dur) { S.marcas.splice(i, 1); bater(m); if (S.estado !== 'jogando') return; } }
    for (let i = S.buracos.length - 1; i >= 0; i--) { const b = S.buracos[i]; b.t += dt; b.espera -= dt; if (b.t > b.dur) { S.buracos.splice(i, 1); continue; } if (b.espera <= 0) for (let k = S.soldados.length - 1; k >= 0; k--) { const s = S.soldados[k]; if (Math.hypot(s.x - b.x, s.d - b.d) < b.r * .75) { b.espera = .45; derrubar(k); break; } } }
    for (let i = S.vaos.length - 1; i >= 0; i--) {
      const v = S.vaos[i]; v.t += dt; if (v.t > v.dur || v.d1 < S.d - 22) { S.vaos.splice(i, 1); continue; } v.espera -= dt;
      for (const z of S.zumbis) if (!z.morto && !z.entra && z.x > v.x0 && z.x < v.x1 && z.d > v.d0 + .2 && z.d < v.d1 - .2) sumir(z);
      if (v.espera <= 0 && S.estado === 'jogando') for (let k = S.soldados.length - 1; k >= 0; k--) { const s = S.soldados[k]; if (s.x > v.x0 + .1 && s.x < v.x1 - .1 && s.d > v.d0 + .1 && s.d < v.d1 - .1) { v.espera = .1; derrubar(k, true, true); break; } }
    }
  }
  function passoChefe(dt, frenteMax) {
    const c = S.chefe, T = c.T; S.tLuta += dt; c.t += dt; c.dano = Math.max(0, c.dano - dt * 4); c.frio = Math.max(0, c.frio - dt); let anda = 0;
    if (S.luta === 'chega') {
      if (c.estado === 'cai') { c.alt = Math.max(0, 16 * (1 - (c.t / .85) ** 2)); if (c.t >= .85) { c.alt = 0; muda('ruge', c.meio ? 1.2 : 1.9); aoEvento('chefePousa', c); if (!c.meio) chamar(trecho.escolta || []); } }
      else if (c.t >= c.dur) { S.luta = 'luta'; muda('anda', 1.1); }
      return;
    }
    if (S.luta === 'morre' && c.meio) { if (S.tLuta > 1.9) { S.luta = ''; S.chefe = null; S.meioFeito = true; aoEvento('meioFim'); } return; }
    if (S.luta === 'morre') { if (S.tLuta > 4.2 && S.estado === 'jogando') { S.estado = 'vitoria'; aoEvento('vitoria'); } return; }
    const ritmo = [1, 1.06, 1.14][c.fase];
    if (c.estado === 'anda') {
      anda = T.vel * ritmo; const dx = limita(S.x * .55 - c.x, -1, 1); c.x += dx * dt * 1.2;
      if (c.mudaFase) { c.mudaFase = false; muda('tonto', 1.5); aoEvento('fase', c); chamar((trecho.tropas || [])[c.fase] || []); proxTropa = 11; const b = S.barris.filter(b => b.tipo === 'reforco')[c.fase - 1]; if (b) Object.assign(b, { x: S.x > 0 ? -2.6 : 2.6, d: S.d + 9, alt: 9, vida: 90, max: 90, vivo: true, reforco: 5 + Math.floor(S.n * .12) }); }
      else if (c.t >= c.dur) atacar();
    } else if (c.estado === 'mergulha') { const k = Math.min(1, c.t / c.dur); c.x += (c.lado * 8.4 - c.x) * Math.min(1, dt * 5); c.alt = Math.sin(k * 2.2) * 1.6 - k * k * 9; if (c.t >= c.dur) { c.fora = true; c.alt = -14; muda('submersa', 2.5); aoEvento('mergulhou', c); for (let i = 0; i < 3; i++) circulo(limita(S.x + (i ? (sorte() - .5) * 5 : 0), -4, 4), S.d + S.frente + (i ? (sorte() - .5) * 4 : .3), 2.1, 1.05 + i * .5, { som: 'agua' }); for (let i = 0; i < 5 + c.fase * 2; i++) nascerLado('comum', S.d + 7 + sorte() * 12, .3 + i * .16); }
    } else if (c.estado === 'submersa') { if (c.t >= c.dur) { c.x = -c.lado * 8.4; c.d = Math.max(c.d, S.d + 13); muda('emerge', 1); aoEvento('emergiu', c); }
    } else if (c.estado === 'emerge') { const k = Math.min(1, c.t / c.dur); c.alt = -9 * (1 - k) ** 2 + Math.sin(k * Math.PI) * 2.2; c.x += (-c.lado * 2.2 - c.x) * Math.min(1, dt * 5); if (k > .6) c.fora = false; if (c.t >= c.dur) { c.alt = 0; muda('anda', T.pausa); aoEvento('passoChefe', c); } } else if (c.estado === 'prepara') { if (c.t >= c.dur) { if (c.golpe === 'convoca') { for (let i = 0; i < 10; i++) nascerLado(i % 3 ? 'comum' : 'corredor', S.d + 7 + sorte() * 13, i * .12); aoEvento('tropa', { c, grupo: [] }); } muda('bate', c.golpe === 'investida' ? .55 : .4); } }
    else if (c.estado === 'bate') { if (c.vai) { const q = c.vai * Math.sin(Math.min(1, c.t / .55) * Math.PI / 2); c.d -= q - (c.foi || 0); c.foi = q; } if (c.t >= c.dur) { c.volta = c.vai ? c.vai * .72 : 0; c.vai = 0; c.foi = 0; muda('volta', .85); } }
    else if (c.estado === 'volta') { if (c.volta) { const v = Math.min(c.volta, dt * 6.5); c.volta -= v; c.d += v; } if (c.t >= c.dur && !c.volta) muda('anda', T.pausa / ritmo); else if (c.t >= c.dur) c.t = c.dur - .01; }
    else if (c.estado === 'tonto') { if (c.t >= c.dur) muda('anda', .5); }
    c.d -= anda * dt; c.vel = anda; const p0 = Math.floor(c.passo * 2); c.passo += anda * dt * .3; if (Math.floor(c.passo * 2) !== p0) aoEvento('passoChefe', c); if (!c.fora && c.estado !== 'mergulha' && c.estado !== 'emerge') c.x = limita(c.x, -2.6, 2.6);
    if (T.quente && S.estado === 'jogando') { proxHid -= dt; if (proxHid <= 0 && c.frio <= 0 && !S.barris.some(b => b.tipo === 'hidrante' && b.vivo)) { proxHid = 5; S.barris.filter(b => b.tipo === 'hidrante').forEach((b, i) => Object.assign(b, { vivo: true, vida: 180 + S.n * 12, max: 180 + S.n * 12, x: (i ? 1 : -1) * (2.6 + sorte() * 1.2), d: S.d + 9 + sorte() * 2, dano: 0 })); aoEvento('hidranteSurge', c); } }
    if (!c.meio) { proxTropa -= dt; if (proxTropa <= 0) { proxTropa = 12; chamar(((trecho.tropas || [])[c.fase] || []).map(([q, n]) => [q, Math.ceil(n * .6)])); } }
    if (c.estado !== 'bate' && c.estado !== 'volta' && c.d - T.raio < frenteMax + .25 && !c.fora && S.estado === 'jogando') { aoEvento('alcancou', c); if (c.meio) { const q = Math.ceil(S.n * .4); for (let k = 0; k < q && S.n > 0; k++) derrubar(S.soldados.length - 1); c.d += 8; muda('tonto', 1.6); S.marcas.length = 0; } else while (S.soldados.length > 0 && S.n > 0) { S.n = S.soldados.length; derrubar(S.soldados.length - 1); } }
  }

  // ---------- passo ----------
  function passo(dt) {
    S.tempo += dt; const fim = trecho.comprimento;
    S.atordoado = Math.max(0, S.atordoado - dt); if (S.adrT > 0) S.adrT = Math.max(0, S.adrT - dt); else S.adr = Math.max(0, S.adr - dt * .012);
    if (S.estado === 'jogando' && !S.luta) { const para = S.meioFeito ? fim : trecho.meio.d; S.ritmo = Math.min(S.ritmo + dt * 1.6, limita((para - S.d) / 4, .12, 1)); S.d += VELOCIDADE * S.ritmo * dt; if (S.d >= para) chegarChefe(!S.meioFeito); }
    else S.ritmo = Math.max(0, S.ritmo - dt * 3);
    // meia largura do pelotão, para ninguém sair da pista
    let meia = 0; const nv = S.soldados.length; for (let i = 0; i < nv; i++) meia = Math.max(meia, Math.abs(VAGAS[i][0]));
    // muro, carro ou vão ao lado: a formação se espreme no espaço livre
    const centro0 = S.d + S.frente; let lo = -PISTA - .6, hi = PISTA + .6, trE = -9, trD = 9;
    for (const o of S.blocos) if (o.d1 > centro0 - 3.2 && o.d0 < centro0 + 7) { if (S.x >= o.x1) { lo = Math.max(lo, o.x1); if (o.d0 < centro0 + .6 && o.d1 > centro0 - 1) trE = Math.max(trE, o.x1 + .35); } else if (S.x <= o.x0) { hi = Math.min(hi, o.x0); if (o.d0 < centro0 + .6 && o.d1 > centro0 - 1) trD = Math.min(trD, o.x0 - .35); } }
    for (const o of S.vaos) if (o.d1 > centro0 - 3.2 && o.d0 < centro0 + 7) { if (S.x >= o.x1) lo = Math.max(lo, o.x1); else if (S.x <= o.x0) hi = Math.min(hi, o.x0); }
    const solto = lo < -PISTA && hi > PISTA, querAp = solto ? 1 : limita((hi - lo - .5) / 2 / Math.max(.6, meia), .3, 1); S.aperto += (querAp - S.aperto) * Math.min(1, dt * 6);
    const lim = Math.max(.9, PISTA + .5 - meia * S.aperto);
    S.alvoX = limita(limita(S.alvoX, -lim, lim), trE, Math.max(trE, trD)); S.alvoFrente = limita(S.alvoFrente, S.luta ? -5 : TRAS, S.luta ? 5 : FRENTE);
    for (let i = S.gelos.length - 1; i >= 0; i--) { const g = S.gelos[i]; g.t += dt; if (g.t > g.dur || g.d1 < S.d - 24) S.gelos.splice(i, 1); }
    S.noGelo = S.gelos.some(g => S.x > g.x0 && S.x < g.x1 && centro0 > g.d0 && centro0 < g.d1);
    // chão que escorrega: o pelotão tem embalo e passa do ponto; na placa de gelo quase não freia
    if (trecho.escorrega || S.noGelo) { const k = S.noGelo ? 15 : 44, f = S.noGelo ? 1.7 : 7.2; S.vx = limita(S.vx + ((S.alvoX - S.x) * k - S.vx * f) * dt, -8.5, 8.5); S.x += S.vx * dt; if (Math.abs(S.x) > lim) { S.x = limita(S.x, -lim, lim); S.vx *= -.25; } if (S.x < trE || S.x > Math.max(trE, trD)) { S.x = limita(S.x, trE, Math.max(trE, trD)); S.vx = 0; } }
    else { S.vx = 0; S.x += (S.alvoX - S.x) * Math.min(1, dt * 14); }
    S.frente += (S.alvoFrente - S.frente) * Math.min(1, dt * (S.luta ? 7 : 10));
    const centro = S.d + S.frente; let frenteMax = -1e9; verAlvos(); porTiro = (S.n - S.esp) / Math.max(1, nv - S.esp);
    for (let i = 0; i < S.soldados.length; i++) {
      const s = S.soldados[i], v = VAGAS[i], ax = solto ? S.x + v[0] * S.aperto : limita(S.x + v[0] * S.aperto, Math.min(lo + .3, S.x), Math.max(hi - .3, S.x)), ad = centro + v[1] * (1 + (1 - S.aperto) * .9), k = Math.min(1, dt * 11), x0 = s.x, d0 = s.d, arma = s.arma || S.arma, A = ARMAS[arma];
      s.x += (ax - s.x) * k; s.d += (ad - s.d) * k; s.vx = (s.x - x0) / Math.max(dt, .001); s.vd = (s.d - d0) / Math.max(dt, .001); s.inclina += (limita(s.vx * .05, -.35, .35) - s.inclina) * Math.min(1, dt * 8); s.fase += dt * (1.45 + s.semente * .12); s.calor = Math.max(0, s.calor - dt * 5);
      if (s.d > frenteMax) frenteMax = s.d;
      for (const o of S.blocos) if (s.x > o.x0 - .2 && s.x < o.x1 + .2 && s.d > o.d0 - .25 && s.d < o.d1 + .2) {
        if (s.d < o.d0 + .9 && s.x > o.x0 && s.x < o.x1) { s.d = o.d0 - .3; if (S.ritmo > .25 && S.estado === 'jogando' && S.tempo > o.bate) { o.bate = S.tempo + .13; if (o.vida) { o.vida -= 70; o.dano = 1; } aoEvento('batida', { x: s.x, d: o.d0 }); derrubar(i); i--; break; } }
        else s.x = s.x - o.x0 < o.x1 - s.x ? o.x0 - .22 : o.x1 + .22;
      }
      if (S.soldados[i] !== s) continue;
      if (S.estado === 'jogando' && S.atordoado <= 0) { s.espera -= dt; if (s.espera <= 0) { s.espera += 1 / (A.cadencia * S.multCad * S.cadenciaExtra * (S.adrT > 0 ? 1.6 : 1)); if (s.espera < -.1) s.espera = 0; if (distAlvo < alcance(A) + 2) atirar(s, A, arma); } }
    }
    // hordas entram quando chegam perto
    const ateD = S.meioFeito ? 1e9 : trecho.meio.d - 3;
    while (proximaHorda < daFrente.length && daFrente[proximaHorda][0] < S.d + 62 && daFrente[proximaHorda][0] < ateD) { const [d, t, q, l, p] = daFrente[proximaHorda++]; for (let i = 0, n = mais(q); i < n; i++) fila.push([t, t === 'escudeiro' && q > 1 ? (i / (mais(q) - 1) - .5) * l : (sorte() - .5) * l, d + 8 + (sorte() - .5) * p]); }
    if (!S.luta) for (const o of daLado) if (!o.foi && S.d >= o.h[0] - 6) { o.foi = true; const [, t, q0, , p] = o.h, q = mais(q0); for (let i = 0; i < q; i++) nascerLado(t, S.d + 8 + sorte() * p, i * .09); aoEvento('lateral', { d: S.d + 12 }); }
    if (!S.luta && S.estado === 'jogando') for (const p of perigos) if (!p.foi && centro >= p.d - ANTES[p.tipo]) { p.foi = true; if (p.d > centro + 3) soltarPerigo(p); }
    while (fila.length && S.zumbis.length < maxZumbis) { const [t, x, d] = fila.shift(); nascer(t, limita(x, -PISTA, PISTA), Math.max(d, S.d + 45)); }
    montarGrade();
    moverZumbis(dt, frenteMax, centro);
    moverTiros(dt);
    if (S.chefe) passoChefe(dt, frenteMax);
    if (S.estado === 'jogando') passoMarcas(dt);
    for (const p of S.portoes) { if (p.anda && p.usado < 0) p.ox = Math.sin(S.tempo * 1.35 + p.d) * p.anda; if (p.usado < 0 && centro >= p.d && S.estado === 'jogando') passar(p); }
    for (let i = S.blocos.length - 1; i >= 0; i--) { const o = S.blocos[i]; o.dano = Math.max(0, o.dano - dt * 5); if (o.tipo === 'escombro' && o.vida <= 0) { S.blocos.splice(i, 1); aoEvento('escombro', o); } else if (o.tipo === 'carro' && o.vida <= 0) { S.blocos.splice(i, 1); aoEvento('carroExplode', { x: o.x, d: o.d, alt: 0 }); explodir(o.x, o.d, 4, 150, 'carro'); } else if (o.d1 < S.d - 24) S.blocos.splice(i, 1); }
    for (const b of S.barris) { b.dano = Math.max(0, b.dano - dt * 5); if (b.voa) passoCarro(b, dt); else if (b.alt) b.alt = Math.max(0, b.alt - dt * 11); if (b.vivo && b.vida <= 0) estourar(b); if (b.tipo === 'carro' || b.tipo === 'hidrante') continue; if (b.vivo) for (let i = S.soldados.length - 1; i >= 0; i--) { const s = S.soldados[i]; if (Math.abs(s.x - b.x) < b.raio + .2 && Math.abs(s.d - b.d) < b.raio + .2) { if (b.tipo === 'reforco') b.vida = 0; else if (b.tipo === 'barril') { derrubar(i); b.vida -= 60; } else b.vida -= 6; break; } } }
    for (let i = S.caidos.length - 1; i >= 0; i--) { const c = S.caidos[i]; c.t += dt; if (c.vel) { c.d += c.vel * Math.max(0, .5 - c.t) * dt * (c.jeito ? -1 : 2); } if (c.t > 6 || c.d < S.d - 14) { S.caidos[i] = S.caidos[S.caidos.length - 1]; S.caidos.pop(); } }
  }
  function moverZumbis(dt, frenteMax, centro) {
    for (let i = S.zumbis.length - 1; i >= 0; i--) {
      const z = S.zumbis[i];
      if (z.morto || z.d < S.d - 12) { S.zumbis[i] = S.zumbis[S.zumbis.length - 1]; S.zumbis.pop(); livresZ.push(z); continue; }
      z.dano = Math.max(0, z.dano - dt * 7);
      if (z.fogo > 0) { z.fogo -= dt; z.vida -= 14 * S.multDano * dt; if (S.luta === 'morre') { if (z.fogo <= 0) { matar(z, 0); continue; } } else if (z.vida <= 0) { matar(z, 0); continue; } }
      if (z.entra > 0) { // subindo pela lateral
        z.entra = Math.max(0, z.entra - dt); const k = limita((1.15 - z.entra) / 1.15, 0, 1);
        const y0 = trecho.entraY; if (y0) { const q = k * k; z.x = z.lado * (9.4 - 4.7 * k); z.y = y0 * (1 - q) + Math.sin(k * Math.PI) * 1.2; } else if (k < .55) { z.x = z.lado * 7.9; z.y = -3 + 4 * k / .55; } else { const q = (k - .55) / .45; z.x = z.lado * (7.9 - 3.2 * q); z.y = 1 - q * q + Math.sin(q * Math.PI) * .8; }
        z.ang = -z.lado * Math.PI / 2; z.fase += dt * 1.4; if (!z.entra) z.y = 0; continue;
      }
      const dist = z.d - centro; let vx = 0, vd = -z.vel;
      const ch = S.chefe;
      if (z.guarda && ch && !ch.fora && S.luta !== 'morre' && S.estado === 'jogando') { vx = limita((ch.x * .5 + z.gx - z.x) * 2, -2, 2); vd = limita((ch.d - ch.T.raio - 1.7 - z.d) * 3, -3.2, 3.2); }
      else if (z.T.cospe && dist < 17 && dist > 5 && S.estado === 'jogando' && S.luta !== 'morre' && S.soldados.length) { // atirador: para e cospe
        vd = S.luta ? 0 : -.2; z.espera -= dt; if (z.espera <= 0) { z.espera = z.T.cospe; const al = S.soldados[Math.floor(sorte() * S.soldados.length)]; circulo(al.x, al.d + (S.luta ? 0 : VELOCIDADE * S.ritmo * 1.25), 1.25, 1.25, { som: 'gosma', perda: 1, max: 2, cospe: { x: z.x, d: z.d } }); aoEvento('cuspe', z); }
      } else if (S.soldados.length && dist < 16) { // persegue o soldado mais próximo
        let m = null, md = 1e9; const passoBusca = S.soldados.length > 30 ? 3 : 1;
        for (let k = (z.id % passoBusca); k < S.soldados.length; k += passoBusca) { const s = S.soldados[k], q = (s.x - z.x) ** 2 + (s.d - z.d) ** 2; if (q < md) { md = q; m = s; } }
        if (m) { const l = Math.sqrt(md) || 1, f = limita(1.3 - dist / 16, .15, 1), dx = (m.x - z.x) / l, dd = (m.d - z.d) / l; vx = dx * z.vel * f * 1.2; vd = -z.vel * (1 - f) + dd * z.vel * f; }
      } else vx = Math.sin(S.tempo * .8 + z.semente * 40) * .25;
      if (S.estado === 'derrota') { vd = -z.vel * .6; }
      if (S.luta === 'morre') { vx = vd = 0; }
      if (trecho.escorrega && z.tipo === 'corredor') vx += Math.sin(S.tempo * 2.4 + z.semente * 30) * 2.2; // corredor derrapa na neve
      z.recuo = Math.max(0, z.recuo - dt * 1.6); const fr = 1 - z.recuo;
      // afasta dos vizinhos
      let ex = 0, ed = 0; perto(z.x, z.d, o => { if (o === z || o.morto) return; const dx = z.x - o.x, dd = z.d - o.d, r = z.T.raio + o.T.raio, q = dx * dx + dd * dd; if (q < r * r && q > 1e-6) { const l = Math.sqrt(q), f = (r - l) / l; ex += dx * f; ed += dd * f; } });
      z.x = limita(z.x + vx * fr * dt + ex * Math.min(.5, dt * 6), -PISTA - .6, PISTA + .6); z.d += vd * fr * dt + ed * Math.min(.5, dt * 6);
      for (const o of S.blocos) if (z.x > o.x0 - .2 && z.x < o.x1 + .2 && z.d > o.d0 - .2 && z.d < o.d1 + .2) { const dir = o.x0 < -5 ? 1 : o.x1 > 5 ? -1 : z.x > o.x ? 1 : -1; if (z.d > o.d1 - .8) z.d = o.d1 + .2; z.x += dir * z.vel * 1.3 * dt; vx = dir; }
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
    const c = S.luta === 'luta' && !S.chefe.fora ? S.chefe : null;
    for (let i = S.tiros.length - 1; i >= 0; i--) {
      const t = S.tiros[i], A = ARMAS[t.arma], d0 = t.d; t.d += t.vel * dt; t.x += t.vx * dt; t.resta -= t.vel * dt;
      // zumbis no caminho deste passo
      for (let q = d0; q <= t.d + .75 && !t.morto; q += 1.2) perto(t.x, Math.min(q, t.d), z => {
        if (z.morto || z === t.ultimo) return;
        if (Math.abs(z.x - t.x) < z.T.raio * 1.05 && z.d > d0 - .5 && z.d < t.d + .35) { aoEvento('acerto', { x: t.x, d: z.d, z, arma: t.arma }); ferir(z, t.dano); t.ultimo = z; if (A.raio) { acertou(t, t.x, z.d); return true; } if (t.passa-- <= 0) { t.morto = true; return true; } }
      });
      if (!t.morto && c && t.d > c.d - c.T.raio * .7 && Math.abs(t.x - c.x) < c.T.raio * 1.1) { const d = c.d - c.T.raio * .75; aoEvento('acertoChefe', { x: t.x, d, c, arma: t.arma, y: A.raio ? 2 : .8 + sorte() * c.T.altura * .55 }); ferirChefe(t.dano + (A.raio ? A.danoArea * S.multDano : 0)); acertou(t, t.x, d); }
      if (!t.morto) for (const o of S.blocos) if (o.vida > 0 && t.x > o.x0 && t.x < o.x1 && t.d > o.d0 && d0 < o.d1) { o.vida -= t.dano; o.dano = 1; aoEvento('faisca', { x: t.x, d: o.d0 - .2, arma: t.arma, lata: true }); acertou(t, t.x, o.d0 - .3); break; }
      if (!t.morto) for (const b of S.barris) if (b.vivo && !(b.voa && b.voa.t < b.voa.dur * .32) && Math.abs(b.x - t.x) < b.raio && b.d > d0 - .4 && b.d < t.d + .3) { b.vida -= t.dano; b.dano = 1; aoEvento('faisca', { x: t.x, d: b.d - .4, arma: t.arma, alt: b.alt || 0, lata: b.tipo !== 'barril' || true }); acertou(t, t.x, b.d - .4); break; }
      if (!t.morto) for (const p of S.portoes) if (p.usado < 0 && p.d > d0 && p.d <= t.d) { const kk = ladoDe(p, t.x), l = p.lados[kk]; if (l.tipo === 'tiro') { l.pancadas += t.dano; const ganho = Math.floor(l.pancadas / 40); if (ganho) { l.pancadas -= ganho * 40; const era = l.v; l.v = Math.min(30, l.v + ganho); p.mudou = true; aoEvento('dente', l); if (era < 0 && l.v >= 0) aoEvento('virou', { p, k: kk }); } aoEvento('faiscaPortao', { x: t.x, d: p.d, bom: l.v >= 0, arma: t.arma }); acertou(t, t.x, p.d - .3); } }
      if (!t.morto && A.raio && t.resta <= 0) acertou(t, t.x, t.d);
      if (t.morto || t.resta <= 0) { S.tiros[i] = S.tiros[S.tiros.length - 1]; S.tiros.pop(); livresT.push(t); }
    }
  }
  somar(trecho.inicio + (melhorias.soldados || 0)); for (const [m, a] of [['bazuca', 4], ['metralhadora', 3], ['chamas', 5]]) if (melhorias[m]) especialistas(a, melhorias[m]);
  // veteranos: soldados com nome, que sobreviveram a níveis anteriores e causam o dobro de dano
  for (const nome of melhorias.vets || []) { S.n++; novoSoldado(null); S.soldados.at(-1).vet = nome; }
  return Object.assign(S, {
    passo, somar, evoluir, bom, especialistas, borda, chamar,
    mover(dx, dd) { S.alvoX += dx; S.alvoFrente += dd; },
    // para testes: leva direto à luta com o chefe
    pularParaChefe() { S.meioFeito = true; S.d = trecho.comprimento - .5; S.blocos.length = S.vaos.length = S.marcas.length = 0; S.gelos.length = 0; for (const o of daLado) o.foi = true; for (const p of perigos) p.foi = true; for (const p of S.portoes) if (p.usado < 0) p.usado = 0; for (const b of S.barris) b.vivo = false; for (const z of S.zumbis) z.morto = true; fila.length = 0; proximaHorda = daFrente.length; },
    pularParaMeio() { const D = trecho.meio.d; S.d = D - .5; for (const p of S.portoes) if (p.usado < 0 && p.d < D) p.usado = 0; for (const b of S.barris) if (b.d < D) b.vivo = false; for (const z of S.zumbis) z.morto = true; fila.length = 0; while (proximaHorda < daFrente.length && daFrente[proximaHorda][0] < D) proximaHorda++; for (const o of daLado) if (o.h[0] < D) o.foi = true; for (const p of perigos) if (p.d < D) p.foi = true; S.blocos = S.blocos.filter(b => b.d > D); },
  });
}
