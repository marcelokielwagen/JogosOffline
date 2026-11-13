// Funções compartilhadas: salvar no aparelho, tema claro/escuro, janelas e offline.
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

  function aplicarTema(t) {
    document.documentElement.dataset.tema = t;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'claro' ? '#f2f3fa' : '#0f1220';
    document.querySelectorAll('[data-acao="tema"]').forEach(b => b.textContent = t === 'claro' ? '🌙' : '☀️');
  }
  let tema = carregar('tema', 'escuro');
  aplicarTema(tema);

  document.addEventListener('DOMContentLoaded', () => {
    aplicarTema(tema);
    document.querySelectorAll('[data-acao="tema"]').forEach(b => b.addEventListener('click', () => {
      tema = tema === 'claro' ? 'escuro' : 'claro'; salvar('tema', tema); aplicarTema(tema);
    }));
    document.querySelectorAll('[data-abre]').forEach(b => b.addEventListener('click', () =>
      document.getElementById(b.dataset.abre).showModal()));
    document.querySelectorAll('[data-fecha]').forEach(b => b.addEventListener('click', () =>
      b.closest('dialog').close()));
  });

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

  return { carregar, salvar };
})();
