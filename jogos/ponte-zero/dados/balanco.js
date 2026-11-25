// Números do jogo: armas, zumbis, chefes e o roteiro de cada nível.
export const PISTA = 4.7;        // até onde o centro do pelotão e os zumbis chegam, do meio para cada lado (m)
export const VELOCIDADE = 5.2;   // avanço automático (m/s)
export const FRENTE = 9, TRAS = -1.5; // quanto o jogador pode adiantar ou recuar (m)
export const MAX_SOLDADOS = 100;

// As três primeiras são do pelotão inteiro e evoluem (meta = eliminações para a próxima).
// As três últimas são de especialistas: soldados que entram pelos portões dourados e levam sempre a própria arma.
export const ARMAS = [
  { id: 'pistola', nome: 'Pistola', pegada: 'pistola', dano: 10, cadencia: 2.5, alcance: 26, vel: 40, atravessa: 0, abre: .012, meta: 45 },
  { id: 'submetralhadora', nome: 'Submetralhadora', pegada: 'curta', dano: 7, cadencia: 6, alcance: 29, vel: 44, atravessa: 0, abre: .022, meta: 170 },
  { id: 'fuzil', nome: 'Fuzil', pegada: 'longa', dano: 12, cadencia: 6, alcance: 36, vel: 52, atravessa: 1, abre: .012, meta: Infinity },
  { id: 'metralhadora', nome: 'Metralhadora', plural: 'Metralhadoras', pegada: 'quadril', dano: 9, cadencia: 15, alcance: 32, vel: 54, atravessa: 0, abre: .035, especial: true },
  { id: 'bazuca', nome: 'Bazuca', plural: 'Bazucas', pegada: 'ombro', dano: 60, cadencia: .6, alcance: 36, vel: 21, atravessa: 0, abre: .01, especial: true, raio: 2.7, danoArea: 95 },
  { id: 'chamas', nome: 'Lança-chamas', plural: 'Lança-chamas', pegada: 'jato', dano: 13, cadencia: 10, alcance: 13, vel: 0, atravessa: 0, abre: .24, especial: true, jato: true, queima: 14 },
];
export const ESPECIAL = { m: 3, b: 4, l: 5 }; // letra usada nos portões

export const ZUMBIS = {
  comum: { vida: 30, vel: 2.2, raio: .4, custo: 1, escala: 1, pontos: 1 },
  corredor: { vida: 20, vel: 5.4, raio: .38, custo: 1, escala: .96, pontos: 1 },
  blindado: { vida: 220, vel: 1.4, raio: .66, custo: 4, escala: 1.4, pontos: 5 },
  // escudo: segura as balas de quem está atrás; explosão e fogo passam por ele
  escudeiro: { vida: 45, vel: 1.7, raio: .5, custo: 1, escala: 1.1, pontos: 3, escudo: 130 },
  // atirador: para longe e cospe gosma, com marca no chão antes de cair
  atirador: { vida: 45, vel: 2, raio: .42, custo: 1, escala: 1.04, pontos: 3, cospe: 3.4 },
};

// ---------- chefes ----------
// vel = quanto anda por segundo entre um golpe e outro; pausa = descanso entre golpes (s)
// aviso = segundos com a marca no chão antes do golpe; perda = fração dos soldados marcados que cai
// golpes = lista por fase (a fase muda com 2/3 e 1/3 da vida). corpo = modelo, quando é dividido por dois meio-chefes
export const CHEFES = {
  cancela: { nome: 'Cancela', lema: 'Ninguém passa sem pagar', altura: 7.6, escala: 5, raio: 2.4, vel: 1.75, pausa: 1.8, aviso: 1.5, perda: .5, golpes: [['porrete'], ['porrete', 'varrida'], ['varrida', 'duplo']], premio: { texto: '+2 soldados no começo de toda partida', soldados: 2 } },
  operario: { nome: 'Operário', lema: 'A obra nunca termina', altura: 7.8, escala: 5, raio: 2.5, vel: 1.75, pausa: 1.65, aviso: 1.5, perda: .5, golpes: [['buraco'], ['buraco', 'entulho'], ['buraco', 'entulho', 'onda']], premio: { texto: '+10% de dano para sempre', dano: .1 } },
  sirene: { nome: 'Sirene', lema: 'Quando ela grita, eles correm', altura: 8.6, escala: 4.6, raio: 1.9, vel: 1.85, pausa: 1.65, aviso: 1.45, perda: .45, golpes: [['grito'], ['grito', 'garra'], ['grito', 'garra', 'ondas']], premio: { texto: '+10% de cadência para sempre', cadencia: .1 } },
  carcaca: { nome: 'Carcaça', lema: 'Feito de tudo que ficou para trás', altura: 7.2, escala: 5, raio: 2.7, vel: 1.7, pausa: 1.75, aviso: 1.45, perda: .5, placas: 5, golpes: [['placa'], ['placa', 'investida'], ['investida', 'pisao', 'placa']], premio: { texto: 'Toda partida começa com 1 bazuca', bazuca: 1 } },
  afogada: { nome: 'Afogada', lema: 'O rio devolve o que engoliu', altura: 8.2, escala: 4.8, raio: 2.1, vel: 1.75, pausa: 1.7, aviso: 1.5, perda: .5, golpes: [['enxurrada'], ['enxurrada', 'mergulho'], ['mergulho', 'enxurrada', 'ondas']], premio: { texto: 'Toda partida começa com 1 lança-chamas', chamas: 1 } },
  guindaste: { nome: 'Guindaste', lema: 'O que ele levanta, ele solta', altura: 8.6, escala: 5, raio: 2.6, vel: 1.65, pausa: 1.6, aviso: 1.5, perda: .5, golpes: [['carro'], ['carro', 'varrida'], ['carros', 'varrida', 'porrete']], premio: { texto: '+3 soldados no começo de toda partida', soldados: 3 } },
  fornalha: { nome: 'Fornalha', lema: 'Só a água abre o ferro em brasa', altura: 7.6, escala: 5, raio: 2.6, vel: 1.65, pausa: 1.6, aviso: 1.45, perda: .5, quente: .3, golpes: [['brasa'], ['brasa', 'bafo'], ['bafo', 'pisao', 'brasa']], premio: { texto: '+10% de dano para sempre', dano: .1 } },
  mae: { nome: 'Mãe da Ponte', lema: 'A ponte inteira é o corpo dela', altura: 9.6, escala: 5.4, raio: 2.6, vel: 1.6, pausa: 1.55, aviso: 1.45, perda: .48, placas: 6, etapas: 3, golpes: [['pente', 'garra'], ['desaba', 'pente', 'convoca'], ['investida', 'desaba', 'ondas', 'pente']], premio: { texto: 'Toda partida começa com 1 metralhadora', metralhadora: 1 } },
  // meio-chefes: menores, um ou dois golpes, luta curta
  fiscal: { meio: true, nome: 'Fiscal', lema: 'Documentos, por favor', altura: 5, escala: 3.15, raio: 1.4, vel: 2.1, pausa: 1.3, aviso: 1.3, perda: .34, corpo: 'guarda', golpes: [['porrete']] },
  britadeira: { meio: true, nome: 'Britadeira', lema: 'Quebra o chão e quem estiver nele', altura: 4.7, escala: 3.2, raio: 1.6, vel: 2, pausa: 1.25, aviso: 1.3, perda: .36, corpo: 'bruto', golpes: [['buraco', 'porrete']] },
  motoqueiro: { meio: true, nome: 'Motoqueiro', lema: 'Sem freio e sem dono', altura: 5, escala: 3.1, raio: 1.4, vel: 2.2, pausa: 1.1, aviso: 1.2, perda: .36, corpo: 'saltador', golpes: [['investida', 'varrida']] },
  tampa: { meio: true, nome: 'Tampa', lema: 'Arremessa bueiros', altura: 4.8, escala: 3.1, raio: 1.6, vel: 1.9, pausa: 1.15, aviso: 1.25, perda: .38, corpo: 'casca', golpes: [['placa', 'pisao']] },
  mergulhador: { meio: true, nome: 'Mergulhador', lema: 'Subiu sem descompressão', altura: 5, escala: 3.15, raio: 1.4, vel: 2, pausa: 1.1, aviso: 1.25, perda: .38, corpo: 'saltador', golpes: [['garra', 'ondas']] },
  estivador: { meio: true, nome: 'Estivador', lema: 'Descarrega em cima de você', altura: 4.8, escala: 3.2, raio: 1.6, vel: 1.9, pausa: 1.1, aviso: 1.25, perda: .38, corpo: 'casca', golpes: [['entulho', 'varrida']] },
  fundidor: { meio: true, nome: 'Fundidor', lema: 'Martelo saído do forno', altura: 4.8, escala: 3.25, raio: 1.6, vel: 2, pausa: 1.05, aviso: 1.2, perda: .4, corpo: 'bruto', golpes: [['porrete', 'brasa']] },
  arauto: { meio: true, nome: 'Arauto', lema: 'Anuncia quem vem depois', altura: 5.2, escala: 3.25, raio: 1.4, vel: 2, pausa: 1, aviso: 1.2, perda: .4, corpo: 'guarda', golpes: [['pente', 'grito']] },
};
export const ARENA = { comeca: 25, meio: 18 }; // a que distância o chefe cai (m à frente do pelotão)

// ---------- níveis ----------
// d = distância na ponte (m). portoes: l = lados (2 ou 3), anda = quanto a divisão corre de lado.
// +n soma, -n tira, *n multiplica, /n divide, a = arma melhor, c = cadência, t = portão de tiro, m/b/l + n = n especialistas
// vida = força do chefe para quem chega com "tropa" soldados (chegar com mais ou menos muda um pouco)
// hordas: [d, tipo, quantos, largura, profundidade]; largura 'L' = sobem pelas laterais quando o pelotão passa
// barris: [d, x]; caixas: [d, x, vida, o que dá] (soldados = gaiola de resgate; outro = caixa de arma)
// blocos: [d0, d1, x0, x1, tipo] muro fecha parte da pista, carro pode ser explodido
// perigos: [d, tipo, x] desaba (lado -1, 0 ou 1), carro (cai do alto em x), fogo (jato na faixa x)
// escolta = tropa que entra com o chefe; tropas = reforços de cada fase
export const NIVEIS = [
  {
    nome: 'Pedágio', forca: 1, aviso: 1, cenario: 'tarde', chefe: 'cancela', novo: 'Resgate soldados presos nas gaiolas', vida: 41000, tropa: 42, inicio: 3, comprimento: 352,
    meio: { id: 'fiscal', d: 178, vida: 6000, tropa: 22, premio: 'm2' },
    portoes: [{ d: 24, l: ['+5', '+2'] }, { d: 62, l: ['+2', '*2'] }, { d: 104, l: ['a', '+6'] }, { d: 146, l: ['+10', '-6'] }, { d: 222, l: ['t-10', '/2'] }, { d: 264, l: ['+16', 'b2'] }, { d: 306, l: ['+15', '-20'] }],
    hordas: [[36, 'comum', 4, 5, 5], [50, 'comum', 6, 7, 6], [76, 'comum', 8, 8, 10], [92, 'comum', 10, 8, 8], [118, 'comum', 20, 8, 12], [132, 'corredor', 6, 6, 6], [158, 'comum', 18, 8, 10], [232, 'comum', 36, 9, 14], [246, 'corredor', 14, 8, 8], [250, 'blindado', 2, 5, 2], [276, 'comum', 52, 9, 14], [290, 'corredor', 21, 9, 8], [318, 'blindado', 3, 8, 3], [322, 'comum', 43, 9, 10]],
    barris: [[48, 2.5], [90, -3], [128, 3.2], [242, 2.8], [286, -3.2]], caixas: [[84, 3.4, 140, '+4'], [138, -3.6, 260, '+5'], [238, -3.6, 700, '+8'], [296, 3.6, 1200, '+10']],
    escolta: [['comum', 8], ['escudeiro', 2]], tropas: [[['comum', 4]], [['comum', 8], ['escudeiro', 2]], [['corredor', 8], ['escudeiro', 2]]],
  },
  {
    nome: 'Canteiro', forca: 1.1, aviso: 1, cenario: 'manha', chefe: 'operario', novo: 'A pista estreita e há caixas com armas', vida: 60000, tropa: 46, inicio: 3, comprimento: 388,
    meio: { id: 'britadeira', d: 190, vida: 8600, tropa: 24, premio: '+12' },
    portoes: [{ d: 24, l: ['+6', '+3'] }, { d: 62, l: ['+6', 'l2'] }, { d: 106, l: ['*2', 't-6'] }, { d: 152, l: ['+6', 'a'] }, { d: 232, l: ['b2', '-12'] }, { d: 276, l: ['c', '+14'] }, { d: 318, l: ['+12', '/2'] }, { d: 352, l: ['l3', 'm2'] }],
    hordas: [[36, 'comum', 6, 6, 5], [50, 'corredor', 4, 6, 4], [78, 'comum', 10, 8, 8], [94, 'corredor', 3, 8, 6], [118, 'comum', 15, 9, 10], [136, 'blindado', 1, 4, 2], [164, 'comum', 26, 9, 12], [174, 'corredor', 8, 9, 6], [244, 'comum', 44, 9, 12], [258, 'escudeiro', 5, 8, 2], [264, 'comum', 24, 9, 6], [288, 'comum', 66, 9, 14], [302, 'corredor', 24, 9, 8], [328, 'comum', 70, 9, 12], [338, 'blindado', 4, 9, 4], [364, 'comum', 48, 9, 10]],
    blocos: [[84, 92, -5.4, -.4, 'muro'], [124, 134, 1.2, 5.4, 'muro'], [250, 262, -5.4, -1, 'muro'], [304, 312, .4, 5.4, 'muro'], [332, 340, -5.4, -2.4, 'muro'], [332, 340, 2.4, 5.4, 'muro']],
    barris: [[46, -2.5], [98, 3], [140, -3.2], [272, 3], [324, 3.2]], caixas: [[70, -3.4, 160, '+4'], [112, 3.4, 260, 'm1'], [168, -3.6, 420, '+6'], [240, 3.4, 900, 'b1'], [296, -3.4, 1500, 'm2'], [346, 0, 1800, '+12']],
    escolta: [['comum', 8], ['escudeiro', 3]], tropas: [[['comum', 6]], [['comum', 8], ['blindado', 1]], [['escudeiro', 3], ['corredor', 8]]],
  },
  {
    nome: 'Sinal', forca: 1.12, aviso: 0.98, cenario: 'noite', chefe: 'sirene', novo: 'Portões que correm e adrenalina de perto', vida: 88000, tropa: 64, inicio: 3, comprimento: 420, adrenalina: true,
    meio: { id: 'motoqueiro', d: 196, vida: 9500, tropa: 30, premio: 'm2' },
    portoes: [{ d: 24, l: ['+6', '+4'] }, { d: 62, l: ['b1', '*2'], anda: 2 }, { d: 106, l: ['+8', '-6'], anda: 2.6 }, { d: 152, l: ['a', 't-12'] }, { d: 240, l: ['*2', 'm2'], anda: 2.4 }, { d: 288, l: ['/2', 'l3'], anda: 2.8 }, { d: 334, l: ['+18', 'a', '-15'], anda: 1.4 }, { d: 380, l: ['-20', 'b3'], anda: 2.6 }],
    hordas: [[36, 'corredor', 4, 6, 5], [52, 'comum', 8, 7, 6], [78, 'corredor', 7, 8, 10], [94, 'comum', 10, 8, 8], [122, 'comum', 22, 9, 12], [136, 'corredor', 9, 8, 6], [166, 'comum', 29, 9, 12], [176, 'atirador', 2, 8, 2], [250, 'corredor', 30, 9, 12], [262, 'comum', 48, 9, 12], [274, 'atirador', 3, 8, 3], [300, 'comum', 64, 9, 14], [314, 'blindado', 4, 9, 4], [346, 'corredor', 42, 9, 12], [360, 'comum', 60, 9, 12], [366, 'atirador', 4, 9, 4], [394, 'comum', 66, 9, 12], [404, 'blindado', 4, 9, 4]],
    barris: [[48, 2.6], [90, -2.8], [130, 3.1], [268, 2.8], [318, -3.2], [370, 3]], caixas: [[84, 3.4, 200, '+5'], [144, -3.6, 420, 'l1'], [256, -3.6, 1300, '+10'], [350, 3.6, 2200, 'm2']],
    escolta: [['corredor', 10], ['atirador', 2]], tropas: [[['corredor', 5]], [['corredor', 8], ['atirador', 2]], [['corredor', 10], ['escudeiro', 3]]],
  },
  {
    nome: 'Desmanche', forca: 1.18, aviso: 0.96, cenario: 'tempestade', chefe: 'carcaca', novo: 'Carros no caminho e portões triplos', vida: 94000, tropa: 60, inicio: 3, comprimento: 452, adrenalina: true,
    meio: { id: 'tampa', d: 200, vida: 12500, tropa: 34, premio: 'b2' },
    portoes: [{ d: 24, l: ['+7', '+4'] }, { d: 62, l: ['*2', '-4', 'm1'] }, { d: 106, l: ['-8', 'a'] }, { d: 152, l: ['l2', '/2', 'b2'] }, { d: 244, l: ['+12', 't-14'] }, { d: 292, l: ['a', '-12', '+14'] }, { d: 340, l: ['m3', '+12'] }, { d: 386, l: ['b3', '-30', '+10'] }, { d: 424, l: ['+15', 't-25'] }],
    hordas: [[36, 'comum', 7, 6, 5], [50, 'comum', 8, 7, 6], [76, 'comum', 14, 8, 10], [92, 'blindado', 1, 4, 2], [120, 'comum', 24, 9, 12], [136, 'corredor', 12, 8, 6], [166, 'blindado', 3, 8, 3], [172, 'comum', 31, 9, 10], [256, 'comum', 59, 9, 14], [272, 'blindado', 4, 9, 4], [304, 'corredor', 38, 9, 12], [318, 'escudeiro', 8, 9, 3], [322, 'comum', 59, 9, 10], [352, 'comum', 78, 9, 14], [368, 'blindado', 6, 9, 5], [398, 'corredor', 47, 9, 10], [408, 'comum', 53, 9, 10], [434, 'blindado', 6, 9, 5], [436, 'comum', 53, 9, 8]],
    blocos: [[82, 87, -1.1, 1.1, 'carro'], [128, 133, 2.2, 4.6, 'carro'], [140, 145, -4.6, -2.2, 'carro'], [264, 269, -2.6, -.4, 'carro'], [280, 285, 1.4, 3.8, 'carro'], [326, 331, -4.8, -2.4, 'carro'], [326, 331, 2.4, 4.8, 'carro'], [374, 379, -1.2, 1.2, 'carro']],
    barris: [[46, -2.6], [112, 3], [262, 2.8], [312, -3.2], [360, 3], [412, -3]], caixas: [[70, 3.4, 220, '+5'], [116, -3.6, 420, 'm1'], [250, 3.6, 1400, '+10'], [300, -3.6, 1900, 'b1'], [392, 0, 2600, '+14']],
    escolta: [['comum', 10], ['escudeiro', 4]], tropas: [[['comum', 8]], [['blindado', 2], ['comum', 8]], [['escudeiro', 4], ['corredor', 10]]],
  },
  {
    nome: 'Maré', forca: 1.4, aviso: 0.94, cenario: 'mare', chefe: 'afogada', novo: 'Zumbis sobem pelas laterais', vida: 152000, tropa: 60, inicio: 4, comprimento: 464, adrenalina: true, lateral: true,
    meio: { id: 'mergulhador', d: 206, vida: 13500, tropa: 36, premio: 'l2' },
    portoes: [{ d: 24, l: ['+8', '+4'] }, { d: 62, l: ['l1', '*2'] }, { d: 106, l: ['+10', '-8'], anda: 2.2 }, { d: 154, l: ['a', 't-10'] }, { d: 248, l: ['+16', '/2', 'm2'] }, { d: 296, l: ['+16', 'l2'], anda: 2.4 }, { d: 344, l: ['a', '-18'] }, { d: 392, l: ['m2', '+15'], anda: 2.6 }, { d: 434, l: ['t-20', 'b2'] }],
    hordas: [[36, 'comum', 8, 6, 5], [46, 'comum', 4, 'L', 8], [76, 'comum', 14, 8, 8], [86, 'comum', 8, 'L', 10], [118, 'comum', 24, 9, 10], [128, 'comum', 10, 'L', 10], [138, 'corredor', 10, 8, 6], [168, 'comum', 30, 9, 10], [176, 'comum', 12, 'L', 12], [260, 'comum', 48, 9, 12], [268, 'comum', 20, 'L', 12], [278, 'atirador', 4, 8, 4], [308, 'comum', 66, 9, 12], [314, 'corredor', 15, 'L', 12], [326, 'escudeiro', 7, 9, 3], [356, 'comum', 68, 9, 14], [362, 'comum', 26, 'L', 14], [374, 'blindado', 4, 9, 4], [404, 'comum', 66, 9, 12], [410, 'corredor', 22, 'L', 12], [446, 'comum', 51, 9, 8], [448, 'blindado', 4, 9, 4]],
    barris: [[50, 2.5], [112, -3], [274, 3], [320, -3], [368, 2.8], [416, -2.8]], caixas: [[70, -3.6, 260, '+6'], [132, 3.6, 500, '+8'], [256, -3.6, 1600, 'l2'], [350, 3.6, 2400, '+12'], [420, 0, 2800, 'b1']],
    escolta: [['comum', 10], ['atirador', 3], ['escudeiro', 2]], tropas: [[['comum', 8]], [['comum', 10], ['atirador', 2]], [['corredor', 12], ['escudeiro', 3]]],
  },
  {
    nome: 'Porto', forca: 2, aviso: .88, cenario: 'aurora', chefe: 'guindaste', novo: 'Carros caem do alto: atire antes', vida: 180000, tropa: 62, inicio: 4, comprimento: 476, adrenalina: true,
    meio: { id: 'estivador', d: 208, vida: 18500, tropa: 38, premio: '+16' },
    portoes: [{ d: 24, l: ['+8', '+5'] }, { d: 62, l: ['*2', '-5', 'm1'] }, { d: 106, l: ['a', '+9'], anda: 2.2 }, { d: 156, l: ['+12', 't-20'] }, { d: 250, l: ['b2', '+12'], anda: 2.6 }, { d: 298, l: ['/2', '+16', '-16'], anda: 1.3 }, { d: 348, l: ['c', 'm2'] }, { d: 398, l: ['+18', '/2'], anda: 2.8 }, { d: 444, l: ['b2', '+16'] }],
    hordas: [[36, 'comum', 9, 6, 5], [50, 'corredor', 7, 7, 6], [76, 'comum', 18, 8, 8], [94, 'escudeiro', 2, 5, 2], [118, 'comum', 29, 9, 10], [136, 'corredor', 16, 8, 6], [168, 'comum', 36, 9, 10], [178, 'blindado', 3, 8, 3], [262, 'comum', 67, 9, 12], [274, 'escudeiro', 9, 9, 3], [280, 'comum', 32, 9, 6], [310, 'corredor', 52, 9, 10], [320, 'atirador', 7, 9, 5], [328, 'comum', 40, 'L', 14], [360, 'comum', 94, 9, 14], [374, 'blindado', 8, 9, 5], [410, 'comum', 75, 9, 10], [418, 'corredor', 32, 'L', 12], [424, 'escudeiro', 9, 9, 3], [456, 'blindado', 7, 9, 4], [460, 'comum', 62, 9, 8]],
    perigos: [[88, 'carro', 2], [124, 'carro', -2], [146, 'carro', 0], [186, 'carro', 2.4], [268, 'carro', -2.2], [276, 'carro', 2.2], [316, 'carro', 0], [334, 'carro', -2.4], [340, 'carro', 2], [368, 'carro', 0], [384, 'carro', 2.6], [420, 'carro', -1.6], [434, 'carro', 1.8]],
    barris: [[46, -2.5], [266, 3.4], [366, -3], [452, 3]], caixas: [[70, 3.6, 280, '+6'], [112, -3.6, 520, 'm1'], [256, 3.6, 1700, 'b1'], [304, 3.6, 2100, '+12'], [404, 0, 3000, 'm2']],
    escolta: [['comum', 10], ['escudeiro', 5]], tropas: [[['comum', 8], ['escudeiro', 2]], [['blindado', 2], ['atirador', 2], ['comum', 6]], [['corredor', 12], ['escudeiro', 4]]],
  },
  {
    nome: 'Siderúrgica', forca: 2.15, aviso: 0.9, cenario: 'brasa', chefe: 'fornalha', novo: 'Jatos de fogo; hidrantes esfriam o chefe', vida: 116000, tropa: 62, inicio: 4, comprimento: 484, adrenalina: true,
    meio: { id: 'fundidor', d: 210, vida: 21000, tropa: 40, premio: 'm2' },
    portoes: [{ d: 24, l: ['+9', '+5'] }, { d: 62, l: ['m1', '*2'], anda: 2.2 }, { d: 108, l: ['a', '-10', '+10'] }, { d: 156, l: ['*2', 't-12'] }, { d: 252, l: ['+14', 'l2', '/2'], anda: 1.2 }, { d: 300, l: ['+20', '-25'], anda: 2.6 }, { d: 350, l: ['a', 'b2'] }, { d: 402, l: ['+20', '/2', 'm2'], anda: 1.4 }, { d: 452, l: ['b2', 't-25'] }],
    hordas: [[36, 'comum', 9, 6, 5], [50, 'corredor', 7, 7, 6], [78, 'comum', 17, 8, 8], [94, 'blindado', 1, 4, 2], [120, 'comum', 28, 9, 10], [138, 'atirador', 3, 8, 3], [168, 'comum', 36, 9, 10], [180, 'escudeiro', 5, 8, 2], [264, 'comum', 62, 9, 12], [276, 'blindado', 5, 9, 4], [312, 'comum', 69, 9, 12], [320, 'corredor', 28, 'L', 12], [328, 'escudeiro', 9, 9, 3], [362, 'corredor', 53, 9, 12], [376, 'atirador', 7, 9, 5], [384, 'comum', 46, 9, 8], [414, 'comum', 76, 9, 12], [426, 'blindado', 8, 9, 5], [464, 'comum', 57, 9, 8], [468, 'escudeiro', 8, 9, 3]],
    perigos: [[88, 'fogo', -2.6], [100, 'fogo', 2.6], [132, 'fogo', 0], [186, 'fogo', 2.4], [272, 'fogo', -2.8], [280, 'fogo', 2.8], [290, 'fogo', 0], [330, 'fogo', 2.4], [338, 'fogo', -2.4], [372, 'fogo', 0], [386, 'fogo', -2.8], [392, 'fogo', 2.6], [420, 'fogo', 0], [436, 'fogo', -2.6], [444, 'fogo', 2.6]],
    blocos: [[142, 148, -5.4, -1.4, 'muro']], barris: [[46, 2.5], [116, -3.2], [268, 3], [366, -3.2], [460, 2.8]], caixas: [[72, -3.6, 300, '+7'], [128, 3.6, 560, 'b1'], [258, 3.6, 1800, '+12'], [358, 3.6, 2500, 'm2'], [410, -3.6, 3000, '+16']],
    escolta: [['comum', 12], ['blindado', 2], ['escudeiro', 3]], tropas: [[['comum', 8]], [['blindado', 2], ['atirador', 2], ['comum', 6]], [['corredor', 12], ['escudeiro', 4], ['atirador', 2]]],
  },
  {
    nome: 'Última Ponte', forca: 2.1, aviso: 0.88, cenario: 'eclipse', chefe: 'mae', novo: 'A ponte desaba e o chefe tem 3 etapas', vida: 51000, tropa: 66, inicio: 4, comprimento: 506, adrenalina: true, lateral: true,
    meio: { id: 'arauto', d: 214, vida: 21000, tropa: 42, premio: 'b3' },
    portoes: [{ d: 24, l: ['+9', '+6'] }, { d: 62, l: ['*2', '-6', 'b1'], anda: 1.2 }, { d: 108, l: ['+12', 'a'], anda: 2.4 }, { d: 158, l: ['l2', '*2'] }, { d: 258, l: ['/2', '+18', '-30'], anda: 1.4 }, { d: 306, l: ['a', '+18'], anda: 2.6 }, { d: 356, l: ['t-30', 'm3'] }, { d: 408, l: ['+20', '/2'], anda: 3 }, { d: 452, l: ['+22', '-30', 'l3'], anda: 1.4 }, { d: 484, l: ['b2', 'm2'] }],
    hordas: [[36, 'comum', 10, 6, 5], [50, 'corredor', 8, 7, 6], [78, 'comum', 18, 8, 8], [90, 'comum', 8, 'L', 10], [122, 'comum', 30, 9, 10], [138, 'escudeiro', 4, 8, 2], [142, 'atirador', 2, 8, 2], [170, 'comum', 38, 9, 10], [182, 'blindado', 4, 8, 3], [270, 'comum', 66, 9, 12], [280, 'escudeiro', 10, 9, 3], [286, 'comum', 28, 'L', 12], [318, 'corredor', 58, 9, 12], [328, 'atirador', 7, 9, 5], [336, 'comum', 54, 9, 8], [368, 'comum', 86, 9, 14], [376, 'blindado', 8, 9, 5], [420, 'comum', 70, 9, 10], [426, 'corredor', 35, 'L', 14], [434, 'escudeiro', 10, 9, 3], [464, 'comum', 66, 9, 10], [472, 'blindado', 7, 9, 5]],
    perigos: [[92, 'desaba', 1], [130, 'desaba', -1], [146, 'desaba', 0], [276, 'desaba', 1], [292, 'desaba', -1], [324, 'desaba', 0], [344, 'desaba', 1], [380, 'desaba', -1], [396, 'desaba', 1], [436, 'desaba', 0]],
    blocos: [[112, 117, -1.1, 1.1, 'carro']], barris: [[46, -2.6], [126, 3], [274, -3], [372, 3], [470, 0]], caixas: [[72, 3.6, 320, '+8'], [136, 3.6, 600, 'm1'], [264, -3.6, 1900, '+14'], [312, 3.6, 2300, 'b1'], [416, -3.6, 3200, '+18']],
    escolta: [['comum', 12], ['escudeiro', 5], ['atirador', 2]], tropas: [[['comum', 8], ['escudeiro', 2]], [['blindado', 2], ['atirador', 3], ['comum', 6]], [['corredor', 14], ['escudeiro', 4], ['blindado', 1]]],
  },
];
