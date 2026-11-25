// Cópia automática do núcleo de jogos/zen/index.html (feita por loop-fases.mjs). Não editar aqui.
window.Zen = {
  CHAVE: 'zen.v1',                 // onde o progresso fica salvo (localStorage)
  FASES: 50,
  DIFS: ['facil', 'medio', 'dificil'],
  NOMES: { loop: 'Loop Zen', okay: 'Ricochet Zen', facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' },
  menosMovimento: false,           // opção do jogador em "Som e aparência"
  jogos: {},                       // loop_game.js e okay_game.js se registram aqui

  /* Transforma um texto em número de 32 bits (FNV-1a). "loop/medio/17" dá sempre o mesmo número. */
  semente(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
    h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13;
    return h >>> 0;
  },
  /* Sorteio que se repete igual em qualquer aparelho (mulberry32). */
  sorteio(semente) {
    let a = semente >>> 0;
    const r = () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.entre = (min, max) => min + r() * (max - min);
    r.inteiro = (min, max) => min + Math.floor(r() * (max - min + 1));
    r.um = lista => lista[Math.floor(r() * lista.length)];
    r.chance = p => r() < p;
    return r;
  },
  /* Sorteio próprio de cada fase. "tentativa" só muda se o gerador recusar um desenho. */
  daFase(jogo, dif, fase, tentativa = 0) {
    return this.sorteio(this.semente(jogo + '/' + dif + '/' + fase + '/' + tentativa));
  }
};
