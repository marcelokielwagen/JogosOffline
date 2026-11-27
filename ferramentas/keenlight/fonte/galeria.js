/* Nível 3 — Galeria Camuflada: salão de museu pintado em Canvas 2D (3600 × 2250).
   Os objetos se escondem DENTRO das pinturas, no papel de parede, nas molduras douradas e nas sombras das estátuas.
   A camada da frente passa verniz e craquelê por cima dos quadros, então o objeto parece pintado junto. */
function criarGaleria() {
  const W = 3600, H = 2250, PI = Math.PI, CHAO = 1600, PF = [1800, 880];
  Tex.sorte(4242); const r = Tex.r, ent = Tex.ent, esco = a => a[(r() * a.length) | 0];
  const lt = (g, cor, w, ...p) => { g.strokeStyle = cor; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const pin = (g, x, y, c, l, a, cor) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = cor; g.beginPath(); g.ellipse(0, 0, c, l, 0, 0, 7); g.fill(); g.restore(); };
  const QUADROS = {
    paisagem: [220, 250, 840, 600], dama: [1150, 300, 330, 460], natureza: [2130, 290, 470, 400], tempestade: [2720, 240, 660, 500],
    coruja: [300, 960, 320, 320], mosaico: [2200, 850, 320, 310], mapa: [720, 990, 280, 260]
  };
  const TAPECARIA = [2740, 860, 620, 470];

  /* ---------- objetos escondidos ---------- */
  const itens = [];
  const item = (id, nome, charada, x, y, raio, desenho, o = {}) => { const it = Object.assign({ id, nome, charada, x, y, raio, desenho, achado: false }, o); itens.push(it); return it; };
  // cada um tem cores "naturais" (para o ícone) e é pintado na cena com as cores de onde se esconde
  const cam = (cores, f) => (g, modo) => f(g, modo === 'icone' ? cores.n : cores.c);
  const novoItem = (id, nome, charada, x, y, raio, cores, f, o) => { const d = cam(cores, f); return item(id, nome, charada, x, y, raio, g => d(g, 'cena'), Object.assign({ icone2d: g => d(g, 'icone') }, o)); };

  novoItem('violino', 'Violino', 'Tem quatro cordas e canta com um arco.', 2440, 520, 44, { n: ['#9a4a1a', '#2a1408', '#e8d0a0'], c: ['#6a3a1a', '#2a1408', '#9a7a4a'] }, (g, [a, b, c]) => {
    g.fillStyle = a; g.beginPath(); g.ellipse(0, 14, 17, 18, 0, 0, 7); g.ellipse(0, -14, 13, 14, 0, 0, 7); g.fill(); g.fillRect(-9, -4, 18, 10);
    g.fillStyle = b; g.fillRect(-2.5, -50, 5, 40); g.beginPath(); g.arc(0, -52, 4, 0, 7); g.fill();
    g.strokeStyle = c; g.lineWidth = .8; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 1.6, -48); g.lineTo(i * 2, 26); g.stroke(); }
    g.fillStyle = b; g.beginPath(); g.ellipse(-6, 6, 1.5, 6, 0, 0, 7); g.ellipse(6, 6, 1.5, 6, 0, 0, 7); g.fill();
  }, { giro: -.5 });
  novoItem('lua', 'Lua crescente', 'Sorri no céu da noite, fininha.', 3260, 330, 30, { n: ['#f2e6b0'], c: ['rgba(214,214,200,.55)'] }, (g, [a]) => {
    g.fillStyle = a; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.arc(9, -5, 21, 0, 7, true); g.fill('evenodd');
  }, { giro: .3 });
  novoItem('peixe', 'Peixe', 'Nada sem parar e não fecha os olhos.', 560, 735, 32, { n: ['#e8843a', '#1a1a1a'], c: ['#5a7a7a', '#2a3a3a'] }, (g, [a, b]) => {
    g.fillStyle = a; g.beginPath(); g.ellipse(0, 0, 22, 10, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(18, 0); g.lineTo(32, -10); g.lineTo(32, 10); g.closePath(); g.fill();
    g.fillStyle = b; g.beginPath(); g.arc(-13, -2, 2, 0, 7); g.fill();
  }, { giro: .08 });
  novoItem('mascara', 'Máscara de teatro', 'Sorri ou chora no palco.', 3165, 1640, 34, { n: ['#f4f0e6', '#2a1f17'], c: ['#cfc6b4', '#8a8070'] }, (g, [a, b]) => {
    g.fillStyle = a; g.beginPath(); g.moveTo(-22, -20); g.quadraticCurveTo(0, -30, 22, -20); g.quadraticCurveTo(24, 10, 0, 28); g.quadraticCurveTo(-24, 10, -22, -20); g.fill();
    g.fillStyle = b; g.beginPath(); g.ellipse(-9, -8, 6, 4, -.2, 0, 7); g.ellipse(9, -8, 6, 4, .2, 0, 7); g.fill();
    g.strokeStyle = b; g.lineWidth = 3; g.beginPath(); g.arc(0, 4, 10, .2, PI - .2); g.stroke();
  }, { giro: -.2 });
  novoItem('ampulheta', 'Ampulheta', 'Conta o tempo com areia.', 2900, 764, 30, { n: ['#c9a24a', '#e8c890', '#d8e8e8'], c: ['#b8892e', '#d8b060', '#c99a3a'] }, (g, [a, b, c]) => {
    g.fillStyle = a; g.fillRect(-14, -26, 28, 5); g.fillRect(-14, 21, 28, 5);
    g.fillStyle = c; g.beginPath(); g.moveTo(-11, -21); g.lineTo(11, -21); g.lineTo(2, 0); g.lineTo(11, 21); g.lineTo(-11, 21); g.lineTo(-2, 0); g.closePath(); g.fill();
    g.fillStyle = b; g.beginPath(); g.moveTo(-7, -12); g.lineTo(7, -12); g.lineTo(0, -2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-10, 20); g.lineTo(10, 20); g.lineTo(0, 10); g.closePath(); g.fill();
    g.strokeStyle = a; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-13, -21); g.lineTo(-13, 21); g.moveTo(13, -21); g.lineTo(13, 21); g.stroke();
  });
  novoItem('leque', 'Leque', 'Abre como um arco e faz vento.', 1330, 640, 34, { n: ['#c83a4a', '#5a2a1a', '#f2d8a0'], c: ['#4a2a3a', '#2a1418', '#6a3a4a'] }, (g, [a, b, c]) => {
    for (let i = 0; i < 9; i++) { const a0 = -PI * .85 + i * PI * .7 / 9; g.fillStyle = i % 2 ? a : c; g.beginPath(); g.moveTo(0, 14); g.arc(0, 14, 34, a0, a0 + PI * .7 / 9); g.closePath(); g.fill(); }
    g.strokeStyle = b; g.lineWidth = 1.2; for (let i = 0; i <= 9; i++) { const a0 = -PI * .85 + i * PI * .7 / 9; g.beginPath(); g.moveTo(0, 14); g.lineTo(Math.cos(a0) * 34, 14 + Math.sin(a0) * 34); g.stroke(); }
    g.fillStyle = b; g.beginPath(); g.arc(0, 14, 3, 0, 7); g.fill();
  }, { giro: .4 });
  novoItem('guardachuva', 'Guarda-chuva', 'Abre quando o céu chora.', 2400, 1080, 30, { n: ['#2a6a9a', '#3a2a1a'], c: ['#b8603a', '#3a2a1a'] }, (g, [a, b]) => {
    g.fillStyle = a; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(-24, -24, 0, -26); g.quadraticCurveTo(24, -24, 26, 0); for (let i = 3; i >= 0; i--) g.quadraticCurveTo(-26 + (i + .5) * 13, -6, -26 + i * 13, 0); g.fill();
    lt(g, b, 2.5, 0, -26, 0, 20); g.strokeStyle = b; g.lineWidth = 2.5; g.beginPath(); g.arc(-5, 20, 5, 0, PI); g.stroke();
  }, { giro: -.1 });
  novoItem('rosa', 'Rosa', 'Bonita, perfumada e com espinhos.', 3060, 1150, 30, { n: ['#c8283a', '#2a6a2a'], c: ['#8a3a3a', '#4a5a3a'] }, (g, [a, b]) => {
    lt(g, b, 3, 0, 4, 2, 34); g.fillStyle = b; g.beginPath(); g.ellipse(8, 22, 8, 4, -.5, 0, 7); g.fill();
    g.fillStyle = a; for (let i = 0; i < 6; i++) { const ang = i * 1.05; g.beginPath(); g.ellipse(Math.cos(ang) * 6, Math.sin(ang) * 5 - 4, 9, 7, ang, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, -4, 6, 0, 5); g.stroke(); g.beginPath(); g.arc(0, -4, 3, 1, 6); g.stroke();
  });
  novoItem('coroa', 'Coroa', 'Fica na cabeça de reis e rainhas.', 1800, 128, 32, { n: ['#e0b040', '#c8283a'], c: ['#b8892e', '#8a5a2a'] }, (g, [a, b]) => {
    g.fillStyle = a; g.beginPath(); g.moveTo(-26, 14); g.lineTo(-26, -10); g.lineTo(-14, 2); g.lineTo(0, -18); g.lineTo(14, 2); g.lineTo(26, -10); g.lineTo(26, 14); g.closePath(); g.fill();
    g.fillStyle = b; for (const x of [-14, 0, 14]) { g.beginPath(); g.arc(x, 8, 3.5, 0, 7); g.fill(); }
    g.fillStyle = a; for (const [x, y] of [[-26, -12], [0, -20], [26, -12]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
  });
  novoItem('sino', 'Sino', 'Badala quando balança.', 925, 1535, 26, { n: ['#c9a24a', '#5a3a1a'], c: ['#a8875a', '#5a4a3a'] }, (g, [a, b]) => {
    g.fillStyle = a; g.beginPath(); g.moveTo(-18, 14); g.quadraticCurveTo(-16, -20, 0, -20); g.quadraticCurveTo(16, -20, 18, 14); g.closePath(); g.fill();
    g.fillRect(-21, 12, 42, 5); g.fillStyle = b; g.beginPath(); g.arc(0, 20, 4, 0, 7); g.fill(); g.strokeStyle = a; g.lineWidth = 3; g.beginPath(); g.arc(0, -22, 4, PI, 0); g.stroke();
  });
  novoItem('chave', 'Chave dourada', 'Pequena, abre portas grandes.', 2645, 1230, 30, { n: ['#d8a838', '#9a7020'], c: ['rgba(196,150,70,.3)', 'rgba(60,20,15,.4)'] }, (g, [a, b]) => {
    g.strokeStyle = a; g.lineWidth = 5; g.beginPath(); g.arc(-18, 0, 9, 0, 7); g.stroke();
    g.fillStyle = a; g.fillRect(-9, -2.5, 36, 5); g.fillRect(18, 2, 4, 8); g.fillRect(24, 2, 4, 6);
    g.fillStyle = b; g.beginPath(); g.arc(-18, 0, 3, 0, 7); g.fill();
  }, { giro: -1.2 });
  novoItem('coruja', 'Coruja', 'Vigia a noite com olhos grandes.', 505, 1060, 30, { n: ['#8a6a4a', '#f2d23a', '#1a1a1a'], c: ['#24302a', '#4a5a3a', '#101410'] }, (g, [a, b, c]) => {
    g.fillStyle = a; g.beginPath(); g.ellipse(0, 6, 16, 22, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-14, -10); g.lineTo(-12, -24); g.lineTo(-4, -14); g.lineTo(4, -14); g.lineTo(12, -24); g.lineTo(14, -10); g.fill();
    g.fillStyle = b; g.beginPath(); g.arc(-6, -8, 5, 0, 7); g.arc(6, -8, 5, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(-6, -8, 2.2, 0, 7); g.arc(6, -8, 2.2, 0, 7); g.fill();
    g.fillStyle = b; g.beginPath(); g.moveTo(-2, -3); g.lineTo(2, -3); g.lineTo(0, 2); g.fill();
  });
  for (const it of itens) it.giroIcone = 0;

  /* ---------- pinturas ---------- */
  function moldura(g, [x, y, w, h], b = 46) {
    const gr = g.createLinearGradient(x - b, y - b, x + w + b, y + h + b); gr.addColorStop(0, '#e6c068'); gr.addColorStop(.35, '#9a6a24'); gr.addColorStop(.6, '#f0d080'); gr.addColorStop(1, '#7a5018');
    g.fillStyle = gr; g.fillRect(x - b, y - b, w + 2 * b, h + 2 * b);
    g.fillStyle = 'rgba(60,35,10,.55)'; g.fillRect(x - b * .45, y - b * .45, w + b * .9, h + b * .9);
    g.fillStyle = gr; g.fillRect(x - b * .38, y - b * .38, w + b * .76, h + b * .76);
    g.fillStyle = '#3a2410'; g.fillRect(x - 6, y - 6, w + 12, h + 12);
    // contas e folhas entalhadas
    g.fillStyle = 'rgba(255,235,170,.7)';
    for (let t = 0; t < 1; t += 18 / (w + 2 * b)) { for (const yy of [y - b * .72, y + h + b * .72]) { g.beginPath(); g.arc(x - b + t * (w + 2 * b), yy, 4, 0, 7); g.fill(); } }
    for (let t = 0; t < 1; t += 18 / (h + 2 * b)) { for (const xx of [x - b * .72, x + w + b * .72]) { g.beginPath(); g.arc(xx, y - b + t * (h + 2 * b), 4, 0, 7); g.fill(); } }
    for (const [cx, cy] of [[x - b * .7, y - b * .7], [x + w + b * .7, y - b * .7], [x - b * .7, y + h + b * .7], [x + w + b * .7, y + h + b * .7]]) {
      g.fillStyle = '#c9963a'; g.beginPath(); g.arc(cx, cy, b * .55, 0, 7); g.fill();
      g.fillStyle = '#f2d890'; for (let i = 0; i < 8; i++) { const a = i * PI / 4; g.beginPath(); g.ellipse(cx + Math.cos(a) * b * .3, cy + Math.sin(a) * b * .3, b * .16, b * .07, a, 0, 7); g.fill(); }
      g.fillStyle = '#8a5a1a'; g.beginPath(); g.arc(cx, cy, b * .12, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - b + 10, y + h + b, w + 2 * b, 16);
  }
  const recorta = (g, [x, y, w, h], f) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); f(x, y, w, h); g.restore(); };
  function pintarPaisagem(g, q) {
    recorta(g, q, (x, y, w, h) => {
      let c = g.createLinearGradient(0, y, 0, y + h * .5); c.addColorStop(0, '#5f7f96'); c.addColorStop(1, '#e8c890'); g.fillStyle = c; g.fillRect(x, y, w, h);
      for (let i = 0; i < 400; i++) pin(g, x + r() * w, y + r() * h * .45, ent(8, 28), ent(2, 5), ent(-.2, .2), `rgba(255,${ent(225, 245) | 0},${ent(200, 230) | 0},${ent(.06, .2)})`);
      for (let k = 0; k < 4; k++) { g.fillStyle = ['#8a8a62', '#6a7448', '#4f5a34', '#3a4428'][k]; g.beginPath(); g.moveTo(x, y + h); for (let i = 0; i <= w; i += 8) g.lineTo(x + i, y + h * (.36 + k * .1) + Math.sin(i * .008 + k * 1.7) * 30 + Math.sin(i * .03 + k) * 8); g.lineTo(x + w, y + h); g.fill(); for (let i = 0; i < 200; i++) pin(g, x + r() * w, y + h * (.42 + k * .1) + r() * h * .2, ent(3, 14), ent(1.5, 4), ent(-.6, .6), `rgba(${k < 2 ? '190,180,120' : '20,30,15'},${ent(.1, .3)})`); }
      // rio serpenteando até a frente (o peixe nada ali)
      g.fillStyle = '#5f7f80'; g.beginPath(); g.moveTo(x + w * .52, y + h * .45);
      g.bezierCurveTo(x + w * .3, y + h * .6, x + w * .65, y + h * .72, x + w * .25, y + h); g.lineTo(x + w * .55, y + h); g.bezierCurveTo(x + w * .78, y + h * .74, x + w * .42, y + h * .6, x + w * .56, y + h * .45); g.fill();
      for (let i = 0; i < 160; i++) pin(g, x + w * ent(.3, .62), y + h * ent(.55, 1), ent(4, 16), ent(1, 2.5), ent(-.2, .2), `rgba(${r() < .5 ? '200,220,210' : '40,60,60'},${ent(.15, .35)})`);
      for (let i = 0; i < 14; i++) { const tx = x + ent(.05, .95) * w, ty = y + h * ent(.45, .75), th = ent(50, 120); g.fillStyle = '#26301c'; g.beginPath(); g.ellipse(tx, ty - th / 2, th * .13, th / 2, 0, 0, 7); g.fill(); }
      g.fillStyle = '#c87a4a'; g.fillRect(x + w * .7, y + h * .46, 46, 30); g.fillStyle = '#7a3020'; g.beginPath(); g.moveTo(x + w * .7 - 6, y + h * .46); g.lineTo(x + w * .7 + 23, y + h * .41); g.lineTo(x + w * .7 + 52, y + h * .46); g.fill();
    });
  }
  function pintarDama(g, q) {
    recorta(g, q, (x, y, w, h) => {
      g.fillStyle = '#2a1e16'; g.fillRect(x, y, w, h);
      let c = g.createRadialGradient(x + w * .5, y + h * .3, 10, x + w * .5, y + h * .4, w); c.addColorStop(0, 'rgba(110,80,50,.8)'); c.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = c; g.fillRect(x, y, w, h);
      // vestido escuro com bordado (o leque some no meio)
      g.fillStyle = '#3a1e2a'; g.beginPath(); g.moveTo(x + w * .15, y + h); g.quadraticCurveTo(x + w * .2, y + h * .5, x + w * .5, y + h * .46); g.quadraticCurveTo(x + w * .8, y + h * .5, x + w * .85, y + h); g.fill();
      for (let i = 0; i < 300; i++) { const px = x + w * ent(.2, .8), py = y + h * ent(.55, 1); g.fillStyle = esco(['rgba(110,50,70,.5)', 'rgba(60,25,40,.6)', 'rgba(140,90,70,.35)']); g.beginPath(); g.arc(px, py, ent(2, 6), 0, 7); g.fill(); }
      for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(150,100,80,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(x + w * .5, y + h * (.62 + k * .07), w * .25, .3, PI - .3); g.stroke(); }
      g.fillStyle = '#d8b090'; g.beginPath(); g.ellipse(x + w * .5, y + h * .3, w * .13, h * .11, 0, 0, 7); g.fill(); g.fillRect(x + w * .46, y + h * .38, w * .08, h * .08);
      g.fillStyle = '#3a2214'; g.beginPath(); g.ellipse(x + w * .5, y + h * .24, w * .17, h * .1, 0, PI, 0); g.fill(); g.beginPath(); g.arc(x + w * .5, y + h * .14, w * .07, 0, 7); g.fill();
      g.fillStyle = '#efe6d0'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(x + w * (.4 + i * .018), y + h * (.46 + Math.sin(i / 11 * PI) * .03), 3.5, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(80,40,30,.6)'; g.beginPath(); g.ellipse(x + w * .46, y + h * .3, 5, 3, 0, 0, 7); g.ellipse(x + w * .54, y + h * .3, 5, 3, 0, 0, 7); g.fill();
      g.fillStyle = '#c99a7a'; g.beginPath(); g.ellipse(x + w * .58, y + h * .73, 16, 10, .4, 0, 7); g.fill();
    });
  }
  function pintarNatureza(g, q) {
    recorta(g, q, (x, y, w, h) => {
      let c = g.createRadialGradient(x + w * .4, y + h * .3, 10, x + w * .5, y + h * .5, w * .8); c.addColorStop(0, '#5a4630'); c.addColorStop(1, '#1a120a'); g.fillStyle = c; g.fillRect(x, y, w, h);
      // cortina marrom pregueada à direita (o violino se mistura nas dobras)
      for (let i = 0; i < 9; i++) { const px = x + w * (.62 + i * .045); const gr = g.createLinearGradient(px, 0, px + w * .045, 0); gr.addColorStop(0, '#3a2010'); gr.addColorStop(.5, '#7a4a24'); gr.addColorStop(1, '#3a2010'); g.fillStyle = gr; g.fillRect(px, y, w * .046, h * .72); }
      g.fillStyle = '#5a3a1e'; g.fillRect(x, y + h * .66, w, h * .34);
      g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(x, y + h * .7); g.bezierCurveTo(x + w * .3, y + h * .62, x + w * .6, y + h * .78, x + w * .8, y + h * .68); g.lineTo(x + w * .85, y + h); g.lineTo(x, y + h); g.fill();
      g.fillStyle = '#7a8a90'; g.beginPath(); g.ellipse(x + w * .26, y + h * .5, 50, 82, 0, 0, 7); g.fill(); g.fillRect(x + w * .26 - 18, y + h * .22, 36, 50);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(x + w * .23, y + h * .45, 9, 36, -.2, 0, 7); g.fill();
      const fruta = (fx, fy, rr, cor) => { const gr = g.createRadialGradient(fx - rr * .4, fy - rr * .4, 2, fx, fy, rr); gr.addColorStop(0, '#fff0b8'); gr.addColorStop(.3, cor); gr.addColorStop(1, '#2a1208'); g.fillStyle = gr; g.beginPath(); g.arc(fx, fy, rr, 0, 7); g.fill(); };
      fruta(x + w * .45, y + h * .72, 34, '#b8402a'); fruta(x + w * .55, y + h * .76, 30, '#c8902a'); fruta(x + w * .5, y + h * .64, 28, '#8a3018'); fruta(x + w * .38, y + h * .77, 22, '#6a8a2a');
      g.fillStyle = '#4a2a50'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(x + w * .62 + (i % 4) * 11, y + h * .78 + (i / 4 | 0) * 9, 7, 0, 7); g.fill(); }
      for (let i = 0; i < 500; i++) pin(g, x + r() * w, y + r() * h, ent(3, 12), ent(1, 2.5), r() * 3, `rgba(${r() < .5 ? '0,0,0' : '255,220,160'},.05)`);
    });
  }
  function pintarTempestade(g, q) {
    recorta(g, q, (x, y, w, h) => {
      let c = g.createLinearGradient(0, y, 0, y + h); c.addColorStop(0, '#1e2a30'); c.addColorStop(.45, '#4a5a5a'); c.addColorStop(.5, '#2a3a3a'); c.addColorStop(1, '#12201e'); g.fillStyle = c; g.fillRect(x, y, w, h);
      for (let i = 0; i < 300; i++) pin(g, x + r() * w, y + r() * h * .45, ent(20, 70), ent(6, 18), ent(-.3, .3), `rgba(${r() < .5 ? '140,150,150' : '20,25,28'},${ent(.08, .25)})`);
      g.fillStyle = 'rgba(230,230,210,.25)'; g.beginPath(); g.ellipse(x + w * .82, y + h * .2, 70, 40, 0, 0, 7); g.fill();   // clarão no céu, perto da lua
      for (let i = 0; i < 500; i++) pin(g, x + r() * w, y + h * ent(.5, 1), ent(10, 40), ent(2, 5), ent(-.4, .4), `rgba(${r() < .3 ? '220,230,220' : '10,30,30'},${ent(.1, .35)})`);
      // barco inclinado
      g.save(); g.translate(x + w * .4, y + h * .58); g.rotate(-.2);
      g.fillStyle = '#2a1a10'; g.beginPath(); g.moveTo(-90, 0); g.lineTo(90, 0); g.lineTo(70, 30); g.lineTo(-70, 30); g.fill();
      lt(g, '#2a1a10', 5, 0, 0, 0, -160); g.fillStyle = '#c8bca0'; g.beginPath(); g.moveTo(4, -150); g.quadraticCurveTo(70, -90, 6, -10); g.fill(); g.fillStyle = '#b8ac90'; g.beginPath(); g.moveTo(-4, -140); g.quadraticCurveTo(-60, -80, -4, -20); g.fill();
      g.restore();
      g.strokeStyle = 'rgba(240,240,220,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w * .2, y); g.lineTo(x + w * .23, y + h * .12); g.lineTo(x + w * .19, y + h * .16); g.lineTo(x + w * .24, y + h * .32); g.stroke();
    });
  }
  function pintarFloresta(g, q) {
    recorta(g, q, (x, y, w, h) => {
      g.fillStyle = '#0f1612'; g.fillRect(x, y, w, h);
      let c = g.createRadialGradient(x + w * .7, y + h * .25, 5, x + w * .7, y + h * .25, w * .6); c.addColorStop(0, 'rgba(160,170,140,.5)'); c.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = c; g.fillRect(x, y, w, h);
      g.fillStyle = '#d8d8b8'; g.beginPath(); g.arc(x + w * .72, y + h * .22, 18, 0, 7); g.fill();
      for (let i = 0; i < 9; i++) { const tx = x + ent(0, w), tw = ent(14, 30); g.fillStyle = esco(['#1a2418', '#202a1e', '#141c12']); g.fillRect(tx, y, tw, h); for (let k = 0; k < 4; k++) lt(g, '#1a2418', ent(4, 8), tx + tw / 2, y + ent(.1, .7) * h, tx + tw / 2 + ent(-80, 80), y + ent(0, .5) * h); }
      for (let i = 0; i < 400; i++) pin(g, x + r() * w, y + r() * h, ent(3, 12), ent(1, 4), r() * 3, `rgba(${esco(['40,60,40', '60,80,50', '10,15,10'])},${ent(.2, .5)})`);
      lt(g, '#24302a', 9, x, y + h * .4, x + w * .85, y + h * .33);   // galho onde a coruja pousa
    });
  }
  function pintarMosaico(g, q) {
    recorta(g, q, (x, y, w, h) => {
      g.fillStyle = '#2a1e16'; g.fillRect(x, y, w, h);
      const cores = ['#b8603a', '#d8a04a', '#6a3a24', '#3a5a5a', '#e8d0a0', '#8a3a2a', '#c87a4a'];
      for (let i = 0; i < 140; i++) { const cx = x + r() * w, cy = y + r() * h, rr = ent(10, 36); g.fillStyle = esco(cores); g.beginPath(); const n = 3 + (r() * 4 | 0); for (let k = 0; k < n; k++) { const a = k / n * PI * 2 + r(); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); }
      g.strokeStyle = 'rgba(20,10,5,.7)'; g.lineWidth = 3; for (let i = 0; i < 26; i++) { g.beginPath(); g.moveTo(x + r() * w, y + r() * h); g.lineTo(x + r() * w, y + r() * h); g.stroke(); }
      for (let k = 0; k < 6; k++) { g.fillStyle = esco(cores); g.beginPath(); g.arc(x + r() * w, y + r() * h, ent(20, 40), PI, 0); g.fill(); }   // meias-luas que parecem guarda-chuvas
    });
  }
  function pintarMapa(g, q) {
    recorta(g, q, (x, y, w, h) => {
      g.fillStyle = '#d8c090'; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(90,60,30,.6)'; g.lineWidth = 2; g.fillStyle = 'rgba(150,110,60,.35)';
      for (let k = 0; k < 3; k++) { g.beginPath(); const cx = x + ent(.2, .8) * w, cy = y + ent(.2, .8) * h; for (let a = 0; a < 6.3; a += .25) { const rr = ent(25, 60); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .7); } g.closePath(); g.fill(); g.stroke(); }
      g.save(); g.translate(x + 50, y + 50); g.strokeStyle = 'rgba(60,40,20,.7)'; for (let a = 0; a < 8; a++) { g.rotate(PI / 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, a % 2 ? 16 : 30); g.stroke(); } g.restore();
    });
  }
  function ornamento(g, cx, cy, s, cor) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = cor; g.strokeStyle = cor; g.lineWidth = 2.4;
    for (const l of [1, -1]) { g.save(); g.scale(l, 1);
      g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(26, -48, 34, -20, 14, -4); g.bezierCurveTo(30, 6, 40, 30, 18, 46); g.bezierCurveTo(10, 52, 4, 56, 0, 64); g.stroke();
      g.beginPath(); g.moveTo(10, -30); g.bezierCurveTo(40, -46, 56, -20, 44, 0); g.bezierCurveTo(36, 12, 22, 6, 26, -6); g.fill();
      g.beginPath(); g.moveTo(8, 22); g.bezierCurveTo(36, 18, 52, 40, 36, 56); g.bezierCurveTo(26, 62, 18, 52, 24, 44); g.fill(); g.restore(); }
    g.beginPath(); g.ellipse(0, 6, 8, 16, 0, 0, 7); g.fill(); g.restore();
  }

  /* ---------- FUNDO ---------- */
  function fundo(g) {
    // parede bordô com damasco
    let c = g.createLinearGradient(0, 0, 0, CHAO); c.addColorStop(0, '#4a1a1c'); c.addColorStop(1, '#5e2224'); g.fillStyle = c; g.fillRect(0, 0, W, CHAO);
    for (let y = 140; y < 1400; y += 170) for (let x = (y / 170 % 2) * 110; x < W; x += 220) { ornamento(g, x, y, .9, 'rgba(25,5,8,.35)'); ornamento(g, x - 1.5, y - 1.5, .9, 'rgba(196,150,70,.16)'); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,220,190'},${ent(.02, .06)})`; g.fillRect(r() * W, r() * CHAO, 2, 2); }
    // luz quente de cima
    c = g.createRadialGradient(1800, 300, 100, 1800, 500, 1900); c.addColorStop(0, 'rgba(255,210,150,.22)'); c.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = c; g.fillRect(0, 0, W, CHAO);
    // sanca dourada e lambri
    c = g.createLinearGradient(0, 0, 0, 100); c.addColorStop(0, '#6a4418'); c.addColorStop(.5, '#d8b060'); c.addColorStop(1, '#5a3810'); g.fillStyle = c; g.fillRect(0, 0, W, 100);
    for (let x = 0; x < W; x += 40) { g.fillStyle = 'rgba(255,235,170,.5)'; g.fillRect(x, 70, 20, 14); }
    g.fillStyle = '#2e1a10'; g.fillRect(0, 1380, W, CHAO - 1380);
    for (let x = 30; x < W; x += 300) { g.fillStyle = '#3a2214'; g.fillRect(x, 1410, 260, 160); g.strokeStyle = 'rgba(255,200,120,.18)'; g.lineWidth = 3; g.strokeRect(x + 14, 1424, 232, 132); }
    g.fillStyle = '#c9963a'; g.fillRect(0, 1376, W, 10);
    // arco central com a sala seguinte
    const ax0 = 1560, ax1 = 2040, ay = 560;
    g.save(); g.beginPath(); g.moveTo(ax0, CHAO); g.lineTo(ax0, ay); g.arc((ax0 + ax1) / 2, ay, (ax1 - ax0) / 2, PI, 0); g.lineTo(ax1, CHAO); g.closePath(); g.clip();
    { // sala seguinte em perspectiva: parede do fundo, paredes laterais e chão quadriculado
      const bx0 = 1690, bx1 = 1910, by0 = 760, by1 = 1180;
      c = g.createLinearGradient(0, 300, 0, CHAO); c.addColorStop(0, '#8a3a34'); c.addColorStop(1, '#6a2a26'); g.fillStyle = c; g.fillRect(ax0, 300, ax1 - ax0, CHAO - 300);
      g.fillStyle = '#7a302c'; g.beginPath(); g.moveTo(ax0, 300); g.lineTo(bx0, by0 - 200); g.lineTo(bx0, by1); g.lineTo(ax0, CHAO); g.fill();
      g.fillStyle = '#5e2422'; g.beginPath(); g.moveTo(ax1, 300); g.lineTo(bx1, by0 - 200); g.lineTo(bx1, by1); g.lineTo(ax1, CHAO); g.fill();
      g.fillStyle = '#9a4a40'; g.fillRect(bx0, by0 - 200, bx1 - bx0, by1 - by0 + 200);
      g.fillStyle = '#3a1a14'; g.fillRect(1770, 1010, 60, 170); g.fillStyle = '#c9963a'; g.fillRect(1766, 1006, 68, 6);
      g.fillStyle = '#c9963a'; g.fillRect(1735, 840, 130, 100); g.fillStyle = '#5a6a5a'; g.fillRect(1745, 850, 110, 80);
      for (const [x0, x1, y0, y1] of [[ax0 + 20, bx0 - 10, 860, 960], [bx1 + 10, ax1 - 20, 860, 960]]) { g.fillStyle = '#c9963a'; g.beginPath(); g.moveTo(x0, y0 - 30); g.lineTo(x1, y0 + 10); g.lineTo(x1, y1 - 10); g.lineTo(x0, y1 + 40); g.fill(); g.fillStyle = '#4a4a3a'; g.beginPath(); g.moveTo(x0 + 8, y0 - 18); g.lineTo(x1 - 4, y0 + 16); g.lineTo(x1 - 4, y1 - 16); g.lineTo(x0 + 8, y1 + 28); g.fill(); }
      const N = 8, M = 6;
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
        const f0 = Math.pow(j / M, 1.5), f1 = Math.pow((j + 1) / M, 1.5);
        const yA = by1 + (CHAO - by1) * f0, yB = by1 + (CHAO - by1) * f1, xl = t => bx0 + (ax0 - bx0) * t, xr = t => bx1 + (ax1 - bx1) * t;
        const p = (t, k) => xl(t) + (xr(t) - xl(t)) * k / N;
        g.fillStyle = (i + j) % 2 ? '#e8dfcc' : '#2a2a24'; g.beginPath(); g.moveTo(p(f0, i), yA); g.lineTo(p(f0, i + 1), yA); g.lineTo(p(f1, i + 1), yB); g.lineTo(p(f1, i), yB); g.closePath(); g.fill();
      }
      c = g.createRadialGradient(1800, 900, 10, 1800, 900, 520); c.addColorStop(0, 'rgba(255,230,180,.45)'); c.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = c; g.fillRect(ax0, 300, ax1 - ax0, CHAO);
    }
    g.restore();
    g.strokeStyle = '#c9963a'; g.lineWidth = 26; g.beginPath(); g.moveTo(ax0 - 13, CHAO); g.lineTo(ax0 - 13, ay); g.arc((ax0 + ax1) / 2, ay, (ax1 - ax0) / 2 + 13, PI, 0); g.lineTo(ax1 + 13, CHAO); g.stroke();
    g.strokeStyle = '#7a5018'; g.lineWidth = 6; g.beginPath(); g.moveTo(ax0 - 26, CHAO); g.lineTo(ax0 - 26, ay); g.arc((ax0 + ax1) / 2, ay, (ax1 - ax0) / 2 + 26, PI, 0); g.lineTo(ax1 + 26, CHAO); g.stroke();
    g.fillStyle = '#e8c870'; g.beginPath(); g.moveTo(1770, ay - 270); g.lineTo(1830, ay - 270); g.lineTo(1815, ay - 220); g.lineTo(1785, ay - 220); g.fill();   // pedra-chave
    // colunas de mármore
    for (const cx of [90, 3510, 1470, 2130]) {
      const cw = cx === 1470 || cx === 2130 ? 70 : 120, top = cx === 1470 || cx === 2130 ? 400 : 100;
      c = g.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0); c.addColorStop(0, '#9a9080'); c.addColorStop(.35, '#f4eee2'); c.addColorStop(1, '#8a8070'); g.fillStyle = c; g.fillRect(cx - cw / 2, top, cw, CHAO - top);
      for (let k = 0; k < 5; k++) lt(g, 'rgba(120,110,100,.3)', 2, cx - cw / 2 + (k + .5) * cw / 5, top, cx - cw / 2 + (k + .5) * cw / 5, CHAO);
      for (let i = 0; i < 20; i++) lt(g, 'rgba(140,130,120,.25)', 1, cx + ent(-cw / 2, cw / 2), top + r() * (CHAO - top), cx + ent(-cw / 2, cw / 2), top + r() * (CHAO - top));
      g.fillStyle = '#d8b060'; g.fillRect(cx - cw / 2 - 12, top, cw + 24, 26); g.fillRect(cx - cw / 2 - 12, CHAO - 30, cw + 24, 30);
    }
    // arandelas (as chamas são animadas)
    for (const sx of [1380, 2220]) { g.fillStyle = '#c9963a'; g.beginPath(); g.ellipse(sx, 900, 22, 34, 0, 0, 7); g.fill(); lt(g, '#a87a2a', 6, sx, 920, sx, 960, sx + 30, 960, sx + 30, 930); g.fillStyle = '#f0e6cc'; g.fillRect(sx + 24, 890, 12, 40); }
    // quadros
    const Qs = QUADROS;
    moldura(g, Qs.paisagem); pintarPaisagem(g, Qs.paisagem);
    moldura(g, Qs.dama, 40); pintarDama(g, Qs.dama);
    moldura(g, Qs.natureza, 40); pintarNatureza(g, Qs.natureza);
    moldura(g, Qs.tempestade); pintarTempestade(g, Qs.tempestade);
    moldura(g, Qs.coruja, 34); pintarFloresta(g, Qs.coruja);
    moldura(g, Qs.mosaico, 34); pintarMosaico(g, Qs.mosaico);
    moldura(g, Qs.mapa, 30); pintarMapa(g, Qs.mapa);
    // plaquinhas
    for (const q of Object.values(Qs)) { g.fillStyle = '#c9a24a'; g.fillRect(q[0] + q[2] / 2 - 40, q[1] + q[3] + 70, 80, 22); g.fillStyle = '#3a2410'; for (let i = 0; i < 3; i++) g.fillRect(q[0] + q[2] / 2 - 30, q[1] + q[3] + 76 + i * 5, 60 - i * 14, 2); }
    // tapeçaria com flores
    const [tx, ty, tw, th] = TAPECARIA;
    lt(g, '#8a5a1a', 10, tx - 30, ty - 10, tx + tw + 30, ty - 10);
    g.fillStyle = '#5a4a3a'; g.fillRect(tx, ty, tw, th);
    g.fillStyle = '#6a5a40'; g.fillRect(tx + 24, ty + 24, tw - 48, th - 48);
    for (let i = 0; i < 180; i++) { const fx = tx + ent(30, tw - 30), fy = ty + ent(30, th - 30); g.fillStyle = esco(['#8a3a3a', '#a85a3a', '#c8a060', '#4a5a3a', '#7a2a2a']); for (let p = 0; p < 5; p++) { g.beginPath(); g.ellipse(fx + Math.cos(p * 1.26) * 6, fy + Math.sin(p * 1.26) * 6, 6, 3.5, p * 1.26, 0, 7); g.fill(); } }
    for (let i = 0; i < 70; i++) { const fx = tx + ent(30, tw - 30), fy = ty + ent(30, th - 30); g.strokeStyle = '#4a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx + 15, fy - 20, fx + ent(-20, 30), fy - 30); g.stroke(); }
    for (let x = tx; x < tx + tw; x += 8) { g.strokeStyle = '#c8a060'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, ty + th); g.lineTo(x + ent(-2, 2), ty + th + 26); g.stroke(); }
    for (let i = 0; i < 7000; i++) { g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,230,190'},.06)`; g.fillRect(tx + r() * tw, ty + r() * th, 1.5, 3); }

    // chão de mármore em xadrez com perspectiva
    c = g.createLinearGradient(0, CHAO, 0, H); c.addColorStop(0, '#3a3228'); c.addColorStop(1, '#1e1a14'); g.fillStyle = c; g.fillRect(0, CHAO, W, H - CHAO);
    const linhas = []; for (let k = 0; k <= 9; k++) linhas.push(CHAO + (H - CHAO) * Math.pow(k / 9, 1.6));
    for (let k = 0; k < 9; k++) for (let i = -14; i < 14; i++) {
      const y0 = linhas[k], y1 = linhas[k + 1], f0 = (y0 - PF[1]) / (H - PF[1]), f1 = (y1 - PF[1]) / (H - PF[1]), L = 300;
      g.fillStyle = (i + k) % 2 ? '#e8dfcc' : '#2a2a24'; g.beginPath();
      g.moveTo(PF[0] + i * L * f0 * 1.4, y0); g.lineTo(PF[0] + (i + 1) * L * f0 * 1.4, y0); g.lineTo(PF[0] + (i + 1) * L * f1 * 1.4, y1); g.lineTo(PF[0] + i * L * f1 * 1.4, y1); g.closePath(); g.fill();
    }
    for (let i = 0; i < 260; i++) lt(g, `rgba(${r() < .5 ? '140,130,110' : '250,245,230'},.18)`, 1.2, ent(0, W), ent(CHAO, H), ent(0, W), ent(CHAO, H));
    c = g.createLinearGradient(0, CHAO, 0, CHAO + 300); c.addColorStop(0, 'rgba(255,220,170,.2)'); c.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = c; g.fillRect(0, CHAO, W, 300);
    g.fillStyle = 'rgba(20,10,5,.5)'; g.fillRect(0, CHAO, W, 10);

    // vitrine com peças (o sino fica no meio dos vasos)
    const vx = 700, vy = 1290, vw = 340, vh = 410;
    g.fillStyle = '#3a2214'; g.fillRect(vx - 14, vy - 14, vw + 28, vh + 28); g.fillStyle = '#5a3a24'; g.fillRect(vx, vy, vw, vh);
    for (const sy of [vy + 130, vy + 270]) { g.fillStyle = '#7a5a3a'; g.fillRect(vx, sy, vw, 10); }
    const vaso = (x, y, s, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x - 10 * s, y); g.quadraticCurveTo(x - 28 * s, y - 30 * s, x - 10 * s, y - 60 * s); g.lineTo(x - 12 * s, y - 72 * s); g.lineTo(x + 12 * s, y - 72 * s); g.lineTo(x + 10 * s, y - 60 * s); g.quadraticCurveTo(x + 28 * s, y - 30 * s, x + 10 * s, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x - 12 * s, y - 50 * s, 5 * s, 30 * s); };
    vaso(vx + 60, vy + 130, 1.2, '#2a5a6a'); vaso(vx + 160, vy + 130, 1.4, '#a8875a'); vaso(vx + 270, vy + 130, 1.1, '#6a2a2a');
    vaso(vx + 80, vy + 270, .9, '#a8875a'); vaso(vx + 280, vy + 270, 1, '#8a7a5a');
    g.fillStyle = '#9a8a6a'; g.beginPath(); g.arc(vx + 150, vy + 245, 22, 0, 7); g.fill(); g.fillRect(vx + 140, vy + 255, 20, 15);
    vaso(vx + 70, vy + 410, 1.3, '#4a3a2a'); vaso(vx + 260, vy + 410, 1.2, '#a8875a'); g.fillStyle = '#b8a888'; g.fillRect(vx + 140, vy + 340, 60, 70);
    // bancos, postes com corda, vaso grande, plantas, busto e estátua
    const poste = (x, y) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y + 4, 34, 9, 0, 0, 7); g.fill(); g.fillStyle = '#c9963a'; g.beginPath(); g.ellipse(x, y, 26, 7, 0, 0, 7); g.fill(); g.fillRect(x - 5, y - 130, 10, 130); g.beginPath(); g.arc(x, y - 136, 11, 0, 7); g.fill(); };
    const corda = (x0, x1, y) => { g.strokeStyle = '#8a1a20'; g.lineWidth = 10; g.beginPath(); g.moveTo(x0, y - 120); g.quadraticCurveTo((x0 + x1) / 2, y - 60, x1, y - 120); g.stroke(); g.strokeStyle = 'rgba(255,150,150,.3)'; g.lineWidth = 3; g.stroke(); };
    // busto em pedestal (à esquerda do arco)
    const pX = 1270, pY = 1780;
    c = g.createLinearGradient(pX - 70, 0, pX + 70, 0); c.addColorStop(0, '#9a9080'); c.addColorStop(.4, '#f2ece0'); c.addColorStop(1, '#7a7060'); g.fillStyle = c;
    g.fillRect(pX - 60, pY - 330, 120, 330); g.fillRect(pX - 80, pY - 350, 160, 26); g.fillRect(pX - 80, pY - 24, 160, 24);
    g.beginPath(); g.moveTo(pX - 70, pY - 350); g.quadraticCurveTo(pX - 60, pY - 440, pX, pY - 450); g.quadraticCurveTo(pX + 60, pY - 440, pX + 70, pY - 350); g.fill();
    g.beginPath(); g.ellipse(pX, pY - 520, 46, 60, 0, 0, 7); g.fill(); g.fillRect(pX - 20, pY - 470, 40, 30);
    g.beginPath(); g.moveTo(pX - 90, pY - 360); g.quadraticCurveTo(pX - 92, pY - 430, pX - 30, pY - 448); g.lineTo(pX + 30, pY - 448); g.quadraticCurveTo(pX + 92, pY - 430, pX + 90, pY - 360); g.closePath(); g.fill();
    g.fillStyle = 'rgba(110,100,90,.45)'; g.beginPath(); g.moveTo(pX - 4, pY - 530); g.lineTo(pX + 8, pY - 505); g.lineTo(pX - 2, pY - 503); g.fill(); g.fillRect(pX - 22, pY - 545, 14, 4); g.fillRect(pX + 6, pY - 545, 14, 4); g.fillStyle = c;
    g.fillStyle = 'rgba(120,110,100,.35)'; g.beginPath(); g.ellipse(pX + 18, pY - 515, 18, 50, 0, 0, 7); g.fill();
    // estátua de corpo inteiro (à direita, na frente da tapeçaria) e a máscara na sombra do pedestal
    const sX = 3150, sY = 1720;
    c = g.createLinearGradient(sX - 90, 0, sX + 90, 0); c.addColorStop(0, '#8a8070'); c.addColorStop(.45, '#efe8da'); c.addColorStop(1, '#6a6050'); g.fillStyle = c;
    g.fillRect(sX - 110, sY - 160, 220, 160); g.fillRect(sX - 130, sY - 180, 260, 26);
    g.beginPath(); g.moveTo(sX - 60, sY - 180); g.quadraticCurveTo(sX - 80, sY - 420, sX - 40, sY - 560); g.lineTo(sX + 40, sY - 560); g.quadraticCurveTo(sX + 90, sY - 400, sX + 70, sY - 180); g.closePath(); g.fill();
    for (let k = 0; k < 9; k++) lt(g, 'rgba(110,100,90,.35)', 4, sX - 50 + k * 13, sY - 190, sX - 30 + k * 8, sY - 520);
    g.beginPath(); g.ellipse(sX, sY - 610, 36, 46, 0, 0, 7); g.fill(); g.fillRect(sX - 14, sY - 570, 28, 20);
    lt(g, '#d8d0c0', 22, sX + 34, sY - 520, sX + 80, sY - 430, sX + 60, sY - 380);
    g.fillStyle = 'rgba(40,30,25,.55)'; g.beginPath(); g.ellipse(sX + 10, sY - 70, 120, 70, 0, 0, 7); g.fill();   // sombra no pedestal
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(sX + 40, sY + 6, 170, 26, 0, 0, 7); g.fill();
    // vaso grande, plantas, banco e postes
    const urna = (x, y) => { c = g.createLinearGradient(x - 60, 0, x + 60, 0); c.addColorStop(0, '#5a3a24'); c.addColorStop(.4, '#b87a4a'); c.addColorStop(1, '#4a2a18'); g.fillStyle = c; g.beginPath(); g.moveTo(x - 30, y); g.quadraticCurveTo(x - 80, y - 90, x - 34, y - 190); g.lineTo(x - 44, y - 210); g.lineTo(x + 44, y - 210); g.lineTo(x + 34, y - 190); g.quadraticCurveTo(x + 80, y - 90, x + 30, y); g.closePath(); g.fill(); g.fillStyle = '#2a1a10'; for (let k = 0; k < 3; k++) g.fillRect(x - 50, y - 150 + k * 40, 100, 4); };
    urna(2330, 1760);
    const planta = (x, y, s) => { g.fillStyle = '#6a3a24'; g.beginPath(); g.moveTo(x - 60 * s, y - 120 * s); g.lineTo(x + 60 * s, y - 120 * s); g.lineTo(x + 44 * s, y); g.lineTo(x - 44 * s, y); g.closePath(); g.fill(); for (let i = 0; i < 26; i++) { const a = -PI / 2 + ent(-1.3, 1.3), L = ent(140, 260) * s; g.strokeStyle = esco(['#2a4a24', '#3a5a2a', '#1e3a1a']); g.lineWidth = 6 * s; g.beginPath(); g.moveTo(x, y - 120 * s); g.quadraticCurveTo(x + Math.cos(a) * L * .4, y - 120 * s - L * .7, x + Math.cos(a) * L, y - 120 * s + Math.sin(a) * L * .5); g.stroke(); } };
    planta(150, 1900, 1.2); planta(3450, 1960, 1.3);
    const bancoY = 1980; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(1800, bancoY + 10, 340, 34, 0, 0, 7); g.fill();
    g.fillStyle = '#4a2a18'; for (const x of [1520, 2060]) g.fillRect(x, bancoY - 90, 22, 90);
    g.fillStyle = '#7a1a22'; g.beginPath(); g.roundRect(1480, bancoY - 140, 640, 60, 20); g.fill(); g.fillStyle = 'rgba(255,150,150,.18)'; g.fillRect(1500, bancoY - 136, 600, 12);
    for (let i = 0; i < 10; i++) { g.fillStyle = '#c9963a'; g.beginPath(); g.arc(1510 + i * 64, bancoY - 110, 4, 0, 7); g.fill(); }
    for (const [x0, x1, y] of [[260, 700, 1860], [700, 1140, 1860], [2460, 2900, 1860]]) { corda(x0, x1, y); }
    for (const x of [260, 700, 1140, 2460, 2900]) poste(x, 1860);
    // lustre (a coroa fica em cima dele, dourado no dourado)
    lt(g, '#5a3a14', 6, 1800, 0, 1800, 150);
    g.fillStyle = '#c9963a'; g.beginPath(); g.ellipse(1800, 250, 150, 30, 0, 0, 7); g.fill(); g.fillRect(1785, 140, 30, 110);
    g.beginPath(); g.ellipse(1800, 160, 40, 14, 0, 0, 7); g.fill();
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, x = 1800 + Math.cos(a) * 150, y = 250 + Math.sin(a) * 30; lt(g, '#b8862a', 6, 1800, 250, x, y + 20, x, y - 10); g.fillStyle = '#f0e6cc'; g.fillRect(x - 6, y - 40, 12, 30); }
    for (let i = 0; i < 40; i++) { const a = r() * PI * 2; g.fillStyle = 'rgba(240,250,255,.8)'; g.beginPath(); g.moveTo(1800 + Math.cos(a) * 130, 280 + Math.sin(a) * 26); g.lineTo(1800 + Math.cos(a) * 130 - 4, 300 + Math.sin(a) * 26); g.lineTo(1800 + Math.cos(a) * 130 + 4, 300 + Math.sin(a) * 26); g.fill(); }
  }

  /* ---------- FRENTE: verniz e craquelê por cima dos quadros, vidro da vitrine ---------- */
  function frente(g) {
    for (const q of [...Object.values(QUADROS), TAPECARIA]) {
      const [x, y, w, h] = q;
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      const v = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .2, x + w / 2, y + h / 2, Math.max(w, h) * .7); v.addColorStop(0, 'rgba(255,220,150,.04)'); v.addColorStop(1, 'rgba(40,20,0,.32)'); g.fillStyle = v; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = .9;
      for (let i = 0; i < w * h / 2500; i++) { let px = x + r() * w, py = y + r() * h; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += ent(-14, 14); py += ent(-14, 14); g.lineTo(px, py); } g.stroke(); }
      const br = g.createLinearGradient(x, y, x + w, y + h); br.addColorStop(0, 'rgba(255,240,210,.12)'); br.addColorStop(.3, 'rgba(255,240,210,0)'); g.fillStyle = br; g.fillRect(x, y, w, h);
      g.restore();
    }
    // vidro da vitrine
    const vx = 700, vy = 1290, vw = 340, vh = 410;
    g.fillStyle = 'rgba(200,220,230,.12)'; g.fillRect(vx, vy, vw, vh);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(vx + 40, vy); g.lineTo(vx + 120, vy); g.lineTo(vx + 20, vy + vh); g.lineTo(vx - 60 + 60, vy + vh); g.fill();
    lt(g, '#3a2214', 10, vx + vw / 2, vy, vx + vw / 2, vy + vh);
    // a folha da planta passa por cima da beira do quadro da coruja
    g.strokeStyle = '#2a4a24'; g.lineWidth = 9; g.beginPath(); g.moveTo(150, 1780); g.quadraticCurveTo(200, 1300, 420, 1230); g.stroke();
  }

  /* ---------- animação: chamas, brilho do lustre e poeira na luz do arco ---------- */
  const chamas = [[1410, 882], [2250, 882], ...Array.from({ length: 9 }, (_, i) => { const a = i / 9 * PI * 2; return [1800 + Math.cos(a) * 150, 250 + Math.sin(a) * 30 - 46]; })];
  const poeira = Array.from({ length: 70 }, () => ({ x: ent(1560, 2040), y: ent(500, 1600), f: r() * 9 }));
  function animarMeio(g, t) {
    for (const [x, y] of chamas) {
      const k = 1 + Math.sin(t * 11 + x) * .12 + Math.sin(t * 17 + y) * .08;
      const gr = g.createRadialGradient(x, y, 0, x, y, 120 * k); gr.addColorStop(0, 'rgba(255,200,120,.35)'); gr.addColorStop(1, 'rgba(255,180,90,0)');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - 130, y - 130, 260, 260); g.restore();
      g.fillStyle = '#ffd890'; g.beginPath(); g.ellipse(x, y - 8 * k, 5, 12 * k, Math.sin(t * 6 + x) * .15, 0, 7); g.fill(); g.fillStyle = '#fff6d8'; g.beginPath(); g.ellipse(x, y - 5, 2.5, 6, 0, 0, 7); g.fill();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of poeira) { const y = p.y - ((t * 8 + p.f * 50) % 400), x = p.x + Math.sin(t * .4 + p.f) * 20, a = .4 + Math.sin(t + p.f) * .3; g.fillStyle = `rgba(255,235,190,${a * .5})`; g.beginPath(); g.arc(x, y < 500 ? y + 1100 : y, 2.5, 0, 7); g.fill(); }
    g.restore();
  }
  function animarTopo(g, t) {
    // reflexo que passa no vidro da vitrine de vez em quando
    const u = (t % 9) / 9; if (u < .25) { const x = 700 + u / .25 * 500 - 100; g.save(); g.beginPath(); g.rect(700, 1290, 340, 410); g.clip(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x, 1290); g.lineTo(x + 50, 1290); g.lineTo(x - 70, 1700); g.lineTo(x - 120, 1700); g.fill(); g.restore(); }
    // brilho no cristal do lustre
    for (let i = 0; i < 6; i++) { const a = t * .3 + i, x = 1800 + Math.cos(a) * 130, y = 290 + Math.sin(a) * 26, b = Math.max(0, Math.sin(t * 3 + i * 2)); if (b < .5) continue; g.fillStyle = `rgba(255,255,255,${b})`; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 2, y); g.lineTo(x, y + 10); g.lineTo(x - 2, y); g.fill(); g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x, y + 2); g.lineTo(x + 10, y); g.lineTo(x, y - 2); g.fill(); }
  }

  return { tipo: '2d', nome: 'Galeria Camuflada', largura: W, altura: H, cor: '#1a0e0c', foco: [1800, 900], itens, fundo, frente, animarMeio, animarTopo };
}
