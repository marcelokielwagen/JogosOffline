// Funções compartilhadas: salvar no aparelho, tema, sons, vibração, ajustes, estatísticas e offline.
const JO = (() => {
  const raiz = new URL('../', document.currentScript.src);
  const P = 'jo:';

  function carregar(chave, padrao) {
    try { const v = localStorage.getItem(P + chave); return v == null ? padrao : JSON.parse(v); }
    catch (e) { return padrao; }
  }
  function salvar(chave, valor) {
    try { localStorage.setItem(P + chave, JSON.stringify(valor)); } catch (e) {}
  }

  // ---------- Tema e tamanho da letra ----------
  function aplicarTema(t) {
    document.documentElement.dataset.tema = t;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'claro' ? '#f2f3fa' : '#0f1220';
    document.querySelectorAll('[data-acao="tema"]').forEach(b => b.textContent = t === 'claro' ? '🌙' : '☀️');
  }
  const aplicarLetra = () => document.documentElement.style.fontSize = carregar('letraGrande', false) ? '115%' : '';
  let tema = carregar('tema', 'escuro');
  aplicarTema(tema); aplicarLetra();

  // ---------- Sons (feitos pelo próprio código, sem arquivos) e vibração ----------
  const NOTAS = {
    toque: [[520, .05]], carta: [[300, .045]], acerto: [[660, .08], [880, .11]], erro: [[190, .14]],
    vitoria: [[523, .1], [659, .1], [784, .1], [1047, .24]], derrota: [[330, .14], [247, .22]],
  };
  let audio = null;
  function som(tipo) {
    if (!carregar('som', true) || !NOTAS[tipo]) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      let t = audio.currentTime;
      for (const [freq, dur] of NOTAS[tipo]) {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = tipo === 'erro' || tipo === 'derrota' ? 'triangle' : 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.13, t + .012);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g); g.connect(audio.destination);
        o.start(t); o.stop(t + dur + .03);
        t += dur * .9;
      }
    } catch (e) {}
  }
  function vibrar(padrao) {
    if (carregar('vibra', true) && navigator.vibrate) { try { navigator.vibrate(padrao); } catch (e) {} }
  }

  // ---------- Estatísticas (lê o que cada jogo salvou) ----------
  const relogio = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  function estatisticas() {
    const v = carregar('velha', null), r = carregar('resta-um', null), p = carregar('paciencia', null), c = carregar('cruzadas', null);
    const pl = m => (v && v.placar && v.placar[m]) || { X: 0, O: 0, E: 0 };
    const pc = m => `${pl(m).X} vitórias · ${pl(m).E} empates · ${pl(m).O} derrotas`;
    const feitas = c && c.g ? Object.values(c.g).filter(g => g && g.fim).length : 0;
    return [
      ['Jogo da Velha', [['Fácil', pc('facil')], ['Difícil', pc('dificil')], ['2 jogadores', `X ${pl(2).X} · O ${pl(2).O} · empates ${pl(2).E}`]]],
      ['Resta Um', [['Vitórias', r && r.stats ? r.stats.vitorias : 0], ['Melhor resultado', r && r.stats && r.stats.melhor != null ? (r.stats.melhor === 1 ? '1 peça' : r.stats.melhor + ' peças') : '–']]],
      ['Paciência', [['Vitórias', p && p.stats ? p.stats.v : 0], ['Melhor tempo', p && p.stats && p.stats.melhor != null ? relogio(p.stats.melhor) : '–']]],
      ['Palavras Cruzadas', [['Grades completas', feitas + ' de 10']]],
    ];
  }
  function preencherEstatisticas(cx) {
    cx.innerHTML = estatisticas().map(([jogo, linhas]) =>
      `<section class="stat"><h3>${jogo}</h3>${linhas.map(([n, val]) => `<p><span>${n}</span><b>${val}</b></p>`).join('')}</section>`).join('');
  }

  // ---------- Botões comuns ----------
  document.addEventListener('DOMContentLoaded', () => {
    aplicarTema(tema);
    document.querySelectorAll('[data-acao="tema"]').forEach(b => b.addEventListener('click', () => {
      tema = tema === 'claro' ? 'escuro' : 'claro'; salvar('tema', tema); aplicarTema(tema);
    }));
    document.querySelectorAll('[data-abre]').forEach(b => b.addEventListener('click', () => {
      const d = document.getElementById(b.dataset.abre);
      const lista = d.querySelector('[data-estatisticas]');
      if (lista) preencherEstatisticas(lista);
      d.showModal();
    }));
    document.querySelectorAll('[data-fecha]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
    // Chaves liga/desliga dos ajustes: <button data-ajuste="som" data-padrao="1">
    document.querySelectorAll('[data-ajuste]').forEach(b => {
      const chave = b.dataset.ajuste, padrao = b.dataset.padrao === '1';
      const mostra = () => { const on = carregar(chave, padrao); b.setAttribute('aria-pressed', on); b.querySelector('b').textContent = on ? 'Ligado' : 'Desligado'; };
      b.addEventListener('click', () => {
        salvar(chave, !carregar(chave, padrao)); mostra(); aplicarLetra();
        if (chave === 'som') som('acerto');
        if (chave === 'vibra') vibrar(60);
      });
      mostra();
    });
  });

  // ---------- Offline ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', raiz))
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
          const el = document.getElementById('status-offline');
          if (el) { el.textContent = '✓ Pronto para jogar sem internet'; el.classList.add('ok'); }
        }).catch(() => {});
    });
  }

  return { carregar, salvar, som, vibrar };
})();
