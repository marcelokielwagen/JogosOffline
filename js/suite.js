// Veio da suíte ou entrou direto pelo link do jogo?
// Direto: o jogo não mostra nenhum botão de voltar para a suíte. Pela suíte: mostra. Recarregar a página mantém o que era.
// Os botões são reconhecidos pelo link para ../../index.html (o #voltar das Cruzadas e do Caça-Palavras é interno e fica).
(() => {
  const raiz = new URL('../', document.currentScript.src), aqui = location.pathname;
  const eSuite = p => p === raiz.pathname || p === raiz.pathname + 'index.html';
  const K = 'jo:suite:', ler = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const por = (k, v) => { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) {} };
  if (eSuite(aqui)) {
    // reforço para navegadores que escondem de onde a pessoa veio
    document.addEventListener('click', ev => {
      const a = ev.target.closest && ev.target.closest('a.cartao');
      if (a && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) por(K + 'clique', new URL(a.href).pathname);
    });
    return;
  }
  let veio = ler(K + 'clique') === aqui;
  por(K + 'clique', '');
  try { const r = new URL(document.referrer); veio = veio || (r.origin === location.origin && eSuite(r.pathname)); } catch (e) {}
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (!veio && nav && nav.type !== 'navigate') veio = ler(K + aqui) === '1';
  por(K + aqui, veio ? '1' : '');
  if (veio) return;
  document.documentElement.classList.add('direto');
  const st = document.createElement('style');
  st.textContent = '.direto a[href="../../index.html"]:not(#voltar),.direto .jo-sair,.direto .jo-sair-grande{display:none!important}';
  document.head.appendChild(st);
})();
