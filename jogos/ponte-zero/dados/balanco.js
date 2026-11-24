// Números do jogo: armas, zumbis e o roteiro do trecho de teste (Fase 2).
export const PISTA = 4.7;        // até onde o centro do pelotão e os zumbis chegam, do meio para cada lado (m)
export const VELOCIDADE = 5.2;   // avanço automático (m/s)
export const FRENTE = 9, TRAS = -1.5; // quanto o jogador pode adiantar ou recuar (m)
export const MAX_SOLDADOS = 100;

// meta = eliminações para evoluir sozinha para a próxima
export const ARMAS = [
  { id: 'pistola', nome: 'Pistola', pegada: 'pistola', dano: 10, cadencia: 2.5, alcance: 24, vel: 46, atravessa: 0, abre: .012, meta: 45 },
  { id: 'submetralhadora', nome: 'Submetralhadora', pegada: 'curta', dano: 7, cadencia: 6, alcance: 28, vel: 52, atravessa: 0, abre: .022, meta: 170 },
  { id: 'fuzil', nome: 'Fuzil', pegada: 'longa', dano: 12, cadencia: 6, alcance: 36, vel: 62, atravessa: 1, abre: .012, meta: Infinity },
];

export const ZUMBIS = {
  comum: { vida: 30, vel: 2.2, raio: .38, custo: 1, escala: 1, pontos: 1 },
  corredor: { vida: 20, vel: 5.4, raio: .36, custo: 1, escala: .96, pontos: 1 },
  blindado: { vida: 220, vel: 1.4, raio: .6, custo: 4, escala: 1.32, pontos: 5 },
};

// Trecho de teste: d = distância na ponte (m).
// portao: [esquerda, direita]; +n soma, -n tira, *n multiplica, /n divide, a = arma melhor, c = cadência, t = portão de tiro
export const TRECHO = {
  nome: 'Trecho 1', cenario: 'Pôr do sol', inicio: 3, comprimento: 470,
  portoes: [
    { d: 24, e: '+3', f: '+5' },
    { d: 66, e: '*2', f: '+6' },
    { d: 112, e: 'a', f: '+8' },
    { d: 164, e: 't-10', f: '+6' },
    { d: 218, e: '*2', f: '+15' },
    { d: 272, e: '-8', f: 'c' },
    { d: 322, e: 'a', f: '+12' },
    { d: 380, e: 't-20', f: '+10' },
  ],
  // [d, tipo, quantos, largura, profundidade]
  hordas: [
    [36, 'comum', 4, 5, 5], [54, 'comum', 6, 7, 6], [84, 'comum', 10, 8, 10], [100, 'comum', 12, 8, 8],
    [130, 'comum', 30, 8, 14], [148, 'corredor', 8, 6, 6], [182, 'comum', 41, 8, 14], [202, 'corredor', 16, 8, 8],
    [234, 'comum', 59, 9, 16], [254, 'blindado', 2, 5, 2], [260, 'comum', 24, 8, 6], [290, 'comum', 76, 9, 16], [306, 'corredor', 32, 9, 8],
    [338, 'comum', 95, 9, 18], [354, 'blindado', 5, 8, 4], [366, 'corredor', 30, 9, 8], [396, 'comum', 122, 9, 20], [416, 'corredor', 46, 9, 10], [430, 'blindado', 8, 9, 6], [440, 'comum', 108, 9, 18],
  ],
  barris: [[50, 2.5], [95, -3], [140, 3.2], [196, -2.2], [246, 2.8], [300, -3.4], [350, 0], [408, 3], [430, -2.6]],
};
