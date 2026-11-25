/* Ricochet Zen: um lançamento de estilingue para apagar todas as formas.

   MUNDO: 1000 x 1400 unidades, em qualquer tela. As bordas são abertas: saiu, acabou o lançamento.
   Formas (alvos) somem ao serem tocadas; barreiras ficam. Tudo rebate a bola.

   FÍSICA COM PASSOS CURTOS
   A bola anda em passos de 1/4 do raio dela, então nunca pula uma forma (a menor é bem maior que isso).
   Se no fim do passo ela encostou em algo, o ponto exato do toque é achado dividindo o passo ao meio
   várias vezes; ali ela rebate e termina o resto do passo. O passo é medido em distância, não em tempo:
   o caminho é o mesmo a 30, 60 ou 144 quadros por segundo, devagar ou rápido.
   Só entram + - * / e raiz quadrada, que dão o mesmo resultado em todo aparelho.

   COMO A FASE É CRIADA
   O gerador sorteia por onde a bola vai passar e põe em cada virada uma forma, na inclinação certa para
   causar aquela virada. Depois simula o lançamento com esta mesma física: toda fase tem solução.        */
(() => {
'use strict';

const LARG = 1000, ALT = 1400, R = 23, PASSO = R / 4, MAX_DIST = 15000, MAX_RIC = 50;
const raiz = Math.sqrt;

/* ======================= formas ======================= */

// polígonos com uma face virada para +x e distância 1 do centro até ela
const POLIGONOS = {
  quadrado:  [[1, 1], [-1, 1], [-1, -1], [1, -1]],
  triangulo: [[1, 1.7320508075688772], [-2, 0], [1, -1.7320508075688772]],
  pentagono: [[1, .7265425280053609], [-.3819660112501051, 1.1755705045849463], [-1.2360679774997896, 0], [-.3819660112501051, -1.1755705045849463], [1, -.7265425280053609]],
  hexagono:  [[1, .5773502691896257], [0, 1.1547005383792515], [-1, .5773502691896257], [-1, -.5773502691896257], [0, -1.1547005383792515], [1, -.5773502691896257]]
};
/* Toda forma é um miolo (ponto ou polígono) engrossado por um raio: os cantos são redondos de verdade,
   e a batida no canto é tão exata quanto na face.  n = direção da face; tam = distância do centro à face;
   comp = meia largura, só para a barra */
function forma(tipo, alvo, x, y, nx, ny, tam, comp) {
  if (tipo === 'bola') return { tipo, alvo, x, y, v: [[x, y]], rr: tam, br: tam };
  const rr = tipo === 'barra' ? Math.min(10, tam * .5) : tam * .3, a = tam - rr;
  const base = tipo === 'barra' ? [[a, comp - rr], [-a, comp - rr], [-a, rr - comp], [a, rr - comp]] : POLIGONOS[tipo].map(([p, q]) => [p * a, q * a]);
  let m = 0; for (const [p, q] of base) m = Math.max(m, p * p + q * q);
  return { tipo, alvo, x, y, v: base.map(([p, q]) => [x + p * nx - q * ny, y + p * ny + q * nx]), rr, br: raiz(m) + rr };
}
// ponto do miolo mais perto de (x, y); devolve a distância até a superfície e guarda o ponto em PX, PY
let PX = 0, PY = 0;
function distancia(f, x, y) {
  const v = f.v, n = v.length; let melhor = Infinity;
  if (n === 1) { PX = v[0][0]; PY = v[0][1]; const a = x - PX, b = y - PY; return raiz(a * a + b * b) - f.rr; }
  let dentro = true;
  for (let i = 0; i < n; i++) {
    const p = v[i], q = v[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], wx = x - p[0], wy = y - p[1];
    if (ex * wy - ey * wx < 0) dentro = false;
    let t = (wx * ex + wy * ey) / (ex * ex + ey * ey); t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = p[0] + ex * t, cy = p[1] + ey * t, a = x - cx, b = y - cy, d = a * a + b * b;
    if (d < melhor) { melhor = d; PX = cx; PY = cy; }
  }
  return (dentro ? -raiz(melhor) : raiz(melhor)) - f.rr;
}
const longe = (f, x, y, d) => { const a = x - f.x, b = y - f.y, s = f.br + d; return a * a + b * b > s * s; };

/* ======================= física ======================= */

function lancar(formas, x, y, dx, dy) {
  const m = raiz(dx * dx + dy * dy);
  return { formas, vivo: formas.map(() => true), restam: formas.filter(f => f.alvo).length, x, y, dx: dx / m, dy: dy / m, dist: 0, ric: 0, fim: '', eventos: [], aoBater: null };
}
// um passo. S.fim fica '', 'limpou' ou 'saiu'
function passo(S, tam = PASSO) {
  let resto = tam;
  for (let volta = 0; volta < 6 && resto > 0; volta++) {
    let quem = -1, t = resto;
    for (let k = 0; k < S.formas.length; k++) {
      const f = S.formas[k];
      if (!S.vivo[k] || longe(f, S.x, S.y, R + resto + 1)) continue;
      const x1 = S.x + S.dx * t, y1 = S.y + S.dy * t;
      if (distancia(f, x1, y1) >= R) continue;
      // só conta se a bola está indo na direção da forma (logo depois de rebater ela ainda está encostada)
      let a = x1 - PX, b = y1 - PY;
      let lo = 0, hi = t;
      if (distancia(f, S.x, S.y) < R) { a = S.x - PX; b = S.y - PY; if (a * S.dx + b * S.dy >= 0) continue; hi = 0; }
      else for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (distancia(f, S.x + S.dx * mid, S.y + S.dy * mid) < R) hi = mid; else lo = mid; }
      if (hi === 0) lo = 0;
      if (quem < 0 || lo < t) { quem = k; t = lo; }
    }
    S.x += S.dx * t; S.y += S.dy * t; resto -= t; S.dist += t;
    if (quem < 0) break;
    const f = S.formas[quem]; distancia(f, S.x, S.y);
    let nx = S.x - PX, ny = S.y - PY; const m = raiz(nx * nx + ny * ny); nx /= m; ny /= m;
    const vn = S.dx * nx + S.dy * ny;
    if (vn < 0) { S.dx -= 2 * vn * nx; S.dy -= 2 * vn * ny; const q = raiz(S.dx * S.dx + S.dy * S.dy); S.dx /= q; S.dy /= q; }
    S.ric++;
    if (f.alvo) { S.vivo[quem] = false; S.restam--; }
    const ev = { k: quem, x: S.x, y: S.y, nx, ny, forca: -vn, combo: S.ric - 1 }; S.eventos.push(ev);
    if (S.aoBater) S.aoBater(ev, f);
    if (!S.restam) { S.fim = 'limpou'; return; }
  }
  if (S.x < -60 || S.y < -60 || S.x > LARG + 60 || S.y > ALT + 60 || S.dist > MAX_DIST || S.ric >= MAX_RIC) S.fim = 'saiu';
}
function simular(F, dx, dy) { const S = lancar(F.formas, F.x, F.y, dx, dy); while (!S.fim) passo(S); return S; }

/* ======================= fases ======================= */

/* Qual tentativa do sorteio cada fase usa (três caracteres por fase, 0-9 a-z).
   Escolhidas por ferramentas/zen/okay-fases.mjs: solução conferida, folga de mira suficiente
   para o dedo e nada que se resolva atirando para qualquer lado. */
const TENTATIVAS = {
  facil: '00000000100100000000000000100000000500200200400100000000100000100000200000800t00200s00k00700000200300400100a01002a00x00500i00601800201600i00008a0hn02h',
  medio: '00000200200000000200800900700400200300000500l00400400000400000n00r00000300600000x01002o01401900f00z00q00400k00k01s01q00102d01b06804202b01n08c03v06r006',
  dificil: '00z00200i00700801g02g00s00a01600r00f00f03402400e00801s03y02d00x04t06u00c02800j0880dz0010050nt0ak0lz07t09702j07805n24r47p0re4vo0ey1df1ku1tv32g28f0az1qa'
};
function receita(dif, fase) {
  const p = (fase - 1) / 49, g = Math.floor((fase - 1) / 10);
  if (dif === 'facil') return { alvos: fase === 1 ? 1 : 2 + Math.floor(p * 4.2), noCaminho: g < 1 ? 0 : g < 3 ? .12 : .2, soltas: fase < 4 ? 0 : 1 + (g >> 1), tipos: ['quadrado', 'hexagono', 'bola', 'barra'].slice(0, 2 + Math.min(2, g)), tam: 62 - g * 3 };
  if (dif === 'medio') return { alvos: 4 + Math.floor(p * 3.9), noCaminho: .22, soltas: 2 + (g >> 1), tipos: ['quadrado', 'triangulo', 'hexagono', 'barra', 'pentagono', 'bola'], tam: 52 - g * 2 };
  return { alvos: 6 + Math.floor(p * 3.9), noCaminho: .22, soltas: 3 + (g >> 1), tipos: ['quadrado', 'triangulo', 'pentagono', 'hexagono', 'barra', 'quadrado', 'bola'], tam: 45 - g, perto: 165 };
}
/* Monta a fase. Devolve null se o sorteio encurralou (outra tentativa resolve). */
function gerar(dif, fase, tentativa = parseInt(TENTATIVAS[dif].substr((fase - 1) * 3, 3) || '0', 36)) {
  const r = Zen.daFase('okay', dif, fase, tentativa), C = receita(dif, fase);
  const x0 = r.entre(200, 800), y0 = r.chance(.75) ? r.entre(1080, 1270) : r.entre(650, 1000);
  const formas = [], caminho = [[x0, y0]];
  // a forma não pode encostar nas outras, na bola parada nem no caminho já percorrido
  const cabe = (f, folgaCaminho) => {
    for (const [a, b] of f.v) if (a < 60 || a > LARG - 60 || b < 60 || b > ALT - 60) return false;
    if (distancia(f, x0, y0) < R + 95) return false;
    for (const g of formas) {
      if (longe(g, f.x, f.y, f.br + 16)) continue;
      for (const [a, b] of f.v) if (distancia(g, a, b) < f.rr + 16) return false;
      for (const [a, b] of g.v) if (distancia(f, a, b) < g.rr + 16) return false;
      if (distancia(g, f.x, f.y) < f.rr + 16 || distancia(f, g.x, g.y) < g.rr + 16) return false;
    }
    for (let k = 0; k + 1 < caminho.length; k++) if (pertoDoTrecho(f, caminho[k], caminho[k + 1], folgaCaminho)) return false;
    return true;
  };
  const pertoDoTrecho = (f, p, q, folga) => {
    const a = q[0] - p[0], b = q[1] - p[1], n = Math.ceil(raiz(a * a + b * b) / 9);
    for (let i = 0; i <= n; i++) { const x = p[0] + a * i / n, y = p[1] + b * i / n; if (!longe(f, x, y, R + folga) && distancia(f, x, y) < R + folga) return true; }
    return false;
  };
  // o trecho p-q não pode esbarrar em nada que esteja de pé (barreiras; alvos já apagados não contam)
  const livre = (p, q) => formas.every(f => f.alvo || !pertoDoTrecho(f, p, q, 12));
  const sorteiaPonto = p => {
    for (let t = 0; t < 40; t++) {
      const q = [r.entre(110, LARG - 110), r.entre(110, ALT - 110)], a = q[0] - p[0], b = q[1] - p[1], d = raiz(a * a + b * b);
      if (d > (C.perto || 210) && d < 680 && livre(p, q)) return [q, a / d, b / d];
    }
    return null;
  };
  let prox = sorteiaPonto(caminho[0]); if (!prox) return null;
  const mira = [prox[1], prox[2]]; let faltam = C.alvos, seguidas = 0;
  while (faltam > 0) {
    const [q, ix, iy] = prox, p = caminho[caminho.length - 1]; let achou = false;
    for (let t = 0; t < 30 && !achou; t++) {
      const saida = sorteiaPonto(q); if (!saida) continue;
      const [, ox, oy] = saida, giro = ix * ox + iy * oy;
      if (giro > .72 || giro < -.9) continue;                                  // nem raspão, nem volta pelo mesmo caminho
      let nx = ox - ix, ny = oy - iy; const m = raiz(nx * nx + ny * ny); nx /= m; ny /= m;
      const barreira = seguidas < 1 && faltam < C.alvos && r.chance(C.noCaminho);
      const tipo = barreira ? 'barra' : r.um(C.tipos), tam = tipo === 'barra' ? r.entre(20, 25) : C.tam * r.entre(.85, 1.1), comp = tipo === 'barra' ? r.entre(80, 118) : 0;
      // bate na face, um pouco fora do centro
      const meia = tipo === 'bola' ? 0 : tipo === 'barra' ? comp : tam * { quadrado: 1, triangulo: 1.2, pentagono: .7, hexagono: .55 }[tipo], fora = meia * r.entre(-.35, .35), afasta = R + tam;
      const f = forma(tipo, !barreira, q[0] - nx * afasta - ny * fora, q[1] - ny * afasta + nx * fora, nx, ny, tam, comp);
      if (!cabe(f, 10)) continue;
      formas.push(f);
      // a nova barreira não pode atrapalhar a própria saída, nem o alvo a chegada
      if (!livre([q[0] + ox * 20, q[1] + oy * 20], saida[0])) { formas.pop(); continue; }
      caminho.push(q); prox = saida; achou = true;
      if (barreira) seguidas++; else { seguidas = 0; faltam--; }
    }
    if (!achou) return null;
  }
  // barreiras fora do caminho: atrapalham os outros lançamentos
  for (let k = 0, t = 0; k < C.soltas && t < 60; t++) {
    const u = r.entre(-1, 1), m = 1 + u * u, nx = (1 - u * u) / m, ny = 2 * u / m, f = forma('barra', false, r.entre(120, LARG - 120), r.entre(120, ALT - 120), nx, ny, r.entre(18, 24), r.entre(70, 130));
    if (cabe(f, 30)) { formas.push(f); k++; }
  }
  return { dif, fase, x: x0, y: y0, formas, mira, alvos: C.alvos };
}

/* ======================= partida ======================= */

const mistura = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cor = (c, o = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${o})`;
const suave = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// quanto do caminho a mira mostra: [unidades antes, unidades depois do 1º ricochete]
const MIRA = { facil: [3000, 300], medio: [3000, 0], dificil: [420, 0] };

/* criar(canvas, op):
     op.dif, op.fase, op.cores                     como no Loop Zen
     op.andamento                                  o que guardar() devolveu antes (opcional)
     op.aoMudar({ restam, total, lancamentos, estado })
     op.aoVencer({ lancamentos, combo, total })                                                  */
function criar(canvas, op) {
  const cx = canvas.getContext('2d'), som = Zen.Audio || new Proxy({}, { get: () => () => {} }), QUIETO = !!Zen.menosMovimento;
  const F = gerar(op.dif, op.fase);
  let C = op.cores, W = 0, H = 0, dpr = 1, margem = { topo: 70, base: 80, esq: 12, dir: 12 }, esc = .4, ox = 0, oy = 0, deitado = false, fundo = null, sujo = true;
  let estado = 'mira', tempo = 0, desde = 0, S = null, vel = 1200, sobra = 0, lancamentos = Math.max(0, (op.andamento && op.andamento.n) | 0);
  let puxa = null, mira = null, degrau = 0, teclado = null;      // gesto em curso e mira { dx, dy, forca }
  let marca = null, venceu = null, fora = 0;                     // caminho do lançamento anterior
  const rastro = [], ondas = [], graos = [], A = F.formas.map(() => ({ some: 0, entra: QUIETO ? 1 : 0, treme: 0 }));
  const avisa = () => op.aoMudar && op.aoMudar({ restam: S ? S.restam : F.alvos, total: F.alvos, lancamentos, estado });

  /* ---------- tela <-> mundo ---------- */
  const tela = (x, y) => deitado ? [ox + (ALT - y) * esc, oy + x * esc] : [ox + x * esc, oy + y * esc];
  const direcaoMundo = (sx, sy) => deitado ? [sy / esc, -sx / esc] : [sx / esc, sy / esc];
  const mundo = (c, desvio = 0) => deitado ? c.setTransform(0, esc * dpr, -esc * dpr, 0, (ox + ALT * esc) * dpr, (oy + desvio) * dpr) : c.setTransform(esc * dpr, 0, 0, esc * dpr, ox * dpr, (oy + desvio) * dpr);

  /* ---------- estilingue ---------- */
  const MINIMO = 26, CHEIO = 170;                                // pixels: abaixo do mínimo, soltar cancela
  function miraDe(sx, sy) {
    const d = Math.sqrt(sx * sx + sy * sy); if (d < MINIMO) return null;
    const [a, b] = direcaoMundo(-sx, -sy), m = Math.sqrt(a * a + b * b);
    return { dx: a / m, dy: b / m, forca: Math.min(1, (d - MINIMO) / (CHEIO - MINIMO)) };
  }
  function disparar(m) {
    S = lancar(F.formas, F.x, F.y, m.dx, m.dy); S.aoBater = bateu; lancamentos++;
    estado = 'voo'; desde = tempo; vel = 950 + 600 * m.forca; sobra = -60 * m.forca; fora = 0;    // a bola primeiro volta do recuo do estilingue
    S.recuo = 60 * m.forca; marca = null; rastro.length = 0; mira = null;
    som.soltar(m.forca); avisa();
  }
  function bateu(ev, f) {
    const [sx, sy] = tela(ev.x, ev.y), a = A[ev.k];
    som.ricochete(ev.combo, f.alvo ? 'alvo' : 'barreira', .55 + .45 * ev.forca, W ? (sx / W - .5) * 1.3 : 0);
    a.treme = 1;
    if (!QUIETO) {
      ondas.push({ x: f.alvo ? f.x : ev.x, y: f.alvo ? f.y : ev.y, t: 0, dur: f.alvo ? 1.5 : .7, r0: f.alvo ? f.br * .6 : 8, r1: f.alvo ? f.br + 130 : 70, o: f.alvo ? .8 : .4, luz: f.alvo ? .8 : .1 });
      if (f.alvo) {
        ondas.push({ x: f.x, y: f.y, t: -.16, dur: 1.5, r0: f.br * .6, r1: f.br + 80, o: .55, luz: .6 });
        for (let k = 0; k < 14; k++) { const u = Math.random() * 6.283, q = 60 + Math.random() * 190; graos.push({ x: f.x + Math.cos(u) * f.br * .6, y: f.y + Math.sin(u) * f.br * .6, vx: Math.cos(u) * q - ev.nx * 60, vy: Math.sin(u) * q - ev.ny * 60, r: 3 + Math.random() * 4, t: 0, dur: .7 + Math.random() * .8 }); }
      }
    }
    avisa();
  }
  function acabou() {
    if (S.fim === 'limpou') {
      estado = 'fim'; desde = tempo; venceu = { avisou: false, combo: S.ric }; som.limpar(S.ric);
      const [x, y] = [S.x, S.y];
      if (!QUIETO) for (let k = 0; k < 6; k++) ondas.push({ x, y, t: -.12 - k * .26, dur: 3, r0: 10, r1: 1500, o: .7 - k * .08, luz: .6, w: 4.5 });
    } else {
      estado = 'volta'; desde = tempo; som.quase();
      marca = [[F.x, F.y], ...S.eventos.map(e => [e.x, e.y]), [S.x, S.y]];
    }
    avisa();
  }
  function prontoDeNovo() { estado = 'mira'; S = null; rastro.length = 0; for (const a of A) { if (a.some > .01 && !QUIETO) a.entra = 0; a.some = 0; } sujo = true; avisa(); }

  /* ---------- desenho ---------- */
  function contorno(c, f) { c.beginPath(); if (f.v.length === 1) { c.moveTo(f.x, f.y); c.lineTo(f.x + .01, f.y); return; } f.v.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
  // forma engrossada em "mais" unidades
  function solido(c, f, mais, estilo) { c.lineJoin = c.lineCap = 'round'; c.lineWidth = 2 * (f.rr + mais); c.strokeStyle = c.fillStyle = estilo; contorno(c, f); if (f.v.length > 1) c.fill(); c.stroke(); }
  // areia: riscos soltos e, em volta de cada forma, riscos que acompanham o contorno dela
  function fazerFundo() {
    fundo = fundo || document.createElement('canvas'); fundo.width = canvas.width; fundo.height = canvas.height;
    const f = fundo.getContext('2d'); f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.strokeStyle = cor(C.sulco, .75); f.lineWidth = 1.4; f.beginPath();
    for (let y = 8; y < H + 10; y += 16) { f.moveTo(0, y); for (let x = 0; x < W; x += 240) { f.quadraticCurveTo(x + 60, y - 5, x + 120, y); f.quadraticCurveTo(x + 180, y + 5, x + 240, y); } }
    f.stroke();
    const g = f.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cor(C.areia)); g.addColorStop(1, cor(C.areia2));
    // o degradê vale em coordenadas da tela: pinta as regiões numa máscara e aplica
    const masc = document.createElement('canvas'); masc.width = fundo.width; masc.height = fundo.height; const mk = masc.getContext('2d');
    const linha = 1.5 / esc, lista = [...F.formas, { v: [[F.x, F.y]], x: F.x, y: F.y, rr: R, br: R }];
    for (let k = 4; k >= 1; k--) {
      mundo(f); for (const s of lista) solido(f, s, 6 + k * 15 + linha / 2, cor(C.sulco, 1));
      mk.setTransform(1, 0, 0, 1, 0, 0); mk.globalCompositeOperation = 'source-over'; mk.clearRect(0, 0, masc.width, masc.height);
      mundo(mk); for (const s of lista) solido(mk, s, 6 + k * 15 - linha / 2, '#000');
      mk.setTransform(dpr, 0, 0, dpr, 0, 0); mk.globalCompositeOperation = 'source-in'; mk.fillStyle = g; mk.fillRect(0, 0, W, H);
      f.setTransform(1, 0, 0, 1, 0, 0); f.drawImage(masc, 0, 0);
    }
  }
  function pontilhado(pts, passoU, raio, estilo, sumir) {
    let falta = 0, total = 0, andou = 0; for (let i = 0; i + 1 < pts.length; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    cx.fillStyle = estilo;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], d = Math.hypot(bx - ax, by - ay); if (!d) continue;
      for (let t = falta; t < d; t += passoU) { if (sumir) cx.globalAlpha = Math.max(.12, 1 - (andou + t) / total * .8); cx.beginPath(); cx.arc(ax + (bx - ax) * t / d, ay + (by - ay) * t / d, raio, 0, 7); cx.fill(); falta = t + passoU - d; }
      if (falta < 0) falta = 0; andou += d;
    }
    cx.globalAlpha = 1;
  }
  function caminhoDaMira(m) {
    const [antes, depois] = MIRA[op.dif], Q = lancar(F.formas, F.x, F.y, m.dx, m.dy), pts = [[F.x, F.y]]; let teto = antes;
    while (!Q.fim && Q.dist < teto) { const n = Q.ric; passo(Q); if (Q.ric > n) { const e = Q.eventos[n]; pts.push([e.x, e.y]); if (n > 0 || !depois) return pts; teto = Q.dist + depois; } }
    pts.push([Q.x, Q.y]); return pts;
  }
  function desenhar() {
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, canvas.width, canvas.height);
    if (!fundo) fazerFundo();
    cx.drawImage(fundo, 0, 0);
    mundo(cx);
    for (const o of ondas) { const t = o.t / o.dur; if (t <= 0) continue; cx.beginPath(); cx.arc(o.x, o.y, o.r0 + (o.r1 - o.r0) * (1 - Math.pow(1 - t, 2.2)), 0, 7); cx.strokeStyle = cor(mistura(C.sulco, C.luz, o.luz), o.o * (1 - t)); cx.lineWidth = o.w || 4; cx.stroke(); }
    if (marca && estado !== 'voo') pontilhado(marca, 34, 4, cor(C.tinta2, .42));
    // formas: sombra, corpo e um risco interno
    const visivel = (k, fn) => { const a = A[k], v = suave(a.entra) * (1 - suave(a.some)); if (v > .002) fn(F.formas[k], v, a); };
    const escalar = (f, k) => { cx.translate(f.x, f.y); cx.scale(k, k); cx.translate(-f.x, -f.y); };
    for (let k = 0; k < F.formas.length; k++) visivel(k, (f, v) => { mundo(cx, 4.5 * v); cx.globalAlpha = v; escalar(f, .6 + .4 * v); solido(cx, f, 0, cor(C.sombra)); });
    for (let k = 0; k < F.formas.length; k++) visivel(k, (f, v, a) => {
      mundo(cx); cx.globalAlpha = v; escalar(f, (.6 + .4 * v) * (1 + a.treme * .05));
      const corpo = f.alvo ? mistura(C.luz, C.tinta, a.treme * .5) : mistura(mistura(C.pedra, C.tinta2, .14), C.luz, a.treme * .4);
      solido(cx, f, 0, cor(corpo));
      if (f.alvo) { if (f.rr > 8) { escalar(f, .52); solido(cx, f, 0, cor(mistura(corpo, C.sobre || C.areia, .16))); } }
      else if (f.v.length === 4) {                               // barreira: dois riscos de ancinho no comprimento
        const [p, q, r2, s] = f.v, ax = (p[0] + s[0]) / 2, ay = (p[1] + s[1]) / 2, bx = (q[0] + r2[0]) / 2, by = (q[1] + r2[1]) / 2, curto = Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(q[0] - r2[0], q[1] - r2[1]);
        cx.beginPath(); for (const u of [.3, .7]) { const m1 = curto ? [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u] : [p[0] + (s[0] - p[0]) * u, p[1] + (s[1] - p[1]) * u], m2 = curto ? [s[0] + (r2[0] - s[0]) * u, s[1] + (r2[1] - s[1]) * u] : [q[0] + (r2[0] - q[0]) * u, q[1] + (r2[1] - q[1]) * u]; cx.moveTo(...m1); cx.lineTo(...m2); }
        cx.lineWidth = 3; cx.strokeStyle = cor(C.areia2, .6); cx.stroke();
      }
    });
    cx.globalAlpha = 1; mundo(cx);
    // mira e elástico
    let bx = F.x, by = F.y, alfa = 1;
    if (estado === 'mira' && mira) {
      const rec = 60 * mira.forca; bx -= mira.dx * rec; by -= mira.dy * rec;
      pontilhado(caminhoDaMira(mira), 30, 5, cor(C.tinta), true);
      const nx = -mira.dy, ny = mira.dx; cx.strokeStyle = cor(mistura(C.pedra, C.luz, mira.forca)); cx.lineWidth = 5 - 2 * mira.forca; cx.lineCap = 'round'; cx.beginPath();
      for (const s of [-1, 1]) { cx.moveTo(F.x + nx * 46 * s, F.y + ny * 46 * s); cx.lineTo(bx + nx * R * .8 * s, by + ny * R * .8 * s); } cx.stroke();
      cx.fillStyle = cor(C.pedra); for (const s of [-1, 1]) { cx.beginPath(); cx.arc(F.x + nx * 46 * s, F.y + ny * 46 * s, 9, 0, 7); cx.fill(); }
    } else if (S && estado !== 'mira') {
      const antesDeSair = sobra < 0 ? -sobra : 0;
      bx = S.x - S.dx * antesDeSair; by = S.y - S.dy * antesDeSair;
      if (estado === 'volta') { bx += S.dx * fora; by += S.dy * fora; alfa = 1 - suave((tempo - desde) / .5); }
      if (estado === 'fim') { bx += S.dx * fora; by += S.dy * fora; alfa = 1 - suave((tempo - desde) / 1.1); }
    }
    for (let i = 0; i < rastro.length; i++) { const q = rastro[i], t = i / rastro.length; cx.beginPath(); cx.arc(q[0], q[1], R * (.25 + .6 * t), 0, 7); cx.fillStyle = cor(C.tinta, .05 + .13 * t); cx.globalAlpha = alfa; cx.fill(); }
    if (estado === 'mira') alfa = suave((tempo - desde) / .35);
    if (alfa > 0) {
      cx.globalAlpha = alfa; mundo(cx, 3.5); cx.beginPath(); cx.arc(bx, by, R, 0, 7); cx.fillStyle = cor(C.sombra); cx.fill();
      mundo(cx); cx.beginPath(); cx.arc(bx, by, R, 0, 7); cx.fillStyle = cor(C.tinta); cx.fill(); cx.globalAlpha = 1;
    }
    for (const g of graos) { const t = g.t / g.dur; cx.beginPath(); cx.arc(g.x, g.y, g.r * (1 - t * .6), 0, 7); cx.fillStyle = cor(C.luz, .85 * (1 - t)); cx.fill(); }
  }

  /* ---------- um quadro; devolve true se algo ainda se mexe ---------- */
  function quadro(dt) {
    dt = Math.min(.05, dt); tempo += dt;
    let mexe = false;
    A.forEach((a, k) => {
      if (a.entra < 1) { a.entra = Math.max(0, Math.min(1, a.entra + dt / .55)); mexe = true; }
      const alvo = S && !S.vivo[k] ? 1 : 0; if (a.some !== alvo && alvo) { a.some = Math.min(1, a.some + dt / .32); mexe = true; }
      if (a.treme > 0) { a.treme = Math.max(0, a.treme - dt * 4); mexe = true; }
    });
    if (estado === 'voo') {
      mexe = true; sobra += vel * dt;
      while (sobra >= PASSO && !S.fim) { sobra -= PASSO; passo(S); }
      if (sobra > 0 || S.dist > 0) { rastro.push([S.x, S.y]); if (rastro.length > 16) rastro.shift(); }
      if (S.fim) { sobra = 0; acabou(); }
    } else if (estado === 'volta') {
      mexe = true; fora += vel * dt; if (rastro.length) rastro.shift();
      if (tempo - desde > .75) { desde = tempo; prontoDeNovo(); }
    } else if (estado === 'fim') {
      if (tempo - desde < 1.2) { fora += vel * .6 * dt; mexe = true; if (rastro.length) rastro.shift(); }
      if (!venceu.avisou) { mexe = true; if (tempo - desde > 1.35) { venceu.avisou = true; if (op.aoVencer) op.aoVencer({ lancamentos, combo: venceu.combo, total: F.alvos }); } }
    } else if (tempo - desde < .4) mexe = true;
    for (let k = ondas.length - 1; k >= 0; k--) { ondas[k].t += dt; if (ondas[k].t >= ondas[k].dur) ondas.splice(k, 1); mexe = true; }
    for (let k = graos.length - 1; k >= 0; k--) { const g = graos[k], f = Math.exp(-dt * 2.4); g.t += dt; g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= f; g.vy *= f; if (g.t >= g.dur) graos.splice(k, 1); mexe = true; }
    if (mexe || sujo) { sujo = false; desenhar(); }
    return mexe;
  }
  function esticou() { const n = mira ? 1 + Math.floor(mira.forca * 7) : 0; if (n > degrau) som.esticar(mira.forca); degrau = n; sujo = true; }

  return {
    quadro,
    redimensionar(w, h, escala, m) {
      W = w; H = h; dpr = escala; if (m) margem = { ...margem, ...m };
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const lw = Math.max(60, w - margem.esq - margem.dir), lh = Math.max(60, h - margem.topo - margem.base), emPe = Math.min(lw / LARG, lh / ALT), virado = Math.min(lw / ALT, lh / LARG);
      deitado = virado > emPe * 1.08; esc = deitado ? virado : emPe;
      ox = margem.esq + (lw - (deitado ? ALT : LARG) * esc) / 2; oy = margem.topo + (lh - (deitado ? LARG : ALT) * esc) / 2;
      fundo = null; puxa = mira = null; sujo = true;
    },
    cores(c) { C = c; fundo = null; sujo = true; },
    // o gesto pode começar em qualquer lugar da tela: o dedo não tapa a bola
    toqueInicio(x, y, id) {
      if (estado === 'voo' && tempo - desde > .5) { S.fim = 'saiu'; sobra = 0; acabou(); return true; }   // tocar durante o voo encerra o lançamento
      if (estado !== 'mira' || puxa) return false;
      puxa = { id, x, y }; mira = null; teclado = null; degrau = 0; return true;
    },
    toqueMove(x, y, id) { if (!puxa || puxa.id !== id) return; mira = miraDe(x - puxa.x, y - puxa.y); esticou(); },
    toqueFim(x, y, id, cancelado) {
      if (!puxa || puxa.id !== id) return;
      const m = cancelado ? null : miraDe(x - puxa.x, y - puxa.y); puxa = mira = null; degrau = 0; sujo = true;
      if (m && estado === 'mira') disparar(m);
    },
    tecla(k, fino) {
      if (estado !== 'mira') return false;
      const D = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
      if (k in D) { if (teclado === null) teclado = -Math.PI / 2; else teclado += D[k] * (fino ? .1 : 1.5) * Math.PI / 180; const [a, b] = direcaoMundo(Math.cos(teclado), Math.sin(teclado)), m = Math.hypot(a, b); mira = { dx: a / m, dy: b / m, forca: .6 }; sujo = true; return true; }
      if ((k === 'Enter' || k === ' ') && mira && !puxa) { disparar(mira); return true; }
      if (k === 'Escape' && mira) { mira = puxa = teclado = null; sujo = true; return true; }
      return false;
    },
    refazer() { lancamentos = 0; marca = venceu = S = puxa = mira = null; estado = 'mira'; desde = tempo; rastro.length = ondas.length = graos.length = 0; for (const a of A) { a.some = a.treme = 0; a.entra = QUIETO ? 1 : 0; } sujo = true; avisa(); },
    guardar: () => venceu || !lancamentos ? null : { n: lancamentos },
    get info() { return { restam: S ? S.restam : F.alvos, total: F.alvos, lancamentos, estado, venceu: !!venceu }; },
    destruir() { fundo = null; },
    teste: { F, tela, get S() { return S; }, get esc() { return esc; }, get deitado() { return deitado; }, get mira() { return mira; }, desenhar }
  };
}

Zen.jogos.okay = { id: 'okay', gerar, criar, simular, lancar, passo, distancia, R, PASSO, LARG, ALT };
})();
