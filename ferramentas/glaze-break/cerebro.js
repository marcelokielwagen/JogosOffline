// Glaze Break: o "cérebro" do robô de teste. Decide onde pôr a barra e quando lançar.
// Usado no Node (calibrar.mjs) e dentro do navegador (jogar.mjs), que depois move a barra com toque simulado.
// mira(P, N) -> { x: onde a barra deve ficar, lancar: true/false, t: segundos até a bola chegar }
function mira(P, N, o) {
  o = o || {};
  const rq = P.rq, topo = N.PY - N.PH / 2 - N.R, livres = P.bolas.filter(b => !b.presa);
  // para onde mandar a bola: de preferência azulejos da mesma cor (ela atravessa), jarros, e os mais baixos
  const alvo = (b, L) => {
    let best = null, bs = -1e9;
    for (const t of P.cel) if (t && t.vivo && t.k !== 'f') {
      const cx = t.x + N.CW / 2, cy = t.y + N.CH / 2, mesma = b.cor >= 0 && t.cor === b.cor && (t.k === 'a' || t.k === 'j');
      const sc = cy - Math.abs(cx - L) * .45 + (mesma ? 22 : 0) + (t.k === 'j' ? 8 : 0);
      if (sc > bs) { bs = sc; best = [cx, cy]; }
    }
    return best;
  };
  if (!livres.length) { const a = alvo({ cor: -1 }, rq.x); return { x: a ? Math.max(rq.w / 2, Math.min(N.W - rq.w / 2, a[0] + (a[0] < N.W / 2 ? -12 : 12))) : N.W / 2, lancar: true, t: 9 }; }
  let b = null, tb = 1e9;
  for (const q of livres) if (q.dy > 0) { const t = (topo - q.y) / (q.dy * q.v); if (t < tb) { tb = t; b = q; } }
  // item caindo e nenhuma bola com pressa: vai buscar
  for (const it of P.itens) { const ti = (N.PY - it.y) / it.vy; if (ti > 0 && ti < tb - .45 && Math.abs(it.x - rq.x) < 70) return { x: it.x, lancar: false, t: ti }; }
  if (!b) { const q = livres.reduce((a, c) => c.y > a.y ? c : a); return { x: q.x, lancar: false, t: 9 }; }
  const L = N.prever(b, topo) + (o.erro || 0), a = alvo(b, L); let off = 0;
  if (a) off = Math.max(-.72, Math.min(.72, Math.atan2(a[0] - L, N.PY - a[1]) / 1.08 + (o.erroMira || 0) + (o.vies || 0)));
  return { x: L - off * (rq.w / 2 + N.R * .5), lancar: false, t: tb };
}
if (typeof module !== 'undefined') module.exports = mira;
