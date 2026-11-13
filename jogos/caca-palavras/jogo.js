// Caça-Palavras: cada jogo sorteia um tema, 8 palavras e monta um quadro 10x10.
(() => {
  const $ = id => document.getElementById(id);
  const N = 10, QTD = 8;
  const TEMAS = {
    'Animais': 'GATO CACHORRO CAVALO MACACO GIRAFA ELEFANTE TIGRE LEAO ZEBRA COELHO PATO GALINHA OVELHA URSO LOBO RAPOSA JACARE TUCANO ARARA BALEIA GOLFINHO TARTARUGA FORMIGA ABELHA COBRA SAPO',
    'Frutas': 'BANANA LARANJA ABACAXI MORANGO MELANCIA UVA MANGA GOIABA LIMAO PERA CAJU COCO MAMAO AMEIXA KIWI FIGO JABUTICABA ACEROLA PESSEGO CEREJA MELAO TANGERINA AMORA PITANGA',
    'Cores': 'AZUL VERDE AMARELO VERMELHO ROXO ROSA LARANJA PRETO BRANCO CINZA MARROM DOURADO PRATA BEGE LILAS VIOLETA TURQUESA ANIL',
    'Comida': 'ARROZ FEIJAO MACARRAO PIZZA SALADA SOPA QUEIJO PRESUNTO BOLO PUDIM FAROFA CUSCUZ TAPIOCA PASTEL COXINHA LASANHA OMELETE BISCOITO SORVETE PIPOCA BRIGADEIRO',
    'Corpo': 'OLHO NARIZ BOCA ORELHA OMBRO PERNA JOELHO DEDO UNHA CABELO BARRIGA COSTAS LINGUA DENTE COTOVELO TORNOZELO PEITO QUEIXO TESTA PULSO CINTURA',
    'Casa': 'SALA QUARTO COZINHA BANHEIRO JANELA PORTA TELHADO GARAGEM JARDIM QUINTAL SOFA CAMA MESA CADEIRA ARMARIO ESPELHO TAPETE CORTINA FOGAO VARANDA ESCADA',
    'Natureza': 'MONTANHA FLORESTA RIO LAGO MAR PRAIA CACHOEIRA DESERTO ILHA VULCAO CAVERNA NUVEM CHUVA VENTO TROVAO ARVORE FLOR PEDRA AREIA ESTRELA LUA SOL',
    'Brasil': 'BAHIA CEARA PARANA GOIAS AMAZONAS ACRE PIAUI SERGIPE ALAGOAS RORAIMA TOCANTINS AMAPA MARANHAO PARAIBA RONDONIA RECIFE NATAL MANAUS BELEM CURITIBA SALVADOR FORTALEZA BRASILIA',
    'Profissões': 'MEDICO PROFESSOR PADEIRO BOMBEIRO PILOTO DENTISTA PINTOR PEDREIRO MOTORISTA COZINHEIRO ADVOGADO ENGENHEIRO CARTEIRO PESCADOR MUSICO JORNALISTA GARI ATOR JUIZ VENDEDOR',
    'Esportes': 'FUTEBOL VOLEI BASQUETE TENIS NATACAO JUDO SURFE SKATE CORRIDA CICLISMO BOXE GINASTICA HANDEBOL XADREZ CAPOEIRA KARATE REMO VELA GOLFE ESGRIMA',
  };
  const DIRS = {
    facil: [[0, 1], [1, 0]],
    medio: [[0, 1], [1, 0], [1, 1], [-1, 1]],
    dificil: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]],
  };
  const NOME_NIVEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
  const CORES = ['#7c8cff', '#ff7a90', '#3fc7b4', '#f0b429', '#c58cff', '#5fc45f', '#ff9f5a', '#4aa8f0'];
  const ENCHE = 'AAAAEEEEIIOOOUURRSSTTLLMMNNCCDDPBGFVHJQXZ';
  const sorte = n => Math.floor(Math.random() * n);
  const relogio = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

  // ---------- Montar um quadro ----------
  function novo(nivel, stats, temaAnterior) {
    const nomes = Object.keys(TEMAS).filter(t => t !== temaAnterior);
    for (;;) {
      const tema = nomes[sorte(nomes.length)];
      const lista = TEMAS[tema].split(' ').filter(w => w.length <= N).sort(() => Math.random() - .5).slice(0, QTD).sort((a, b) => b.length - a.length);
      const g = Array(N * N).fill(''), p = [];
      let deu = true;
      for (const w of lista) {
        let posto = false;
        for (let k = 0; k < 400 && !posto; k++) {
          const [dl, dc] = DIRS[nivel][sorte(DIRS[nivel].length)], l = sorte(N), c = sorte(N);
          const fl = l + dl * (w.length - 1), fc = c + dc * (w.length - 1);
          if (fl < 0 || fl >= N || fc < 0 || fc >= N) continue;
          let cabe = true;
          for (let i = 0; i < w.length && cabe; i++) { const ch = g[(l + dl * i) * N + c + dc * i]; if (ch && ch !== w[i]) cabe = false; }
          if (!cabe) continue;
          for (let i = 0; i < w.length; i++) g[(l + dl * i) * N + c + dc * i] = w[i];
          p.push({ w, ok: false }); posto = true;
        }
        if (!posto) { deu = false; break; }
      }
      if (!deu) continue;
      for (let i = 0; i < N * N; i++) if (!g[i]) g[i] = ENCHE[sorte(ENCHE.length)];
      p.sort((a, b) => a.w.localeCompare(b.w));
      return { nivel, tema, g, p, t: 0, fim: false, stats: stats || { v: 0, melhor: {} } };
    }
  }
  const valido = x => x && Array.isArray(x.g) && x.g.length === N * N && Array.isArray(x.p) && x.stats && DIRS[x.nivel];
  let e = JO.carregar('caca', null);
  if (!valido(e)) e = novo('facil', e && e.stats);
  const salvar = () => JO.salvar('caca', e);

  // ---------- Tela ----------
  const grade = $('grade'), caixa = grade.parentNode, letras = [];
  for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.className = 'letra'; grade.appendChild(d); letras.push(d); }
  let inicio = null, fimSel = null, arrastando = false, moveu = false, ancora = null;

  const linha = (a, b, cor, classe) => `<line x1="${a.c + .5}" y1="${a.l + .5}" x2="${b.c + .5}" y2="${b.l + .5}" ${cor ? `stroke="${cor}"` : ''} class="${classe || ''}"/>`;
  function desenhar() {
    letras.forEach((d, i) => { d.textContent = e.g[i]; d.classList.toggle('ancora', !!ancora && ancora.l * N + ancora.c === i); });
    let s = '';
    e.p.forEach((p, k) => { if (p.ok) s += linha(p.a, p.b, CORES[k % CORES.length]); });
    if (arrastando && inicio && fimSel) s += linha(inicio, fimSel, '', 'agora');
    $('riscos').innerHTML = s;
    $('palavras').innerHTML = e.p.map((p, k) => `<span class="palavra${p.ok ? ' ok' : ''}" style="--cor:${CORES[k % CORES.length]}">${p.w}</span>`).join('');
    $('achadas').textContent = e.p.filter(p => p.ok).length + '/' + e.p.length;
    $('tema-nome').textContent = e.tema;
    $('tempo').textContent = relogio(e.t);
    document.querySelectorAll('.modos button').forEach(b => b.classList.toggle('ativo', b.dataset.nivel === e.nivel));
  }

  // ---------- Seleção: arrastar, ou tocar na primeira e na última letra ----------
  function casa(ev) {
    const r = grade.getBoundingClientRect(), lim = v => Math.max(0, Math.min(N - 1, v));
    return { l: lim(Math.floor((ev.clientY - r.top) / r.height * N)), c: lim(Math.floor((ev.clientX - r.left) / r.width * N)) };
  }
  // Prende a seleção a uma linha reta (deitada, em pé ou diagonal) saindo do início.
  function reta(a, b) {
    const dl = b.l - a.l, dc = b.c - a.c;
    if (!dl && !dc) return a;
    const passo = Math.round(Math.atan2(dl, dc) / (Math.PI / 4));
    const [sl, sc] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]][(passo + 8) % 8];
    let n = Math.max(Math.abs(dl), Math.abs(dc));
    while (n > 0 && (a.l + sl * n < 0 || a.l + sl * n >= N || a.c + sc * n < 0 || a.c + sc * n >= N)) n--;
    return { l: a.l + sl * n, c: a.c + sc * n };
  }
  function concluir(a, b) {
    const n = Math.max(Math.abs(b.l - a.l), Math.abs(b.c - a.c));
    if (!n || e.fim) return;
    const sl = Math.sign(b.l - a.l), sc = Math.sign(b.c - a.c);
    let s = ''; for (let i = 0; i <= n; i++) s += e.g[(a.l + sl * i) * N + a.c + sc * i];
    const inv = [...s].reverse().join('');
    const p = e.p.find(x => !x.ok && (x.w === s || x.w === inv));
    if (!p) return;
    p.ok = true; p.a = a; p.b = b;
    if (e.p.every(x => x.ok)) {
      e.fim = true; e.stats.v++;
      const m = e.stats.melhor[e.nivel];
      if (m == null || e.t < m) e.stats.melhor[e.nivel] = e.t;
      JO.vibrar([40, 60, 120]); JO.som('vitoria');
      $('vitoria-txt').textContent = `Tema ${e.tema}, nível ${NOME_NIVEL[e.nivel]}, em ${relogio(e.t)}. Melhor tempo neste nível: ${relogio(e.stats.melhor[e.nivel])}.`;
      setTimeout(() => { if (e.fim && !$('vitoria').open) $('vitoria').showModal(); }, 600);
    } else { JO.vibrar(30); JO.som('acerto'); }
    salvar();
  }

  caixa.addEventListener('pointerdown', ev => {
    if (e.fim) return;
    ev.preventDefault();
    const c = casa(ev);
    if (ancora) { inicio = ancora; ancora = null; moveu = true; fimSel = reta(inicio, c); }
    else { inicio = c; fimSel = c; moveu = false; }
    arrastando = true;
    try { caixa.setPointerCapture(ev.pointerId); } catch (err) {}
    desenhar();
  });
  caixa.addEventListener('pointermove', ev => {
    if (!arrastando) return;
    const f = reta(inicio, casa(ev));
    if (f.l !== inicio.l || f.c !== inicio.c) moveu = true;
    if (f.l !== fimSel.l || f.c !== fimSel.c) { fimSel = f; desenhar(); }
  });
  function soltar() {
    if (!arrastando) return;
    arrastando = false;
    if (moveu) concluir(inicio, fimSel); else { ancora = inicio; JO.som('toque'); }
    desenhar();
  }
  caixa.addEventListener('pointerup', soltar);
  caixa.addEventListener('pointercancel', () => { arrastando = false; ancora = null; desenhar(); });

  // ---------- Botões e relógio ----------
  function recomecar(nivel) { ancora = null; arrastando = false; e = novo(nivel, e.stats, e.tema); salvar(); desenhar(); }
  $('novo').addEventListener('click', () => recomecar(e.nivel));
  $('vitoria-novo').addEventListener('click', () => { $('vitoria').close(); recomecar(e.nivel); });
  document.querySelectorAll('.modos button').forEach(b => b.addEventListener('click', () => { if (b.dataset.nivel !== e.nivel) recomecar(b.dataset.nivel); }));
  setInterval(() => {
    if (!e.fim && !document.hidden) { e.t++; $('tempo').textContent = relogio(e.t); if (e.t % 5 === 0) salvar(); }
  }, 1000);

  salvar(); desenhar();
})();
