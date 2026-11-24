// Desenho da mesa "Pinball Show" (protótipo cinza, Fase 3).
// Medidas em "unidades" da mesa: 400 de largura, 820 de comprimento (y cresce em direção ao jogador).
// A mesa tem 3 andares em degraus: 0 = baixo (palhetas), 1 = meio (vinil), 2 = cima (teclado).
// z = altura de cada andar. A física é 2D em cada andar; rampas, elevador e quedas levam a bola entre eles.

export const W = 400, H = 820, R = 8;
export const Z = [0, 30, 60];          // altura de cada andar
export const BORDA = [H, 470, 220];    // beirada da frente de cada andar (passou dela, a bola cai para o andar de baixo)
export const RALO = 830;               // passou daqui no andar 0: bola perdida

// ---------- Paredes ----------
// seg: { ax, ay, bx, by, r (raio), e (quique), andar, tipo, mao (só bate de um lado) }
export const paredes = [];
function seg(andar, ax, ay, bx, by, o) { const p = Object.assign({ ax, ay, bx, by, r: 3, e: .45, f: .015, andar, tipo: 'parede' }, o); paredes.push(p); return p; }
function linha(andar, pts, o) { for (let i = 0; i < pts.length - 1; i++) seg(andar, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); }

// Andar 0 (baixo)
seg(0, 20, 470, 20, 840);                       // lateral esquerda
seg(0, 350, 840, 350, 478);                     // parede do corredor do lançador
seg(0, 20, 470, 350, 470, { tipo: 'degrau' });   // frente do degrau do andar do meio
linha(0, [[46, 565], [46, 660], [114, 697]], { tipo: 'guia' });     // guias de retorno
linha(0, [[324, 565], [324, 660], [256, 697]], { tipo: 'guia' });

// Rampas encostadas no degrau (paredes laterais no andar de baixo)
export const RAMPAS_INFO = [
  { nome: 'rampaE', x0: 86, x1: 140, yBoca: 556, yTopo: 470, andarIni: 0, andarFim: 1 },
  { nome: 'rampaD', x0: 230, x1: 284, yBoca: 556, yTopo: 470, andarIni: 0, andarFim: 1 },
  { nome: 'rampaC', x0: 220, x1: 276, yBoca: 322, yTopo: 220, andarIni: 1, andarFim: 2 },
];
for (const r of RAMPAS_INFO) {
  seg(r.andarIni, r.x0, r.yBoca, r.x0, r.yTopo, { tipo: 'rampa' });
  seg(r.andarIni, r.x1, r.yBoca, r.x1, r.yTopo, { tipo: 'rampa' });
}

// Estilingues
export const ESTILINGUES = [
  { a: [72, 580], b: [72, 640], c: [104, 660], flash: 0 },
  { a: [298, 580], b: [298, 640], c: [266, 660], flash: 0 },
];
for (const s of ESTILINGUES) {
  seg(0, ...s.a, ...s.b, { e: .6, tipo: 'borracha', est: s });
  seg(0, ...s.b, ...s.c, { e: .6, tipo: 'borracha', est: s });
  seg(0, ...s.a, ...s.c, { e: .6, tipo: 'borracha', est: s, chute: 520 });
}

// Andar 1 (meio)
seg(1, 20, 220, 20, 470);
seg(1, 350, 220, 350, 470);
seg(1, 20, 220, 350, 220, { tipo: 'degrau' });
seg(1, 350, 402, 318, 436, { tipo: 'guia' });

// Andar 2 (cima): arco no fundo, corredor do lançador e portinhola
export const ARCO = [];
for (let i = 0; i <= 40; i++) { const t = Math.PI * (1 + i / 40); ARCO.push([200 + 180 * Math.cos(t), 200 + 180 * Math.sin(t)]); }
linha(2, ARCO);
seg(2, 20, 200, 20, 220);
seg(2, 380, 200, 380, 220);
seg(2, 350, 162, 350, 220);
seg(2, 380, 140, 352, 162, { tipo: 'portao', mao: [-.62, -.79] });   // a bola sai do lançador, mas não volta
seg(2, 28, 152, 48, 182, { tipo: 'guia' });

// Teclado gigante (andar 2): bloco de 10 teclas; a frente de cada tecla é um alvo
export const TECLADO = { x0: 90, x1: 290, y0: 92, y1: 130, n: 10 };
export const TECLAS = [];
{
  const { x0, x1, y0, y1, n } = TECLADO, w = (x1 - x0) / n;
  seg(2, x0, y0, x1, y0, { tipo: 'teclado' });
  seg(2, x0, y0, x0, y1, { tipo: 'teclado' });
  seg(2, x1, y0, x1, y1, { tipo: 'teclado' });
  for (let i = 0; i < n; i++) TECLAS.push({ i, ax: x0 + i * w, bx: x0 + (i + 1) * w, y: y1, acesa: false, toque: -9 });
}

// ---------- Palhetas ----------
// lado: qual botão mexe (E = esquerdo, D = direito)
const palheta = (andar, lado, px, py, len, rb, rt) => {
  const esq = lado === 'E';
  const rep = esq ? .5 : Math.PI - .5, cima = esq ? -.45 : Math.PI + .45;
  return { andar, lado, px, py, len, rb, rt, rep, cima, ang: rep, w: 0, wReal: 0, apertada: false };
};
export const palhetas = [
  palheta(0, 'E', 116, 706, 60, 10, 5.5),
  palheta(0, 'D', 254, 706, 60, 10, 5.5),
  palheta(1, 'D', 314, 446, 40, 8, 4.5),    // mini palheta do andar do meio
  palheta(2, 'E', 54, 194, 40, 8, 4.5),     // mini palheta do andar de cima
];

// ---------- Peças especiais ----------
export const VINIL = { x: 120, y: 330, r: 60, w: 1.6, ang: 0 };   // w = giro (voltas por segundo × 2π, ajustado depois pela música)
export const BURACO = { x: 185, y: 492 };                           // entrada do elevador (andar 0)
export const LANCADOR = { x: 366, base: 776, curso: 30 };

// ---------- Trilhas (rampas, lançador e elevador) ----------
// Cada ponto: x, y (posição na mesa) e z (altura). d = distância percorrida.
function trilha(pts, extra) {
  const T = Object.assign({ pts: [], L: 0 }, extra);
  let d = 0;
  pts.forEach((p, i) => {
    if (i) { const a = pts[i - 1]; d += Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]); }
    T.pts.push({ x: p[0], y: p[1], z: p[2], d });
  });
  T.L = d;
  return T;
}
const suave = t => t * t * (3 - 2 * t);
function reta(x, y0, y1, z0, z1, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x, y0 + (y1 - y0) * t, z0 + (z1 - z0) * suave(t)]); }
  return pts;
}

export const TRILHAS = {};
for (const r of RAMPAS_INFO) {
  const cx = (r.x0 + r.x1) / 2;
  TRILHAS[r.nome] = trilha(reta(cx, r.yBoca, r.yTopo - 4, Z[r.andarIni], Z[r.andarFim]),
    { nome: r.nome, andarIni: r.andarIni, andarFim: r.andarFim, x0: r.x0, x1: r.x1, largura: r.x1 - r.x0 });
}
// Lançador: sobe pelo corredor da direita até o andar de cima
{
  const pts = [];
  for (let y = LANCADOR.base; y > 480; y -= 37) pts.push([LANCADOR.x, y, 0]);
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([LANCADOR.x, 480 + (200 - 480) * t, Z[2] * suave(t)]); }
  pts.push([LANCADOR.x, 132, Z[2]]);
  TRILHAS.lancador = trilha(pts, { nome: 'lancador', andarIni: 0, andarFim: 2, largura: 28 });
}
// Elevador: sobe numa torre na frente do degrau e leva a bola por um tubo até o andar de cima
TRILHAS.elevador = trilha([
  [BURACO.x, BURACO.y, 0], [BURACO.x, BURACO.y, 78], [BURACO.x, 455, 78], [BURACO.x, 260, 78], [BURACO.x, 222, 70], [BURACO.x, 206, Z[2]],
], { nome: 'elevador', andarIni: 0, andarFim: 2, cinem: 300 });

// Áreas onde existe chão em cada andar (para o desenho 3D e para segurança da física)
export const CHAO = [
  [[20, 470], [380, 470], [380, 840], [20, 840]],
  [[20, 220], [350, 220], [350, 470], [20, 470]],
  [...ARCO, [380, 220], [20, 220]],
];
