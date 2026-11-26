// Keepsake Hunt no aplicativo (Capacitor): liga anúncio, compra e o botão Voltar do Android ao jogo.
// Só entra no pacote do app (montar.mjs põe este arquivo no index.html). No site ele nem é carregado.
// Plugins esperados: @capacitor-community/admob, @revenuecat/purchases-capacitor e @capacitor/app.
// Enquanto TESTE for verdadeiro, só aparecem anúncios de teste do Google e as compras vão para o ambiente de teste das lojas.
(() => {
  const C = window.Capacitor; if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const TESTE = true, ios = C.getPlatform() === 'ios', P = C.Plugins || {}, AdMob = P.AdMob, Compras = P.Purchases, App = P.App;
  // IDs de teste públicos do Google. Os de verdade vêm da conta AdMob do dono (trocar aqui e pôr TESTE = false)
  const ID = ios ? { video: 'ca-app-pub-3940256099942544/1712485313', entre: 'ca-app-pub-3940256099942544/4411468910' } : { video: 'ca-app-pub-3940256099942544/5224354917', entre: 'ca-app-pub-3940256099942544/1033173712' };
  const CHAVE_COMPRAS = ios ? 'COLOCAR_A_CHAVE_IOS_DO_REVENUECAT' : 'COLOCAR_A_CHAVE_ANDROID_DO_REVENUECAT';
  // os produtos na loja têm o mesmo nome que no jogo: keepsake.inicial, keepsake.sem_anuncios, keepsake.moedas_500...
  const prefixo = 'keepsake.', paraLoja = id => prefixo + id, doJogo = id => String(id || '').replace(prefixo, '');
  const espera = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));

  // ---------- anúncios: não personalizados (npa) e com o pedido de consentimento quando a lei exige
  let anuncioPronto = null;
  async function iniciarAnuncios() {
    if (!AdMob) return false;
    try { await AdMob.initialize({ initializeForTesting: TESTE, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false, maxAdContentRating: 'PG' }); } catch (e) { return false; }
    try { const c = await AdMob.requestConsentInfo(); if (c && c.isConsentFormAvailable && c.status === 'REQUIRED') await AdMob.showConsentForm(); } catch (e) { /* sem formulário: segue com não personalizados */ }
    if (ios) try { const s = await AdMob.trackingAuthorizationStatus(); if (s && s.status === 'notDetermined') await AdMob.requestTrackingAuthorization(); } catch (e) { /* iOS antigo */ }
    return true;
  }
  const comAnuncio = () => anuncioPronto || (anuncioPronto = iniciarAnuncios());
  // vídeo com prêmio: só devolve verdadeiro se o jogador recebeu a recompensa
  async function recompensado() {
    if (!await comAnuncio()) return false; let ganhou = false, h = null;
    try { h = await AdMob.addListener('onRewardedVideoAdReward', () => { ganhou = true; }); } catch (e) { /* versão sem eventos */ }
    try { await AdMob.prepareRewardVideoAd({ adId: ID.video, isTesting: TESTE, npa: true }); const r = await AdMob.showRewardVideoAd(); if (r && (r.amount !== undefined || r.type)) ganhou = true; await espera(300); } catch (e) { ganhou = false; }
    try { if (h) h.remove(); } catch (e) { /* já saiu */ } return ganhou;
  }
  async function intersticial() { if (!await comAnuncio()) return false; try { await AdMob.prepareInterstitial({ adId: ID.entre, isTesting: TESTE, npa: true }); await AdMob.showInterstitial(); return true; } catch (e) { return false; } }

  // ---------- compras pela Google Play / App Store (RevenueCat cuida do recibo)
  let comprasProntas = null, produtos = {};
  async function iniciarCompras() {
    if (!Compras || /^COLOCAR/.test(CHAVE_COMPRAS)) return false;
    try { await Compras.configure({ apiKey: CHAVE_COMPRAS }); const ids = Eco.PRODUTOS.map(p => paraLoja(p.id)), r = await Compras.getProducts({ productIdentifiers: ids, type: 'INAPP' }); for (const p of (r && r.products) || []) produtos[doJogo(p.identifier)] = p; return true; } catch (e) { return false; }
  }
  const comCompras = () => comprasProntas || (comprasProntas = iniciarCompras());
  async function precos() { if (!await comCompras()) return {}; return Object.fromEntries(Object.entries(produtos).map(([id, p]) => [id, p.priceString])); }
  async function comprar(id) {
    if (!await comCompras() || !produtos[id]) return { ok: false };
    try { const r = await Compras.purchaseStoreProduct({ product: produtos[id] }), t = r && r.transaction; return { ok: true, transacao: (t && (t.transactionIdentifier || t.transactionId)) || ('rc-' + Date.now()) }; } catch (e) { return { ok: false }; }
  }
  // restaurar: só o que não se gasta (pacote da casa e sem anúncios) volta de outra instalação
  async function restaurar() {
    if (!await comCompras()) return []; try { const r = await Compras.restorePurchases(), info = r && (r.customerInfo || r); const l = (info && info.nonSubscriptionTransactions) || []; return l.map(t => ({ id: doJogo(t.productIdentifier), transacao: t.transactionIdentifier })).filter(x => ['inicial', 'sem_anuncios'].includes(x.id)); } catch (e) { return []; }
  }

  // espera o jogo terminar de abrir para trocar o provedor
  const ligar = () => { if (typeof Monetizacao === 'undefined') return setTimeout(ligar, 200); Monetizacao.usar({ nome: 'loja', get podeComprar() { return !!Compras && !/^COLOCAR/.test(CHAVE_COMPRAS); }, recompensado, intersticial, precos, comprar, restaurar }); };
  ligar();

  // ---------- botão Voltar do Android: fecha a janela de cima, pausa a fase ou volta uma tela; no início, deixa o app em segundo plano
  if (App) App.addListener('backButton', () => {
    if (typeof Jogo === 'undefined') return; const J = Jogo; if (document.getElementById('anuncio').classList.contains('on')) return;
    if (J.aberto === 'abertura' && !document.querySelector('.tela.solta.on')) { App.minimizeApp(); return; }
    if (['vitoria', 'derrota'].includes(J.aberto) && !document.querySelector('.tela.solta.on')) { Telas.inicio(); return; }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));       // o jogo já trata o Esc
  });
  if (App) App.addListener('pause', () => { try { Progresso.salvar(); } catch (e) { /* sem jogo */ } });
})();
