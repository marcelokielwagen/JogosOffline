// Física do Galatic Pinball: bola, paredes, palhetas, para-choques, canos, trilhos, buracos e varandas.
// A mesa principal e cada varanda são planos 2D com a mesma inclinação (gravidade G puxando para o jogador).
// Nas trilhas (canos, trilhos, lançador, elevador) a bola anda ao longo de um caminho com subida de verdade:
// se não tiver força, ela volta descendo.
import { R, Z, RALO, VARANDAS, paredes, palhetas, BUMPERS, TECLAS, ALVOS, ESTILINGUES, VINIL, BURACOS, LETRAS, ALTAS, VOLTAS, CATRACAS, COMETA, PORTAS, TRILHAS } from '../mesa/layout.js';

export const G = 1150;          // gravidade da mesa inclinada
export const PASSO = 1 / 600;   // cada passo da física
const VMAX = 3200;
const K_SUBIDA = 2400;          // quanto a subida freia a bola
const ATRITO = .05;             // atrito da bola encostada nas paredes
const QUEDA_G = 2600;           // gravidade da queda (só altura)
const BOCAS = Object.values(TRILHAS).filter(T => T.boca);

const aleat = (a, b) => a + Math.random() * (b - a);

export function criarFisica(aoEvento) {
  const M = { bolas: [], relogio: 0, puxar: 0, puxando: false, tilt: false, arcoAte: 0, elevadorVai: 'elevE' };
  const ev = (nome, dados) => aoEvento && aoEvento(nome, dados);

  // ---------- Bola ----------
  function novaBola() {
    return { x: 0, y: 0, z: 0, vz: 0, vx: 0, vy: 0, andar: 0, trilha: null, s: 0, v: 0, presa: 0, buraco: null, fora: false, ignora: 0, parado: 0,
             naMola: false, sozinha: 0, bonus: false, dx: 0, dy: 0, noVinil: 0, tempoVaranda: 0, bateu: -9 };
  }
  // sozinha = a mesa lança a bola por conta própria (bola salva e multibola)
  function bolaNoLancador(sozinha = false) {
    const b = novaBola();
    entrarTrilha(b, TRILHAS.lancador, 0, 0);
    b.naMola = true;
    if (sozinha) b.sozinha = M.relogio + .6 + .9 * M.bolas.filter(o => o.sozinha).length;
    M.bolas.push(b);
    return b;
  }

  // Bolas de bônus: saem da explosão do cometa, espalhadas para cima
  function bolasBonus(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (.2 + .6 * (n > 1 ? i / (n - 1) : .5)), b = novaBola();
      Object.assign(b, { x: x + Math.cos(a) * 20, y: y + Math.sin(a) * 20, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, bonus: true, z: 26 });
      M.bolas.push(b);
    }
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
    const p = pontoTrilha(T, s);
    // a bola entra onde estiver e vai escorregando para o meio da trilha (sem pulo)
    const nova = !b.x && !b.y;
    b.dx = nova ? 0 : Math.max(-36, Math.min(36, b.x - p.x));
    b.dy = nova ? 0 : Math.max(-20, Math.min(20, b.y - p.y));
    b.trilha = T; b.s = s; b.v = v; b.naMola = false;
    b.x = p.x + b.dx; b.y = p.y + b.dy; b.z = p.z;
    if (T.nome !== 'lancador') ev('trilha', { nome: T.nome, sobe: v > 0 });
  }
  function sairTrilha(b, fim) {
    const T = b.trilha, p = pontoTrilha(T, fim ? T.L : 0);
    const l = Math.hypot(p.tx, p.ty) || 1;
    b.trilha = null; b.andar = fim ? T.andarFim : T.andarIni;
    b.x = p.x + b.dx; b.y = p.y; b.z = Math.max(p.z, Z[b.andar]); b.vz = 0; b.dx = b.dy = 0;
    let v = T.cinem ? T.saida : b.v;
    if (fim && T.vmax) v = Math.min(v, T.vmax);
    b.vx = p.tx / l * v; b.vy = p.ty / l * v;
    b.ignora = M.relogio + .25; if (T.andarIni !== T.andarFim) b.tempoVaranda = 0;
    if (fim) ev('chegou', { nome: T.nome });
  }
  function moverTrilha(b, h) {
    const T = b.trilha, puxa = Math.max(0, 1 - 9 * h);
    b.dx *= puxa; b.dy *= puxa;
    if (T.cinem) {
      b.s += T.cinem * h;
      if (b.s >= T.L) { sairTrilha(b, true); return; }
    } else if (b.naMola) {
      b.s = 0; b.v = 0;
      if (b.sozinha && M.relogio > b.sozinha) { b.sozinha = 0; b.naMola = false; b.v = 2450 + aleat(-120, 120); M.arcoAte = M.relogio + 2.6; ev('lancou', { forca: 1, sozinha: true }); }
    } else {
      const p0 = pontoTrilha(T, b.s);
      b.v += (G * p0.ty - (T.k || K_SUBIDA) * p0.tz) * h;
      b.v *= 1 - .15 * h;
      b.s += b.v * h;
      if (b.s >= T.L) { sairTrilha(b, true); return; }
      if (b.s <= 0) {
        if (T.nome === 'lancador') { b.s = 0; b.v = 0; b.naMola = true; ev('voltouMola'); }
        else { sairTrilha(b, false); return; }
      }
    }
    const p = pontoTrilha(T, b.s);
    b.x = p.x + b.dx; b.y = p.y + b.dy; b.z = p.z;
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
  // rola = parede: o atrito depende da força do encosto, para a bola escorrer bem pelas guias
  function rebater(c, e, f, svx = 0, svy = 0, rola = false) {
    B.x += c.nx * c.pen; B.y += c.ny * c.pen;
    const rvx = B.vx - svx, rvy = B.vy - svy, vn = rvx * c.nx + rvy * c.ny;
    if (vn >= 0) return 0;
    const tx = -c.ny, ty = c.nx, vt = rvx * tx + rvy * ty;
    const ee = e * (1 - Math.min(.3, -vn / 7000));
    const nvn = vn > -35 ? 0 : -vn * ee;
    let nvt = rola ? vt - Math.sign(vt) * Math.min(Math.abs(vt) * f, ATRITO * -vn) : vt * (1 - f);
    if (vn < -150) nvt += aleat(-.025, .025) * -vn;
    B.vx = svx + c.nx * nvn + tx * nvt; B.vy = svy + c.ny * nvn + ty * nvt;
    return -vn;
  }
  function colisoes(andar) {
    for (const p of paredes) {
      if (p.andar !== andar) continue;
      if (p.porta && PORTAS[p.porta].aberta) continue;
      if (p.mao && (B.x - p.ax) * p.mao[0] + (B.y - p.ay) * p.mao[1] < 0) continue;
      const c = contato(p.ax, p.ay, p.bx, p.by, p.r);
      if (!c) continue;
      const forca = rebater(c, p.e, p.f, 0, 0, true);
      if (p.chute && forca > 60 && p.est.flash <= 0 && !M.tilt) {
        B.vx += c.nx * p.chute; B.vy += c.ny * p.chute;
        p.est.flash = .14;
        B.bateu = M.relogio;
        ev('estilingue', { x: c.qx, y: c.qy });
      } else if (forca > 400 && p.tipo !== 'borracha') ev('batida', { forca });
    }
    for (const u of BUMPERS) {
      if (u.andar !== andar) continue;
      const c = contato(u.x, u.y, u.x, u.y, u.r);
      if (!c) continue;
      const forca = rebater(c, .4, .02);
      if (forca > 40 && u.flash <= 0 && !M.tilt && B.tempoVaranda < 14) { const chute = u.andar ? 260 : 430; const g = aleat(-.35, .35), cg = Math.cos(g), sg = Math.sin(g); B.vx += (c.nx * cg - c.ny * sg) * chute; B.vy += (c.nx * sg + c.ny * cg) * chute; u.flash = .16; B.bateu = M.relogio; ev('bumper', u); }
    }
    if (andar === 0 && COMETA.vivo) {
      const c = contato(COMETA.x, COMETA.y, COMETA.x, COMETA.y, COMETA.r);
      if (c) {
        const forca = rebater(c, .55, .02, COMETA.vx, 0);
        if (forca > 80 && M.relogio - COMETA.toque > .12) { COMETA.toque = M.relogio; B.vx += c.nx * 160; B.vy += c.ny * 160; B.bateu = M.relogio; ev('cometa', { x: c.qx, y: c.qy }); }
      }
    }
    if (andar === 0) for (const t of TECLAS) {
      if (t.acesa) continue;                       // já caiu: a bola passa
      const c = contato(t.ax, t.ay, t.bx, t.by, 3);
      if (c && rebater(c, .4, .02) > 60) { t.toque = M.relogio; B.bateu = M.relogio; ev('tecla', t); }
    }
    for (const a of ALVOS) {
      if (a.andar !== andar) continue;
      const c = contato(a.ax, a.ay, a.bx, a.by, 3);
      if (c && rebater(c, .55, .02) > 45 && M.relogio - a.toque > .2) { a.toque = M.relogio; B.bateu = M.relogio; ev('alvo', a); }
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

  // ---------- Bola andando no chão ----------
  function moverBola(b, h) {
    if (b.presa) {
      if (M.relogio >= b.presa) {
        b.presa = 0;
        entrarTrilha(b, TRILHAS[b.buraco === 'elevador' ? M.elevadorVai : b.buraco], 0, 0);
      }
      return;
    }
    if (b.trilha) { moverTrilha(b, h); return; }
    B = b;
    const k = b.andar;
    // as varandas são mais planas: a bola anda mais devagar lá em cima
    b.vy += (k ? G * .5 : G) * h;
    if (k === VINIL.andar) {
      const dx = b.x - VINIL.x, dy = b.y - VINIL.y;
      if (dx * dx + dy * dy < VINIL.r * VINIL.r) {
        const f = (1.5 + VINIL.w * .8) * h;        // quanto mais rápido, mais o disco agarra a bola
        b.vx += (-VINIL.w * dy * 1.6 - b.vx) * f;
        b.vy += (VINIL.w * dx * 1.6 - b.vy) * f;
        b.noVinil += h;
        if (b.noVinil > .35) { b.noVinil = 0; ev('vinil'); }
      }
    }
    if (M.relogio > b.ignora) for (const u of BURACOS) {
      if (u.andar !== k || (u.porta && !PORTAS[u.porta].aberta)) continue;
      const dx = u.x - b.x, dy = u.y - b.y, d = Math.hypot(dx, dy);
      if (d >= 18) continue;
      if (d < 8 && Math.hypot(b.vx, b.vy) < 1100) {
        b.x = u.x; b.y = u.y; b.vx = b.vy = 0; b.presa = M.relogio + u.espera; b.buraco = u.nome; ev('buraco', { nome: u.nome }); return;
      }
      const f = 1500 * (1 - d / 18) * h / (d || 1);
      b.vx += dx * f; b.vy += dy * f;
    }
    const y0 = b.y;
    b.vx *= 1 - .06 * h; b.vy *= 1 - .06 * h;
    const v2 = b.vx * b.vx + b.vy * b.vy;
    if (v2 > VMAX * VMAX) { const f = VMAX / Math.sqrt(v2); b.vx *= f; b.vy *= f; }
    b.x += b.vx * h; b.y += b.vy * h;
    colisoes(k);

    if (k === 0) {
      const perto = (l, raio) => (l.x - b.x) ** 2 + (l.y - b.y) ** 2 < raio * raio;
      for (const l of LETRAS) if (perto(l, 10)) { if (M.relogio - l.toque > .5) ev('letra', l); l.toque = M.relogio; }
      for (const l of ALTAS) if (perto(l, 11)) { if (M.relogio - l.toque > .5) ev('alta', l); l.toque = M.relogio; }
      for (const l of VOLTAS) if (perto(l, 20)) {
        if (M.relogio - l.toque > .5) {
          const outro = VOLTAS.find(o => o !== l);
          if (M.relogio - outro.toque < 1.6) { outro.toque = -9; ev('volta', { de: outro.lado }); }
        }
        l.toque = M.relogio;
      }
      for (const q of CATRACAS) if (b.x > q.x0 && b.x < q.x1 && (y0 - q.y) * (b.y - q.y) < 0) q.w = b.vy * .035;
    }
    if (M.relogio > b.ignora) for (const T of BOCAS) {
      const q = T.boca;
      if (T.andarIni !== k || b.vy * q.dir <= 0 || b.x < q.x0 || b.x > q.x1) continue;
      const passou = (b.y - q.y) * q.dir;
      if (passou > 0 && passou < 14) {
        // acelerador na boca dos canos: quem entra com alguma força ganha um empurrão para subir
        let v = Math.hypot(b.vx, b.vy) * .95;
        if (T.cano && v > (T.minimo ? 150 : 380)) v = Math.max(v, T.minimo || 1380);
        entrarTrilha(b, T, 0, v); return;
      }
    }
    if (k === 0) { if (b.y > RALO) { b.fora = true; return; } }
    else {
      // segurança: se escapar da varanda, cai na mesa
      const v = VARANDAS[k].jogo;
      if (b.x < v.x0 - 12 || b.x > v.x1 + 12 || b.y < v.y0 - 12 || b.y > v.y1 + 14) { b.andar = 0; b.vz = 0; b.x = 185 + Math.sign(b.x - 185) * 20; b.y = 640; ev('queda'); return; }
      b.tempoVaranda += h;
    }
    // bola parada num canto por muito tempo: a mesa dá um empurrãozinho
    if (Math.hypot(b.vx, b.vy) < 12 && !palhetas.some(p => p.apertada)) {
      b.parado += h;
      if (b.parado > 2.5) { b.vy = k ? -200 : -380; b.vx = aleat(-120, 120); b.parado = 0; ev('empurrao', { x: b.x, y: b.y, andar: k }); }
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
    PORTAS.arco.aberta = M.relogio > M.arcoAte;
    for (const p of palhetas) {
      // a visita à varanda tem limite: depois dele as palhetas pequenas descansam e a bola desce pelo trilho
      const cansada = p.andar > 0 && M.bolas.some(b => b.andar === p.andar && !b.trilha && b.tempoVaranda > 20);
      const alvo = p.apertada && !M.tilt && !cansada ? p.cima : p.rep, ant = p.ang, dir = Math.sign(alvo - p.ang);
      if (!dir) p.w = 0;
      else {
        if (Math.sign(p.w) !== dir) p.w = 0;
        const vel = p.andar ? 30 : 46;
        p.w = dir * Math.min(p.apertada ? vel : 24, Math.abs(p.w) + (p.apertada ? 1500 : 700) * h);
        let novo = p.ang + p.w * h;
        if ((dir > 0 && novo >= alvo) || (dir < 0 && novo <= alvo)) { novo = alvo; p.w = 0; }
        p.ang = novo;
      }
      p.wReal = (p.ang - ant) / h;
    }
    for (const s of ESTILINGUES) if (s.flash > 0) s.flash -= h;
    for (const u of BUMPERS) if (u.flash > 0) u.flash -= h;
    if (M.puxando) M.puxar = Math.min(1, M.puxar + h / 1.1);
    VINIL.w += (VINIL.alvo - VINIL.w) * Math.min(1, 1.5 * h);
    VINIL.ang += VINIL.w * h;
    // catraca: cada meia volta vale pontos
    for (const q of CATRACAS) {
      const meia = Math.floor(q.ang / Math.PI);
      q.ang += q.w * h; q.w *= 1 - 1.1 * h;
      if (Math.abs(q.w) < 2) q.w = 0;
      if (Math.floor(q.ang / Math.PI) !== meia) ev('catraca');
    }
    // cometa: vai e volta devagar
    COMETA.fase += h * .9;
    const xc = COMETA.x0 + Math.sin(COMETA.fase) * COMETA.amplitude;
    COMETA.vx = (xc - COMETA.x) / h; COMETA.x = xc;
    if (!COMETA.vivo && M.relogio > COMETA.volta) { COMETA.vivo = true; COMETA.batidas = 0; ev('cometaVoltou'); }
    for (const b of M.bolas.slice()) { moverBola(b, h); alturaVisual(b, h); }
    if (M.bolas.length > 1) choqueEntreBolas();
    const perdidas = M.bolas.filter(b => b.fora);
    if (perdidas.length) { M.bolas = M.bolas.filter(b => !b.fora); perdidas.forEach(b => ev('perdeu', b)); }
  }

  // ---------- Lançador ----------
  const naMola = () => M.bolas.find(b => b.naMola && !b.sozinha);
  function comecarPuxar() { if (!naMola() || M.puxando) return false; M.puxando = true; M.puxar = 0; return true; }
  function soltar() {
    if (!M.puxando) return;
    M.puxando = false;
    const b = naMola();
    if (b) { b.naMola = false; b.v = 800 + 2000 * M.puxar; M.arcoAte = M.relogio + 2.6; ev('lancou', { forca: M.puxar }); }
    M.puxar = 0;
  }

  Object.assign(M, { passo, bolaNoLancador, bolasBonus, comecarPuxar, soltar, naMola, pontoTrilha });
  return M;
}
