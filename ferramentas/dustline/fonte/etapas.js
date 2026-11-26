/* As 5 pistas. Cada uma: cores da luz e do chão, forma dos morros e da estrada, tipo de árvore, clima e música.
   Tons naturais (nada de azul-escuro). A estrada vai de um lado ao outro do mapa, sem cruzar consigo mesma. */
const ETAPAS = [
  { id: 'pinhal', nome: 'Pinhal na névoa', semente: 3,
    ceu: ['#a9c6c0', '#dfe6d9', '#f1e3cf'], nevoa: '#e8e1d2', perto: 22, longe: 190, sol: '#fff1dc', solAlt: .26, solDir: -.7, luz: 1.05, ceuLuz: '#e3ece4', chaoLuz: '#8a8a62', amb: .62, tinta: '#5b4a3a',
    chao: ['#7f9a55', '#93a95c', '#a9b267', '#6f8a4e'], terra: '#b39672', pedra: '#9c968a', estrada: ['#a99a6e', '#b49474', '#c2a37d', '#a88b68'],
    morro: { amp: 40, freq: .006, det: 5 }, curva: { amp: 46, freq: .021, ruido: 22 }, arvore: 'pinheiro', densidade: .42, clima: 'nevoa', musica: 'manha', grip: 1, poeira: '#d9c4a0', marca: '#6e5a42' },
  { id: 'serra', nome: 'Serra ao entardecer', semente: 11,
    ceu: ['#8b7a96', '#e4a98c', '#f4c08c'], nevoa: '#e9b38f', perto: 70, longe: 430, sol: '#ffc98a', solAlt: .1, solDir: 2.2, luz: 1.15, ceuLuz: '#f2c8a6', chaoLuz: '#6e5a4a', amb: .78, tinta: '#5a3a33',
    chao: ['#a39a5c', '#b5a463', '#c2ad6c', '#8f8a52'], terra: '#c09068', pedra: '#a8907c', estrada: ['#b18f6a', '#bf9670', '#cfa57c', '#a8805e'],
    morro: { amp: 60, freq: .005, det: 6 }, curva: { amp: 50, freq: .026, ruido: 14 }, arvore: 'pinheiro', densidade: .58, clima: 'poeira', musica: 'tarde', grip: 1, poeira: '#e2b88f', marca: '#7a5640' },
  { id: 'cerejeiras', nome: 'Vale das cerejeiras', semente: 23,
    ceu: ['#b9d2c9', '#eee6dc', '#f7e6dc'], nevoa: '#f2e4dc', perto: 40, longe: 300, sol: '#fff6ea', solAlt: .4, solDir: .9, luz: 1.0, ceuLuz: '#eef2ea', chaoLuz: '#94a070', amb: .7, tinta: '#5e4448',
    chao: ['#9bb86a', '#acc274', '#bccb80', '#8eae63'], terra: '#c3a184', pedra: '#b0a69c', estrada: ['#b9a184', '#c6a98a', '#d3b796', '#b49678'],
    morro: { amp: 26, freq: .007, det: 4 }, curva: { amp: 38, freq: .024, ruido: 18 }, arvore: 'cerejeira', densidade: .5, clima: 'petalas', musica: 'primavera', grip: 1, poeira: '#e6d2bb', marca: '#7c6250' },
  { id: 'neve', nome: 'Neve no planalto', semente: 31,
    ceu: ['#b7b3c2', '#e2dfe2', '#f0ece6'], nevoa: '#ebe8e6', perto: 18, longe: 170, sol: '#fff2e2', solAlt: .2, solDir: -1.6, luz: 1.0, ceuLuz: '#f1eff0', chaoLuz: '#b8b4b0', amb: .78, tinta: '#4e4a54',
    chao: ['#f3f1ee', '#e9e7e6', '#fbfaf8', '#e2e0e0'], terra: '#d8d2ca', pedra: '#a7a3a0', estrada: ['#e2ddd6', '#d6cdc2', '#cdbfae', '#b4a28e'],
    morro: { amp: 34, freq: .0065, det: 4 }, curva: { amp: 50, freq: .026, ruido: 20 }, arvore: 'pinheiroNeve', densidade: .45, clima: 'neve', musica: 'neve', grip: .72, poeira: '#f6f4f2', marca: '#9a8f86' },
  { id: 'outono', nome: 'Outono junto ao lago', semente: 47,
    ceu: ['#a7b3a0', '#ead7bc', '#f3d3a8'], nevoa: '#ecd6b8', perto: 50, longe: 340, sol: '#ffdca6', solAlt: .16, solDir: 2.8, luz: 1.1, ceuLuz: '#f2dcbc', chaoLuz: '#7a6a4c', amb: .72, tinta: '#5b3e2e',
    chao: ['#9a9a58', '#ab9f5c', '#b9a463', '#8c9052'], terra: '#b98e64', pedra: '#a39582', estrada: ['#ab8d68', '#b8966f', '#c8a57c', '#a07f5c'],
    morro: { amp: 34, freq: .0058, det: 5 }, curva: { amp: 44, freq: .022, ruido: 18 }, arvore: 'outono', densidade: .5, clima: 'folhas', musica: 'outono', grip: .96, poeira: '#dcc09a', marca: '#6e523c', lago: -6 }
];
