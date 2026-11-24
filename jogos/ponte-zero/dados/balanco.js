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
};

// ---------- chefes ----------
// vel = quanto anda por segundo entre um golpe e outro; pausa = descanso entre golpes (s)
// aviso = segundos com a marca no chão antes do golpe; perda = fração dos soldados marcados que cai
// golpes = lista por fase (a fase muda com 2/3 e 1/3 da vida)
export const CHEFES = {
  cancela: { nome: 'Cancela', lema: 'Ninguém passa sem pagar', altura: 7.6, escala: 5, raio: 2.4, vel: 1.75, pausa: 1.9, aviso: 1.5, perda: .5, golpes: [['porrete'], ['porrete', 'varrida'], ['varrida', 'duplo']], premio: { texto: '+2 soldados no começo de toda partida', soldados: 2 } },
  operario: { nome: 'Operário', lema: 'A obra nunca termina', altura: 7.8, escala: 5, raio: 2.5, vel: 1.75, pausa: 1.7, aviso: 1.55, perda: .5, golpes: [['buraco'], ['buraco', 'entulho'], ['buraco', 'entulho', 'onda']], premio: { texto: '+10% de dano para sempre', dano: .1 } },
  sirene: { nome: 'Sirene', lema: 'Quando ela grita, eles correm', altura: 8.6, escala: 4.6, raio: 1.9, vel: 1.85, pausa: 1.7, aviso: 1.45, perda: .45, golpes: [['grito'], ['grito', 'garra'], ['grito', 'garra', 'ondas']], premio: { texto: '+10% de cadência para sempre', cadencia: .1 } },
  carcaca: { nome: 'Carcaça', lema: 'Feito de tudo que ficou para trás', altura: 7.2, escala: 5, raio: 2.7, vel: 1.7, pausa: 1.8, aviso: 1.5, perda: .5, placas: 5, golpes: [['placa'], ['placa', 'investida'], ['investida', 'pisao', 'placa']], premio: { texto: 'Toda partida começa com 1 bazuca', bazuca: 1 } },
};
export const ARENA = { comeca: 25 }; // onde o chefe aparece e onde para antes de lutar (m à frente do pelotão)

// ---------- níveis ----------
// d = distância na ponte (m). portao: [esquerda, direita]; +n soma, -n tira, *n multiplica, /n divide, a = arma melhor, c = cadência,
// vida = força do chefe para quem chega com "tropa" soldados (chegar com mais ou menos muda um pouco)
// t = portão de tiro, m/b/l + n = n especialistas (metralhadora, bazuca, lança-chamas)
// hordas: [d, tipo, quantos, largura, profundidade]; barris: [d, x]
export const NIVEIS = [
  {
    nome: 'Pedágio', cenario: 'tarde', chefe: 'cancela', vida: 32000, tropa: 40, inicio: 3, comprimento: 318,
    portoes: [{ d: 24, e: '+5', f: '+2' }, { d: 64, e: '+2', f: '*2' }, { d: 108, e: 'a', f: '+6' }, { d: 152, e: '+10', f: 'm2' }, { d: 200, e: 't-10', f: '/2' }, { d: 246, e: '*2', f: 'b3' }, { d: 286, e: '+15', f: '-20' }],
    hordas: [[36, 'comum', 4, 5, 5], [52, 'comum', 6, 7, 6], [80, 'comum', 9, 8, 10], [96, 'comum', 10, 8, 8], [122, 'comum', 20, 8, 12], [138, 'corredor', 6, 6, 6], [166, 'comum', 30, 8, 14], [186, 'corredor', 12, 8, 8], [214, 'comum', 48, 9, 16], [232, 'blindado', 2, 5, 2], [258, 'comum', 58, 9, 14], [274, 'corredor', 22, 9, 8], [298, 'blindado', 3, 8, 3], [302, 'comum', 46, 9, 10]],
    barris: [[50, 2.5], [92, -3], [134, 3.2], [180, -2.2], [228, 2.8], [268, -3.2]],
  },
  {
    nome: 'Canteiro', cenario: 'manha', chefe: 'operario', vida: 42000, tropa: 45, inicio: 3, comprimento: 356,
    portoes: [{ d: 24, e: '+6', f: '+3' }, { d: 62, e: '+6', f: 'l2' }, { d: 106, e: '*2', f: 't-6' }, { d: 152, e: 'm2', f: 'a' }, { d: 198, e: 'b2', f: '-12' }, { d: 246, e: 'c', f: '*2' }, { d: 290, e: '+12', f: '/2' }, { d: 328, e: 'l3', f: 'm2' }],
    hordas: [[36, 'comum', 6, 6, 5], [50, 'corredor', 4, 6, 4], [76, 'comum', 9, 8, 10], [92, 'corredor', 2, 8, 6], [118, 'comum', 13, 9, 12], [136, 'blindado', 1, 4, 2], [168, 'comum', 24, 9, 14], [184, 'corredor', 10, 9, 8], [214, 'comum', 48, 9, 14], [230, 'blindado', 3, 8, 4], [262, 'comum', 74, 9, 16], [276, 'corredor', 26, 9, 8], [304, 'comum', 84, 9, 16], [316, 'blindado', 5, 9, 4], [340, 'comum', 52, 9, 10]],
    barris: [[46, -2.5], [88, 3], [132, -3.2], [178, 2.4], [224, -2.8], [272, 3.2], [312, 0]],
  },
  {
    nome: 'Sinal', cenario: 'noite', chefe: 'sirene', vida: 64000, tropa: 70, inicio: 3, comprimento: 388,
    portoes: [{ d: 24, e: '+6', f: '+4' }, { d: 62, e: 'b1', f: '*2' }, { d: 106, e: '+8', f: '-6' }, { d: 152, e: 'a', f: 't-12' }, { d: 200, e: '*2', f: 'm2' }, { d: 250, e: '/2', f: 'l3' }, { d: 298, e: '+18', f: 'a' }, { d: 342, e: '-20', f: 'b3' }],
    hordas: [[36, 'corredor', 4, 6, 5], [52, 'comum', 10, 7, 6], [78, 'corredor', 7, 8, 10], [94, 'comum', 11, 8, 8], [122, 'comum', 26, 9, 12], [136, 'corredor', 10, 8, 6], [170, 'comum', 42, 9, 14], [186, 'blindado', 3, 7, 3], [214, 'corredor', 34, 9, 12], [232, 'comum', 56, 9, 14], [266, 'comum', 72, 9, 14], [282, 'blindado', 5, 9, 4], [312, 'corredor', 48, 9, 12], [328, 'comum', 70, 9, 12], [356, 'comum', 76, 9, 12], [372, 'blindado', 5, 9, 4]],
    barris: [[48, 2.6], [90, -2.8], [130, 3.1], [182, -2.4], [228, 2.8], [278, -3.2], [324, 3], [366, -2]],
  },
  {
    nome: 'Desmanche', cenario: 'tempestade', chefe: 'carcaca', vida: 64000, tropa: 60, inicio: 3, comprimento: 420,
    portoes: [{ d: 24, e: '+7', f: '+4' }, { d: 62, e: '*2', f: 'm1' }, { d: 106, e: '-8', f: 'a' }, { d: 152, e: 'l2', f: 'b2' }, { d: 200, e: '*2', f: 't-14' }, { d: 250, e: 'a', f: '/2' }, { d: 300, e: 'm3', f: '+12' }, { d: 346, e: 'b3', f: '-30' }, { d: 386, e: '+15', f: 't-25' }],
    hordas: [[36, 'comum', 8, 6, 5], [50, 'comum', 10, 7, 6], [76, 'comum', 16, 8, 10], [92, 'blindado', 1, 4, 2], [120, 'comum', 30, 9, 12], [136, 'corredor', 16, 8, 6], [168, 'blindado', 3, 8, 3], [172, 'comum', 46, 9, 12], [214, 'comum', 64, 9, 14], [230, 'blindado', 5, 9, 4], [264, 'corredor', 40, 9, 12], [282, 'comum', 76, 9, 14], [314, 'comum', 84, 9, 14], [330, 'blindado', 8, 9, 5], [358, 'corredor', 52, 9, 12], [374, 'comum', 70, 9, 12], [400, 'blindado', 7, 9, 5], [404, 'comum', 60, 9, 10]],
    barris: [[46, -2.6], [88, 3], [130, -3.2], [178, 2.4], [226, -2.8], [274, 3.2], [322, 0], [368, 2.8], [398, -3]],
  },
];
