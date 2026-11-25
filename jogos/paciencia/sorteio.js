// Sorteio das cartas da Paciência. Nos níveis fáceis, só aceita um baralho que um jogador automático
// simples consegue vencer (sem ver as cartas viradas e sem desfazer): se ele vence, dá para vencer.
const Sorteio = (() => {
  const naipe = c => Math.floor(c / 13), valor = c => c % 13, vermelha = c => naipe(c) % 2 === 1;
  function embaralhar(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ajuda: até que valor as cartas baixas ficam à mão (0 = nenhuma, 2 = Ases e 2, 3 = Ases, 2 e 3).
  function repartir(ajuda, rnd) {
    const b = embaralhar(Array.from({ length: 52 }, (_, i) => i), rnd);
    if (ajuda) {
      // Lugares à mão: carta de cima de cada coluna e as primeiras do baralho.
      const bons = embaralhar([0, 2, 5, 9, 14, 20, 27, 44, 45, 46, 47, 48, 49, 50, 51], rnd);
      const chave = b.filter(c => valor(c) < ajuda).sort((x, y) => valor(x) - valor(y));
      chave.forEach((c, k) => { const de = b.indexOf(c), para = bons[k]; [b[de], b[para]] = [b[para], b[de]]; });
    }
    const c = []; for (let i = 0; i < 7; i++) c.push({ k: b.splice(0, i + 1), d: i });
    return { s: b, c };
  }

  // Joga sozinho. Devolve quantas voltas no baralho precisou, ou -1 se não venceu.
  function jogar({ s, c }, vira, maxVoltas) {
    s = s.slice(); c = c.map(x => ({ k: x.k.slice(), d: x.d }));
    let w = [], voltas = 0, mexeu = false;
    const f = [0, 0, 0, 0], topo = a => a[a.length - 1];
    const sobe = x => x != null && f[naipe(x)] === valor(x);
    const segura = x => sobe(x) && [0, 1, 2, 3].every(n => (n % 2 === 1) === vermelha(x) || f[n] >= valor(x) - 1);
    const encaixa = (baixo, cima) => vermelha(baixo) !== vermelha(cima) && valor(baixo) === valor(cima) + 1;
    const cabe = (x, j) => c[j].k.length ? encaixa(topo(c[j].k), x) : valor(x) === 12;
    const vire = col => { if (col.d > 0 && col.k.length === col.d) col.d--; };
    for (let passo = 0; passo < 2000; passo++) {
      if (f[0] + f[1] + f[2] + f[3] === 52) return voltas;
      let fez = false;
      // 1. Subir o que não faz falta, ou o que vira uma carta escondida.
      for (const col of c) { const x = topo(col.k); if (sobe(x) && (segura(x) || (col.k.length - 1 === col.d && col.d > 0))) { col.k.pop(); f[naipe(x)]++; vire(col); fez = true; break; } }
      if (!fez && segura(topo(w))) { f[naipe(w.pop())]++; fez = true; }
      // 2. Mover uma sequência que descobre carta (começa pela coluna com mais cartas escondidas).
      if (!fez) {
        const ord = [0, 1, 2, 3, 4, 5, 6].filter(j => c[j].d > 0).sort((a, b) => c[b].d - c[a].d);
        fora: for (const j of ord) {
          const x = c[j].k[c[j].d];
          for (let q = 0; q < 7; q++) if (q !== j && cabe(x, q)) { c[q].k.push(...c[j].k.splice(c[j].d)); vire(c[j]); fez = true; break fora; }
        }
      }
      // 3. Usar a carta do descarte.
      if (!fez && w.length) { const x = topo(w); for (let q = 0; q < 7; q++) if (cabe(x, q)) { c[q].k.push(w.pop()); fez = true; break; } }
      // 4. Subir qualquer carta.
      if (!fez && sobe(topo(w))) { f[naipe(w.pop())]++; fez = true; }
      if (!fez) for (const col of c) { const x = topo(col.k); if (sobe(x)) { col.k.pop(); f[naipe(x)]++; vire(col); fez = true; break; } }
      if (fez) { mexeu = true; continue; }
      // 5. Comprar.
      if (s.length) { for (let n = 0; n < vira && s.length; n++) w.push(s.pop()); continue; }
      if (!w.length || !mexeu || voltas + 1 >= maxVoltas) return -1;
      s = w.reverse(); w = []; voltas++; mexeu = false;
    }
    return -1;
  }

  // n: { ajuda, vira, testado: máximo de passadas do jogador automático (0 = sem teste) }
  function novo(n, rnd = Math.random) {
    let d;
    for (let t = 0; t < 600; t++) { d = repartir(n.ajuda, rnd); if (!n.testado || jogar(d, n.vira, n.testado) >= 0) break; }
    return d;
  }
  return { novo, repartir, jogar };
})();
if (typeof module !== 'undefined') module.exports = Sorteio;
