// Robô da fase Muralha (nível 12): testa estratégias de lado. Uso: node ferramentas/ponte-zero/muralha.mjs [partidas] [dificuldade 0..2]
import { criarSimulacao } from '../../jogos/ponte-zero/nucleo/simulacao.js';
import { NIVEIS, DIFICULDADES } from '../../jogos/ponte-zero/dados/balanco.js';

const N = +(process.argv[2] || 6), DIF = DIFICULDADES[+(process.argv[3] || 0)], T = NIVEIS.findIndex(n => n.defesa), M = NIVEIS[T].defesa.muro;
const ESTRATEGIAS = {
  esquerda: () => -3,
  direita: () => 2.6,
  meio: () => M,
  // horda até o chefe chegar perto, depois o chefe; pega caixas do helicóptero
  esperto: S => { const c = S.chefe, b = S.barris.find(b => b.vivo && b.heli && b.alt < 3); if (b) return b.x; if (c && c.d - S.d < 42) return 2.4; const perto = S.zumbis.filter(z => !z.morto && z.d - S.d < 14).length; return perto > 6 || !c ? -2.8 : c.d - S.d < 60 ? M + .2 : -2.8; },
};
for (const [nome, f] of Object.entries(ESTRATEGIAS)) {
  let v = 0, soma = { t: 0, n: 0, vida: 0, horda: 0 };
  for (let k = 0; k < N; k++) {
    const S = criarSimulacao(NIVEIS[T], { dif: DIF, maxZumbis: 150, maxSoldados: 52 });
    let t = 0; while (S.estado === 'jogando' && t < 400) { const x = f(S); S.alvoX = x; S.alvoFrente = -1.5; S.passo(1 / 60); t += 1 / 60; }
    if (S.estado === 'vitoria') v++; soma.t += t; soma.n += S.n; soma.vida += S.chefe ? S.chefe.vida / S.chefe.max : 0; soma.horda += S.hordaSaiu;
  }
  console.log(nome.padEnd(9), `vitórias ${v}/${N}`, `tempo ${(soma.t / N).toFixed(0)}s`, `soldados ${(soma.n / N).toFixed(0)}`, `vida chefe ${(100 * soma.vida / N).toFixed(0)}%`, `horda saiu ${(soma.horda / N).toFixed(0)}`);
}
