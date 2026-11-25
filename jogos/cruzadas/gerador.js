// Monta na hora as grades pequenas das partidas rápidas.
const Gerador = (() => {
  // ---------- Temas: { nome: [[palavra, dica], ...] } ----------
  function temas() {
    const r = {};
    for (const nome in BANCO) r[nome] = BANCO[nome].trim().split('\n').map(l => { const i = l.indexOf('|'); return [l.slice(0, i), l.slice(i + 1)]; });
    // Os temas das grades grandes também viram partidas rápidas.
    const varias = [];
    for (const g of GRADES) {
      const alvo = g.cat ? (r[g.cat] = r[g.cat] || []) : varias;
      for (const [, , , w, dica] of g.p) { if (!alvo.some(x => x[0] === w)) alvo.push([w, dica]); }
    }
    r['Variadas'] = varias;
    return r;
  }

  // ---------- Montagem ----------
  // Regra: duas letras só podem ser vizinhas quando pertencem à mesma palavra. Devolve o número de cruzamentos.
  function cabe(g, T, w, l, c, d) {
    const dl = d === 'v' ? 1 : 0, dc = 1 - dl, n = w.length;
    if (l + dl * (n - 1) >= T || c + dc * (n - 1) >= T) return 0;
    const em = (a, b) => a >= 0 && b >= 0 && a < T && b < T ? g[a * T + b] : null;
    if (em(l - dl, c - dc) || em(l + dl * n, c + dc * n)) return 0;
    let cruz = 0;
    for (let i = 0; i < n; i++) {
      const a = l + dl * i, b = c + dc * i, x = g[a * T + b];
      if (x) { if (x.ch !== w[i] || x[d]) return 0; cruz++; }
      else if (em(a - dc, b - dl) || em(a + dc, b + dl)) return 0;
    }
    return cruz;
  }
  function por(g, T, w, l, c, d) {
    for (let i = 0; i < w.length; i++) { const x = (l + (d === 'v' ? i : 0)) * T + c + (d === 'h' ? i : 0); g[x] = { ...(g[x] || { ch: w[i] }), [d]: true }; }
  }
  function tentar(banco, T, meta) {
    const g = Array(T * T).fill(null), p = [], usadas = new Set();
    const coloca = (x, l, c, d) => { por(g, T, x[0], l, c, d); usadas.add(x[0]); p.push([l, c, d, x[0], x[1]]); };
    const grandes = banco.filter(x => x[0].length >= T - 2), prim = (grandes.length ? grandes : banco)[Math.floor(Math.random() * (grandes.length || banco.length))];
    coloca(prim, Math.floor(T / 2), Math.floor((T - prim[0].length) / 2), 'h');
    let cruzes = 0;
    while (p.length < meta) {
      let m = null;
      for (const x of banco) {
        const w = x[0]; if (usadas.has(w)) continue;
        // Não repete "irmãs" (REDE e REDES) na mesma grade.
        let irma = false; for (const u of usadas) if (u.includes(w) || w.includes(u)) { irma = true; break; }
        if (irma) continue;
        for (const d of ['h', 'v']) for (let l = 0; l < T; l++) for (let c = 0; c < T; c++) {
          const k = cabe(g, T, w, l, c, d); if (!k || k === w.length) continue;
          const nota = k * 4 + Math.random() * 6;
          if (!m || nota > m.nota) m = { nota, k, x, l, c, d };
        }
      }
      if (!m) break;
      coloca(m.x, m.l, m.c, m.d); cruzes += m.k;
    }
    return { p, nota: p.length * 10 + cruzes };
  }
  // Corta as bordas vazias, para as casas ficarem maiores na tela.
  function aparar(p) {
    let l0 = 99, c0 = 99, l1 = 0, c1 = 0;
    for (const [l, c, d, w] of p) { l0 = Math.min(l0, l); c0 = Math.min(c0, c); l1 = Math.max(l1, l + (d === 'v' ? w.length - 1 : 0)); c1 = Math.max(c1, c + (d === 'h' ? w.length - 1 : 0)); }
    const h = l1 - l0 + 1, w = c1 - c0 + 1, t = Math.max(h, w), fl = Math.floor((t - h) / 2) - l0, fc = Math.floor((t - w) / 2) - c0;
    return { t, p: p.map(x => [x[0] + fl, x[1] + fc, x[2], x[3], x[4]]) };
  }
  // banco: [[palavra, dica]]; T: lado máximo; meta: quantas palavras; evitar: usadas há pouco.
  function nova(banco, T, meta, evitar) {
    const cabem = banco.filter(x => x[0].length >= 3 && x[0].length <= T);
    let uso = cabem.filter(x => !evitar.has(x[0])), m = null;
    if (uso.length < meta * 2) uso = cabem;
    for (let k = 0; k < 60; k++) {
      const r = tentar(k < 40 || (m && m.p.length >= meta) ? uso : cabem, T, meta);
      if (!m || r.nota > m.nota) m = r;
      if (k >= 12 && m.p.length >= meta) break;
    }
    return aparar(m.p);
  }
  return { temas, nova };
})();
