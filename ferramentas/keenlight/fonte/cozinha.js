/* Nível 6 — A Cozinha do Relojoeiro (2D, lista só com charadas).
   Cozinha antiga que virou oficina: relógios por toda a parede (ponteiros e pêndulos animados, cuco que sai),
   fogão com chaleira soltando vapor, prateleiras de potes e uma bancada cheia de engrenagens. 3600 × 2250. */
function criarCozinha() {
  const W = 3600, H = 2250, PI = Math.PI, BALCAO = 1450, MESA = 2140;
  Tex.sorte(1912); const r = Tex.r, ent = Tex.ent, esco = a => a[(r() * a.length) | 0];
  const lt = (g, cor, w, ...p) => { g.strokeStyle = cor; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const circ = (g, x, y, rr, cor) => { g.fillStyle = cor; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); };
  function engrenagem(g, x, y, rr, dentes, cor, buraco = .35) {
    g.fillStyle = cor; g.beginPath();
    for (let i = 0; i < dentes * 2; i++) { const a = i / (dentes * 2) * PI * 2, R = i % 2 ? rr : rr * 1.18; g.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x, y, rr * buraco, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,240,200,.3)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, rr * .75, 0, 7); g.stroke();
  }
  // relógios de parede (os ponteiros são animados)
  const relogios = [
    { x: 700, y: 330, r: 95, cor: '#6a3a1e', off: 0 }, { x: 1150, y: 260, r: 70, cor: '#2a4a3a', off: 2.3 }, { x: 2280, y: 220, r: 60, cor: '#8a2a1e', off: 5.1 },
    { x: 2600, y: 1130, r: 55, cor: '#c9a24a', off: 7.7 }, { x: 3330, y: 1150, r: 75, cor: '#3a2a1e', off: 9.2 }, { x: 1380, y: 1070, r: 50, cor: '#6a4a2a', off: 3.4 },
    { x: 270, y: 640, r: 82, cor: '#3a2418', off: 0, alto: true }
  ];
  const pendulos = [{ x: 270, y: 760, L: 640, f: 1.4 }, { x: 3330, y: 1230, L: 170, f: 2.1 }, { x: 2280, y: 290, L: 160, f: 2.3 }];
  const CUCO = [3000, 360];

  /* ---------- objetos escondidos (charadas) ---------- */
  const itens = [];
  const item = (id, nome, charada, x, y, raio, desenho, o = {}) => { const it = Object.assign({ id, nome, charada, x, y, raio, desenho, achado: false }, o); itens.push(it); return it; };
  item('pente', 'Pente', 'Tem dentes, mas não morde.', 3150, 1905, 32, g => {
    g.fillStyle = '#8a5a2a'; g.beginPath(); g.roundRect(-30, -10, 60, 10, 3); g.fill(); for (let i = 0; i < 15; i++) g.fillRect(-28 + i * 4, 0, 2.3, 12);
  }, { giro: .7 });
  item('agulha', 'Agulha', 'Tem olho, mas não enxerga.', 2655, 1935, 30, g => {
    g.fillStyle = '#c8ccd0'; g.beginPath(); g.moveTo(-30, -1.6); g.lineTo(26, -1.2); g.lineTo(32, 0); g.lineTo(26, 1.2); g.lineTo(-30, 1.6); g.closePath(); g.fill();
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(-25, 0, 3, 1, 0, 0, 7); g.fill();
    g.strokeStyle = '#c8202a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-25, 0); g.bezierCurveTo(-36, 10, -20, 18, -34, 26); g.stroke();
  }, { giro: -.8 });
  item('toalha', 'Toalha', 'Quanto mais seca, mais molhada fica.', 1160, 1592, 40, g => {
    g.fillStyle = '#f0ece0'; g.beginPath(); g.moveTo(-28, -30); g.lineTo(28, -30); g.lineTo(26, 34); g.quadraticCurveTo(0, 40, -26, 34); g.closePath(); g.fill();
    g.fillStyle = '#c8402a'; for (const y of [-14, 18]) g.fillRect(-27, y, 54, 6); g.fillStyle = '#2a6a9a'; g.fillRect(-27, y0(), 54, 2);
    function y0() { return 26; }
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 4; i++) g.fillRect(-20 + i * 12, -30, 3, 64);
  }, { raio: 40 });
  item('garrafa', 'Garrafa', 'Tem pescoço, mas não tem cabeça.', 2655, 742, 40, g => {
    g.fillStyle = 'rgba(60,120,70,.9)'; g.beginPath(); g.moveTo(-14, 38); g.lineTo(14, 38); g.lineTo(14, -4); g.quadraticCurveTo(12, -16, 5, -20); g.lineTo(5, -36); g.lineTo(-5, -36); g.lineTo(-5, -20); g.quadraticCurveTo(-12, -16, -14, -4); g.closePath(); g.fill();
    g.fillStyle = '#8a5a2a'; g.fillRect(-5, -42, 10, 8); g.fillStyle = '#efe2c0'; g.fillRect(-12, 6, 24, 18); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-11, -6, 4, 40);
  }, { raio: 40 });
  item('ovo', 'Ovo', 'Precisa ser quebrado antes de ser usado.', 2050, 1990, 26, g => {
    const gr = g.createRadialGradient(-6, -8, 2, 0, 0, 24); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#e8d8b8'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 15, 20, 0, 0, 7); g.fill();
  }, { giro: .3 });
  item('vela', 'Vela', 'Quanto mais vive, mais diminui.', 1895, 722, 34, g => {
    g.fillStyle = '#efe6cc'; g.fillRect(-8, -26, 16, 50); g.fillStyle = '#e8dcb8'; g.beginPath(); g.ellipse(0, -26, 8, 3, 0, 0, 7); g.fill();
    lt(g, '#2a2a2a', 1.5, 0, -26, 0, -32); g.fillStyle = '#c9a24a'; g.beginPath(); g.ellipse(0, 26, 18, 6, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(232,220,184,.9)'; g.beginPath(); g.moveTo(-8, -20); g.quadraticCurveTo(-11, -8, -9, -2); g.lineTo(-8, -2); g.fill();
  });
  item('colher', 'Colher de pau', 'Vai à boca todo dia, mas nunca come.', 1012, 845, 40, g => {
    g.fillStyle = '#c8a060'; g.fillRect(-3, -40, 6, 52); g.beginPath(); g.ellipse(0, 22, 11, 16, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(120,80,30,.35)'; g.beginPath(); g.ellipse(0, 24, 7, 11, 0, 0, 7); g.fill(); circ(g, 0, -40, 3, '#8a6a3a');
  }, { raio: 40 });
  item('esponja', 'Esponja', 'Cheia de buracos, mas segura água.', 2915, 1428, 28, g => {
    g.fillStyle = '#f2d23a'; g.beginPath(); g.roundRect(-26, -12, 52, 22, 4); g.fill(); g.fillStyle = '#3a8a3a'; g.beginPath(); g.roundRect(-26, -16, 52, 7, 3); g.fill();
    g.fillStyle = 'rgba(160,120,20,.5)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(-22 + (i * 13) % 46, -4 + (i % 3) * 5, 1.8, 0, 7); g.fill(); }
  }, { giro: .1 });
  item('cebola', 'Cebola', 'Faz chorar sem precisar bater.', 1525, 1405, 28, g => {
    g.fillStyle = '#b8642a'; g.beginPath(); g.moveTo(0, -24); g.quadraticCurveTo(24, -6, 18, 10); g.quadraticCurveTo(10, 22, 0, 22); g.quadraticCurveTo(-10, 22, -18, 10); g.quadraticCurveTo(-24, -6, 0, -24); g.fill();
    g.strokeStyle = 'rgba(80,30,10,.5)'; g.lineWidth = 1.5; for (const k of [-.5, 0, .5]) { g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(k * 30, 0, 0, 21); g.stroke(); }
    lt(g, '#e8d8a8', 2, -2, 22, -4, 28, 2, 22, 4, 28);
  });
  item('dedal', 'Dedal', 'Chapéu de dedo de quem costura.', 1352, 2045, 24, g => {
    g.fillStyle = '#b8bcc0'; g.beginPath(); g.moveTo(-13, 14); g.lineTo(-11, -10); g.quadraticCurveTo(0, -20, 11, -10); g.lineTo(13, 14); g.closePath(); g.fill();
    g.fillStyle = 'rgba(60,60,70,.5)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(-8 + (i % 6) * 3.2, -6 + (i / 6 | 0) * 6, 1, 0, 7); g.fill(); } g.fillStyle = '#8a8e92'; g.fillRect(-13, 10, 26, 4);
  });
  item('luva', 'Luva de lã', 'Tem cinco dedos, mas não tem unhas.', 470, 1745, 34, g => {
    g.fillStyle = '#5a7a3a'; g.beginPath(); g.roundRect(-15, -4, 30, 32, 8); g.fill(); for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-15 + i * 7.8, -30 + Math.abs(i - 1.5) * 3, 7, 30, 3.5); g.fill(); } g.beginPath(); g.ellipse(-18, 8, 5.5, 13, -.6, 0, 7); g.fill();
    g.fillStyle = '#e8d8a8'; for (let i = 0; i < 4; i++) g.fillRect(-15, 18 + i * 3, 30, 1.5);
  }, { giro: 2.6 });
  item('piao', 'Pião', 'Gira, gira e dorme em pé.', 2352, 2085, 28, g => {
    g.fillStyle = '#c8402a'; g.beginPath(); g.moveTo(-22, -6); g.quadraticCurveTo(0, -24, 22, -6); g.lineTo(0, 24); g.closePath(); g.fill();
    g.fillStyle = '#f2c02a'; g.fillRect(-20, -8, 40, 5); g.fillStyle = '#6a3a1a'; g.fillRect(-2.5, -24, 5, 10); lt(g, '#5a5a5a', 2, 0, 24, 0, 30);
  }, { giro: .4 });

  /* ---------- FUNDO ---------- */
  function relogio(g, c) {
    if (c.alto) { // relógio de pêndulo de chão
      g.fillStyle = '#3a2418'; g.fillRect(c.x - 130, 520, 260, 1440); g.fillStyle = '#5a3a24'; g.fillRect(c.x - 110, 760, 220, 700);
      g.fillStyle = '#2a1a10'; g.fillRect(c.x - 150, 1460, 300, 500); g.beginPath(); g.moveTo(c.x - 150, 520); g.quadraticCurveTo(c.x, 380, c.x + 150, 520); g.fill();
      g.fillStyle = 'rgba(200,220,220,.15)'; g.fillRect(c.x - 90, 780, 180, 660);
      for (let i = 0; i < 3; i++) { g.fillStyle = '#c9a24a'; g.fillRect(c.x - 50 + i * 40, 1100 + i * 40, 18, 160); }
    }
    circ(g, c.x, c.y, c.r + 12, c.cor); circ(g, c.x, c.y, c.r, '#f2ead6');
    g.strokeStyle = '#2a1f17'; g.lineWidth = 2; g.beginPath(); g.arc(c.x, c.y, c.r * .9, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.fillStyle = '#2a1f17'; g.fillRect(c.x + Math.cos(a) * c.r * .78 - 2, c.y + Math.sin(a) * c.r * .78 - 2, 4, 4); }
    g.fillStyle = '#2a1f17'; g.font = `${c.r * .2}px Georgia`; g.textAlign = 'center'; g.fillText('XII', c.x, c.y - c.r * .55);
  }
  function fundo(g) {
    // parede: reboco em cima, azulejos embaixo
    let c = g.createLinearGradient(0, 0, 0, BALCAO); c.addColorStop(0, '#d8c09a'); c.addColorStop(1, '#e8d4ae'); g.fillStyle = c; g.fillRect(0, 0, W, BALCAO);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < .5 ? '140,100,60' : '255,250,235'},${ent(.03, .08)})`; g.fillRect(r() * W, r() * 1000, 2, 2); }
    for (let y = 980; y < BALCAO; y += 60) for (let x = (y / 60 % 2) * 30; x < W; x += 60) { g.fillStyle = (x / 60 + y / 60) % 2 < 1 ? '#efe6d0' : '#e2d6b8'; g.fillRect(x + 2, y + 2, 56, 56); g.fillStyle = 'rgba(40,90,120,.35)'; g.beginPath(); g.arc(x + 30, y + 30, 8, 0, 7); g.fill(); }
    g.fillStyle = '#8a5a3a'; g.fillRect(0, 960, W, 22);
    // vigas do teto
    g.fillStyle = '#5a3a24'; g.fillRect(0, 0, W, 70); for (let x = 0; x < W; x += 450) { g.fillStyle = '#4a2e1c'; g.fillRect(x, 0, 60, 120); }
    // janela com neve lá fora
    g.fillStyle = '#c8d8e0'; g.fillRect(1500, 200, 620, 540);
    c = g.createLinearGradient(0, 200, 0, 740); c.addColorStop(0, '#9ab0c0'); c.addColorStop(1, '#e8eef0'); g.fillStyle = c; g.fillRect(1500, 200, 620, 540);
    g.fillStyle = '#f4f6f8'; g.beginPath(); g.moveTo(1500, 740); for (let x = 1500; x <= 2120; x += 20) g.lineTo(x, 640 + Math.sin(x * .02) * 20); g.lineTo(2120, 740); g.fill();
    for (let i = 0; i < 4; i++) { const x = 1560 + i * 150; g.fillStyle = '#4a5a50'; g.beginPath(); g.moveTo(x, 640); g.lineTo(x + 40, 470); g.lineTo(x + 80, 640); g.fill(); g.fillStyle = '#f4f6f8'; g.beginPath(); g.moveTo(x + 20, 560); g.lineTo(x + 40, 470); g.lineTo(x + 60, 560); g.fill(); }
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 26; g.strokeRect(1500, 200, 620, 540); lt(g, '#6a4a2a', 14, 1810, 200, 1810, 740); lt(g, '#6a4a2a', 14, 1500, 470, 2120, 470);
    g.fillStyle = '#7a5a3a'; g.fillRect(1460, 745, 700, 30);
    // cortininhas de xadrez
    for (const [x0, x1] of [[1470, 1640], [1980, 2150]]) { g.fillStyle = '#c8402a'; g.beginPath(); g.moveTo(x0, 180); g.lineTo(x1, 180); g.quadraticCurveTo((x0 + x1) / 2, 380, x0 < 1800 ? x0 + 20 : x1 - 20, 560); g.lineTo(x0 < 1800 ? x0 : x1, 560); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 6; k++) g.fillRect(x0 + k * 30, 180, 10, 200); }
    lt(g, '#8a6a3a', 8, 1440, 180, 2180, 180);
    // vasinhos no peitoril
    for (const x of [1560, 1700, 2060]) { g.fillStyle = '#b5653e'; g.beginPath(); g.moveTo(x - 28, 745); g.lineTo(x + 28, 745); g.lineTo(x + 34, 690); g.lineTo(x - 34, 690); g.fill(); for (let k = 0; k < 8; k++) lt(g, '#4a7a3a', 5, x, 690, x + ent(-40, 40), 690 - ent(30, 80)); }
    // relógios
    relogios.forEach(cc => relogio(g, cc));
    // casinha do cuco
    { const [cx, cy] = CUCO; g.fillStyle = '#5a3a20'; g.beginPath(); g.moveTo(cx - 110, cy - 60); g.lineTo(cx, cy - 160); g.lineTo(cx + 110, cy - 60); g.fill(); g.fillStyle = '#7a4a28'; g.fillRect(cx - 90, cy - 60, 180, 200);
      for (let i = 0; i < 7; i++) { g.fillStyle = esco(['#3a5a2a', '#4a6a30']); g.beginPath(); g.ellipse(cx - 90 + i * 30, cy - 70, 22, 10, ent(-.4, .4), 0, 7); g.fill(); }
      g.fillStyle = '#2a1a10'; g.fillRect(cx - 22, cy - 50, 44, 40); circ(g, cx, cy + 60, 46, '#f2ead6'); g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy + 60, 40, 0, 7); g.stroke();
      for (const s of [-1, 1]) { lt(g, '#5a3a20', 3, cx + s * 30, cy + 140, cx + s * 30, cy + 330); g.fillStyle = '#c9a24a'; g.beginPath(); g.moveTo(cx + s * 30 - 12, cy + 300); g.lineTo(cx + s * 30 + 12, cy + 300); g.lineTo(cx + s * 30 + 8, cy + 360); g.lineTo(cx + s * 30 - 8, cy + 360); g.fill(); } }
    // trilho com utensílios pendurados (a colher de pau no meio)
    lt(g, '#8a8a80', 8, 560, 640, 1440, 640);
    const uten = [[620, 'concha'], [700, 'escumadeira'], [780, 'fouet'], [860, 'panela'], [940, 'garfo'], [1090, 'espatula'], [1170, 'faca'], [1250, 'panela2'], [1360, 'rolo']];
    lt(g, '#6a6a60', 3, 1012, 640, 1012, 806);   // ganchinho da colher
    for (const [x, t] of uten) {
      lt(g, '#6a6a60', 3, x, 640, x, 670); g.fillStyle = '#9a9a92';
      if (t === 'concha') { g.fillRect(x - 3, 670, 6, 150); g.beginPath(); g.arc(x, 840, 26, 0, PI); g.fill(); }
      else if (t === 'escumadeira') { g.fillRect(x - 3, 670, 6, 140); circ(g, x, 830, 26, '#9a9a92'); for (let k = 0; k < 9; k++) circ(g, x - 12 + (k % 3) * 12, 818 + (k / 3 | 0) * 12, 3, '#6a5a4a'); }
      else if (t === 'fouet') { g.fillRect(x - 3, 670, 6, 70); for (let k = -2; k <= 2; k++) { g.strokeStyle = '#b8b8b0'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + k * 3, 800, 6 + Math.abs(k) * 5, 60, 0, 0, 7); g.stroke(); } }
      else if (t === 'panela' || t === 'panela2') { const rr = t === 'panela' ? 70 : 55; g.fillStyle = t === 'panela' ? '#b87a4a' : '#3a3a3a'; g.fillRect(x - 4, 670, 8, 110); circ(g, x, 780 + rr, rr, g.fillStyle); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(x - rr * .3, 780 + rr * .7, rr * .5, 0, 7); g.fill(); }
      else if (t === 'garfo') { g.fillRect(x - 3, 670, 6, 120); for (let k = -1; k <= 1; k++) g.fillRect(x + k * 7 - 1.5, 790, 3, 40); g.fillRect(x - 10, 786, 20, 6); }
      else if (t === 'espatula') { g.fillStyle = '#c8a060'; g.fillRect(x - 3, 670, 6, 120); g.fillRect(x - 16, 790, 32, 50); }
      else if (t === 'faca') { g.fillStyle = '#3a2a1a'; g.fillRect(x - 4, 670, 8, 50); g.fillStyle = '#c8ccd0'; g.beginPath(); g.moveTo(x - 6, 720); g.lineTo(x + 6, 720); g.lineTo(x + 2, 850); g.lineTo(x - 6, 820); g.fill(); }
      else if (t === 'rolo') { g.fillStyle = '#c8a060'; g.fillRect(x - 14, 670, 28, 200); g.fillRect(x - 4, 650, 8, 240); }
    }
    // prateleiras com potes (a garrafa fica entre eles)
    for (const y of [560, 790, 960 - 30]) { g.fillStyle = '#6a4a2a'; g.fillRect(2300, y, 1150, 22); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(2300, y + 22, 1150, 10); }
    const pote = (x, y, w, h, cor, tampa) => { g.fillStyle = cor; g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, 8); g.fill(); g.fillStyle = tampa; g.fillRect(x - w / 2 - 3, y - h - 10, w + 6, 12); g.fillStyle = '#efe2c0'; g.fillRect(x - w / 2 + 6, y - h * .6, w - 12, h * .3); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - w / 2 + 5, y - h + 6, 5, h - 12); };
    for (let i = 0; i < 12; i++) pote(2350 + i * 92, 560, ent(50, 70), ent(80, 130), esco(['rgba(180,120,60,.85)', 'rgba(200,170,90,.85)', 'rgba(120,70,40,.85)', 'rgba(220,200,150,.85)']), esco(['#c8402a', '#3a6a3a', '#c9a24a']));
    for (let i = 0; i < 11; i++) { const x = 2350 + i * 100; if (Math.abs(x - 2655) < 45) continue; if (i % 3 === 1) { g.fillStyle = esco(['rgba(60,100,80,.85)', 'rgba(110,60,40,.85)']); g.beginPath(); g.moveTo(x - 15, 790); g.lineTo(x + 15, 790); g.lineTo(x + 15, 735); g.lineTo(x + 5, 715); g.lineTo(x + 5, 690); g.lineTo(x - 5, 690); g.lineTo(x - 5, 715); g.lineTo(x - 15, 735); g.closePath(); g.fill(); } else pote(x, 790, ent(50, 66), ent(70, 110), esco(['rgba(180,120,60,.85)', 'rgba(140,160,90,.85)', 'rgba(200,90,50,.85)', 'rgba(220,200,150,.85)']), esco(['#c8402a', '#3a6a3a', '#c9a24a'])); }
    for (let i = 0; i < 8; i++) { g.fillStyle = esco(['#7a2a1a', '#2a4a3a', '#8a6a3a', '#3a3a5a']); g.fillRect(2330 + i * 40, 930 - ent(120, 160), 34, 160); }
    { const x = 2850; g.fillStyle = '#e8e0d4'; g.beginPath(); g.ellipse(x, 900, 60, 34, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, 862, 24, 10, 0, 0, 7); g.fill(); lt(g, '#e8e0d4', 10, x + 55, 890, x + 95, 860); }
    // balcão, fogão, pia
    g.fillStyle = '#6a4a2a'; g.fillRect(0, BALCAO, W, 300); g.fillStyle = '#8a6a42'; g.fillRect(0, BALCAO - 10, W, 34);
    for (let x = 80; x < W; x += 280) { g.fillStyle = '#5a3e22'; g.fillRect(x, BALCAO + 50, 240, 230); g.fillStyle = '#c9a24a'; g.fillRect(x + 110, BALCAO + 100, 20, 8); }
    // fogão a lenha
    g.fillStyle = '#2a2a2a'; g.fillRect(780, BALCAO - 30, 560, 330); g.fillStyle = '#3a3a3a'; g.fillRect(760, BALCAO - 46, 600, 24);
    g.fillStyle = '#1a1a1a'; g.fillRect(830, BALCAO + 40, 200, 150); g.fillStyle = '#4a4a4a'; g.fillRect(1070, BALCAO + 40, 230, 220);
    lt(g, '#c8c8c0', 6, 1080, BALCAO + 100, 1290, BALCAO + 100);   // puxador do forno (a toalha pendurada)
    for (const x of [880, 1220]) { g.fillStyle = '#4a4a4a'; g.beginPath(); g.ellipse(x, BALCAO - 46, 90, 16, 0, 0, 7); g.fill(); }
    lt(g, '#2a2a2a', 40, 1300, BALCAO - 50, 1300, 120);
    // chaleira e panela no fogão
    g.fillStyle = '#b8bcc0'; g.beginPath(); g.ellipse(880, BALCAO - 110, 80, 64, 0, 0, 7); g.fill(); g.fillStyle = '#9a9ea2'; g.fillRect(800, BALCAO - 110, 160, 50); g.strokeStyle = '#2a2a2a'; g.lineWidth = 8; g.beginPath(); g.arc(880, BALCAO - 170, 50, PI * 1.1, PI * 1.9); g.stroke();
    lt(g, '#b8bcc0', 16, 950, BALCAO - 100, 1010, BALCAO - 160); circ(g, 880, BALCAO - 178, 12, '#2a2a2a');
    g.fillStyle = '#b87a4a'; g.fillRect(1140, BALCAO - 150, 160, 100); g.fillStyle = '#8a5a3a'; g.beginPath(); g.ellipse(1220, BALCAO - 150, 82, 14, 0, 0, 7); g.fill(); lt(g, '#3a2a1a', 8, 1300, BALCAO - 120, 1370, BALCAO - 120);
    // cesta com alhos (a cebola no meio)
    g.fillStyle = '#a87a42'; g.beginPath(); g.ellipse(1520, BALCAO - 10, 130, 30, 0, 0, PI); g.lineTo(1390, BALCAO - 40); g.fill();
    for (let i = 0; i < 9; i++) { const x = 1430 + (i % 5) * 40 + (i > 4 ? 20 : 0), y = BALCAO - 40 - (i > 4 ? 26 : 0); if (Math.abs(x - 1525) < 26 && Math.abs(y - 1405) < 30) continue; g.fillStyle = '#efe6d4'; g.beginPath(); g.moveTo(x, y - 24); g.quadraticCurveTo(x + 22, y - 6, x + 16, y + 10); g.quadraticCurveTo(x, y + 20, x - 16, y + 10); g.quadraticCurveTo(x - 22, y - 6, x, y - 24); g.fill(); g.strokeStyle = 'rgba(160,130,110,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x, y + 18); g.stroke(); }
    lt(g, '#e8dcc0', 10, 1660, BALCAO - 20, 1700, 1180); for (let i = 0; i < 8; i++) { const y = 1200 + i * 30; g.fillStyle = '#efe6d4'; g.beginPath(); g.ellipse(1690 + (i % 2 ? 14 : -14), y, 18, 15, 0, 0, 7); g.fill(); }   // trança de alho pendurada
    // tábua, pão, queijo
    g.fillStyle = '#c8a060'; g.beginPath(); g.roundRect(1880, BALCAO - 30, 260, 26, 8); g.fill(); g.fillStyle = '#c8803a'; g.beginPath(); g.ellipse(1980, BALCAO - 56, 80, 32, 0, 0, 7); g.fill(); for (let k = 0; k < 4; k++) lt(g, '#e8b070', 3, 1930 + k * 30, BALCAO - 76, 1940 + k * 30, BALCAO - 40);
    g.fillStyle = '#f2c84a'; g.beginPath(); g.moveTo(2080, BALCAO - 30); g.lineTo(2160, BALCAO - 30); g.lineTo(2160, BALCAO - 80); g.closePath(); g.fill();
    // pia com bacia e torneira
    g.fillStyle = '#d8d8d0'; g.fillRect(2600, BALCAO - 20, 380, 40); g.fillStyle = '#a8aca8'; g.beginPath(); g.ellipse(2780, BALCAO - 20, 160, 22, 0, 0, 7); g.fill();
    lt(g, '#9a9a92', 14, 2780, BALCAO - 30, 2780, BALCAO - 140, 2840, BALCAO - 140, 2840, BALCAO - 110);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#f2ece0'; g.beginPath(); g.ellipse(2680 + i * 18, BALCAO - 40 - i * 10, 50, 12, 0, 0, 7); g.fill(); }
    g.fillStyle = '#e8e8e0'; g.beginPath(); g.roundRect(2990, BALCAO - 50, 40, 46, 6); g.fill();   // sabão
    // chão de ladrilho
    for (let y = BALCAO + 300; y < H; y += 70) for (let x = 0; x < W; x += 70) { g.fillStyle = ((x + y) / 70) % 2 < 1 ? '#8a3a2a' : '#c8b088'; g.fillRect(x, y, 70, 70); }
    // gato dormindo na cadeira? fica na frente; aqui a cadeira da esquerda
    g.fillStyle = '#5a3a20'; g.fillRect(300, 1500, 26, 500); g.fillRect(620, 1500, 26, 500); for (let i = 0; i < 4; i++) g.fillRect(300, 1520 + i * 60, 346, 18);
    // bancada da frente
    g.fillStyle = '#4a2e1a'; g.fillRect(700, MESA + 60, 2900, H - MESA); c = g.createLinearGradient(0, MESA, 0, MESA + 70); c.addColorStop(0, '#9a6a3a'); c.addColorStop(1, '#6a4422'); g.fillStyle = c; g.fillRect(680, MESA, 2940, 70);
    g.fillStyle = '#b07a44'; g.fillRect(680, MESA - 320, 2940, 420);
    for (let i = 0; i < 60; i++) lt(g, 'rgba(90,50,20,.25)', 2, 680 + r() * 2940, MESA - 320 + r() * 420, 680 + r() * 2940, MESA - 320 + r() * 420);
    // em cima da bancada: engrenagens, molas, ferramentas, botões, mecanismo aberto, tecidos
    for (let i = 0; i < 70; i++) { const x = ent(1150, 3550), y = ent(MESA - 300, MESA - 20); if (itens.some(it => Math.hypot(it.x - x, it.y - y) < it.raio + 30)) continue; engrenagem(g, x, y, ent(10, 34), 8 + (r() * 10 | 0), esco(['#c9a24a', '#b8bcc0', '#a87a3a', '#8a8e92'])); }
    for (let i = 0; i < 40; i++) { const x = ent(1150, 1700), y = ent(MESA - 300, MESA - 30); if (Math.hypot(x - 1352, y - 2045) < 50) continue; circ(g, x, y, ent(7, 13), esco(['#c8402a', '#efe6d0', '#2a2a2a', '#3a6a9a', '#c9a24a', '#8a8e92'])); g.fillStyle = 'rgba(0,0,0,.4)'; for (const d of [-2.5, 2.5]) { g.beginPath(); g.arc(x + d, y, 1.5, 0, 7); g.fill(); } }
    for (let i = 0; i < 10; i++) { const x = ent(2800, 3500), y = ent(MESA - 290, MESA - 40); if (Math.hypot(x - 3150, y - 1905) < 60) continue; g.save(); g.translate(x, y); g.rotate(ent(-1, 1)); g.fillStyle = esco(['#c8402a', '#2a5a8a', '#e8b030']); g.beginPath(); g.roundRect(-40, -6, 34, 12, 5); g.fill(); g.fillStyle = '#b8bcc0'; g.fillRect(-6, -2, 44, 4); g.restore(); }
    for (let i = 0; i < 8; i++) { const x = ent(2200, 2500), y = ent(MESA - 290, MESA - 60); g.strokeStyle = '#a8acb0'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 40; k++) g.lineTo(x + Math.cos(k * .8) * 8, y + k * 1.2 + Math.sin(k * .8) * 3); g.stroke(); }
    // mecanismo grande aberto
    circ(g, 1800, MESA - 220, 150, '#c9a24a'); circ(g, 1800, MESA - 220, 135, '#3a2a1a'); engrenagem(g, 1760, MESA - 240, 60, 18, '#d8b060'); engrenagem(g, 1860, MESA - 180, 40, 14, '#b8bcc0'); engrenagem(g, 1820, MESA - 300, 26, 10, '#a87a3a');
    // novelo de corda com o ovo dentro
    g.strokeStyle = '#c8a878'; g.lineWidth = 6; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(2050, 1990, 52 - k * 3, 24 - k * 2, 0, 0, 7); g.stroke(); }
    // almofada de alfinetes (a agulha está ali)
    { const x = 2640, y = 1960; g.fillStyle = '#c8402a'; g.beginPath(); g.ellipse(x, y, 70, 46, 0, 0, 7); g.fill(); g.fillStyle = '#a82a1a'; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x, y); g.arc(x, y, 70, k * PI / 3, k * PI / 3 + .1); g.fill(); }
      for (let k = 0; k < 14; k++) { const a = r() * PI * 2, d = r() * 40, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .6; lt(g, '#c8ccd0', 2, px, py, px + ent(-14, 14), py - ent(16, 26)); circ(g, px + 0, py - 22, 4, esco(['#f2c02a', '#3a8a3a', '#2a6ab0', '#f4f0e6'])); } }
    // xícara, farinha, carretéis, tesourinha, lupa de relojoeiro
    g.fillStyle = '#efe6d0'; g.beginPath(); g.ellipse(3000, 2070, 70, 20, 0, 0, 7); g.fill(); g.fillStyle = '#e8e0d4'; g.fillRect(2965, 2000, 70, 70); g.fillStyle = '#5a3a1e'; g.beginPath(); g.ellipse(3000, 2002, 34, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#efe6d4'; g.beginPath(); g.moveTo(820, 2250); g.lineTo(840, 1960); g.quadraticCurveTo(940, 1900, 1040, 1960); g.lineTo(1060, 2250); g.fill(); g.fillStyle = '#3a5a8a'; g.font = 'bold 40px Georgia'; g.textAlign = 'center'; g.fillText('FARINHA', 940, 2110);
    for (let i = 0; i < 6; i++) { const x = 1180 + i * 46, y = 2100; g.fillStyle = '#c8a060'; g.fillRect(x - 16, y - 40, 32, 8); g.fillRect(x - 16, y, 32, 8); g.fillStyle = esco(['#c8402a', '#2a6ab0', '#3a8a3a', '#f2c02a', '#7a3a9a']); g.fillRect(x - 13, y - 32, 26, 32); }
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(2420, 1890); g.lineTo(2470, 1870); g.lineTo(2480, 1900); g.lineTo(2430, 1920); g.fill(); circ(g, 2480, 1940, 22, '#3a3a3a'); circ(g, 2480, 1940, 15, '#7aa0b0');
  }

  /* ---------- FRENTE: gato dormindo, vapor estático, beirada da bancada ---------- */
  function frente(g) {
    // gato malhado dormindo na cadeira (tampa um pouco a luva)
    g.fillStyle = '#c8803a'; g.beginPath(); g.ellipse(430, 1505, 110, 54, 0, 0, 7); g.fill(); g.beginPath(); g.arc(330, 1480, 42, 0, 7); g.fill();
    g.beginPath(); g.moveTo(300, 1450); g.lineTo(310, 1410); g.lineTo(330, 1442); g.fill(); g.beginPath(); g.moveTo(345, 1440); g.lineTo(362, 1408); g.lineTo(370, 1448); g.fill();
    g.strokeStyle = '#8a4a1a'; g.lineWidth = 8; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(440 + k * 30 - 60, 1505, 40, -1.2, -.4); g.stroke(); }
    lt(g, '#5a3010', 3, 312, 1482, 326, 1486); lt(g, '#5a3010', 3, 340, 1484, 354, 1482);
    // canto da bancada em primeiro plano
    g.fillStyle = '#3a2414'; g.fillRect(680, MESA + 50, 2940, 20);
  }

  /* ---------- animação: ponteiros, pêndulos, cuco, vapor, fogo, neve, rabo do gato ---------- */
  const neve = Array.from({ length: 60 }, () => ({ x: ent(1500, 2120), y: ent(200, 740), v: ent(20, 50), f: r() * 9 }));
  const vapor = Array.from({ length: 10 }, (_, i) => ({ f: i / 10 }));
  function animarMeio(g, t, vis) {
    const d = new Date(), base = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    for (const c of relogios) {
      const s = base + t + c.off * 600, hA = (s / 43200) * PI * 2, mA = (s / 3600) * PI * 2, sA = Math.floor(s) / 60 * PI * 2;
      for (const [a, L, w, cor] of [[hA, .5, 6, '#2a1f17'], [mA, .72, 4, '#2a1f17'], [sA, .8, 1.5, '#a8201a']]) lt(g, cor, w * c.r / 80, c.x, c.y, c.x + Math.sin(a) * c.r * L, c.y - Math.cos(a) * c.r * L);
      circ(g, c.x, c.y, 5 * c.r / 80, '#2a1f17');
    }
    for (const p of pendulos) { const a = Math.sin(t * p.f * PI / 2) * .18, ex = p.x + Math.sin(a) * p.L, ey = p.y + Math.cos(a) * p.L; lt(g, '#8a6a2a', 4, p.x, p.y, ex, ey); circ(g, ex, ey, p.L > 300 ? 46 : 22, '#c9a24a'); circ(g, ex - 8, ey - 8, p.L > 300 ? 14 : 6, 'rgba(255,240,190,.6)'); }
    // cuco sai a cada 15 s
    const u = t % 15; if (u < 1.6) { const [cx, cy] = CUCO, k = Math.sin(Math.min(1, u / .3) * PI / 2) * (u > 1.3 ? (1.6 - u) / .3 : 1); g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(cx, cy - 30 + 0, 18, 14, 0, 0, 7); g.fill(); g.save(); g.translate(cx, cy - 30); g.scale(1, 1); g.translate(0, 0); g.fillStyle = '#6a3a1a'; g.beginPath(); g.ellipse(0, 0, 16 * k, 12, 0, 0, 7); g.fill(); circ(g, 12 * k, -8, 9 * k, '#7a4a20'); g.fillStyle = '#e8a030'; g.beginPath(); g.moveTo(18 * k, -8); g.lineTo(28 * k, -6); g.lineTo(18 * k, -4); g.fill(); g.restore(); }
    // fogo do fogão
    for (let i = 0; i < 5; i++) { const x = 860 + i * 30, hh = 40 + Math.sin(t * 9 + i * 2) * 14; g.fillStyle = i % 2 ? 'rgba(255,170,60,.9)' : 'rgba(255,110,30,.9)'; g.beginPath(); g.moveTo(x - 14, 1640); g.quadraticCurveTo(x, 1640 - hh * 1.6, x + 14, 1640); g.fill(); }
    // vapor da chaleira
    for (const v of vapor) { const k = (t * .25 + v.f) % 1, x = 1010 + k * 60 + Math.sin(t * 2 + v.f * 9) * 20, y = 1290 - k * 320; g.fillStyle = `rgba(255,255,255,${.4 * (1 - k)})`; g.beginPath(); g.arc(x, y, 18 + k * 50, 0, 7); g.fill(); }
    // neve caindo lá fora
    g.save(); g.beginPath(); g.rect(1500, 200, 620, 540); g.clip(); g.fillStyle = 'rgba(255,255,255,.9)';
    for (const n of neve) { const y = 200 + ((n.y - 200 + t * n.v) % 540), x = n.x + Math.sin(t + n.f) * 12; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    g.restore();
  }
  function animarTopo(g, t) {
    // rabo do gato balançando devagar
    const a = Math.sin(t * .8) * .3; g.strokeStyle = '#c8803a'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(535, 1515); g.quadraticCurveTo(600, 1520 + a * 40, 590 + Math.sin(a) * 40, 1460 + a * 30); g.stroke();
  }

  return { tipo: '2d', nome: 'A Cozinha do Relojoeiro', modo: 'charada', largura: W, altura: H, cor: '#2a1a10', foco: [1800, 1300], itens, fundo, frente, animarMeio, animarTopo };
}
