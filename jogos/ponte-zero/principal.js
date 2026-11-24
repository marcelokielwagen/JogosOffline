// Liga o módulo do jogo ao pacote Jogos Offline (salvar, som, vibração e pausa).
import { ZombieBridgeGame } from './ZombieBridgeGame.js';

const jogo = new ZombieBridgeGame({ carregar: JO.carregar, salvar: JO.salvar, som: JO.som, vibrar: JO.vibrar, somLigado: () => JO.carregar('som', true) });
if (new URLSearchParams(location.search).has('teste')) { window.jogo = jogo; window.ZombieBridgeGame = ZombieBridgeGame; }

// pausa: qualquer janela aberta (pausa, ajuda) ou a página escondida param o jogo
const conferir = () => { if (document.hidden || document.querySelector('dialog[open]')) jogo.pause(); else jogo.resume(); };
new MutationObserver(conferir).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
document.addEventListener('visibilitychange', () => { if (document.hidden && jogo.info?.jogando && jogo.info.estado === 'jogando') JO.pausar(); conferir(); });
addEventListener('keydown', e => { if (e.code === 'KeyP' || e.code === 'Escape') { if (!document.querySelector('dialog[open]')) { e.preventDefault(); JO.pausar(); } } });
addEventListener('pagehide', e => { if (!e.persisted) jogo.destroy(); });

window.pronto = jogo.init(document.getElementById('jogo')).then(conferir).catch(() => {});
