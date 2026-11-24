// Desenho da mesa "Galatic Pinball".
// Medidas em "unidades" da mesa: 400 de largura, 960 de comprimento (y cresce em direção ao jogador), z = altura.
// Andar 0 = mesa principal. Andares 1 e 2 = varandas no fundo (1 = do astronauta, à esquerda;
// 2 = do ônibus espacial, à direita). Só se chega às varandas pelos canos.

export const W = 400, H = 960, R = 8;
export const ZV = 70;                  // altura das varandas
export const Z = [0, ZV, ZV];
export const RALO = 958;               // passou daqui no andar 0: bola perdida

// Plataformas: parte de trás (cena) e parte onde a bola anda
export const FRENTE = 404;             // beirada da frente das plataformas
export const VARANDAS = {
  1: { nome: 'astronauta', x0: 24, x1: 142, y0: 26, y1: FRENTE, jogo: { x0: 28, x1: 138, y0: 128, y1: FRENTE } },
  2: { nome: 'nave', x0: 232, x1: 376, y0: 26, y1: FRENTE, jogo: { x0: 236, x1: 372, y0: 128, y1: FRENTE } },
};

// curva suave que passa por todos os pontos (2 ou 3 coordenadas)
function curva(pts, n = 10) {
  const s = [], cr = (a, b, c, d, t) => .5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) s.push(a.map((_, e) => cr(a[e], b[e], c[e], d[e], k / n)));
  }
  s.push(pts[pts.length - 1]);
  return s;
}

// ---------- Paredes ----------
// seg: { ax, ay, bx, by, r (raio), e (quique), andar, tipo, mao (só bate de um lado), porta (some quando aberta) }
export const paredes = [];
function seg(andar, ax, ay, bx, by, o) { const p = Object.assign({ ax, ay, bx, by, r: 3, e: .45, f: .015, andar, tipo: 'parede' }, o); paredes.push(p); return p; }
// Linhas contínuas (usadas também pelo desenho, para fazer uma peça só)
export const LINHAS = [];
function linha(andar, pts, o = {}) {
  LINHAS.push(Object.assign({ andar, pts, tipo: 'parede' }, o));
  for (let i = 0; i < pts.length - 1; i++) seg(andar, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o);
}

// Contorno: lateral, arco do fundo e corredor do lançador
export const ARCO = [];
for (let i = 0; i <= 48; i++) { const t = Math.PI * (1 + i / 48); ARCO.push([200 + 180 * Math.cos(t), 200 + 180 * Math.sin(t)]); }
linha(0, [[20, 966], [20, 200], ...ARCO.slice(1, -1), [380, 200], [380, 966]], { tipo: 'contorno' });
linha(0, [[350, 966], [350, 164]], { tipo: 'madeira' });
seg(0, 380, 140, 352, 162, { tipo: 'portao', mao: [-.62, -.79] });   // a bola sai do lançador, mas não volta

// Ilhas de metal: por fora ficam as voltas (órbitas), por dentro a câmara central dos para-choques
linha(0, curva([[58, 644], [58, 420], [58, 210], [66, 156], [87, 114], [116, 86]], 5), { tipo: 'guia' });
linha(0, curva([[312, 644], [312, 420], [312, 214], [304, 162], [287, 126], [268, 100]], 5), { tipo: 'guia' });
linha(0, [[116, 86], [122, 150], [122, 470]], { tipo: 'guia' });
linha(0, [[268, 100], [248, 150], [248, 470]], { tipo: 'guia' });

// Desvios nas laterais: empurram a bola que desce das voltas para dentro
linha(0, [[20, 680], [36, 714], [36, 724], [20, 746]], { tipo: 'desvio', e: .25 });
linha(0, [[350, 680], [334, 714], [334, 724], [350, 746]], { tipo: 'desvio', e: .25 });
// Portinhola do arco: fecha por uns segundos no lançamento, para a bola cair nos corredores do alto
seg(0, 112, 80, 94, 52, { tipo: 'portinhola', porta: 'arco', mao: [.84, -.54], e: .18 });

// Guias de retorno de baixo
linha(0, [[46, 754], [46, 804], [114, 841]], { tipo: 'guia' });
linha(0, [[324, 754], [324, 804], [256, 841]], { tipo: 'guia' });

// Rampas de fora (bocas em y = 638) e de dentro (bocas em y = 558), com tampa inclinada atrás
linha(0, [[104, 642], [104, 590], [58, 564]], { tipo: 'rampa' });
linha(0, [[104, 590], [112, 562], [112, 506], [122, 470]], { tipo: 'rampa' });
linha(0, [[152, 562], [152, 510], [122, 470]], { tipo: 'rampa' });
linha(0, [[266, 642], [266, 590], [312, 564]], { tipo: 'rampa' });
linha(0, [[266, 590], [258, 562], [258, 506], [248, 470]], { tipo: 'rampa' });
linha(0, [[218, 562], [218, 510], [248, 470]], { tipo: 'rampa' });

// Três corredores no alto (entre as varandas)
for (const x of [146, 173, 200, 227]) linha(0, [[x, 112], [x, 138]], { tipo: 'guia' });

// Estilingues
export const ESTILINGUES = [
  { a: [72, 746], b: [72, 786], c: [104, 804], flash: 0 },
  { a: [298, 746], b: [298, 786], c: [266, 804], flash: 0 },
];
for (const s of ESTILINGUES) {
  seg(0, ...s.a, ...s.b, { e: .6, tipo: 'borracha', est: s });
  seg(0, ...s.b, ...s.c, { e: .6, tipo: 'borracha', est: s });
  seg(0, ...s.a, ...s.c, { e: .6, tipo: 'borracha', est: s, chute: 420 });
}

// Pinos de borracha soltos (asteroides)
export const PINOS = [[98, 722], [272, 722]];
for (const [x, y] of PINOS) seg(0, x, y, x, y, { r: 5, e: .7, tipo: 'pino' });

// Para-choques redondos (bumpers): 3 na mesa e 3 em cada plataforma
export const BUMPERS = [
  { x: 157, y: 232, r: 14, andar: 0 }, { x: 213, y: 232, r: 14, andar: 0 }, { x: 185, y: 284, r: 14, andar: 0 },
  { x: 60, y: 184, r: 10, andar: 1 }, { x: 106, y: 184, r: 10, andar: 1 }, { x: 83, y: 226, r: 10, andar: 1 },
  { x: 278, y: 190, r: 11, andar: 2 }, { x: 330, y: 190, r: 11, andar: 2 }, { x: 304, y: 238, r: 11, andar: 2 },
].map((b, i) => ({ ...b, i, flash: 0 }));

// Teclado: 5 alvos que caem quando a bola bate, em leve "telhado" para a bola não parar atrás deles
export const TECLAS = [];
const yTecla = x => 352 + Math.abs(x - 181) * .28;
for (let i = 0; i < 5; i++) TECLAS.push({ i, ax: 150 + i * 14, bx: 164 + i * 14, ay: yTecla(150 + i * 14), by: yTecla(164 + i * 14), andar: 0, acesa: false, toque: -9 });

// ---------- Varandas: cada uma é um mini-pinball, com duas palhetas e saída no meio ----------
linha(1, [[43, 366], [28, 346], [28, 130], [138, 130], [138, 346], [123, 366]], { tipo: 'varanda' });
linha(2, [[251, 366], [236, 346], [236, 130], [372, 130], [372, 346], [357, 366]], { tipo: 'varanda' });
// guias das bocas dos loopings das plataformas
linha(1, [[112, 310], [112, 286]], { tipo: 'guiaAlta' });
linha(2, [[262, 310], [262, 286]], { tipo: 'guiaAlta' });

// Alvos em pé: 2 na cabine, 3 no palco, 4 estrelas nas laterais da mesa
export const ALVOS = [
  { grupo: 'djs', andar: 1, ax: 38, ay: 135, bx: 62, by: 135 },
  { grupo: 'djs', andar: 1, ax: 70, ay: 135, bx: 94, by: 135 },
  { grupo: 'casal', andar: 2, ax: 280, ay: 135, bx: 300, by: 135 },
  { grupo: 'casal', andar: 2, ax: 308, ay: 135, bx: 328, by: 135 },
  { grupo: 'casal', andar: 2, ax: 336, ay: 135, bx: 356, by: 135 },
  { grupo: 'estrelas', andar: 0, ax: 106, ay: 596, bx: 106, by: 614 },
  { grupo: 'estrelas', andar: 0, ax: 106, ay: 620, bx: 106, by: 638 },
  { grupo: 'estrelas', andar: 0, ax: 264, ay: 596, bx: 264, by: 614 },
  { grupo: 'estrelas', andar: 0, ax: 264, ay: 620, bx: 264, by: 638 },
].map((a, i) => ({ ...a, i, aceso: false, toque: -9 }));

// ---------- Palhetas ----------
// lado: qual botão mexe (E = esquerdo, D = direito)
const palheta = (andar, lado, px, py, len, rb, rt) => {
  const esq = lado === 'E';
  const rep = esq ? .5 : Math.PI - .5, cima = esq ? -.45 : Math.PI + .45;
  return { andar, lado, px, py, len, rb, rt, rep, cima, ang: rep, w: 0, wReal: 0, apertada: false };
};
export const palhetas = [
  palheta(0, 'E', 116, 850, 60, 10, 5.5),
  palheta(0, 'D', 254, 850, 60, 10, 5.5),
  palheta(1, 'E', 47, 373, 27, 6, 3.5),
  palheta(1, 'D', 119, 373, 27, 6, 3.5),
  palheta(2, 'E', 255, 373, 39, 6, 3.5),
  palheta(2, 'D', 353, 373, 39, 6, 3.5),
];

// ---------- Peças especiais ----------
export const VINIL = { x: 78, y: 282, r: 25, andar: 1, w: 1.6, alvo: 1.6, ang: 0 };   // w = giro agora; alvo = giro pedido pelas regras
export const ELEVADOR = { x: 185, y: 180 };
export const TUNEL = { x: 185, y: 326 };
export const PONTE = { x: 119, y: 150 };
export const CANHAO = { x: 38, y: 470 };          // por onde o túnel devolve a bola
export const PORTAS = { tunel: { aberta: false }, ponte: { aberta: false }, arco: { aberta: true } };
// Buracos que engolem a bola; espera = quanto tempo ela fica presa antes de sair pela trilha
export const BURACOS = [
  { nome: 'elevador', andar: 0, x: ELEVADOR.x, y: ELEVADOR.y, espera: .6 },
  { nome: 'tunel', andar: 0, x: TUNEL.x, y: TUNEL.y, espera: .7, porta: 'tunel' },
  { nome: 'ponte', andar: 1, x: PONTE.x, y: PONTE.y, espera: .5, porta: 'ponte' },
];
export const LANCADOR = { x: 366, base: 900, curso: 30 };
// Catracas giratórias (spinners) nas duas voltas
export const CATRACAS = [{ x0: 23, x1: 55, y: 560, ang: 0, w: 0 }, { x0: 315, x1: 347, y: 560, ang: 0, w: 0 }];
// Letras S-T-A-R nos corredores de baixo e luzes dos 3 corredores do alto
export const LETRAS = [[33, 'S'], [59, 'T'], [311, 'A'], [337, 'R']].map(([x, letra], i) => ({ i, letra, x, y: 776, andar: 0, acesa: false, toque: -9 }));
export const ALTAS = [159.5, 186.5, 213.5].map((x, i) => ({ i, x, y: 126, andar: 0, acesa: false, toque: -9 }));
// Sensores das voltas (para saber que a bola deu a volta inteira)
export const VOLTAS = [{ lado: 'E', x: 38, y: 250, toque: -9 }, { lado: 'D', x: 331, y: 260, toque: -9 }];
// Cometa: vai e volta no meio da mesa; depois de muitas batidas ele explode
export const COMETA = { x: 185, y: 448, x0: 185, y0: 448, amplitude: 34, r: 17, vx: 0, vy: 0, fase: 0, vivo: true, batidas: 0, precisa: 10, toque: -9, volta: 0 };
// Planetas: cada cano de cima faz um looping em volta de um
export const PLANETAS = [
  { nome: 'azul', x: 98, y: 478, z: 92, r: 25 },
  { nome: 'aneis', x: 272, y: 478, z: 92, r: 25 },
];

// ---------- Trilhas (canos, trilhos, lançador e elevador) ----------
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
export const TRILHAS = {};
// Lançador: corredor da direita
TRILHAS.lancador = trilha([[LANCADOR.x, LANCADOR.base, 0], [LANCADOR.x, 520, 0], [LANCADOR.x, 168, 0]], { nome: 'lancador', andarIni: 0, andarFim: 0 });

// looping: círculo inclinado e virado para o jogador (inc = inclinação, voltas = quantas, avanco = quanto anda de lado)
function looping(pl, lado, raio, avanco, voltas = 1, inc = 55) {
  const pts = [], n = 14 * voltas; inc *= Math.PI / 180;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = -Math.PI / 2 + lado * t * Math.PI * 2 * voltas, s = (t - .5) * avanco;
    const u = Math.cos(a) * raio, v = Math.sin(a) * raio;
    pts.push([pl.x + u, pl.y - v * Math.cos(inc) + s * Math.sin(inc), pl.z + v * Math.sin(inc) + s * Math.cos(inc)]);
  }
  return pts;
}
const espelho = pts => pts.map(([x, y, z]) => [370 - x, y, z]);
// Canos de fora: looping em pé no corredor e subida pela lateral até o fundo da plataforma
const fora = [
  [83, 640, 0], [82, 620, 10], [70, 604, 20], [58, 600, 30],
  ...looping({ x: 56, y: 588, z: 62 }, 1, 27, -22, 1, 84),
  [44, 560, 46], [34, 510, 72], [27, 440, 92], [25, 330, 100], [25, 230, 101],
];
TRILHAS.canoE = trilha(curva([...fora, [28, 182, 98], [38, 158, 86], [52, 152, ZV]], 6), { nome: 'canoE', andarIni: 0, andarFim: 1, k: 1500, cano: true, vmax: 420, boca: { x0: 63, x1: 103, y: 637, dir: -1 } });
TRILHAS.canoD = trilha(curva([...espelho(fora).map(([x, y, z], i, a) => [i > a.length - 5 ? x + (y < 470 ? 18 : 0) : x, y, z]), [363, 190, 98], [352, 162, 86], [338, 152, ZV]], 6), { nome: 'canoD', andarIni: 0, andarFim: 2, k: 1500, cano: true, vmax: 420, boca: { x0: 267, x1: 307, y: 637, dir: -1 } });
// Canos de dentro: duas voltas em torno de um planeta e travessia para a outra plataforma
const dentro = [[132, 560, 0], [132, 538, 10], [126, 522, 26], [112, 512, 44]];
TRILHAS.loopE = trilha(curva([...dentro, ...looping(PLANETAS[0], 1, 35, 40, 2),
  [140, 470, 112], [185, 420, 126], [224, 372, 130], [252, 300, 122], [272, 230, 104], [290, 170, 84], [304, 152, ZV]], 6),
  { nome: 'loopE', andarIni: 0, andarFim: 2, k: 1300, cano: true, vmax: 420, boca: { x0: 114, x1: 150, y: 557, dir: -1 } });
TRILHAS.loopD = trilha(curva([...espelho(dentro), ...looping(PLANETAS[1], -1, 35, 40, 2),
  [230, 462, 98], [185, 424, 99], [148, 378, 106], [122, 310, 112], [108, 240, 102], [96, 174, 84], [84, 152, ZV]], 6),
  { nome: 'loopD', andarIni: 0, andarFim: 1, k: 1300, cano: true, vmax: 420, boca: { x0: 220, x1: 256, y: 557, dir: -1 } });
// Loopings das plataformas: boca no canto, uma volta no ar e de volta ao fundo da própria plataforma
const mini = [[125, 312, ZV], [125, 296, 76], [122, 284, 84], ...looping({ x: 112, y: 262, z: 112 }, 1, 25, 20, 1, 70), [104, 236, 104], [92, 196, 96], [72, 162, 82], [60, 154, ZV]];
TRILHAS.miniE = trilha(curva(mini, 6), { nome: 'miniE', andarIni: 1, andarFim: 1, k: 1300, cano: true, vmax: 360, minimo: 900, boca: { x0: 113, x1: 136, y: 309, dir: -1 } });
TRILHAS.miniD = trilha(curva(mini.map(([x, y, z], i) => [i > 17 ? 374 - x + (x < 100 ? 10 : 0) : 374 - x, y, z]), 6), { nome: 'miniD', andarIni: 2, andarFim: 2, k: 1300, cano: true, vmax: 360, minimo: 900, boca: { x0: 238, x1: 261, y: 309, dir: -1 } });

// Elevador de vidro no centro: sobe e vai para uma das varandas
const subida = [[ELEVADOR.x, ELEVADOR.y, 0], [ELEVADOR.x, ELEVADOR.y, 40], [ELEVADOR.x, ELEVADOR.y, 70], [ELEVADOR.x - 1, ELEVADOR.y - 4, 82]];
TRILHAS.elevE = trilha(curva([...subida, [170, 172, 92], [150, 168, 94], [130, 164, 88], [112, 162, ZV]]), { nome: 'elevE', andarIni: 0, andarFim: 1, cinem: 280, saida: 200, cano: true });
TRILHAS.elevD = trilha(curva([...subida, [202, 172, 92], [224, 168, 94], [244, 166, 88], [260, 164, ZV]]), { nome: 'elevD', andarIni: 0, andarFim: 2, cinem: 280, saida: 240, cano: true });
// Ponte de vidro: plataforma do astronauta → plataforma da nave
TRILHAS.ponte = trilha(curva([
  [PONTE.x, PONTE.y, ZV], [PONTE.x + 7, PONTE.y - 4, 86], [142, 140, 102], [188, 132, 116], [236, 137, 106], [254, 146, 86], [264, 150, ZV],
]), { nome: 'ponte', andarIni: 1, andarFim: 2, cinem: 280, saida: 260, cano: true });
// Túnel: some embaixo da mesa e volta como um tiro de canhão na volta esquerda
TRILHAS.tunel = trilha([
  [TUNEL.x, TUNEL.y, 0], [TUNEL.x, TUNEL.y, -26], [CANHAO.x, CANHAO.y + 14, -26], [CANHAO.x, CANHAO.y + 4, -6], [CANHAO.x, CANHAO.y - 12, 0],
], { nome: 'tunel', andarIni: 0, andarFim: 0, cinem: 320, saida: 1550 });
// Trilhos de arame: descem das varandas até as palhetas
TRILHAS.trilhoE = trilha(curva([
  [83, 402, ZV], [72, 420, 66], [48, 440, 58], [30, 470, 50], [28, 540, 38], [28, 640, 30], [36, 700, 22], [49, 740, 12], [57, 768, 3], [59, 788, 0], [59, 796, 0],
]), { nome: 'trilhoE', andarIni: 1, andarFim: 0, cinem: 460, saida: 260, arame: true, boca: { x0: 28, x1: 138, y: 402, dir: 1 } });
TRILHAS.trilhoD = trilha(curva([
  [304, 402, ZV], [310, 420, 66], [326, 440, 58], [341, 470, 50], [342, 540, 38], [342, 640, 30], [334, 700, 22], [321, 740, 12], [313, 768, 3], [311, 788, 0], [311, 796, 0],
]), { nome: 'trilhoD', andarIni: 2, andarFim: 0, cinem: 460, saida: 260, arame: true, boca: { x0: 236, x1: 372, y: 402, dir: 1 } });
