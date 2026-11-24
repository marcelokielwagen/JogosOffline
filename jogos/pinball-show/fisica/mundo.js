// Física do Pinball Show: bola, paredes, palhetas, rampas, elevador e quedas entre os 3 andares.
// Cada andar é um plano 2D com a mesma inclinação (gravidade G puxando para o jogador).
// Nas trilhas (rampas, lançador, elevador) a bola anda ao longo de um caminho com subida de verdade:
// se não tiver força, ela volta descendo.
import { R, Z, BORDA, RALO, paredes, palhetas, TECLAS, VINIL, BURACO, TRILHAS, RAMPAS_INFO } from '../mesa/layout.js';

export const G = 1150;          // gravidade da mesa inclinada
export const PASSO = 1 / 600;   // cada passo da física
const VMAX = 3200;
const K_SUBIDA = 16000;         // quanto a subida das rampas freia a bola
const QUEDA_G = 2600;           // gravidade da queda de um andar para o outro (só altura)

const aleat = (a, b) => a + Math.random() * (b - a);

export function criarFisica(aoEvento) {
  const M = { bolas: [], relogio: 0, puxar: 0, puxando: false, tilt: false };
  const ev = (nome, dados) => aoEvento && aoEvento(nome, dados);

  // ---------- Bola ----------
  function novaBola() {
    return { x: 0, y: 0, z: 0, vz: 0, vx: 0, vy: 0, andar: 0, trilha: null, s: 0, v: 0, presa: 0, fora: false, ignora: 0, parado: 0, naMola: false };
  }
  function bolaNoLancador() {
    const b = novaBola();
    entrarTrilha(b, TRILHAS.lancador, 0, 0);
    b.naMola = true;
    M.bolas.push(b);
    return b;
  }

  // ---------- Trilhas ----------
  function pontoTrilha(T, s) {
    const P = T.pts;
    let i = 1;
    while (i < P.length - 1 && P[i].d < s) i++;
    const a = P[i - 1], b = P[i], L = (b.d - a.d) || 1, t = Math.max(0, Math.min(1, (s - a.d) / L));
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t,
             tx: (b.x - a.x) / L, ty: (b.y - a.y) / L, tz: (b.z - a.z) / L };
  }
  function entrarTrilha(b, T, s, v) {
    b.trilha = T; b.s = s; b.v = v; b.naMola = false;
    const p = pontoTrilha(T, s);
    b.x = p.x; b.y = p.y; b.z = p.z;
    if (T.nome !== 'lancador') ev('trilha', { nome: T.nome, sobe: v > 0 });
  }
  function sairTrilha(b, fim) {
    const T = b.trilha, p = pontoTrilha(T, fim ? T.L : 0);
    const l = Math.hypot(p.tx, p.ty) || 1;
    b.trilha = null; b.andar = fim ? T.andarFim : T.andarIni;
    b.x = p.x; b.y = p.y; b.z = Math.max(p.z, Z[b.andar]); b.vz = 0;
    const v = T.cinem ? 650 : b.v;
    b.vx = p.tx / l * v; b.vy = p.ty / l * v;
    b.ignora = M.relogio + .25;
    if (fim) ev('chegou', { nome: T.nome });
  }
  function moverTrilha(b, h) {
    const T = b.trilha;
    if (T.cinem) {
      b.s += T.cinem * h;
      if (b.s >= T.L) { sairTrilha(b, true); return; }
    } else {
      if (b.naMola) { b.s = 0; b.v = 0; }
      else {
        const p0 = pontoTrilha(T, b.s);
        b.v += (G * p0.ty - K_SUBIDA * p0.tz) * h;
        b.v *= 1 - .25 * h;
        b.s += b.v * h;
        if (b.s >= T.L) { sairTrilha(b, true); return; }
        if (b.s <= 0) {
          if (T.nome === 'lancador') { b.s = 0; b.v = 0; b.naMola = true; ev('voltouMola'); }
          else { sairTrilha(b, false); return; }
        }
      }
    }
    const p = pontoTrilha(T, b.s);
    b.x = p.x; b.y = p.y; b.z = p.z;
  }

  // ---------- Colisões ----------
  let B = null;
  const C = { nx: 0, ny: 0, pen: 0, qx: 0, qy: 0 };
  function contato(ax, ay, bx, by, rad) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let t = L2 ? ((B.x - ax) * dx + (B.y - ay) * dy) / L2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t, qy = ay + dy * t, ex = B.x - qx, ey = B.y - qy, d2 = ex * ex + ey * ey, m = R + rad;
    if (d2 >= m * m) return null;
    const d = Math.sqrt(d2) || 1e-6;
    C.nx = ex / d; C.ny = ey / d; C.pen = m - d; C.qx = qx; C.qy = qy;
    return C;
  }
  // Empurra a bola para fora e devolve a força da batida (a borracha devolve menos quando a batida é forte)
  function rebater(c, e, f, svx = 0, svy = 0) {
    B.x += c.nx * c.pen; B.y += c.ny * c.pen;
    const rvx = B.vx - svx, rvy = B.vy - svy, vn = rvx * c.nx + rvy * c.ny;
    if (vn >= 0) return 0;
    const tx = -c.ny, ty = c.nx, vt = rvx * tx + rvy * ty;
    const ee = e * (1 - Math.min(.3, -vn / 7000));
    const nvn = vn > -35 ? 0 : -vn * ee;
    let nvt = vt * (1 - f);
    if (vn < -150) nvt += aleat(-.025, .025) * -vn;
    B.vx = svx + c.nx * nvn + tx * nvt; B.vy = svy + c.ny * nvn + ty * nvt;
    return -vn;
  }
  function colisoes(andar) {
    for (const p of paredes) {
      if (p.andar !== andar) continue;
      if (p.mao && (B.x - p.ax) * p.mao[0] + (B.y - p.ay) * p.mao[1] < 0) continue;
      const c = contato(p.ax, p.ay, p.bx, p.by, p.r);
      if (!c) continue;
      const forca = rebater(c, p.e, p.f);
      if (p.chute && forca > 60 && p.est.flash <= 0 && !M.tilt) {
        B.vx += c.nx * p.chute; B.vy += c.ny * p.chute;
        p.est.flash = .14;
        ev('estilingue', { x: c.qx, y: c.qy });
      } else if (forca > 400 && p.tipo !== 'borracha') ev('batida', { forca });
    }
    if (andar === 2) for (const t of TECLAS) {
      const c = contato(t.ax + 1, t.y, t.bx - 1, t.y, 2);
      if (c && rebater(c, .4, .02) > 60 && M.relogio - t.toque > .15) { t.toque = M.relogio; ev('tecla', t); }
    }
    for (const p of palhetas) {
      if (p.andar !== andar) continue;
      const co = Math.cos(p.ang), si = Math.sin(p.ang), tx = p.px + co * p.len, ty = p.py + si * p.len;
      let t = ((B.x - p.px) * co + (B.y - p.py) * si) / p.len;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const c = contato(p.px, p.py, tx, ty, p.rb + (p.rt - p.rb) * t);
      if (!c) continue;
      const forca = rebater(c, p.wReal ? .34 : .22, .03, -p.wReal * (c.qy - p.py), p.wReal * (c.qx - p.px));
      if (forca > 900) ev('batida', { forca });
    }
  }

  // ---------- Bola andando no chão de um andar ----------
  function moverBola(b, h) {
    if (b.presa) {
      if (M.relogio >= b.presa) { b.presa = 0; entrarTrilha(b, TRILHAS.elevador, 0, 0); }
      return;
    }
    if (b.trilha) { moverTrilha(b, h); return; }
    B = b;
    const k = b.andar;
    b.vy += G * h;
    // vinil girando (andar do meio): puxa a bola na direção do giro
    if (k === 1) {
      const dx = b.x - VINIL.x, dy = b.y - VINIL.y;
      if (dx * dx + dy * dy < VINIL.r * VINIL.r) {
        const f = 2.2 * h;
        b.vx += (-VINIL.w * dy - b.vx) * f;
        b.vy += (VINIL.w * dx - b.vy) * f;
      }
    }
    // buraco do elevador (andar 0): puxa de leve e engole a bola devagar
    if (k === 0 && M.relogio > b.ignora) {
      const dx = BURACO.x - b.x, dy = BURACO.y - b.y, d = Math.hypot(dx, dy);
      if (d < 22) {
        if (d < 8 && Math.hypot(b.vx, b.vy) < 1300) {
          b.x = BURACO.x; b.y = BURACO.y; b.vx = b.vy = 0; b.presa = M.relogio + .5; ev('elevador'); return;
        }
        const f = 1700 * (1 - d / 22) * h / (d || 1);
        b.vx += dx * f; b.vy += dy * f;
      }
    }
    b.vx *= 1 - .06 * h; b.vy *= 1 - .06 * h;
    const v2 = b.vx * b.vx + b.vy * b.vy;
    if (v2 > VMAX * VMAX) { const f = VMAX / Math.sqrt(v2); b.vx *= f; b.vy *= f; }
    b.x += b.vx * h; b.y += b.vy * h;
    colisoes(k);

    if (M.relogio > b.ignora) {
      // boca das rampas: a bola subindo entra na rampa
      for (const r of RAMPAS_INFO) {
        if (r.andarIni !== k || b.vy >= 0) continue;
        if (b.x > r.x0 + 4 && b.x < r.x1 - 4 && b.y < r.yBoca && b.y > r.yBoca - 18) { entrarTrilha(b, TRILHAS[r.nome], 0, -b.vy * .95); return; }
      }
    }
    // passou da beirada do andar: desce pela rampa (de costas) ou cai no andar de baixo
    if (k > 0 && b.y > BORDA[k]) {
      for (const r of RAMPAS_INFO) {
        if (r.andarFim === k && b.x > r.x0 + 3 && b.x < r.x1 - 3) { const T = TRILHAS[r.nome]; entrarTrilha(b, T, T.L, -Math.max(b.vy, 40)); return; }
      }
      b.andar = k - 1; b.y = BORDA[k] + R + 4; b.vz = 0; b.ignora = M.relogio + .3;
      // caiu em cima da torre do elevador: o telhado desvia a bola para o lado
      if (k === 1 && Math.abs(b.x - BURACO.x) < 17) { const l = b.x < BURACO.x ? -1 : 1; b.x = BURACO.x + l * 19; b.vx = l * 160; }
      ev('queda', { de: k });
      return;
    }
    if (k === 0 && b.y > RALO) { b.fora = true; return; }
    // segurança: se atravessou o degrau por algum motivo, volta para o lugar
    if (k === 1 && b.y < BORDA[2] + R) b.y = BORDA[2] + R;
    if (k === 0 && b.y < BORDA[1] + R) b.y = BORDA[1] + R;
    // bola parada num canto por muito tempo: a mesa dá um empurrãozinho
    if (Math.hypot(b.vx, b.vy) < 12 && !palhetas.some(p => p.apertada)) {
      b.parado += h;
      if (b.parado > 3) { b.vy = -380; b.vx = aleat(-120, 120); b.parado = 0; }
    } else b.parado = 0;
  }

  function alturaVisual(b, h) {
    if (b.trilha || b.presa) return;
    const alvo = Z[b.andar];
    if (b.z > alvo) {
      b.vz -= QUEDA_G * h; b.z += b.vz * h;
      if (b.z <= alvo) { if (b.vz < -200) ev('pouso', { forca: -b.vz }); b.z = alvo; b.vz = 0; }
    } else b.z = alvo;
  }

  function choqueEntreBolas() {
    const L = M.bolas;
    for (let i = 0; i < L.length; i++) for (let k = i + 1; k < L.length; k++) {
      const a = L[i], b = L[k];
      if (a.presa || b.presa || a.fora || b.fora || a.trilha || b.trilha || a.andar !== b.andar) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
      if (d2 >= 4 * R * R || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = (2 * R - d) / 2;
      a.x -= nx * pen; a.y -= ny * pen; b.x += nx * pen; b.y += ny * pen;
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vn < 0) { const imp = -vn * .95; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; }
    }
  }

  // ---------- Um passo da simulação ----------
  function passo(h) {
    M.relogio += h;
    for (const p of palhetas) {
      const alvo = p.apertada && !M.tilt ? p.cima : p.rep, ant = p.ang, dir = Math.sign(alvo - p.ang);
      if (!dir) p.w = 0;
      else {
        if (Math.sign(p.w) !== dir) p.w = 0;
        p.w = dir * Math.min(p.apertada ? 46 : 24, Math.abs(p.w) + (p.apertada ? 1500 : 700) * h);
        let novo = p.ang + p.w * h;
        if ((dir > 0 && novo >= alvo) || (dir < 0 && novo <= alvo)) { novo = alvo; p.w = 0; }
        p.ang = novo;
      }
      p.wReal = (p.ang - ant) / h;
    }
    if (M.puxando) M.puxar = Math.min(1, M.puxar + h / 1.1);
    VINIL.ang += VINIL.w * h;
    for (const b of M.bolas.slice()) { moverBola(b, h); alturaVisual(b, h); }
    if (M.bolas.length > 1) choqueEntreBolas();
    const perdidas = M.bolas.filter(b => b.fora);
    if (perdidas.length) { M.bolas = M.bolas.filter(b => !b.fora); perdidas.forEach(() => ev('perdeu')); }
  }

  // ---------- Lançador ----------
  const naMola = () => M.bolas.find(b => b.naMola);
  function comecarPuxar() { if (!naMola() || M.puxando) return false; M.puxando = true; M.puxar = 0; return true; }
  function soltar() {
    if (!M.puxando) return;
    M.puxando = false;
    const b = naMola();
    if (b) { b.naMola = false; b.v = 700 + 2300 * M.puxar; ev('lancou', { forca: M.puxar }); }
    M.puxar = 0;
  }

  Object.assign(M, { passo, bolaNoLancador, comecarPuxar, soltar, naMola, pontoTrilha });
  return M;
}
