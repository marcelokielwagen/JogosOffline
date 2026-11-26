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
    const k = carregar('caca', null), fc = carregar('freecell', null);
    const ps = carregar('pinballShow', null), pz = carregar('ponteZero', null);
    let na = null, naFeitas = 0; try { na = JSON.parse(localStorage.getItem('nascente.v2')) || JSON.parse(localStorage.getItem('nascente.v1')); naFeitas = new Set(na ? (na.feitas || [na.concluidas || []]).flat() : []).size; } catch (e) {}
    let cd = null; try { cd = JSON.parse(localStorage.getItem('candeia.v1')); } catch (e) {}
    let hb = null; try { hb = JSON.parse(localStorage.getItem('hushbell.v1')); } catch (e) {}
    let zn = {}; try { const x = JSON.parse(localStorage.getItem('zen.v1')); zn = (x && x.feitas) || {}; } catch (e) {}
    const znJ = j => `${['facil', 'medio', 'dificil'].reduce((a, d) => a + String(zn[j + '/' + d] || '').split('1').length - 1, 0)} de 150`;
    let la = null; try { la = JSON.parse(localStorage.getItem('cozinha-da-le.v1')); } catch (e) {}
    const fcn = (n, nome) => { const s = fc && fc.stats && fc.stats[n]; return [nome, s && s.j ? `${s.v} de ${s.j} (${Math.round(100 * s.v / s.j)}%)` : '–']; };
    const pn = (n, nome) => { const s = p && p.stats && p.stats.n && p.stats.n[n]; return [nome, s && s.v ? `${s.v} · melhor ${relogio(s.melhor)}` : '–']; };
    // Caça-Palavras: fases vencidas, estrelas e temas completos.
    const fases = x => { const ts = Object.values((x && x.fases) || {}).map(t => Object.values(t)); return [['Fases vencidas', ts.flat().length], ['Estrelas', ts.flat().reduce((a, f) => a + f.e, 0)], ['Temas completos', ts.filter(t => t.length >= 10).length]]; };
    const pl = m => (v && v.placar && v.placar[m]) || { X: 0, O: 0, E: 0 };
    const pc = m => `${pl(m).X} vitórias · ${pl(m).E} empates · ${pl(m).O} derrotas`;
    const feitas = c && c.g ? Object.values(c.g).filter(g => g && g.fim).length : 0;
    return [
      ['Jogo da Velha', [['Fácil', pc('facil')], ['Difícil', pc('dificil')], ['2 jogadores', `X ${pl(2).X} · O ${pl(2).O} · empates ${pl(2).E}`]]],
      ['Resta Um', [['Vitórias', r && r.stats ? r.stats.vitorias : 0], ['Melhor resultado', r && r.stats && r.stats.melhor != null ? (r.stats.melhor === 1 ? '1 peça' : r.stats.melhor + ' peças') : '–']]],
      ['Paciência', [['Vitórias', p && p.stats ? p.stats.v : 0], ['Melhor tempo', p && p.stats && p.stats.melhor != null ? relogio(p.stats.melhor) : '–'], pn('mfacil', 'Muito fácil'), pn('facil', 'Fácil'), pn('medio', 'Médio'), pn('dificil', 'Difícil')]],
      ['FreeCell (vitórias)', [fcn('mfacil', 'Muito fácil'), fcn('facil', 'Fácil'), fcn('medio', 'Médio'), fcn('dificil', 'Difícil')]],
      ['Palavras Cruzadas', [['Partidas rápidas', c && c.qn ? Object.values(c.qn).reduce((a, b) => a + b, 0) : 0], ['Grades grandes completas', feitas + ' de ' + ((c && c.total) || 26)]]],
      ['Caça-Palavras', fases(k)],
      ['Galatic Pinball', [['Recorde de pontos', ps && ps.melhor ? ps.melhor.toLocaleString('pt-BR') : 0], ['Partidas', ps ? ps.jogos : 0]]],
      ['Soldier Survivor', [['Recorde de eliminações', pz ? pz.melhor : 0], ['Vitórias', pz ? `${pz.vitorias || 0} de ${pz.jogos}` : '–'], ['Chefes vencidos', pz && pz.medalhas ? `${Object.keys(pz.medalhas).length} de 13` : '0 de 13']]],
      ['Nascente', [['Fases concluídas', `${naFeitas} de 100`]]],
      ['Hushbell', [['Monumentos', `${hb && hb.feitos ? Math.min(5, hb.feitos) : 0} de 5`]]],
      ['Candeia', [['Fases acesas', `${cd && Array.isArray(cd.done) ? cd.done.length : 0} de 100`]]],
      ['Cozinha da Le', [['Pedidos servidos', la && la.st ? la.st.pedidos || 0 : 0], ['Nível', la ? la.nivel || 1 : 1], ['Fantasias vistas', `${la && la.st && Array.isArray(la.st.vistas) ? Math.max(0, la.st.vistas.length - 1) : 0} de 11`]]],
      ['Loop Zen', [['Fases concluídas', znJ('loop')]]],
      ['Ricochet Zen', [['Fases concluídas', znJ('okay')]]],
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

  // ---------- Sair e Pausar (em todas as telas de jogo) ----------
  // A tela de jogo é reconhecida pelo link "←" do topo que leva para a tela inicial.
  // Enquanto a janela de pausa está aberta, os relógios param (JO.pausado()) e o Pinball congela.
  const inicio = () => new URL('index.html', raiz).href;
  const pausado = () => !!document.querySelector('#jo-pausa[open]');
  function pausar() {
    const d = document.getElementById('jo-pausa');
    if (d && !d.open) { document.querySelectorAll('dialog[open]').forEach(x => x.close()); d.showModal(); som('toque'); }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const topo = document.querySelector('.topo'), h1 = topo && topo.querySelector('h1');
    const voltar = topo && [...topo.querySelectorAll('a')].find(a => a.href === inicio());
    if (!voltar || !h1) return;
    const sair = document.createElement('a');
    sair.className = 'icone-btn jo-sair'; sair.href = inicio();
    sair.setAttribute('aria-label', 'Sair para a tela inicial dos jogos');
    sair.innerHTML = '<span aria-hidden="true">✕</span> Sair';
    // Nas Cruzadas a seta também volta para a lista de grades; ali ela fica e o Sair entra antes.
    if (voltar.id) voltar.before(sair); else voltar.replaceWith(sair);
    const bp = document.createElement('button');
    bp.className = 'icone-btn jo-pausar'; bp.type = 'button'; bp.textContent = '⏸';
    bp.setAttribute('aria-label', 'Pausar o jogo');
    bp.addEventListener('click', pausar);
    h1.after(bp);
    const d = document.createElement('dialog');
    d.id = 'jo-pausa';
    d.innerHTML = '<h2>⏸ Jogo pausado</h2><p>O jogo está parado. Volte quando quiser.</p>' +
      '<button class="btn principal" data-continuar>▶ Continuar</button>' +
      `<a class="btn jo-sair-grande" href="${inicio()}">✕ Sair para a tela de jogos</a>`;
    d.querySelector('[data-continuar]').addEventListener('click', () => d.close());
    document.body.appendChild(d);
  });

  // ---------- Atualizar jogos ----------
  // Busca a versão nova de todos os arquivos, apaga a cópia guardada no aparelho e recarrega.
  async function atualizarJogos(botao) {
    if (botao) { botao.disabled = true; botao.textContent = '⏳ Atualizando…'; }
    try {
      const sw = await fetch(new URL('sw.js', raiz), { cache: 'reload' }).then(r => r.text());
      const lista = (sw.match(/'\.\/[^']*'/g) || []).map(s => new URL(s.slice(1, -1), raiz));
      await Promise.all(lista.map(u => fetch(u, { cache: 'reload' }).catch(() => {})));
      if ('serviceWorker' in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      if (window.caches) for (const n of await caches.keys()) await caches.delete(n);
      location.replace(new URL('index.html?v=' + Date.now(), raiz));
    } catch (e) {
      if (botao) { botao.disabled = false; botao.textContent = '🔄 Atualizar jogos'; }
      alert('Não deu para atualizar agora. Confira se o celular está com internet e tente de novo.');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-acao="atualizar"]').forEach(b => b.addEventListener('click', () => atualizarJogos(b)));
  });

  // ---------- Offline ----------
  if ('serviceWorker' in navigator) {
    // Quando chega uma versão nova, a tela inicial recarrega sozinha (nunca no meio de um jogo).
    const tinhaVersao = !!navigator.serviceWorker.controller;
    let recarregou = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (tinhaVersao && !recarregou && document.getElementById('status-offline')) { recarregou = true; location.reload(); }
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', raiz))
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
          const el = document.getElementById('status-offline');
          if (el) { el.textContent = '✓ Pronto para jogar sem internet'; el.classList.add('ok'); }
        }).catch(() => {});
    });
  }

  return { carregar, salvar, som, vibrar, pausado, pausar };
})();
