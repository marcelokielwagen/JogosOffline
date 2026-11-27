/* Nível 4 — Caso Noir: escritório de detetive numa noite de chuva (3600 × 2250).
   Tudo é pintado em cor e depois vira gravura preto e branco com hachuras (noir: true).
   Os objetos são pintados em cor viva, mas viram cinza junto com o resto; quando achados, ganham a cor de volta. */
function criarNoir() {
  const W = 3600, H = 2250, PI = Math.PI, CHAO = 1520;
  Tex.sorte(1947); const r = Tex.r, ent = Tex.ent, esco = a => a[(r() * a.length) | 0];
  const lt = (g, cor, w, ...p) => { g.strokeStyle = cor; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const JAN = [2050, 230, 1150, 900];       // janela com persianas
  const MESA = [880, 1430, 1880, 70];        // tampo: x, y, largura, espessura

  /* ---------- objetos escondidos (cores vivas: só aparecem quando achados) ---------- */
  const itens = [];
  const item = (id, nome, charada, x, y, raio, desenho, o = {}) => { const it = Object.assign({ id, nome, charada, x, y, raio, desenho, achado: false }, o); itens.push(it); return it; };
  item('rosa', 'Rosa vermelha', 'Vermelha como um segredo de amor.', 1265, 1395, 34, g => {
    lt(g, '#2a7a2a', 3.5, 0, 6, -4, 40); g.fillStyle = '#3a8a2a'; g.beginPath(); g.ellipse(-10, 26, 9, 4, .6, 0, 7); g.fill();
    g.fillStyle = '#d81a2a'; for (let i = 0; i < 7; i++) { const a = i * .9; g.beginPath(); g.ellipse(Math.cos(a) * 6, Math.sin(a) * 5 - 4, 9, 7, a, 0, 7); g.fill(); }
    g.strokeStyle = '#8a0a14'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, -4, 6, 0, 5); g.stroke();
  }, { giro: -1.2 });
  item('batom', 'Batom', 'Pinta sorrisos de vermelho.', 2270, 1408, 24, g => {
    g.fillStyle = '#d8b040'; g.fillRect(-6, -4, 12, 22); g.fillStyle = '#1a1a1a'; g.fillRect(-6, 10, 12, 10);
    g.fillStyle = '#e0102a'; g.beginPath(); g.moveTo(-5, -4); g.lineTo(5, -4); g.lineTo(5, -16); g.lineTo(-5, -22); g.closePath(); g.fill();
  }, { giro: 1.35 });
  item('as', 'Ás de copas', 'A carta mais alta tem um coração.', 1700, 560, 34, g => {
    g.fillStyle = '#f8f4ec'; g.beginPath(); g.roundRect(-20, -28, 40, 56, 4); g.fill(); g.strokeStyle = '#999'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#d8102a'; g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-18, -2, -10, -16, 0, -6); g.bezierCurveTo(10, -16, 18, -2, 0, 12); g.fill();
    g.font = 'bold 10px Georgia'; g.fillText('A', -16, -17); g.fillText('A', 9, 25);
  }, { giro: .12 });
  item('chave', 'Chave de hotel', 'Abre o quarto 13 do hotel.', 3290, 1640, 30, g => {
    g.fillStyle = '#c99a2a'; g.beginPath(); g.arc(-16, 0, 8, 0, 7); g.fill(); g.fillRect(-10, -2.5, 30, 5); g.fillRect(14, 2, 4, 6); g.fillRect(8, 2, 3, 4);
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(-16, 0, 3.5, 0, 7); g.fill();
    g.fillStyle = '#2a5ad0'; g.beginPath(); g.roundRect(-40, -12, 18, 24, 6); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 9px Georgia'; g.fillText('13', -37, 3);
  }, { giro: .5 });
  item('distintivo', 'Distintivo', 'Estrela de quem faz a lei.', 800, 905, 30, g => {
    g.fillStyle = '#e0b030'; g.beginPath(); for (let i = 0; i < 12; i++) { const a = -PI / 2 + i * PI / 6, rr = i % 2 ? 13 : 26; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
    g.fillStyle = '#f6d870'; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.fillStyle = '#9a6a10'; g.font = 'bold 8px Georgia'; g.fillText('P', -3, 3);
  });
  item('gravata', 'Gravata listrada', 'Pendurada no pescoço, sem colar.', 760, 700, 40, g => {
    g.fillStyle = '#c8202a'; g.beginPath(); g.moveTo(-8, -38); g.lineTo(8, -38); g.lineTo(5, -28); g.lineTo(13, 28); g.lineTo(0, 40); g.lineTo(-13, 28); g.lineTo(-5, -28); g.closePath(); g.fill();
    g.fillStyle = '#f2c02a'; for (let i = 0; i < 6; i++) { g.save(); g.beginPath(); g.moveTo(-8, -38); g.lineTo(8, -38); g.lineTo(5, -28); g.lineTo(13, 28); g.lineTo(0, 40); g.lineTo(-13, 28); g.lineTo(-5, -28); g.closePath(); g.clip(); g.translate(0, -30 + i * 13); g.rotate(-.5); g.fillRect(-20, 0, 40, 4); g.restore(); }
  }, { giro: .1, raio: 40 });
  item('luva', 'Luva de couro', 'Tem cinco dedos e não tem unhas.', 3330, 2000, 32, g => {
    g.fillStyle = '#8a4a1a'; g.beginPath(); g.roundRect(-14, -6, 28, 30, 7); g.fill();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-14 + i * 7.3, -30 + Math.abs(i - 1.5) * 3, 6.5, 28, 3); g.fill(); }
    g.beginPath(); g.ellipse(-17, 6, 5, 12, -.6, 0, 7); g.fill(); g.fillStyle = '#6a3410'; g.fillRect(-14, 18, 28, 6);
  }, { giro: 1.9 });
  item('bilhete', 'Bilhete de trem', 'Leva quem tem para outra cidade.', 1880, 1415, 30, g => {
    g.fillStyle = '#f2d84a'; g.fillRect(-28, -13, 56, 26); g.fillStyle = '#c8402a'; g.fillRect(-28, -13, 12, 26);
    g.fillStyle = '#3a2a10'; for (let i = 0; i < 3; i++) g.fillRect(-10, -7 + i * 6, 30 - i * 6, 2.5);
    g.fillStyle = '#f2d84a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-16, -9 + i * 6, 1.6, 0, 7); g.fill(); }
  }, { giro: -.25 });
  item('colar', 'Colar de pérolas', 'Contas do mar num fio só.', 2530, 1960, 34, g => {
    for (let i = 0; i < 22; i++) { const a = i / 22 * PI * 2, x = Math.cos(a) * 26, y = Math.sin(a) * 14 + Math.max(0, Math.sin(a)) * 8; const gr = g.createRadialGradient(x - 1.5, y - 1.5, .5, x, y, 4.5); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e8d8c8'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 4.2, 0, 7); g.fill(); }
    g.fillStyle = '#d8b040'; g.fillRect(-4, -18, 8, 6);
  }, { giro: .2 });
  item('fosforos', 'Caixa de fósforos', 'Guarda o fogo dormindo num palito.', 590, 1500, 24, g => {
    g.fillStyle = '#e8402a'; g.fillRect(-20, -12, 40, 24); g.fillStyle = '#f2e0a0'; g.fillRect(-14, -7, 28, 14); g.fillStyle = '#1a1a1a'; g.font = 'bold 8px Georgia'; g.fillText('BAR', -9, 3);
    g.fillStyle = '#6a3a1a'; g.fillRect(-20, 10, 40, 3);
  }, { giro: -.1 });
  item('envelope', 'Envelope com selo', 'Viaja pelo correio com um recado.', 1662, 1985, 36, g => {
    g.fillStyle = '#f2e6c8'; g.fillRect(-32, -20, 64, 40); g.strokeStyle = '#a89878'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-32, -20); g.lineTo(0, 4); g.lineTo(32, -20); g.stroke();
    g.fillStyle = '#2a8a4a'; g.fillRect(16, -16, 12, 14); g.fillStyle = '#c8202a'; g.beginPath(); g.arc(0, 4, 5, 0, 7); g.fill();
  }, { giro: .35 });
  item('caneta', 'Caneta-tinteiro', 'Escreve com tinta e ponta de ouro.', 2140, 1580, 34, g => {
    g.fillStyle = '#1a6a5a'; g.beginPath(); g.roundRect(-32, -5, 44, 10, 5); g.fill(); g.fillStyle = '#d8b040'; g.fillRect(-14, -5, 3, 10); g.fillRect(-26, -7, 18, 2);
    g.fillStyle = '#d8b040'; g.beginPath(); g.moveTo(12, -4); g.lineTo(30, 0); g.lineTo(12, 4); g.closePath(); g.fill();
  }, { giro: .6 });

  /* ---------- FUNDO (pintado em cor; o motor converte para gravura) ---------- */
  function fundo(g) {
    // parede com reboco e papel listrado
    let c = g.createLinearGradient(0, 0, 0, CHAO); c.addColorStop(0, '#5a5048'); c.addColorStop(1, '#7a6e60'); g.fillStyle = c; g.fillRect(0, 0, W, CHAO);
    for (let x = 0; x < W; x += 60) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x, 0, 22, CHAO); }
    for (let i = 0; i < 40; i++) { const gr = g.createRadialGradient(r() * W, r() * CHAO, 0, r() * W, r() * CHAO, ent(60, 220)); gr.addColorStop(0, 'rgba(30,20,10,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, CHAO); }
    g.fillStyle = '#3a3028'; g.fillRect(0, CHAO - 120, W, 120); g.fillStyle = '#2a2018'; g.fillRect(0, CHAO - 124, W, 8);
    // chão de tábuas
    c = g.createLinearGradient(0, CHAO, 0, H); c.addColorStop(0, '#4a3a2a'); c.addColorStop(1, '#2a2018'); g.fillStyle = c; g.fillRect(0, CHAO, W, H - CHAO);
    for (let k = 0; k < 12; k++) { const y = CHAO + (H - CHAO) * Math.pow(k / 12, 1.4); lt(g, 'rgba(0,0,0,.45)', 3, 0, y, W, y); for (let i = 0; i < 6; i++) { const x = ent(0, W); lt(g, 'rgba(0,0,0,.4)', 3, x, y, x, y + 40 + k * 6); } }
    for (let i = 0; i < 300; i++) lt(g, 'rgba(20,10,0,.25)', 1, ent(0, W), ent(CHAO, H), ent(0, W), ent(CHAO, H));
    // janela: cidade de noite com chuva (atrás das persianas)
    const [jx, jy, jw, jh] = JAN;
    c = g.createLinearGradient(0, jy, 0, jy + jh); c.addColorStop(0, '#2a3a4a'); c.addColorStop(1, '#6a7a8a'); g.fillStyle = c; g.fillRect(jx, jy, jw, jh);
    for (let i = 0; i < 16; i++) { const bx = jx + i * jw / 16 + ent(-20, 20), bw = ent(60, 120), bh = ent(250, 700); g.fillStyle = esco(['#1a1e24', '#22262c', '#14181c']); g.fillRect(bx, jy + jh - bh, bw, bh); for (let k = 0; k < 40; k++) if (r() < .45) { g.fillStyle = r() < .7 ? '#f2d890' : '#a8b8c8'; g.fillRect(bx + 8 + (k % 4) * (bw - 16) / 4, jy + jh - bh + 14 + (k / 4 | 0) * 26, 10, 14); } }
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(jx + jw * .82, jy + 120, 50, 0, 7); g.fill();
    // persianas: ripas inclinadas com fresta de luz
    for (let y = jy; y < jy + jh; y += 34) { g.fillStyle = '#c8bca8'; g.fillRect(jx, y, jw, 20); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(jx, y + 18, jw, 4); }
    for (const x of [jx + jw * .3, jx + jw * .7]) lt(g, '#8a7a6a', 3, x, jy, x, jy + jh);
    g.strokeStyle = '#2a2018'; g.lineWidth = 34; g.strokeRect(jx - 17, jy - 17, jw + 34, jh + 34); lt(g, '#2a2018', 18, jx + jw / 2, jy, jx + jw / 2, jy + jh);
    g.fillStyle = '#3a3028'; g.fillRect(jx - 60, jy + jh + 17, jw + 120, 30);
    // porta com vidro fosco
    g.fillStyle = '#3a2a1e'; g.fillRect(1020, 260, 470, CHAO - 260); g.fillStyle = '#4a3a2a'; g.fillRect(1050, 290, 410, CHAO - 300);
    c = g.createLinearGradient(1080, 0, 1430, 0); c.addColorStop(0, '#b8b8a8'); c.addColorStop(1, '#e0e0d0'); g.fillStyle = c; g.fillRect(1080, 320, 350, 480);
    g.save(); g.translate(1255, 520); g.scale(-1, 1); g.fillStyle = '#2a2a2a'; g.font = 'bold 44px Georgia'; g.textAlign = 'center'; g.fillText('DETETIVE', 0, 0); g.font = 'italic 30px Georgia'; g.fillText('T. Vasconcelos', 0, 50); g.restore();
    for (const y of [860, 1080]) { g.strokeStyle = '#2a1e14'; g.lineWidth = 6; g.strokeRect(1090, y, 330, 180); }
    g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(1430, 980, 14, 0, 7); g.fill();
    // arquivos de aço
    for (let i = 0; i < 2; i++) { const x = 150 + i * 250; g.fillStyle = '#6a6a64'; g.fillRect(x, 820, 230, CHAO - 820); for (let k = 0; k < 4; k++) { const y = 850 + k * 165; g.fillStyle = '#7a7a72'; g.fillRect(x + 14, y, 202, 145); g.fillStyle = '#c8c8c0'; g.fillRect(x + 90, y + 30, 50, 12); g.fillStyle = '#e8e0c8'; g.fillRect(x + 100, y + 60, 30, 20); } }
    // pilhas em cima dos arquivos
    for (let i = 0; i < 6; i++) { g.fillStyle = esco(['#d8c8a0', '#a89070', '#e8dcc0']); g.fillRect(170 + i * 4, 820 - (i + 1) * 18, 200, 16); }
    g.fillStyle = '#4a4a44'; g.beginPath(); g.ellipse(560, 790, 50, 22, 0, 0, 7); g.fill(); g.fillRect(540, 720, 40, 70); g.fillStyle = '#7a7a72'; g.beginPath(); g.ellipse(560, 715, 60, 24, 0, 0, 7); g.fill();   // ventiladorzinho
    // cabideiro com sobretudo, chapéu e gravata
    lt(g, '#2a1e14', 14, 760, CHAO - 10, 760, 560); for (const a of [-.6, .6, -2.5, 2.5]) lt(g, '#2a1e14', 8, 760, 580, 760 + Math.cos(a) * 60, 580 + Math.sin(a) * 30);
    for (const a of [0, 2.1, 4.2]) lt(g, '#2a1e14', 10, 760, CHAO - 10, 760 + Math.cos(a) * 90, CHAO + 10);
    g.fillStyle = '#6a5a44'; g.beginPath(); g.moveTo(700, 600); g.quadraticCurveTo(630, 900, 660, 1240); g.lineTo(860, 1240); g.quadraticCurveTo(890, 900, 820, 600); g.closePath(); g.fill();
    for (let k = 0; k < 8; k++) lt(g, 'rgba(0,0,0,.3)', 4, 690 + k * 20, 640, 670 + k * 26, 1230);
    g.fillStyle = '#4a3a2a'; g.beginPath(); g.ellipse(760, 560, 90, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(760, 530, 52, 40, 0, PI, 0); g.fill(); g.fillStyle = '#1a1410'; g.fillRect(708, 538, 104, 12);
    // quadro de cortiça com fotos e barbantes
    g.fillStyle = '#5a3a24'; g.fillRect(1540, 330, 440, 560); g.fillStyle = '#a8805a'; g.fillRect(1560, 350, 400, 520);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < .5 ? '60,40,20' : '200,160,110'},.4)`; g.fillRect(1560 + r() * 400, 350 + r() * 520, 2, 2); }
    const fotos = [[1600, 390, 90, 110], [1720, 380, 80, 60], [1830, 400, 100, 120], [1590, 640, 110, 80], [1760, 650, 90, 110], [1870, 600, 70, 90], [1640, 760, 80, 60], [1800, 790, 120, 60]];
    for (const [x, y, w, h] of fotos) { g.fillStyle = '#f0ece0'; g.fillRect(x, y, w, h); g.fillStyle = esco(['#5a5a5a', '#3a3a3a', '#7a7a7a']); g.fillRect(x + 6, y + 6, w - 12, h - 20); g.fillStyle = '#9a9a9a'; g.beginPath(); g.arc(x + w / 2, y + h / 2 - 8, Math.min(w, h) * .18, 0, 7); g.fill(); }
    g.fillStyle = '#f2e8a0'; for (let i = 0; i < 6; i++) g.fillRect(1580 + r() * 340, 360 + r() * 470, 50, 46);
    g.strokeStyle = '#c8202a'; g.lineWidth = 2.5; g.beginPath(); for (const [x, y, w, h] of fotos) g.lineTo(x + w / 2, y + 6); g.stroke();
    for (const [x, y, w] of fotos) { g.fillStyle = '#d82a2a'; g.beginPath(); g.arc(x + w / 2, y + 6, 6, 0, 7); g.fill(); }
    // relógio de parede e calendário
    g.fillStyle = '#2a1e14'; g.beginPath(); g.arc(560, 360, 90, 0, 7); g.fill(); g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(560, 360, 76, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.fillRect(560 + Math.cos(a) * 64 - 3, 360 + Math.sin(a) * 64 - 3, 6, 6); }
    lt(g, '#1a1a1a', 6, 560, 360, 560, 310); lt(g, '#1a1a1a', 5, 560, 360, 600, 380);
    g.fillStyle = '#e8e0d0'; g.fillRect(220, 280, 160, 220); g.fillStyle = '#8a2a2a'; g.fillRect(220, 280, 160, 46); g.fillStyle = '#3a3a3a'; for (let i = 0; i < 20; i++) g.fillRect(232 + (i % 5) * 30, 340 + (i / 5 | 0) * 36, 18, 20);
    // estante com rádio e cofre à direita
    g.fillStyle = '#3a2a1e'; g.fillRect(3180, 500, 340, 26); g.fillRect(3180, 800, 340, 26);
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.roundRect(3220, 330, 220, 170, [80, 80, 10, 10]); g.fill(); g.fillStyle = '#c8b890'; g.beginPath(); g.roundRect(3250, 360, 160, 90, 60); g.fill(); for (let i = 0; i < 7; i++) lt(g, '#6a4a2a', 3, 3260 + i * 22, 370, 3260 + i * 22, 440); g.fillStyle = '#2a1e14'; for (const x of [3280, 3380]) { g.beginPath(); g.arc(x, 475, 12, 0, 7); g.fill(); }
    for (let i = 0; i < 9; i++) { g.fillStyle = esco(['#5a2a20', '#3a3a2a', '#2a3a4a', '#6a5a3a']); g.fillRect(3200 + i * 34, 640, 28, 160); }
    g.fillStyle = '#3a3a38'; g.fillRect(3120, 1180, 420, 380); g.fillStyle = '#4a4a46'; g.fillRect(3140, 1200, 380, 340);
    g.fillStyle = '#8a8a80'; g.beginPath(); g.arc(3330, 1370, 60, 0, 7); g.fill(); g.fillStyle = '#2a2a28'; g.beginPath(); g.arc(3330, 1370, 40, 0, 7); g.fill();
    for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; lt(g, '#c8c8c0', 3, 3330 + Math.cos(a) * 46, 1370 + Math.sin(a) * 46, 3330 + Math.cos(a) * 56, 1370 + Math.sin(a) * 56); }
    g.fillStyle = '#c9a24a'; g.fillRect(3450, 1340, 30, 70);
    // em cima do cofre: chapéu feminino e caixinha (a chave fica ali)
    g.fillStyle = '#4a3a3a'; g.beginPath(); g.ellipse(3200, 1172, 80, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(3200, 1150, 40, 26, 0, PI, 0); g.fill();
    g.fillStyle = '#2a2a2a'; g.fillRect(3270, 1600, 140, 70);   // banquinho baixo ao lado do cofre
    // porta-guarda-chuva e planta
    g.fillStyle = '#3a3a34'; g.fillRect(2950, 1700, 120, 220); for (let i = 0; i < 3; i++) { lt(g, '#1a1a1a', 8, 2980 + i * 30, 1700, 2970 + i * 34, 1450); g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(2972 + i * 34, 1500, 22, 70, .05, 0, 7); g.fill(); }
    g.fillStyle = '#3a2a1e'; g.fillRect(3330, 1940, 140, 160);
    for (let i = 0; i < 20; i++) { const a = -PI / 2 + ent(-1.2, 1.2), L = ent(120, 230); g.strokeStyle = '#2a3a2a'; g.lineWidth = 8; g.beginPath(); g.moveTo(3400, 1940); g.quadraticCurveTo(3400 + Math.cos(a) * L * .4, 1940 - L * .7, 3400 + Math.cos(a) * L, 1940 + Math.sin(a) * L * .5); g.stroke(); }
    // luz da persiana caindo em faixas na parede e no chão
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 14; k++) { const y0 = jy + k * 34 + 20; g.fillStyle = 'rgba(120,115,100,.16)'; g.beginPath(); g.moveTo(jx - 30, y0); g.lineTo(jx - 30, y0 + 12); g.lineTo(200, y0 + 900 + k * 30); g.lineTo(200, y0 + 870 + k * 30); g.fill(); }
    g.restore();

    // mesa grande
    const [mx, my, mw, me] = MESA;
    g.fillStyle = '#2a1e14'; g.fillRect(mx + 30, my + me, mw - 60, H - my);
    g.fillStyle = '#3a2a1e'; g.fillRect(mx + 60, my + me + 20, 520, H - my); g.fillRect(mx + mw - 580, my + me + 20, 520, H - my);
    for (const x0 of [mx + 60, mx + mw - 580]) for (let k = 0; k < 3; k++) { const y = my + me + 50 + k * 230; g.fillStyle = '#4a3a2a'; g.fillRect(x0 + 30, y, 460, 200); g.fillStyle = '#c9a24a'; g.fillRect(x0 + 230, y + 90, 60, 14); }
    c = g.createLinearGradient(0, my, 0, my + me); c.addColorStop(0, '#6a4a30'); c.addColorStop(1, '#3a2818'); g.fillStyle = c; g.fillRect(mx, my, mw, me);
    g.fillStyle = '#4a3220'; g.fillRect(mx - 20, my - 70, mw + 40, 70);
    for (let i = 0; i < 40; i++) lt(g, 'rgba(0,0,0,.2)', 1.5, mx + r() * mw, my - 70 + r() * 70, mx + r() * mw, my - 70 + r() * 70);
    // tudo o que está em cima da mesa
    const T = my - 40;
    // máquina de escrever
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.roundRect(1440, T - 150, 340, 170, 20); g.fill(); g.fillStyle = '#3a3a3a'; g.fillRect(1420, T - 190, 380, 40);
    g.fillStyle = '#f0e8d8'; g.fillRect(1500, T - 330, 220, 150); g.fillStyle = '#3a3a3a'; for (let i = 0; i < 8; i++) g.fillRect(1520, T - 310 + i * 14, 120 + (i % 3) * 20, 4);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 10; i++) { g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(1475 + i * 30 + k * 6, T - 100 + k * 26, 10, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(1475 + i * 30 + k * 6, T - 100 + k * 26, 6, 0, 7); g.fill(); }
    // telefone de disco
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.moveTo(1900, T); g.lineTo(2100, T); g.lineTo(2070, T - 90); g.lineTo(1930, T - 90); g.closePath(); g.fill();
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(2000, T - 45, 36, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 10; i++) { const a = -PI * .3 + i * .5; g.beginPath(); g.arc(2000 + Math.cos(a) * 24, T - 45 + Math.sin(a) * 24, 6, 0, 7); g.fill(); }
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.roundRect(1880, T - 140, 240, 40, 20); g.fill(); g.beginPath(); g.ellipse(1890, T - 120, 30, 26, 0, 0, 7); g.ellipse(2110, T - 120, 30, 26, 0, 0, 7); g.fill();
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 5; g.beginPath(); g.moveTo(2100, T - 20); g.bezierCurveTo(2200, T + 30, 2140, T + 60, 2260, T + 40); g.stroke();
    // abajur de banqueiro
    g.fillStyle = '#c9a24a'; g.beginPath(); g.ellipse(2440, T, 80, 18, 0, 0, 7); g.fill(); g.fillRect(2432, T - 200, 16, 200);
    g.fillStyle = '#2a6a3a'; g.beginPath(); g.moveTo(2290, T - 190); g.quadraticCurveTo(2440, T - 280, 2590, T - 190); g.lineTo(2570, T - 170); g.lineTo(2310, T - 170); g.closePath(); g.fill();
    c = g.createRadialGradient(2440, T - 100, 10, 2440, T - 60, 500); c.addColorStop(0, 'rgba(255,240,200,.55)'); c.addColorStop(1, 'rgba(255,240,200,0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = c; g.fillRect(1900, T - 200, 1100, 420); g.restore();
    // pastas, papéis, xícara, garrafa, copo, jornal
    for (let i = 0; i < 7; i++) { g.fillStyle = esco(['#c8b080', '#a89068', '#d8c8a0']); g.save(); g.translate(1060 + i * 6, T + 10 - i * 14); g.rotate(ent(-.06, .06)); g.fillRect(-120, -12, 240, 14); g.restore(); }
    for (let i = 0; i < 9; i++) { g.save(); g.translate(ent(1100, 2700), ent(T - 10, T + 40)); g.rotate(ent(-.4, .4)); g.fillStyle = esco(['#f0e8d8', '#e8dcc0', '#d8d0c0']); g.fillRect(-60, -24, 120, 48); g.fillStyle = 'rgba(40,40,40,.5)'; for (let k = 0; k < 5; k++) g.fillRect(-50, -16 + k * 8, 80 + ent(-20, 20), 2); g.restore(); }
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(2640, T); g.lineTo(2700, T); g.lineTo(2696, T - 70); g.lineTo(2644, T - 70); g.fill(); g.strokeStyle = '#e8e0d0'; g.lineWidth = 8; g.beginPath(); g.arc(2706, T - 36, 16, -1.2, 1.2); g.stroke();
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.ellipse(2670, T - 68, 24, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#5a4a2a'; g.beginPath(); g.moveTo(960, T); g.lineTo(1010, T); g.lineTo(1010, T - 140); g.lineTo(995, T - 170); g.lineTo(995, T - 210); g.lineTo(975, T - 210); g.lineTo(975, T - 170); g.lineTo(960, T - 140); g.closePath(); g.fill(); g.fillStyle = '#e8d8a8'; g.fillRect(964, T - 110, 42, 50);
    g.fillStyle = 'rgba(200,200,190,.6)'; g.fillRect(1030, T - 70, 50, 70); g.fillStyle = 'rgba(150,100,40,.6)'; g.fillRect(1030, T - 30, 50, 30);
    g.save(); g.translate(2250, T + 20); g.rotate(.08); g.fillStyle = '#d8d0c0'; g.fillRect(-140, -40, 280, 80); g.fillStyle = '#2a2a2a'; g.font = 'bold 22px Georgia'; g.fillText('CRIME NO PORTO', -120, -12); for (let k = 0; k < 3; k++) g.fillRect(-120 + k * 85, 0, 75, 30); g.restore();
    // cadeira atrás da mesa
    g.fillStyle = '#3a2418'; g.beginPath(); g.roundRect(1600, 1020, 400, 360, 40); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(1630 + i * 68, 1040, 6, 0, 7); g.fill(); }
    // tapete e lixeira no chão
    g.fillStyle = '#4a2a24'; g.beginPath(); g.ellipse(1800, 2140, 1300, 160, 0, 0, 7); g.fill(); g.strokeStyle = '#7a4a3a'; g.lineWidth = 10; g.beginPath(); g.ellipse(1800, 2140, 1240, 140, 0, 0, 7); g.stroke();
    g.fillStyle = '#4a4a44'; g.beginPath(); g.moveTo(560, 1580); g.lineTo(680, 1580); g.lineTo(660, 1760); g.lineTo(580, 1760); g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(ent(560, 680), 1570 - r() * 30, 22, 0, 7); g.fill(); }
    for (let i = 0; i < 6; i++) { g.fillStyle = '#d8d0c0'; g.beginPath(); g.arc(ent(300, 3000), ent(1900, 2150), ent(14, 24), 0, 7); g.fill(); }
  }

  /* ---------- FRENTE: sombra da cadeira do cliente, cantos escuros ---------- */
  function frente(g) {
    // cadeira do cliente em primeiro plano (tampa um pouco o envelope)
    g.fillStyle = '#1e1610'; g.beginPath(); g.roundRect(1380, 1880, 260, 380, 30); g.fill(); g.fillRect(1360, 2050, 300, 40);
    const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  /* ---------- animação: chuva na janela, letreiro piscando, ventilador ---------- */
  const gotas = Array.from({ length: 120 }, () => ({ x: ent(JAN[0], JAN[0] + JAN[2]), y: ent(JAN[1], JAN[1] + JAN[3]), v: ent(500, 900), l: ent(20, 50) }));
  function animarMeio(g, t, vis) {
    const [jx, jy, jw, jh] = JAN;
    g.save(); g.beginPath(); g.rect(jx, jy, jw, jh); g.clip();
    // letreiro HOTEL lá fora, piscando
    const aceso = (Math.sin(t * 2.3) > -.6) && !(t % 7 > 6.6 && t % 7 < 6.8);
    g.fillStyle = aceso ? 'rgba(235,235,235,.9)' : 'rgba(110,110,110,.6)'; g.font = 'bold 54px Georgia';
    'HOTEL'.split('').forEach((l, i) => g.fillText(l, jx + 120, jy + 260 + i * 62));
    if (aceso) { const gr = g.createRadialGradient(jx + 140, jy + 380, 10, jx + 140, jy + 380, 220); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(jx, jy, 400, jh); }
    g.strokeStyle = 'rgba(220,225,230,.45)'; g.lineWidth = 2;
    for (const d of gotas) { const y = jy + ((d.y - jy + t * d.v) % jh); g.beginPath(); g.moveTo(d.x, y); g.lineTo(d.x - 6, y + d.l); g.stroke(); }
    g.restore();
    // sombra do ventilador de teto girando sobre a parede
    g.save(); g.translate(1800, 120); g.rotate(t * 1.2); g.fillStyle = 'rgba(0,0,0,.18)';
    for (let i = 0; i < 4; i++) { g.rotate(PI / 2); g.beginPath(); g.ellipse(170, 0, 170, 26, 0, 0, 7); g.fill(); }
    g.restore();
    g.fillStyle = '#2a2a2a'; g.fillRect(1790, 0, 20, 90); g.beginPath(); g.ellipse(1800, 100, 46, 18, 0, 0, 7); g.fill();
    g.save(); g.translate(1800, 100); g.scale(1, .22); g.rotate(t * 3); g.fillStyle = '#4a4a4a'; for (let i = 0; i < 4; i++) { g.rotate(PI / 2); g.beginPath(); g.ellipse(150, 0, 140, 30, 0, 0, 7); g.fill(); } g.restore();
  }

  return { tipo: '2d', noir: true, nome: 'Caso Noir', largura: W, altura: H, cor: '#0e0e0e', foco: [1800, 1200], itens, fundo, frente, animarMeio };
}
