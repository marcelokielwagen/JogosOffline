/* Loop Zen: girar peças (curvas, retas e pontes) até não sobrar nenhuma ponta solta.

   COMO A FASE É CRIADA
   Imagine a grade como um piso de pedras. O sorteio escolhe um conjunto simétrico de pedras
   e o fio passa pelo contorno: um trecho existe quando só um dos dois lados foi escolhido.
   Com isso toda casa tem 0, 2 ou 4 pontas (vazia, curva/reta ou ponte), o desenho sempre
   fecha e sai simétrico. Depois as peças são giradas.

   SOLUÇÃO ÚNICA: sabendo o que chega por cima e pela esquerda, cada peça só pode ficar de um
   jeito (a curva sai pelos lados opostos aos que usa; a reta segue; a ponte passa dos dois).
   Começando pelo canto, uma peça decide a outra: existe uma única forma de fechar.

   Só entram contas com números inteiros: a fase é idêntica em qualquer aparelho.          */
(() => {
'use strict';

// lados de uma casa: 1 = cima, 2 = direita, 4 = baixo, 8 = esquerda
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const gira = (m, n) => { n = ((n % 4) + 4) % 4; return ((m << n) | (m >> (4 - n))) & 15; };
const BASE = { curva: 3, reta: 5, ponte: 15 };

/* ======================= tamanho de cada fase ======================= */

// tamanhos [largura, altura] possíveis em cada grupo de 10 fases
const TAMANHOS = {
  facil:   [[[4, 4], [4, 5], [5, 5]], [[4, 5], [5, 5], [4, 6]], [[5, 5], [4, 6], [5, 6]], [[5, 6], [6, 6], [5, 7]], [[5, 7], [6, 6], [6, 7]]],
  medio:   [[[5, 7], [6, 6]], [[6, 7], [5, 8]], [[6, 8], [7, 7]], [[6, 9], [7, 8]], [[7, 9], [7, 8]]],
  dificil: [[[7, 9], [8, 8]], [[7, 10], [8, 9]], [[8, 10]], [[8, 11]], [[8, 12]]]
};
// simetrias: dois eixos, um eixo (lados ou topo) ou meia-volta (a mais difícil de adivinhar)
const SIMETRIAS = {
  facil:   ['dois', 'lados', 'lados', 'topo', 'volta'],
  medio:   ['dois', 'lados', 'topo', 'volta', 'volta'],
  dificil: ['lados', 'topo', 'volta', 'volta', 'volta']
};
/* Para cada fase, qual tentativa do sorteio usar (um caractere por fase, 0-9 a-z).
   Escolhidas por ferramentas/zen/loop-fases.mjs: um só fio, desenho inteiro na grade,
   e nenhuma fase igual a outra, nem girada ou espelhada. */
const TENTATIVAS = {
  facil: '00221300201000000000000001021000010100010001000100',
  medio: '01000100000000000000010000000000000000010000000000',
  dificil: '00000000000000000000000000000000000000000000000000'
};

/* ======================= gerador ======================= */

const vizinho = (l, a, i, d) => { const x = i % l + DX[d], y = (i / l | 0) + DY[d]; return x < 0 || y < 0 || x >= l || y >= a ? -1 : y * l + x; };

// quais lados de cada casa têm fio, a partir das pedras escolhidas
function contorno(l, a, pedra) {
  const fl = l - 1, p = (x, y) => x >= 0 && y >= 0 && x < fl && y < a - 1 ? pedra[y * fl + x] : 0, m = new Uint8Array(l * a);
  for (let y = 0; y < a; y++) for (let x = 0; x < l; x++) {
    const no = p(x - 1, y - 1), ne = p(x, y - 1), so = p(x - 1, y), se = p(x, y);
    m[y * l + x] = (no ^ ne) | (ne ^ se) << 1 | (so ^ se) << 2 | (no ^ so) << 3;
  }
  return m;
}
// quantos fios fechados existem (na ponte o fio segue reto)
function contarFios(l, a, m) {
  const visto = new Uint8Array(l * a); let n = 0;
  for (let s = 0; s < l * a; s++) for (let d0 = 0; d0 < 4; d0++) {
    if (!(m[s] >> d0 & 1) || visto[s] >> d0 & 1) continue;
    n++;
    let i = s, d = d0, guarda = l * a * 4;
    do {
      visto[i] |= 1 << d; i = vizinho(l, a, i, d);
      const volta = (d + 2) % 4; visto[i] |= 1 << volta;
      if (m[i] !== 15) { const r = m[i] & ~(1 << volta); d = r === 1 ? 0 : r === 2 ? 1 : r === 4 ? 2 : 3; }
    } while (!(i === s && d === d0) && --guarda);
  }
  return n;
}
function nota(l, a, m, alvoPontes, alvoVazias) {
  let vazias = 0, pontes = 0, retas = 0;
  for (const v of m) { if (!v) vazias++; else if (v === 15) pontes++; else if (v === 5 || v === 10) retas++; }
  const fios = contarFios(l, a, m);
  // um só fio vale mais que tudo; depois vazias e pontes na medida; e retas sem exagero
  return -(fios === 1 ? 0 : 60 + fios * 40) - Math.abs(vazias - alvoVazias) * 12 - Math.abs(pontes - alvoPontes) * 14 - Math.max(0, retas * 3 - l * a) * 4;
}

function gerar(dif, fase, tentativa = parseInt(TENTATIVAS[dif][fase - 1] || '0', 36)) {
  const r = Zen.daFase('loop', dif, fase, tentativa), grupo = Math.floor((fase - 1) / 10);
  const [l, a] = r.um(TAMANHOS[dif][grupo]), sim = r.um(SIMETRIAS[dif]), fl = l - 1, fa = a - 1;
  const alvoPontes = dif === 'facil' ? (fase < 4 ? 0 : r.inteiro(0, 1 + (grupo >> 1))) : dif === 'medio' ? r.inteiro(1, 3 + grupo) : r.inteiro(4, 6 + grupo * 2);
  const alvoVazias = r.inteiro(0, Math.floor(l * a / (dif === 'dificil' ? 8 : 5)));
  // pedras que precisam ser escolhidas juntas para o desenho ficar simétrico
  const grupos = [], visto = new Uint8Array(fl * fa);
  for (let y = 0; y < fa; y++) for (let x = 0; x < fl; x++) {
    if (visto[y * fl + x]) continue;
    const X = fl - 1 - x, Y = fa - 1 - y;
    const g = sim === 'dois' ? [[x, y], [X, y], [x, Y], [X, Y]] : sim === 'lados' ? [[x, y], [X, y]] : sim === 'topo' ? [[x, y], [x, Y]] : [[x, y], [X, Y]];
    const ids = [...new Set(g.map(([p, q]) => q * fl + p))];
    for (const k of ids) visto[k] = 1;
    grupos.push(ids);
  }
  // começa ao acaso e melhora aos poucos, trocando um grupo (ou dois) de cada vez
  const pedra = new Uint8Array(fl * fa);
  for (const g of grupos) if (r.chance(.5)) for (const k of g) pedra[k] = 1;
  let m = contorno(l, a, pedra), melhor = nota(l, a, m, alvoPontes, alvoVazias);
  for (let t = 90 + grupos.length * 14; t--;) {
    const troca = [r.um(grupos)]; if (r.chance(.35)) troca.push(r.um(grupos));
    for (const g of troca) for (const k of g) pedra[k] ^= 1;
    const m2 = contorno(l, a, pedra), n2 = nota(l, a, m2, alvoPontes, alvoVazias);
    if (n2 >= melhor) { m = m2; melhor = n2; } else for (const g of troca) for (const k of g) pedra[k] ^= 1;
  }
  // peças: tipo e posição inicial. Em 4 de cada 5 a posição certa é proibida na largada.
  const pecas = [];
  for (let i = 0; i < l * a; i++) {
    const v = m[i]; if (!v) continue;
    const tipo = v === 15 ? 'ponte' : v === 5 || v === 10 ? 'reta' : 'curva', n = tipo === 'curva' ? 4 : 2;
    let certo = 0; while (gira(BASE[tipo], certo) !== v) certo++;
    const giro = r.chance(.8) ? certo + r.inteiro(1, n - 1) : certo + r.inteiro(0, n - 1);
    pecas.push({ i, x: i % l, y: i / l | 0, tipo, certo, giro: giro % 4 });
  }
  // a fase nunca nasce pronta
  if (pecas.every(p => gira(BASE[p.tipo], p.giro) === m[p.i])) { const p = pecas.find(q => q.tipo !== 'ponte'); p.giro = (p.giro + 1) % 4; }
  return { dif, fase, l, a, sim, m, pecas };
}

/* ======================= partida ======================= */

const mistura = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cor = (c, o = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${o})`;
const suave = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const segue = (v, alvo, dt, vel) => v + (alvo - v) * (1 - Math.exp(-dt * vel));

/* criar(canvas, op):
     op.dif, op.fase      fase a jogar
     op.cores             { areia, areia2, sulco, tinta, tinta2, luz, pedra, sombra }, cada uma [r, g, b]
     op.andamento         o que guardar() devolveu antes (opcional)
     op.aoMudar({ pontas, giros })                depois de cada giro
     op.aoVencer({ giros, pecas })                quando o fio termina de acender            */
function criar(canvas, op) {
  const cx = canvas.getContext('2d'), som = Zen.Audio || new Proxy({}, { get: () => () => {} });
  const F = gerar(op.dif, op.fase), QUIETO = !!Zen.menosMovimento;   // escolha feita em "Som e aparência"
  let C = op.cores, W = 0, H = 0, dpr = 1, margem = { topo: 70, base: 80, esq: 12, dir: 12 };
  let deitado = false, lado = 40, ox = 0, oy = 0;              // tamanho da casa e canto da grade na tela
  let giros = 0, pontasSoltas = 0, tempo = 0, parado = 0, sujo = true, fundo = null;
  let venceu = null, cursor = -1, usaTeclado = false;
  const ondas = [], graos = [], mapa = new Array(F.l * F.a).fill(null);

  const P = F.pecas.map(p => ({
    ...p, ang: 0, ponta: [0, 0, 0, 0],                         // ângulo mostrado (em quartos de volta) e quanto cada ponta está encaixada
    brilho: 0, dist: [-1, -1], luz: [0, 0], chega: QUIETO ? 1 : 0
  }));
  for (const p of P) mapa[p.i] = p;

  const mascara = p => gira(BASE[p.tipo], p.giro);
  const ligada = (p, d) => { const j = vizinho(F.l, F.a, p.i, d), q = j < 0 ? null : mapa[j]; return !!(mascara(p) >> d & 1) && !!q && !!(mascara(q) >> ((d + 2) % 4) & 1); };
  function contarPontas() {
    let n = 0;
    for (const p of P) { const m = mascara(p); for (let d = 0; d < 4; d++) if (m >> d & 1 && !ligada(p, d)) n++; }
    return n;
  }

  // começo: usa o andamento salvo, se for desta mesma fase
  const A = op.andamento;
  if (A && Array.isArray(A.g) && A.g.length === P.length && A.g.every(Number.isInteger)) { P.forEach((p, k) => { p.giro = ((A.g[k] % 4) + 4) % 4; }); giros = Math.max(0, A.n | 0); }
  if (!contarPontas()) { P.forEach((p, k) => { p.giro = F.pecas[k].giro; }); giros = 0; }
  P.forEach(p => { p.ang = p.alvo = p.giro; });
  pontasSoltas = contarPontas();

  /* ---------- jogada ---------- */
  function girarPeca(p, sentido = 1) {
    if (venceu || !p) return false;
    const antes = [0, 1, 2, 3].filter(d => ligada(p, d)).length;
    p.alvo += sentido; p.giro = ((p.giro + sentido) % 4 + 4) % 4; giros++;
    pontasSoltas = contarPontas(); sujo = true;
    const u = F.l > 1 ? p.x / (F.l - 1) : .5, v = F.a > 1 ? p.y / (F.a - 1) : .5;
    som.girar(u, v, p.giro);
    if ([0, 1, 2, 3].filter(d => ligada(p, d)).length > antes) {
      som.encaixar(u);
      const c = centro(p); if (!QUIETO) ondas.push({ x: c.x, y: c.y, t: 0, dur: .9, r: lado * .62, o: .5 });
    }
    if (op.aoMudar) op.aoMudar({ pontas: pontasSoltas, giros });
    if (!pontasSoltas) vencer(p);
    return true;
  }
  function vencer(origem) {
    // distância de cada trecho até a última peça girada, andando pelo fio: a luz segue esse caminho.
    // A ponte tem dois trechos (0 = o de cima, 1 = o de baixo), cada um aceso na sua vez.
    const trechoDe = (p, d) => p.tipo === 'ponte' ? (d - p.giro + 4) % 2 : 0;
    for (const p of P) p.dist = [-1, -1];
    let fila = [[origem, 0]], maior = 0; origem.dist[0] = 0;
    while (fila.length) {
      const prox = [];
      for (const [p, k] of fila) for (let d = 0; d < 4; d++) {
        if (!ligada(p, d) || trechoDe(p, d) !== k) continue;
        const q = mapa[vizinho(F.l, F.a, p.i, d)], kq = trechoDe(q, (d + 2) % 4);
        if (q.dist[kq] < 0) { q.dist[kq] = p.dist[k] + 1; maior = Math.max(maior, q.dist[kq]); prox.push([q, kq]); }
      }
      fila = prox;
    }
    const c = centro(origem);
    venceu = { t: -.22, vel: Math.max(7, maior / 1.7), maior, x: c.x, y: c.y, avisou: false, soou: false, origem };
  }
  const centro = p => deitado ? { x: ox + (F.a - 1 - p.y + .5) * lado, y: oy + (p.x + .5) * lado } : { x: ox + (p.x + .5) * lado, y: oy + (p.y + .5) * lado };
  function pecaEm(x, y) {
    let c = Math.floor((x - ox) / lado), l = Math.floor((y - oy) / lado);
    if (deitado) [c, l] = [l, F.a - 1 - c];
    return c < 0 || l < 0 || c >= F.l || l >= F.a ? null : mapa[l * F.l + c];
  }

  /* ---------- desenho ---------- */
  // areia riscada: feita uma vez por tamanho e cor, depois só copiada
  function fazerFundo() {
    fundo = fundo || document.createElement('canvas');
    fundo.width = canvas.width; fundo.height = canvas.height;
    const f = fundo.getContext('2d'); f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.strokeStyle = cor(C.sulco, .75); f.lineWidth = 1.4; f.beginPath();
    for (let y = 8; y < H + 10; y += 16) { f.moveTo(0, y); for (let x = 0; x < W; x += 240) { f.quadraticCurveTo(x + 60, y - 5, x + 120, y); f.quadraticCurveTo(x + 180, y + 5, x + 240, y); } }
    f.stroke();
    // terreiro liso onde ficam as peças
    const gl = (deitado ? F.a : F.l) * lado, ga = (deitado ? F.l : F.a) * lado, b = Math.min(lado * .34, 22), R = Math.min(lado * .7, 36);
    f.beginPath(); ret(f, ox - b, oy - b, gl + 2 * b, ga + 2 * b, R);
    const g = f.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cor(C.areia)); g.addColorStop(1, cor(C.areia2)); f.fillStyle = g; f.fill();
    for (const k of [0, 1]) { f.beginPath(); ret(f, ox - b - 6 * k, oy - b - 6 * k, gl + 2 * b + 12 * k, ga + 2 * b + 12 * k, R + 6 * k); f.strokeStyle = cor(C.sulco, k ? .6 : 1); f.lineWidth = 1.4; f.stroke(); }
    f.fillStyle = cor(C.sulco); f.beginPath();
    for (let i = 0; i < F.l * F.a; i++) if (!mapa[i]) { const c = centro({ x: i % F.l, y: i / F.l | 0 }); f.moveTo(c.x + lado * .06, c.y); f.arc(c.x, c.y, lado * .06, 0, 7); }
    f.fill();
  }
  function ret(f, x, y, w, h, r) { f.moveTo(x + r, y); f.arcTo(x + w, y, x + w, y + h, r); f.arcTo(x + w, y + h, x, y + h, r); f.arcTo(x, y + h, x, y, r); f.arcTo(x, y, x + w, y, r); f.closePath(); }

  // um trecho da peça, no sistema dela (centro em 0,0). recuo0/recuo1: quanto falta para a borda em cada ponta
  function trecho(tipo, h, r0, r1) {
    cx.beginPath();
    if (tipo === 'curva') cx.arc(h, -h, h, Math.PI - r0 / h, Math.PI / 2 + r1 / h, true);   // da ponta de cima até a da direita
    else if (tipo === 'deitada') { cx.moveTo(h - r0, 0); cx.lineTo(-h + r1, 0); }
    else { cx.moveTo(0, -h + r0); cx.lineTo(0, h - r1); }
  }
  // p.ponta[d] é medido nos lados da peça sem girar: lado d da base
  function riscar(p, parte, larg, dy, estilo) {
    const c = centro(p), h = lado / 2, e = suave(p.chega), rec = d => (1 - p.ponta[d]) * larg * .62;
    cx.save(); cx.translate(c.x, c.y + dy); cx.rotate((p.ang + (deitado ? 1 : 0)) * Math.PI / 2); const k = .82 + .18 * e; cx.scale(k, k); cx.globalAlpha *= e;
    cx.strokeStyle = estilo;
    if (p.tipo === 'curva') trecho('curva', h, rec(0), rec(1));
    else if (p.tipo === 'reta' || parte === 'cima') trecho('em pe', h, rec(0), rec(2));
    else trecho('deitada', h, rec(1), rec(3));
    if (parte === 'cima') {                                // ponte: ponta reta onde está encaixada (não cobre os riscos da vizinha) e redonda onde está solta
      cx.lineCap = 'butt'; cx.stroke(); cx.fillStyle = estilo; cx.beginPath();
      if (p.ponta[0] < 1) cx.arc(0, -h + rec(0), larg / 2, 0, 7);
      if (p.ponta[2] < 1) { cx.moveTo(larg / 2, h - rec(2)); cx.arc(0, h - rec(2), larg / 2, 0, 7); }
      cx.fill();
    } else cx.stroke();
    cx.restore();
  }
  function desenhar() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (!fundo) fazerFundo();
    cx.drawImage(fundo, 0, 0, W, H);
    // ondas na areia
    for (const o of ondas) { const t = o.t / o.dur; if (t <= 0) continue; cx.beginPath(); cx.arc(o.x, o.y, o.r * (1 - Math.pow(1 - t, 2.2)), 0, 7); cx.strokeStyle = cor(mistura(C.sulco, C.luz, o.luz || .35), o.o * (1 - t)); cx.lineWidth = o.w || 1.6; cx.stroke(); }
    const larg = lado * .34;
    cx.lineCap = 'round'; cx.lineJoin = 'round';
    cx.lineWidth = larg;
    for (const p of P) { riscar(p, 'baixo', larg, lado * .055, cor(C.sombra)); if (p.tipo === 'ponte') riscar(p, 'cima', larg, lado * .055, cor(C.sombra)); }
    const corpo = (p, k = 0) => mistura(mistura(C.pedra, C.tinta2, p.brilho * .55), C.luz, p.luz[k]);
    const sulcoDe = (p, k) => cor(mistura(mistura(C.areia, C.pedra, .12), C.sobre || C.areia, p.luz[k] * .6), .62);
    for (const p of P) if (p.tipo !== 'ponte') riscar(p, '', larg, 0, cor(corpo(p)));
    for (const p of P) if (p.tipo === 'ponte') riscar(p, 'baixo', larg, 0, cor(corpo(p, 1)));
    // dois riscos finos ao longo do fio, como marcas de ancinho
    const riscos = (p, parte) => { for (const s of [-1, 1]) { cx.lineWidth = Math.max(1, lado * .026); cx.lineCap = 'butt'; riscoParalelo(p, parte, s * larg * .2, sulcoDe(p, p.tipo === 'ponte' && parte === 'baixo' ? 1 : 0)); } cx.lineCap = 'round'; cx.lineWidth = larg; };
    for (const p of P) riscos(p, 'baixo');
    // a parte de cima das pontes, com um vão escuro dos dois lados
    for (const p of P) if (p.tipo === 'ponte') {
      const c = centro(p), v = larg * .5 + lado * .035;
      cx.save(); cx.translate(c.x, c.y); cx.rotate((p.ang + (deitado ? 1 : 0)) * Math.PI / 2); cx.globalAlpha = suave(p.chega) * .85; cx.strokeStyle = cor(C.sombra); cx.lineCap = 'butt'; cx.lineWidth = lado * .07;
      cx.beginPath(); for (const s of [-1, 1]) { cx.moveTo(s * v, -larg * .5); cx.lineTo(s * v, larg * .5); } cx.stroke(); cx.restore(); cx.lineCap = 'round'; cx.lineWidth = larg;
      riscar(p, 'cima', larg, 0, cor(corpo(p))); riscos(p, 'cima');
    }
    // cursor do teclado
    if (usaTeclado && cursor >= 0 && !venceu) { const c = centro({ x: cursor % F.l, y: cursor / F.l | 0 }); cx.beginPath(); ret(cx, c.x - lado * .46, c.y - lado * .46, lado * .92, lado * .92, lado * .2); cx.strokeStyle = cor(C.luz); cx.lineWidth = 2; cx.stroke(); }
    // grãos de areia que sobem na vitória
    for (const g of graos) { if (g.t < 0) continue; const t = g.t / g.dur; cx.beginPath(); cx.arc(g.x, g.y, g.r * (1 - t * .5), 0, 7); cx.fillStyle = cor(C.luz, .75 * Math.sin(Math.PI * Math.min(1, t * 1.02)) * (1 - t * .3)); cx.fill(); }
  }
  function riscoParalelo(p, parte, desvio, estilo) {
    const c = centro(p), h = lado / 2, e = suave(p.chega), r = d => (1 - p.ponta[d]) * lado * .16;
    cx.save(); cx.translate(c.x, c.y); cx.rotate((p.ang + (deitado ? 1 : 0)) * Math.PI / 2); cx.globalAlpha *= e; cx.strokeStyle = estilo; cx.beginPath();
    if (p.tipo === 'curva') cx.arc(h, -h, h + desvio, Math.PI - r(0) / h, Math.PI / 2 + r(1) / h, true);
    else if (p.tipo === 'reta' || parte === 'cima') { cx.moveTo(desvio, -h + r(0)); cx.lineTo(desvio, h - r(2)); }
    else { cx.moveTo(h - r(1), desvio); cx.lineTo(-h + r(3), desvio); }
    cx.stroke(); cx.restore();
  }

  /* ---------- um quadro de animação; devolve true se algo ainda se mexe ---------- */
  function quadro(dt) {
    dt = Math.min(.05, dt); tempo += dt;
    let mexe = false;
    for (const p of P) {
      if (p.chega < 1) { const atraso = (p.x + p.y) * .035; p.chega = Math.max(0, Math.min(1, (tempo - atraso) / .5)); mexe = true; }
      if (p.ang !== p.alvo) { p.ang = segue(p.ang, p.alvo, dt, QUIETO ? 60 : 17); if (Math.abs(p.ang - p.alvo) < .002) { p.ang = p.alvo = p.giro; } mexe = true; }
      let n = 0, soma = 0;
      for (let b = 0; b < 4; b++) {
        if (!(BASE[p.tipo] >> b & 1)) continue;
        const d = (b + p.giro) % 4, j = vizinho(F.l, F.a, p.i, d), q = j < 0 ? null : mapa[j];
        const girando = Math.abs(p.ang - p.alvo) > .12 || (q && Math.abs(q.ang - q.alvo) > .12), alvo = ligada(p, d) && !girando ? 1 : 0;
        n++; soma += alvo;
        if (p.ponta[b] !== alvo) { p.ponta[b] = segue(p.ponta[b], alvo, dt, 14); if (Math.abs(p.ponta[b] - alvo) < .01) p.ponta[b] = alvo; mexe = true; }
      }
      const br = soma === n ? 1 : 0;
      if (p.brilho !== br) { p.brilho = segue(p.brilho, br, dt, 7); if (Math.abs(p.brilho - br) < .01) p.brilho = br; mexe = true; }
    }
    if (venceu) {
      const v = venceu; v.t += dt;
      if (!v.soou && v.t >= 0) {
        v.soou = true; som.fechar();
        if (!QUIETO) for (let k = 0; k < 6; k++) ondas.push({ x: v.x, y: v.y, t: -k * .26, dur: 3, r: Math.hypot(W, H) * .75, o: .75 - k * .08, luz: .55, w: 2 });
      }
      for (const p of P) {
        for (const k of [0, 1]) {
          const alvo = v.t < 0 || p.dist[k] < 0 ? 0 : suave(v.t * v.vel - p.dist[k] + .4);
          if (p.luz[k] !== alvo) { p.luz[k] = alvo; mexe = true; }
        }
        if (p.luz[0] > 0 && !p.grao && !QUIETO) { p.grao = 1; const c = centro(p); for (let k = 0; k < 2; k++) graos.push({ x: c.x + (Math.random() - .5) * lado, y: c.y + (Math.random() - .5) * lado, vx: (Math.random() - .5) * 14, vy: -14 - Math.random() * 22, r: 1.2 + Math.random() * 1.6, t: -Math.random() * .6, dur: 1.6 + Math.random() * 1.2 }); }
      }
      if (!v.avisou && v.t > v.maior / v.vel + .9) { v.avisou = true; if (op.aoVencer) op.aoVencer({ giros, pecas: P.length }); }
      if (!v.avisou) mexe = true;
    }
    for (let k = ondas.length - 1; k >= 0; k--) { ondas[k].t += dt; if (ondas[k].t >= ondas[k].dur) ondas.splice(k, 1); mexe = true; }
    for (let k = graos.length - 1; k >= 0; k--) { const g = graos[k]; g.t += dt; if (g.t > 0) { g.x += g.vx * dt; g.y += g.vy * dt; g.vy *= 1 - dt * .5; } if (g.t >= g.dur) graos.splice(k, 1); mexe = true; }
    if (mexe || sujo) { sujo = false; desenhar(); }        // parado, não redesenha: poupa bateria
    return mexe;
  }

  return {
    quadro,
    redimensionar(w, h, escala, m) {
      W = w; H = h; dpr = escala; if (m) margem = { ...margem, ...m };
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const lw = Math.max(60, w - margem.esq - margem.dir), lh = Math.max(60, h - margem.topo - margem.base), folga = .75;
      const emPe = Math.min(lw / (F.l + folga), lh / (F.a + folga)), virado = Math.min(lw / (F.a + folga), lh / (F.l + folga));
      deitado = virado > emPe * 1.08;                      // tela larga: a grade deita para as peças ficarem maiores
      lado = Math.min(92, deitado ? virado : emPe);
      ox = margem.esq + (lw - (deitado ? F.a : F.l) * lado) / 2; oy = margem.topo + (lh - (deitado ? F.l : F.a) * lado) / 2;
      fundo = null; ondas.length = graos.length = 0; sujo = true;
      if (venceu) { const c = centro(venceu.origem); venceu.x = c.x; venceu.y = c.y; }
    },
    cores(c) { C = c; fundo = null; sujo = true; },
    // o giro acontece ao encostar (sem esperar soltar), para ficar imediato; vários dedos funcionam
    toqueInicio(x, y, id, inverso) { usaTeclado = false; return girarPeca(pecaEm(x, y), inverso ? -1 : 1); },
    toqueMove() {}, toqueFim() {},
    tecla(k) {
      const D = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
      if (k in D) { usaTeclado = true; sujo = true; if (cursor < 0) { cursor = P[0].i; return true; } const j = vizinho(F.l, F.a, cursor, (D[k] + (deitado ? 3 : 0)) % 4); if (j >= 0) cursor = j; return true; }
      if (k === 'Enter' || k === ' ') { usaTeclado = true; sujo = true; if (cursor >= 0) girarPeca(mapa[cursor]); return true; }
      return false;
    },
    refazer() {
      venceu = null; giros = 0; ondas.length = graos.length = 0;
      P.forEach((p, k) => { const g = F.pecas[k].giro; p.giro = g; p.alvo = p.ang = g; p.luz = [0, 0]; p.grao = 0; p.ponta.fill(0); p.chega = QUIETO ? 1 : 0; });
      tempo = 0; pontasSoltas = contarPontas(); sujo = true;
      if (op.aoMudar) op.aoMudar({ pontas: pontasSoltas, giros });
    },
    guardar: () => venceu || !giros ? null : { g: P.map(p => p.giro), n: giros },
    get info() { return { pontas: pontasSoltas, giros, venceu: !!venceu, pecas: P.length }; },
    destruir() { fundo = null; },
    teste: { F, P, centro, girarPeca, get lado() { return lado; }, get deitado() { return deitado; } }
  };
}

Zen.jogos.loop = { id: 'loop', gerar, criar, contarFios };
})();
