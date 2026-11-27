/* Nível 2 — Praia Movimentada: ilustração densa de 3600 × 2250 pintada em Canvas 2D.
   Camadas: fundo (céu, mar, areia, gente, guarda-sóis…) → objetos escondidos → frente (o que tampa um pouco).
   Por cima, animado: brilho e ondas do mar, espuma na beira, banhistas boiando, bandeiras e gaivotas. */

// pessoa desenhada em traço redondo; (x, y) = chão entre os pés; s = escala da perspectiva
function pessoa(g, x, y, s, o) {
  const k = (o.crianca ? .7 : 1) * s, pele = o.pele, roupa = o.roupa, l = o.lado || 1;
  g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
  const sombra = (w) => { g.fillStyle = 'rgba(90,60,30,.22)'; g.beginPath(); g.ellipse(0, 0, w * k, w * .28 * k, 0, 0, 7); g.fill(); };
  const linha = (cor, w, ...p) => { g.strokeStyle = cor; g.lineWidth = w * k; g.beginPath(); g.moveTo(p[0] * k, p[1] * k); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i] * k, p[i + 1] * k); g.stroke(); };
  const cabeca = (cx, cy) => {
    g.fillStyle = pele; g.beginPath(); g.arc(cx * k, cy * k, 12 * k, 0, 7); g.fill();
    g.fillStyle = o.cabelo; g.beginPath(); if (o.longo) { g.ellipse(cx * k - l * 2 * k, cy * k + 2 * k, 13 * k, 17 * k, 0, Math.PI * .95, Math.PI * 2.05); } else g.arc(cx * k, cy * k - 2 * k, 12.5 * k, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    if (o.chapeu) { g.fillStyle = o.chapeu; g.beginPath(); g.ellipse(cx * k, cy * k - 8 * k, 20 * k, 5 * k, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx * k, cy * k - 12 * k, 10 * k, 8 * k, 0, Math.PI, 0); g.fill(); }
    if (o.oculos) { g.fillStyle = '#1a1a1a'; g.fillRect((cx + l * 1) * k, (cy - 2) * k, 9 * k, 4 * k); }
  };
  if (o.pose === 'pe' || o.pose === 'anda') {
    sombra(22);
    const a = o.pose === 'anda' ? 9 : 4;
    linha(pele, 9, -a, 0, -3, -68); linha(pele, 9, a, 0, 3, -68);
    g.fillStyle = roupa; g.beginPath(); g.roundRect(-11 * k, -78 * k, 22 * k, o.short ? 26 * k : 14 * k, 4 * k); g.fill();
    g.fillStyle = pele; g.beginPath(); g.roundRect(-12 * k, -118 * k, 24 * k, 44 * k, 9 * k); g.fill();
    if (o.top) { g.fillStyle = o.top; g.beginPath(); g.roundRect(-12 * k, -110 * k, 24 * k, o.maio ? 40 * k : 11 * k, 4 * k); g.fill(); }
    const b = o.pose === 'anda' ? 8 : 0;
    linha(pele, 7, -11, -112, -15 - b, -78); linha(pele, 7, 11, -112, 15 + b, -80);
    if (o.segura) { g.fillStyle = o.segura; g.beginPath(); g.arc((15 + b) * k, -78 * k, 9 * k, 0, 7); g.fill(); }
    cabeca(0, -131);
  } else if (o.pose === 'sentada') {
    sombra(28);
    linha(pele, 9, -6, -10, 22 * l, -8, 30 * l, 0); linha(pele, 9, 6, -12, 26 * l, -14, 34 * l, -4);
    g.fillStyle = roupa; g.beginPath(); g.roundRect(-12 * k, -24 * k, 24 * k, 14 * k, 4 * k); g.fill();
    g.fillStyle = pele; g.beginPath(); g.roundRect(-12 * k, -64 * k, 24 * k, 44 * k, 9 * k); g.fill();
    if (o.top) { g.fillStyle = o.top; g.beginPath(); g.roundRect(-12 * k, -56 * k, 24 * k, o.maio ? 38 * k : 11 * k, 4 * k); g.fill(); }
    linha(pele, 7, -10, -58, -20 * l, -26, -24 * l, -14); linha(pele, 7, 10, -58, 18 * l, -30);
    if (o.livro) { g.fillStyle = o.livro; g.fillRect(12 * l * k, -40 * k, 16 * l * k, 12 * k); }
    cabeca(0, -77);
  } else if (o.pose === 'deitada') {
    // deitada de costas, vista de cima em perspectiva (achatada)
    g.scale(1, .55);
    linha(pele, 9, 34 * l, 2, 80 * l, 6); linha(pele, 9, 34 * l, -6, 80 * l, -10);
    g.fillStyle = roupa; g.beginPath(); g.roundRect((l > 0 ? 18 : -36) * k, -12 * k, 18 * k, 22 * k, 5 * k); g.fill();
    g.fillStyle = pele; g.beginPath(); g.roundRect((l > 0 ? -28 : -18) * k, -14 * k, 46 * k, 26 * k, 10 * k); g.fill();
    if (o.top) { g.fillStyle = o.top; g.fillRect((l > 0 ? -14 : 0) * k, -13 * k, 10 * k, 24 * k); }
    linha(pele, 7, -20 * l, -12, -44 * l, -22); linha(pele, 7, -20 * l, 10, -40 * l, 18);
    g.fillStyle = pele; g.beginPath(); g.arc(-40 * l * k, 0, 12 * k, 0, 7); g.fill();
    g.fillStyle = o.cabelo; g.beginPath(); g.arc(-46 * l * k, 0, 11 * k, 0, 7); g.fill();
    if (o.oculos) { g.fillStyle = '#1a1a1a'; g.fillRect(-38 * l * k - 4 * k, -7 * k, 4 * k, 14 * k); }
  } else if (o.pose === 'agacha') {
    sombra(20);
    linha(pele, 9, -8, 0, -12, -26, -2, -40); linha(pele, 9, 8, 0, 14, -24, 4, -40);
    g.fillStyle = roupa; g.beginPath(); g.roundRect(-11 * k, -48 * k, 22 * k, 13 * k, 4 * k); g.fill();
    g.fillStyle = pele; g.beginPath(); g.roundRect(-11 * k, -86 * k, 22 * k, 42 * k, 9 * k); g.fill();
    linha(pele, 7, 9, -80, 24 * l, -50, 30 * l, -30); linha(pele, 7, -9, -80, -14 * l, -50);
    cabeca(0, -98);
  }
  g.restore();
}

function criarPraia() {
  const W = 3600, H = 2250, HZ = 640, PI = Math.PI;
  Tex.sorte(9001); const r = Tex.r, ent = Tex.ent, esco = a => a[(r() * a.length) | 0];
  const costa = x => 1060 + x * .03 + Math.sin(x * .004) * 28 + Math.sin(x * .011) * 9;
  const esc = y => .3 + (y - HZ) / (H - HZ) * 1.0;
  const PELES = ['#f1c7a5', '#e0ac85', '#c68a5e', '#9a6440', '#6e4429', '#f6d5bd', '#d9a074'];
  const CABELOS = ['#2a1a10', '#4a2c18', '#8a5a2a', '#d8b060', '#1a1410', '#b04a22', '#e8e0d0'];
  const ROUPAS = ['#e0402a', '#f2b632', '#1f9a8a', '#ef7a2a', '#e85a8a', '#f4f0e6', '#3a8a3a', '#7a3a9a', '#2a6ab0', '#d8282a', '#ffd84a', '#1aa0c0'];
  const sol = [2900, 170];

  /* ---------- objetos escondidos ---------- */
  const itens = [];
  const item = (id, nome, charada, x, y, raio, desenho, o = {}) => { const it = Object.assign({ id, nome, charada, x, y, raio, desenho, achado: false }, o); itens.push(it); return it; };
  const lt = (g, cor, w, ...p) => { g.strokeStyle = cor; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  item('oculos', 'Óculos de sol', 'Duas luas escuras para dias de sol.', 1510, 1622, 26, g => {
    g.fillStyle = '#1b1b22'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 11, 0, 10, 7, 0, 0, 7); g.fill(); }
    lt(g, '#1b1b22', 3, -2, -2, 2, -2); lt(g, '#1b1b22', 2.5, -21, -2, -27, -9); lt(g, '#1b1b22', 2.5, 21, -2, 27, -9);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-14, -2, 3, 2, -.5, 0, 7); g.ellipse(8, -2, 3, 2, -.5, 0, 7); g.fill();
  }, { giro: .25 });
  item('relogio', 'Relógio de pulso', 'Marca as horas e mora no braço.', 2655, 1885, 24, g => {
    g.fillStyle = '#6a4a2a'; g.fillRect(-26, -5, 52, 10);
    g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
    lt(g, '#222', 1.5, 0, 0, 0, -6); lt(g, '#222', 1.5, 0, 0, 4, 2);
  }, { giro: -.4, depois: g => { g.fillStyle = 'rgba(236,211,162,.92)'; g.beginPath(); g.ellipse(2672, 1893, 22, 9, -.4, 0, 7); g.fill(); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < .5 ? '200,170,120' : '250,235,200'},.8)`; g.fillRect(2650 + r() * 44, 1885 + r() * 16, 2, 2); } } });
  item('chave', 'Chave do carro', 'Liga o motor e vive perdida.', 985, 1728, 26, g => {
    g.fillStyle = '#2a2a2e'; g.beginPath(); g.roundRect(-16, -9, 18, 18, 5); g.fill();
    g.fillStyle = '#b8bcc0'; g.fillRect(2, -3, 18, 6); g.fillRect(14, 3, 3, 3); g.fillRect(9, 3, 3, 2);
    g.strokeStyle = '#c0c4c8'; g.lineWidth = 2; g.beginPath(); g.arc(-20, -8, 6, 0, 7); g.stroke();
    g.fillStyle = '#f07a1a'; g.beginPath(); g.roundRect(-34, -22, 12, 18, 3); g.fill();
  }, { giro: .6 });
  item('estrela', 'Estrela-do-mar', 'Tem cinco braços e mora no mar.', 2052, 1452, 26, g => {
    g.fillStyle = '#e8743a'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? 9 : 24; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,220,180,.7)'; for (let i = 0; i < 14; i++) { const a = r() * 6.3, d = r() * 14; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 1.4, 0, 7); g.fill(); }
  }, { giro: .3 });
  item('garrafa', 'Garrafa com mensagem', 'Viaja pelo mar levando um recado.', 1250, costa(1250) + 6, 32, g => {
    g.fillStyle = 'rgba(120,170,120,.85)'; g.beginPath(); g.roundRect(-30, -9, 44, 18, 8); g.fill(); g.fillRect(12, -5, 16, 10);
    g.fillStyle = '#8a5a2a'; g.fillRect(26, -5, 6, 10);
    g.fillStyle = '#efe2c0'; g.beginPath(); g.roundRect(-22, -5, 26, 10, 4); g.fill(); lt(g, '#c86a3a', 1, -18, 0, 0, 0);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-26, -7, 30, 3);
  }, { giro: -.15 });
  item('pa', 'Pazinha vermelha', 'Cava buracos e enche baldes.', 1808, 1945, 32, g => {
    g.fillStyle = '#d8282a'; g.beginPath(); g.moveTo(-10, 4); g.lineTo(10, 4); g.lineTo(8, 26); g.quadraticCurveTo(0, 34, -8, 26); g.closePath(); g.fill();
    g.fillRect(-2.5, -28, 5, 34); g.beginPath(); g.roundRect(-8, -34, 16, 8, 3); g.fill();
  }, { giro: .35 });
  item('bone', 'Boné', 'Tem aba, mas não voa.', 3058, 1602, 26, g => {
    g.fillStyle = '#2f8a9a'; g.beginPath(); g.ellipse(0, 0, 18, 13, 0, PI, 0); g.fill(); g.fillRect(-18, -1, 36, 3);
    g.fillStyle = '#25707e'; g.beginPath(); g.ellipse(18, 1, 14, 5, .1, 0, 7); g.fill();
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(-2, -6, 3, 0, 7); g.fill();
  }, { giro: -.1 });
  item('camera', 'Máquina fotográfica', 'Guarda o momento num clique.', 622, 1903, 26, g => {
    g.fillStyle = '#26262a'; g.beginPath(); g.roundRect(-22, -14, 44, 28, 5); g.fill(); g.fillRect(-10, -19, 14, 6);
    g.fillStyle = '#4a4a50'; g.beginPath(); g.arc(3, 1, 11, 0, 7); g.fill(); g.fillStyle = '#1a2a3a'; g.beginPath(); g.arc(3, 1, 7, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(0, -2, 2.5, 0, 7); g.fill(); g.fillStyle = '#d8d0b8'; g.fillRect(-18, -11, 6, 4);
  }, { giro: -.2 });
  item('frisbee', 'Frisbee', 'Disco que voa quando é jogado.', 2602, 1176, 24, g => {
    g.fillStyle = '#f2b632'; g.beginPath(); g.ellipse(0, 0, 22, 9, 0, 0, 7); g.fill();
    g.strokeStyle = '#d8962a'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -1, 14, 5, 0, 0, 7); g.stroke();
  }, { giro: .1 });
  item('pipa', 'Pipa', 'Sobe com o vento presa num fio.', 268, 742, 40, g => {
    g.fillStyle = '#9ac23a'; g.beginPath(); g.moveTo(0, -36); g.lineTo(24, 0); g.lineTo(0, 30); g.lineTo(-24, 0); g.closePath(); g.fill();
    g.fillStyle = '#f2d23a'; g.beginPath(); g.moveTo(0, -36); g.lineTo(24, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, 30); g.lineTo(-24, 0); g.lineTo(0, 0); g.closePath(); g.fill();
    lt(g, '#5a3a1a', 1.5, 0, -36, 0, 30); lt(g, '#5a3a1a', 1.5, -24, 0, 24, 0);
    g.strokeStyle = '#e04a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(10, 44, -10, 54, 4, 70); g.stroke();
  }, { giro: .5, raio: 40 });
  item('picole', 'Picolé mordido', 'Gelado, de palito, alguém já provou.', 548, 1552, 24, g => {
    g.fillStyle = '#d8b880'; g.fillRect(-2.5, 8, 5, 18);
    g.fillStyle = '#e85a8a'; g.beginPath(); g.roundRect(-10, -22, 20, 32, 9); g.fill();
    g.fillStyle = '#f6b8cc'; g.fillRect(-10, -6, 20, 5);
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(9, -18, 6, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
  }, { giro: 1.2, depois: g => { g.fillStyle = 'rgba(232,90,138,.35)'; g.beginPath(); g.ellipse(560, 1566, 18, 6, 0, 0, 7); g.fill(); } });
  // pato de borracha: boia no mar entre os banhistas (desenhado animado)
  const pato = item('pato', 'Pato de borracha', 'Amarelo, boia e não sabe nadar.', 2215, 905, 22, g => {
    g.fillStyle = '#ffd23a'; g.beginPath(); g.ellipse(0, 4, 18, 11, 0, 0, 7); g.fill(); g.beginPath(); g.arc(9, -8, 9, 0, 7); g.fill();
    g.fillStyle = '#f07a1a'; g.beginPath(); g.ellipse(19, -7, 6, 3, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(12, -10, 1.8, 0, 7); g.fill();
    g.fillStyle = '#f2b81a'; g.beginPath(); g.ellipse(-4, 2, 8, 5, -.3, 0, 7); g.fill();
  }, { animado: true });
  const reservas = itens.map(i => [i.x, i.y, i.raio + 40]);
  const livre = (x, y, d) => reservas.every(([a, b, rr]) => Math.hypot(x - a, (y - b) * 1.6) > rr + d);

  /* ---------- peças do cenário ---------- */
  function guardaSol(g, x, y, s, c1, c2, giro = 0) {
    const hgt = 175 * s, w = 105 * s;
    g.fillStyle = 'rgba(90,60,30,.2)'; g.beginPath(); g.ellipse(x + 30 * s, y + 6 * s, w * .95, w * .3, 0, 0, 7); g.fill();
    lt(g, '#d8d0c0', 4 * s, x, y, x + giro * 20 * s, y - hgt);
    const cx = x + giro * 20 * s, cy = y - hgt, n = 8;
    for (let i = 0; i < n; i++) {
      const a0 = PI + i * PI / n, a1 = PI + (i + 1) * PI / n;
      g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.moveTo(cx, cy - 22 * s);
      g.lineTo(cx + Math.cos(a0) * w, cy + Math.sin(a0) * w * .32 + 14 * s);
      g.quadraticCurveTo(cx + Math.cos((a0 + a1) / 2) * w * 1.04, cy + Math.sin((a0 + a1) / 2) * w * .32 + 24 * s, cx + Math.cos(a1) * w, cy + Math.sin(a1) * w * .32 + 14 * s);
      g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(cx - w, cy + 14 * s); for (let i = 0; i <= n; i++) { const a = PI + i * PI / n; g.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w * .32 + 14 * s); } g.lineTo(cx + w, cy + 22 * s); g.quadraticCurveTo(cx, cy + 40 * s, cx - w, cy + 22 * s); g.fill();
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(cx, cy - 22 * s, 4 * s, 0, 7); g.fill();
  }
  function toalha(g, x, y, s, tipo, c1, c2, giro = 0) {
    const w = 150 * s, h = 70 * s;
    g.save(); g.translate(x, y); g.rotate(giro); g.scale(1, .62);
    g.fillStyle = 'rgba(90,60,30,.18)'; g.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
    g.fillStyle = c1; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = c2;
    if (tipo === 'listra') for (let i = 0; i < 7; i++) g.fillRect(-w / 2 + i * w / 7, -h / 2, w / 14, h);
    else if (tipo === 'xadrez') { g.globalAlpha = .55; for (let i = 0; i < 8; i++) { g.fillRect(-w / 2 + i * w / 8, -h / 2, w / 16, h); } for (let j = 0; j < 4; j++) g.fillRect(-w / 2, -h / 2 + j * h / 4, w, h / 8); g.globalAlpha = 1; }
    else if (tipo === 'borda') { g.fillRect(-w / 2, -h / 2, w, h * .12); g.fillRect(-w / 2, h / 2 - h * .12, w, h * .12); }
    else if (tipo === 'bolinha') for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(-w / 2 + (i % 6 + .5) * w / 6, -h / 2 + ((i / 6 | 0) + .5) * h / 3, 5 * s, 0, 7); g.fill(); }
    else if (tipo === 'estrelas') for (let i = 0; i < 10; i++) { const cx = -w / 2 + (i % 5 + .5) * w / 5, cy = -h / 2 + ((i / 5 | 0) + .5) * h / 2; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = (k % 2 ? 4 : 10) * s * 1.4; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 12; i++) g.fillRect(-w / 2 + i * w / 12, h / 2, 2, 6 * s);
    g.restore();
  }
  function cooler(g, x, y, s, cor) {
    g.fillStyle = 'rgba(90,60,30,.22)'; g.beginPath(); g.ellipse(x, y + 3, 40 * s, 10 * s, 0, 0, 7); g.fill();
    g.fillStyle = cor; g.beginPath(); g.roundRect(x - 32 * s, y - 46 * s, 64 * s, 46 * s, 6 * s); g.fill();
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.roundRect(x - 34 * s, y - 56 * s, 68 * s, 14 * s, 5 * s); g.fill();
    lt(g, '#888', 3 * s, x - 18 * s, y - 56 * s, x - 18 * s, y - 66 * s, x + 18 * s, y - 66 * s, x + 18 * s, y - 56 * s);
  }
  function cadeira(g, x, y, s, c1, c2) {
    lt(g, '#c8c0b0', 3 * s, x - 30 * s, y, x - 22 * s, y - 34 * s, x + 30 * s, y - 34 * s); lt(g, '#c8c0b0', 3 * s, x + 30 * s, y, x + 22 * s, y - 34 * s);
    lt(g, '#c8c0b0', 3 * s, x - 22 * s, y - 34 * s, x - 36 * s, y - 92 * s); lt(g, '#c8c0b0', 3 * s, x + 22 * s, y - 34 * s, x + 8 * s, y - 92 * s);
    g.fillStyle = c1; g.beginPath(); g.moveTo(x - 22 * s, y - 34 * s); g.lineTo(x + 22 * s, y - 34 * s); g.lineTo(x + 8 * s, y - 90 * s); g.lineTo(x - 36 * s, y - 90 * s); g.closePath(); g.fill();
    g.fillStyle = c2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 22 * s + i * 15 * s, y - 34 * s); g.lineTo(x - 15 * s + i * 15 * s, y - 34 * s); g.lineTo(x - 29 * s + i * 15 * s, y - 90 * s); g.lineTo(x - 36 * s + i * 15 * s, y - 90 * s); g.closePath(); g.fill(); }
  }
  function prancha(g, x, y, s, c1, c2) {
    g.fillStyle = 'rgba(90,60,30,.2)'; g.beginPath(); g.ellipse(x + 14 * s, y + 2, 24 * s, 6 * s, 0, 0, 7); g.fill();
    g.save(); g.translate(x, y); g.rotate(ent(-.15, .15)); g.fillStyle = c1; g.beginPath(); g.ellipse(0, -80 * s, 18 * s, 85 * s, 0, 0, 7); g.fill();
    g.fillStyle = c2; g.fillRect(-3 * s, -160 * s, 6 * s, 150 * s); g.restore();
  }
  function castelo(g, x, y, s) {
    const a = '#e2c08a', b = '#c9a26a';
    g.fillStyle = 'rgba(120,90,50,.25)'; g.beginPath(); g.ellipse(x, y + 4, 80 * s, 18 * s, 0, 0, 7); g.fill();
    g.fillStyle = b; g.beginPath(); g.ellipse(x, y, 74 * s, 14 * s, 0, 0, 7); g.fill();
    for (const [dx, w, h] of [[-46, 30, 52], [46, 30, 52], [0, 44, 80]]) {
      g.fillStyle = a; g.fillRect(x + (dx - w / 2) * s, y - h * s, w * s, h * s);
      for (let i = 0; i < 3; i++) g.fillRect(x + (dx - w / 2 + i * w / 2.5) * s, y - (h + 8) * s, w / 5 * s, 9 * s);
      g.fillStyle = b; g.fillRect(x + (dx - w / 2) * s, y - h * s, 4 * s, h * s); g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(x + dx * s, y - h * .4 * s, 6 * s, PI, 0); g.fill();
    }
    lt(g, '#5a3a1a', 2 * s, x, y - 88 * s, x, y - 118 * s); g.fillStyle = '#d8282a'; g.beginPath(); g.moveTo(x, y - 118 * s); g.lineTo(x + 20 * s, y - 112 * s); g.lineTo(x, y - 106 * s); g.fill();
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(160,120,70,.4)'; g.fillRect(x + ent(-60, 60) * s, y - ent(0, 80) * s, 2, 2); }
  }
  function balde(g, x, y, s, cor) { g.fillStyle = cor; g.beginPath(); g.moveTo(x - 14 * s, y - 28 * s); g.lineTo(x + 14 * s, y - 28 * s); g.lineTo(x + 11 * s, y); g.lineTo(x - 11 * s, y); g.closePath(); g.fill(); g.strokeStyle = cor; g.lineWidth = 2 * s; g.beginPath(); g.arc(x, y - 28 * s, 13 * s, PI, 0); g.stroke(); }
  function bola(g, x, y, s) { const rr = 16 * s; for (let i = 0; i < 6; i++) { g.fillStyle = ['#e0402a', '#f4f0e6', '#2a6ab0', '#f4f0e6', '#f2b632', '#f4f0e6'][i]; g.beginPath(); g.moveTo(x, y - rr); g.arc(x, y - rr, rr, i * PI / 3, (i + 1) * PI / 3); g.fill(); } }
  function gaivota(g, x, y, s) { g.fillStyle = '#f4f2ee'; g.beginPath(); g.ellipse(x, y - 9 * s, 12 * s, 7 * s, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + 10 * s, y - 15 * s, 5 * s, 0, 7); g.fill(); g.fillStyle = '#8a9098'; g.beginPath(); g.ellipse(x - 3 * s, y - 11 * s, 9 * s, 4 * s, -.2, 0, 7); g.fill(); g.fillStyle = '#f2b632'; g.fillRect(x + 14 * s, y - 15 * s, 5 * s, 2 * s); lt(g, '#e0a050', 1.5 * s, x - 2 * s, y - 3 * s, x - 2 * s, y); lt(g, '#e0a050', 1.5 * s, x + 3 * s, y - 3 * s, x + 3 * s, y); }
  function bolsa(g, x, y, s, cor) { g.fillStyle = cor; g.beginPath(); g.moveTo(x - 30 * s, y - 40 * s); g.lineTo(x + 30 * s, y - 40 * s); g.lineTo(x + 26 * s, y); g.lineTo(x - 26 * s, y); g.closePath(); g.fill(); g.strokeStyle = cor; g.lineWidth = 4 * s; g.beginPath(); g.arc(x, y - 40 * s, 18 * s, PI, 0); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - 28 * s, y - 26 * s, 56 * s, 5 * s); }
  function coqueiro(g, x, y, s, curva) {
    const topo = [x + curva * 120 * s, y - 520 * s];
    g.strokeStyle = '#8a6a42'; g.lineWidth = 26 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + curva * 20 * s, y - 280 * s, topo[0], topo[1]); g.stroke();
    for (let t = .05; t < 1; t += .05) { const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + curva * 20 * s) + t * t * topo[0], py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y - 280 * s) + t * t * topo[1]; lt(g, '#6a4a2a', 3 * s, px - 13 * s, py, px + 13 * s, py + 4 * s); }
    for (let i = 0; i < 9; i++) {
      const a = -PI / 2 + (i - 4) * .42 + ent(-.1, .1), comp = ent(170, 230) * s, cx = topo[0] + Math.cos(a) * comp, cy = topo[1] + Math.sin(a) * comp * .5 + comp * .45;
      g.strokeStyle = i % 2 ? '#3f7a2a' : '#4f8a32'; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(topo[0], topo[1]); g.quadraticCurveTo((topo[0] + cx) / 2, topo[1] - 60 * s, cx, cy); g.stroke();
      for (let k = 1; k < 14; k++) { const t = k / 14, px = (1 - t) * (1 - t) * topo[0] + 2 * (1 - t) * t * (topo[0] + cx) / 2 + t * t * cx, py = (1 - t) * (1 - t) * topo[1] + 2 * (1 - t) * t * (topo[1] - 60 * s) + t * t * cy; lt(g, i % 2 ? '#3a6a24' : '#5a9a3a', 4 * s, px, py, px + Math.cos(a + 1.6) * 40 * s * (1 - t * .6), py + 34 * s * (1 - t * .5)); lt(g, i % 2 ? '#3a6a24' : '#5a9a3a', 4 * s, px, py, px + Math.cos(a - 1.6) * 40 * s * (1 - t * .6), py + 30 * s * (1 - t * .5)); }
    }
    for (let i = 0; i < 4; i++) { g.fillStyle = '#6a8a2a'; g.beginPath(); g.arc(topo[0] + ent(-20, 20) * s, topo[1] + ent(5, 25) * s, 14 * s, 0, 7); g.fill(); }
  }

  /* ---------- FUNDO ---------- */
  function fundo(g) {
    // céu
    let c = g.createLinearGradient(0, 0, 0, HZ); c.addColorStop(0, '#7fb6d6'); c.addColorStop(.7, '#cfe2e2'); c.addColorStop(1, '#f6e6c6'); g.fillStyle = c; g.fillRect(0, 0, W, HZ);
    c = g.createRadialGradient(sol[0], sol[1], 10, sol[0], sol[1], 520); c.addColorStop(0, 'rgba(255,250,225,1)'); c.addColorStop(.1, 'rgba(255,240,200,.9)'); c.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = c; g.fillRect(0, 0, W, HZ);
    for (let i = 0; i < 9; i++) { const x = ent(0, W), y = ent(60, 380), w = ent(160, 380); for (let k = 0; k < 8; k++) { const gr = g.createRadialGradient(x + k * w / 8, y + Math.sin(k) * 14, 0, x + k * w / 8, y + Math.sin(k) * 14, w * .22); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + k * w / 8 - w * .3, y - w * .3, w * .6, w * .6); } }
    // morro e farol à esquerda
    g.fillStyle = '#7a9a8a'; g.beginPath(); g.moveTo(0, HZ); g.bezierCurveTo(200, 470, 600, 470, 1150, HZ); g.fill();
    g.fillStyle = '#5f8270'; g.beginPath(); g.moveTo(0, HZ); g.bezierCurveTo(150, 520, 420, 520, 820, HZ); g.fill();
    for (let i = 0; i < 9; i++) { const x = 300 + i * 52, y = 545 + Math.abs(i - 4) * 9; g.fillStyle = ['#f0e6d6', '#e8c8a8', '#d8b0a0'][i % 3]; g.fillRect(x, y, 30, 22); g.fillStyle = '#b05a3a'; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 15, y - 12); g.lineTo(x + 33, y); g.fill(); }
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(690, 540); g.lineTo(730, 540); g.lineTo(722, 420); g.lineTo(698, 420); g.closePath(); g.fill();
    g.fillStyle = '#d8382a'; for (let i = 0; i < 3; i++) g.fillRect(694 + i * 1.6, 440 + i * 36, 32 - i * 3.2, 14);
    g.fillStyle = '#3a3a3a'; g.fillRect(694, 404, 32, 18); g.fillStyle = '#ffe9a0'; g.fillRect(700, 408, 20, 10);
    // ilhazinha à direita
    g.fillStyle = '#8aa898'; g.beginPath(); g.moveTo(2500, HZ); g.quadraticCurveTo(2620, 590, 2760, HZ); g.fill();
    // mar
    c = g.createLinearGradient(0, HZ, 0, 1180); c.addColorStop(0, '#5f9eb0'); c.addColorStop(.35, '#2f8aa2'); c.addColorStop(.8, '#3aa8b0'); c.addColorStop(1, '#6ccac0'); g.fillStyle = c; g.fillRect(0, HZ, W, 560);
    for (let i = 0; i < 260; i++) { const y = HZ + Math.pow(r(), 1.4) * 420, w = (20 + (y - HZ) * .35) * ent(.5, 1.5); g.strokeStyle = `rgba(${r() < .6 ? '220,245,245' : '20,80,100'},${ent(.12, .35)})`; g.lineWidth = 1 + (y - HZ) * .006; const x = r() * W; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3, x + w, y); g.stroke(); }
    // caminho de brilho do sol no mar
    for (let i = 0; i < 160; i++) { const y = HZ + Math.pow(r(), 1.2) * 380, x = sol[0] + ent(-1, 1) * (40 + (y - HZ) * .9); g.fillStyle = `rgba(255,248,220,${ent(.25, .7)})`; g.fillRect(x, y, ent(8, 30), 2); }
    // barquinhos no horizonte
    for (const [x, s] of [[1500, .5], [1900, .35], [3300, .45], [2200, .3]]) { g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(x, HZ - 6); g.lineTo(x, HZ - 60 * s); g.lineTo(x + 34 * s, HZ - 6); g.fill(); g.fillStyle = '#3a2a2a'; g.fillRect(x - 20 * s, HZ - 6, 60 * s, 8 * s); }
    // boias
    for (let i = 0; i < 14; i++) { const x = 900 + i * 160, y = 820 + Math.sin(i) * 6; g.fillStyle = i % 2 ? '#e0402a' : '#f4f0e6'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    // areia molhada e seca
    g.fillStyle = '#c9a676'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, costa(x) - 12); g.lineTo(W, H); g.fill();
    c = g.createLinearGradient(0, 1100, 0, H); c.addColorStop(0, '#e8cd98'); c.addColorStop(1, '#efd6a6'); g.fillStyle = c;
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, costa(x) + 42 + Math.sin(x * .02) * 6); g.lineTo(W, H); g.fill();
    for (let i = 0; i < 22000; i++) { const x = r() * W, y = 1080 + r() * (H - 1080); g.fillStyle = `rgba(${r() < .5 ? '170,130,80' : '255,245,220'},${ent(.15, .45)})`; g.fillRect(x, y, ent(1, 3), ent(1, 2.5)); }
    for (let i = 0; i < 70; i++) { const x = r() * W, y = ent(1150, H), w = ent(60, 200) * esc(y); g.strokeStyle = 'rgba(180,140,90,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke(); }
    // pegadas
    for (let t = 0; t < 9; t++) { let x = ent(200, W - 200), y = ent(1250, 2050); const dx = ent(-30, 30), dy = ent(-20, 20); for (let k = 0; k < 14; k++) { const s = esc(y); g.fillStyle = 'rgba(170,130,85,.4)'; g.beginPath(); g.ellipse(x + (k % 2 ? 8 : -8) * s, y, 5 * s, 9 * s * .5, 0, 0, 7); g.fill(); x += dx; y += dy; } }
    // conchinhas, pedrinhas, algas
    for (let i = 0; i < 260; i++) { const x = r() * W, y = ent(1120, H), s = esc(y); g.fillStyle = esco(['#f4ece0', '#e8c8b0', '#c8b8a8', '#8a7a6a', '#f0d8c8']); g.beginPath(); g.ellipse(x, y, ent(3, 7) * s, ent(2, 4) * s, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { const x = r() * W, y = costa(x) + ent(10, 90); g.strokeStyle = 'rgba(70,90,40,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 10, y - 8, x + 20, y + 8, x + 34, y); g.stroke(); }
    // calçadão no rodapé
    g.fillStyle = '#9a7a52'; g.fillRect(0, 2140, W, 110);
    for (let x = 0; x < W; x += 60) { g.fillStyle = `hsl(30,${ent(30, 40)}%,${ent(36, 44)}%)`; g.fillRect(x + 1, 2140, 58, 110); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 2140, 2, 110); }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 2140, W, 8);

    // salva-vidas e rede de vôlei
    const tx = 3180, ty = 1190, ts = esc(ty);
    for (const s of [-1, 1]) lt(g, '#f4f0e6', 8 * ts, tx + s * 40 * ts, ty, tx + s * 30 * ts, ty - 150 * ts);
    lt(g, '#f4f0e6', 6 * ts, tx - 36 * ts, ty - 60 * ts, tx + 36 * ts, ty - 60 * ts);
    g.fillStyle = '#d8382a'; g.fillRect(tx - 55 * ts, ty - 230 * ts, 110 * ts, 80 * ts); g.fillStyle = '#f4f0e6'; g.fillRect(tx - 55 * ts, ty - 200 * ts, 110 * ts, 14 * ts);
    g.fillStyle = '#b02a20'; g.beginPath(); g.moveTo(tx - 70 * ts, ty - 230 * ts); g.lineTo(tx, ty - 270 * ts); g.lineTo(tx + 70 * ts, ty - 230 * ts); g.fill();
    pessoa(g, tx + 10 * ts, ty - 150 * ts, ts * .9, { pose: 'pe', pele: '#c68a5e', roupa: '#d8382a', cabelo: '#2a1a10', oculos: true });
    const vx = 2380, vy = 1300, vs = esc(vy);
    lt(g, '#e8e0d0', 4 * vs, vx - 160 * vs, vy, vx - 160 * vs, vy - 170 * vs); lt(g, '#e8e0d0', 4 * vs, vx + 160 * vs, vy - 30 * vs, vx + 160 * vs, vy - 200 * vs);
    g.strokeStyle = 'rgba(60,60,60,.6)'; g.lineWidth = 1.2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(vx - 160 * vs, vy - (170 - i * 10) * vs); g.lineTo(vx + 160 * vs, vy - (200 - i * 10) * vs); g.stroke(); } for (let i = 0; i <= 26; i++) { const t = i / 26; g.beginPath(); g.moveTo(vx - 160 * vs + t * 320 * vs, vy - (170 + t * 30) * vs); g.lineTo(vx - 160 * vs + t * 320 * vs, vy - (120 + t * 30) * vs); g.stroke(); }
    lt(g, '#f4f0e6', 4 * vs, vx - 160 * vs, vy - 170 * vs, vx + 160 * vs, vy - 200 * vs);

    // barraca de coco e coqueiros (à esquerda)
    coqueiro(g, 120, 1260, 1.25, .6); coqueiro(g, 360, 1180, 1.05, -.3); coqueiro(g, 40, 1600, 1.4, .4);
    const bx = 470, by = 1470, bs = esc(by);
    for (const s of [-1, 1]) lt(g, '#7a5a3a', 8 * bs, bx + s * 110 * bs, by, bx + s * 110 * bs, by - 200 * bs);
    g.fillStyle = '#c9a060'; g.beginPath(); g.moveTo(bx - 160 * bs, by - 190 * bs); g.lineTo(bx, by - 290 * bs); g.lineTo(bx + 160 * bs, by - 190 * bs); g.closePath(); g.fill();
    for (let i = 0; i < 40; i++) lt(g, 'rgba(120,90,40,.5)', 2, bx + ent(-150, 150) * bs, by - 192 * bs, bx + ent(-60, 60) * bs, by - 280 * bs);
    g.fillStyle = '#8a6a42'; g.fillRect(bx - 120 * bs, by - 80 * bs, 240 * bs, 80 * bs); g.fillStyle = '#6a4a2a'; g.fillRect(bx - 125 * bs, by - 90 * bs, 250 * bs, 12 * bs);
    g.fillStyle = '#f4f0e6'; g.fillRect(bx - 70 * bs, by - 180 * bs, 140 * bs, 34 * bs); g.fillStyle = '#2a6a3a'; g.font = `bold ${22 * bs}px Georgia`; g.textAlign = 'center'; g.fillText('COCO GELADO', bx, by - 156 * bs);
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 3 ? '#6a9a2a' : '#5a8a22'; g.beginPath(); g.arc(bx - 90 * bs + (i % 7) * 28 * bs, by - 100 * bs - (i / 7 | 0) * 18 * bs, 15 * bs, 0, 7); g.fill(); }
    pessoa(g, bx + 30 * bs, by - 75 * bs, bs * .9, { pose: 'pe', pele: '#9a6440', roupa: '#f4f0e6', top: '#2a8a5a', cabelo: '#1a1410', chapeu: '#e8d8a8' });

    /* gente, guarda-sóis, toalhas… desenhados de trás para frente */
    const coisas = [];
    const add = (y, f) => coisas.push({ y, f });
    // anfitriões dos objetos escondidos (posições fixas)
    add(1622, g => toalha(g, 1500, 1622, esc(1622), 'listra', '#f4f0e6', '#1f3a5a', .05));
    add(1450, g => toalha(g, 2045, 1450, esc(1450), 'estrelas', '#f2a07a', '#e8743a', -.08));
    add(1735, g => cooler(g, 950, 1735, esc(1735), '#1aa0c0'));
    add(1740, g => { const s = esc(1740); for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(200,230,240,.8)'; g.fillRect(1030 + i * 22 * s, 1740 - 40 * s, 12 * s, 40 * s); g.fillStyle = '#2a6ab0'; g.fillRect(1030 + i * 22 * s, 1740 - 46 * s, 12 * s, 7 * s); } });
    add(1990, g => castelo(g, 1790, 1990, esc(1990)));
    add(1985, g => { pessoa(g, 1700, 1985, esc(1985), { pose: 'agacha', crianca: true, pele: '#f1c7a5', roupa: '#ef7a2a', cabelo: '#d8b060', lado: 1 }); balde(g, 1880, 1990, esc(1990), '#f2b632'); });
    add(1640, g => cadeira(g, 3060, 1640, esc(1640), '#2f8a9a', '#25707e'));
    add(1915, g => bolsa(g, 615, 1925, esc(1925), '#e85a8a'));
    add(1890, g => toalha(g, 2690, 1890, esc(1890), 'borda', '#ffd84a', '#e0402a', .1));
    add(1300, g => guardaSol(g, 2600, 1340, esc(1340), '#f2b632', '#f4f0e6'));
    add(1560, g => { pessoa(g, 600, 1530, esc(1530), { pose: 'pe', crianca: true, pele: '#c68a5e', roupa: '#2a6ab0', cabelo: '#1a1410', lado: -1 }); });
    // espalha o resto
    const tentar = (n, f, d = 60) => { let k = 0, t = 0; while (k < n && t < n * 30) { t++; const x = ent(560, W - 80), y = ent(1150, 2110); if (x < 700 && y < 1600) continue; if (Math.abs(x - 2380) < 200 && Math.abs(y - 1260) < 80) continue; if (Math.abs(x - 3180) < 90 && y < 1240) continue; if (!livre(x, y, d * esc(y))) continue; f(x, y, esc(y)); reservas.push([x, y, 30 * esc(y)]); k++; } };
    tentar(34, (x, y, s) => { const c = esco([['#e0402a', '#f4f0e6'], ['#1f9a8a', '#f4f0e6'], ['#f2b632', '#e0402a'], ['#e85a8a', '#f4f0e6'], ['#3a8a3a', '#ffd84a'], ['#ef7a2a', '#f4f0e6'], ['#7a3a9a', '#f4e0f0']]); add(y, g => guardaSol(g, x, y, s, c[0], c[1], ent(-.3, .3))); }, 120);
    tentar(52, (x, y, s) => { const tp = esco(['listra', 'xadrez', 'borda', 'bolinha', 'liso']), c1 = esco(ROUPAS), c2 = esco(ROUPAS), gi = ent(-.15, .15), l = r() < .5 ? 1 : -1, ocup = r() < .75;
      add(y - 2, g => toalha(g, x, y, s, tp, c1, c2, gi));
      if (ocup) { const o = { pose: r() < .6 ? 'deitada' : 'sentada', pele: esco(PELES), roupa: esco(ROUPAS), top: r() < .5 ? esco(ROUPAS) : null, cabelo: esco(CABELOS), longo: r() < .4, oculos: r() < .4, lado: l, chapeu: r() < .2 ? esco(['#e8d8a8', '#f4f0e6', '#e0402a']) : null, livro: r() < .2 ? esco(ROUPAS) : null }; add(y + 1, g => pessoa(g, x + (o.pose === 'sentada' ? -20 * s * l : 0), y + (o.pose === 'sentada' ? 6 * s : 0), s, o)); } }, 90);
    tentar(70, (x, y, s) => { const o = { pose: r() < .65 ? 'pe' : 'anda', pele: esco(PELES), roupa: esco(ROUPAS), top: r() < .5 ? esco(ROUPAS) : null, maio: r() < .3, short: r() < .4, cabelo: esco(CABELOS), longo: r() < .4, oculos: r() < .3, lado: r() < .5 ? 1 : -1, chapeu: r() < .25 ? esco(['#e8d8a8', '#f4f0e6', '#e0402a', '#2a6ab0']) : null, crianca: r() < .2, segura: r() < .12 ? esco(['#e0402a', '#f2b632', '#f4f0e6']) : null }; add(y, g => pessoa(g, x, y, s, o)); }, 40);
    tentar(9, (x, y, s) => { const c = esco(['#e0402a', '#1aa0c0', '#f2b632', '#3a8a3a', '#f4f0e6']); add(y, g => cooler(g, x, y, s, c)); }, 50);
    tentar(10, (x, y, s) => { const c = esco([['#e0402a', '#f4f0e6'], ['#1f9a8a', '#ffd84a'], ['#7a3a9a', '#f2b632']]); add(y, g => cadeira(g, x, y, s, c[0], c[1])); }, 60);
    tentar(11, (x, y, s) => { const c = esco([['#f4f0e6', '#e0402a'], ['#ffd84a', '#1aa0c0'], ['#1aa0c0', '#f4f0e6'], ['#ef7a2a', '#f4f0e6'], ['#e85a8a', '#ffd84a']]); add(y, g => prancha(g, x, y, s, c[0], c[1])); }, 50);
    tentar(4, (x, y, s) => add(y, g => castelo(g, x, y, s * .8)), 90);
    tentar(14, (x, y, s) => { const c = esco(['#f2b632', '#2a6ab0', '#1aa0c0', '#3a8a3a']); add(y, g => balde(g, x, y, s, c)); }, 30);
    tentar(8, (x, y, s) => add(y, g => bola(g, x, y, s)), 30);
    tentar(10, (x, y, s) => { const c = esco(ROUPAS); add(y, g => bolsa(g, x, y, s, c)); }, 30);
    tentar(22, (x, y, s) => add(y, g => gaivota(g, x, y, s)), 30);
    // banhistas na areia molhada
    for (let i = 0; i < 26; i++) { const x = ent(650, W - 100), y = costa(x) + ent(15, 70); if (!livre(x, y, 20)) continue; const s = esc(y), o = { pose: r() < .5 ? 'pe' : 'anda', pele: esco(PELES), roupa: esco(ROUPAS), top: r() < .4 ? esco(ROUPAS) : null, cabelo: esco(CABELOS), longo: r() < .4, lado: r() < .5 ? 1 : -1, crianca: r() < .3 }; add(y, g => pessoa(g, x, y, s, o)); }
    coisas.sort((a, b) => a.y - b.y).forEach(c => c.f(g));
  }

  /* ---------- FRENTE (o que tampa um pouquinho) ---------- */
  function frente(g) {
    // folhas do coqueiro passam por cima da pipa
    g.strokeStyle = '#3f7a2a'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(190, 700); g.quadraticCurveTo(250, 690, 320, 760); g.stroke();
    for (let k = 1; k < 10; k++) { const t = k / 10, px = 190 + t * 130, py = 700 + t * t * 60 - Math.sin(t * PI) * 12; lt(g, '#4a8a2e', 4, px, py, px + 10, py + 34); lt(g, '#3a6a24', 4, px, py, px - 12, py + 30); }
    // canto da toalha sobre os óculos? não: uma sandália encosta neles
    g.fillStyle = '#e0402a'; g.beginPath(); g.ellipse(1546, 1636, 20, 8, .3, 0, 7); g.fill(); lt(g, '#f4f0e6', 2, 1536, 1634, 1548, 1630, 1558, 1638);
    // a cadeira tem uma toalha jogada que cobre parte do boné
    g.fillStyle = 'rgba(244,240,230,.95)'; g.beginPath(); g.moveTo(3060, 1585); g.quadraticCurveTo(3085, 1600, 3080, 1640); g.lineTo(3068, 1640); g.quadraticCurveTo(3070, 1610, 3052, 1598); g.fill();
    // capim da duna nos cantos de baixo
    for (const [x0, x1] of [[0, 420], [3200, 3600]]) for (let i = 0; i < 70; i++) { const x = ent(x0, x1), y = ent(2080, 2250), h = ent(40, 110); g.strokeStyle = esco(['#8a9a4a', '#a8b060', '#6a7a3a', '#c8b880']); g.lineWidth = ent(2, 4); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + ent(-20, 20), y - h * .6, x + ent(-30, 30), y - h); g.stroke(); }
  }

  /* ---------- animação: mar, espuma, banhistas, gaivotas, bandeira ---------- */
  const nadadores = Array.from({ length: 34 }, () => { const x = ent(700, W - 60), y = ent(760, 1020); return { x, y, s: esc(y), pele: esco(PELES), cab: esco(CABELOS), boia: r() < .35 ? esco(['#ffd84a', '#e0402a', '#f4f0e6', '#e85a8a', '#1aa0c0']) : null, f: r() * 9 }; });
  nadadores.push({ x: 2185, y: 918, s: esc(918), pele: '#f1c7a5', cab: '#d8b060', boia: '#ffd84a', f: 2 }, { x: 2250, y: 895, s: esc(895), pele: '#9a6440', cab: '#1a1410', boia: null, f: 4 });
  const gaivotas = Array.from({ length: 7 }, () => ({ x: ent(0, W), y: ent(150, 600), v: ent(30, 70), f: r() * 9, s: ent(.6, 1.1) }));
  const brilhos = Array.from({ length: 90 }, () => { const y = HZ + Math.pow(r(), 1.3) * 380; return { x: sol[0] + ent(-1, 1) * (60 + (y - HZ) * 1.1), y, f: r() * 9 }; });
  const ondas = Array.from({ length: 50 }, () => ({ x: ent(-200, W), y: ent(HZ + 40, 1020), w: ent(80, 260), f: r() * 9 }));
  function animarMeio(g, t, vis) {
    for (const b of brilhos) { const a = Math.max(0, Math.sin(t * 2.2 + b.f * 3)); if (a < .2) continue; g.fillStyle = `rgba(255,252,230,${a * .8})`; g.fillRect(b.x, b.y, 10 + a * 14, 2.5); }
    for (const o of ondas) { const y = o.y + ((t * 6 + o.f * 40) % 40), s = esc(y); if (y > costa(o.x) - 20) continue; g.strokeStyle = `rgba(235,250,250,${.35 * s})`; g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(o.x + Math.sin(t * .3 + o.f) * 20, y); g.quadraticCurveTo(o.x + o.w / 2, y - 6 * s, o.x + o.w, y); g.stroke(); }
    // nadadores e boias
    for (const n of nadadores) {
      if (n.x < vis.x0 - 50 || n.x > vis.x1 + 50) continue;
      const b = Math.sin(t * 1.4 + n.f) * 3 * n.s, x = n.x + Math.sin(t * .2 + n.f) * 10, y = n.y + b;
      if (n.boia) { g.strokeStyle = n.boia; g.lineWidth = 9 * n.s; g.beginPath(); g.ellipse(x, y, 22 * n.s, 9 * n.s, 0, 0, 7); g.stroke(); }
      g.fillStyle = n.pele; g.beginPath(); g.arc(x, y - 10 * n.s, 11 * n.s, 0, 7); g.fill(); g.fillStyle = n.cab; g.beginPath(); g.arc(x, y - 13 * n.s, 11.5 * n.s, PI, 0); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2 * n.s; g.beginPath(); g.ellipse(x, y, 26 * n.s, 6 * n.s, 0, 0, PI); g.stroke();
    }
    if (!pato.achado) { pato.x = 2215 + Math.sin(t * .25) * 14; pato.y = 905 + Math.sin(t * 1.3 + 1) * 3; g.save(); g.translate(pato.x, pato.y); g.scale(.95, .95); pato.desenho(g); g.restore(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(pato.x, pato.y + 12, 24, 5, 0, 0, PI); g.stroke(); }
    // espuma que vai e volta na beira (passa por cima da garrafa)
    const sobe = Math.sin(t * .55) * 26;
    g.fillStyle = 'rgba(250,252,250,.82)'; g.beginPath(); g.moveTo(vis.x0 - 20, costa(vis.x0) - 30);
    for (let x = Math.floor(vis.x0 / 20) * 20 - 20; x <= vis.x1 + 20; x += 20) g.lineTo(x, costa(x) - 8 + sobe + Math.sin(x * .03 + t * 1.5) * 6);
    for (let x = Math.ceil(vis.x1 / 20) * 20 + 20; x >= vis.x0 - 20; x -= 20) g.lineTo(x, costa(x) - 24 + sobe * .8 + Math.sin(x * .05 - t) * 4);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(110,190,190,.35)'; g.beginPath(); for (let x = Math.floor(vis.x0 / 20) * 20 - 20; x <= vis.x1 + 20; x += 20) g.lineTo(x, costa(x) - 8 + sobe + Math.sin(x * .03 + t * 1.5) * 6); for (let x = Math.ceil(vis.x1 / 20) * 20 + 20; x >= vis.x0 - 20; x -= 20) g.lineTo(x, costa(x) + 14 + sobe * .5); g.closePath(); g.fill();
  }
  function animarTopo(g, t, vis) {
    // bandeira do salva-vidas
    const fx = 3180, fy = 1190 - 270 * esc(1190), s = esc(1190);
    lt(g, '#5a5a5a', 3 * s, fx, fy, fx, fy - 70 * s); g.fillStyle = '#e0402a'; g.beginPath(); g.moveTo(fx, fy - 70 * s);
    for (let i = 0; i <= 10; i++) g.lineTo(fx + i * 6 * s, fy - 70 * s + Math.sin(t * 5 + i * .7) * 4 * s * i / 10); for (let i = 10; i >= 0; i--) g.lineTo(fx + i * 6 * s, fy - 40 * s + Math.sin(t * 5 + i * .7) * 4 * s * i / 10); g.fill();
    // gaivotas voando
    for (const a of gaivotas) { const x = ((a.x + t * a.v) % (W + 200)) - 100, y = a.y + Math.sin(t * .5 + a.f) * 20, b = Math.sin(t * 6 + a.f) * 10 * a.s; g.strokeStyle = '#f8f8f6'; g.lineWidth = 4 * a.s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 26 * a.s, y - b); g.quadraticCurveTo(x - 12 * a.s, y - 12 * a.s - b * .3, x, y); g.quadraticCurveTo(x + 12 * a.s, y - 12 * a.s - b * .3, x + 26 * a.s, y - b); g.stroke(); }
  }

  return { tipo: '2d', nome: 'Praia Movimentada', largura: W, altura: H, cor: '#2a2018', foco: [1500, 1300], itens, fundo, frente, animarMeio, animarTopo };
}
