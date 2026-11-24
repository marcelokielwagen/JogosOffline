// Regras do Galatic Pinball: missões em fases e peças que conversam entre si.
//   Fases: Decolagem → Órbita → Chuva de meteoros → Caminhada espacial → Resgate → Reentrada (3 bolas e prêmios).
//   Turbo (disco do astronauta, velocidade 1 a 4) multiplica os pontos: acelera com voltas, loopings e girando nele
//   2 alvos do astronauta → abrem a Ponte de vidro até a nave         3 alvos da nave → ligam a bola salva
//   Painel (5 alvos que caem) → abre o Túnel, que devolve a bola num tiro de canhão
//   Para-choques: a cada 8 batidas derrubam um alvo do painel         3 corredores do alto → Elevador dourado
//   Cometa: 10 batidas e ele explode, soltando 3 bolas de bônus (os 4 alvos-estrela valem 3 batidas)
//   Letras S-T-A-R → turbo no máximo e bola salva                     Caminhos diferentes em sequência → COMBO
// Aqui não há física nem desenho: só as regras. Os tempos estão em segundos da mesa.
import { TECLAS, LETRAS, ALTAS, ALVOS, COMETA, PORTAS, VINIL } from '../mesa/layout.js';

export const CAMINHOS = {
  canoE: { nome: 'SUBIDA DO ASTRONAUTA', pontos: 7000 },
  canoD: { nome: 'SUBIDA DA NAVE', pontos: 7000 },
  miniE: { nome: 'LOOPING NO ESPAÇO', pontos: 8000 },
  miniD: { nome: 'LOOPING NO ESPAÇO', pontos: 8000 },
  loopE: { nome: 'LOOPING DO PLANETA AZUL', pontos: 12000 },
  loopD: { nome: 'LOOPING DOS ANÉIS', pontos: 12000 },
  elevador: { nome: 'ELEVADOR', pontos: 5000 },
  ponte: { nome: 'PONTE DE VIDRO', pontos: 20000 },
  tunel: { nome: 'TIRO DE CANHÃO', pontos: 15000 },
  volta: { nome: 'VOLTA COMPLETA', pontos: 5000 },
  trilhoE: { nome: '', pontos: 1000, quieto: true },
  trilhoD: { nome: '', pontos: 1000, quieto: true },
};
// conta: caminhos (ou eventos) que valem para a missão
export const FASES = [
  { nome: 'DECOLAGEM', texto: 'Suba por canos', alvo: 3, conta: ['canoE', 'canoD', 'loopE', 'loopD', 'elevador'] },
  { nome: 'ÓRBITA', texto: 'Faça loopings ou voltas completas', alvo: 3, conta: ['loopE', 'loopD', 'miniE', 'miniD', 'canoE', 'canoD', 'volta'] },
  { nome: 'CHUVA DE METEOROS', texto: 'Bata no cometa até explodir', alvo: 1, conta: ['explosao'] },
  { nome: 'CAMINHADA ESPACIAL', texto: 'Acerte alvos nas plataformas', alvo: 5, conta: ['alvo'] },
  { nome: 'RESGATE', texto: 'Atravesse a ponte ou pegue o elevador', alvo: 2, conta: ['ponte', 'elevador'] },
  { nome: 'REENTRADA', texto: 'Todo caminho vale prêmio!', alvo: 0, conta: [] },
];
export const GIROS = [0, 1.6, 4, 7, 11];             // giro do vinil em cada velocidade
const T_VINIL = 10, T_COMBO = 5, T_SHOW = 32, T_PONTE = 25, T_TUNEL = 16, T_SALVA = 8;
const T_COMETA = 30, PREMIO = 25000;

const fmt = n => Math.round(n).toLocaleString('pt-BR');

// saida: { pontuar(n), msg(texto, s), faisca(de, para), salvar(segundos), bolaExtra(quantas), explodir(quantas, segundosAteVoltar), fase(numero, nivel), efeito(tipo, lugar, força) }
export function criarConexoes(saida) {
  const limpo = () => ({ vinil: 1, tVinil: 0, tunel: 0, ponte: 0, combo: 0, tCombo: 0, ultimo: '', show: 0, elevadorOuro: false, batidas: 0 });
  const nada = () => ({ djs: false, casal: false, teclas: false, letras: false });
  const C = Object.assign(limpo(), { feito: nada(), shows: 0, fase: 0, nivel: 1, feitos: 0 });

  function aplicar() {
    VINIL.alvo = GIROS[C.vinil];
    PORTAS.tunel.aberta = C.tunel > 0;
    PORTAS.ponte.aberta = C.ponte > 0;
  }
  const apagar = (lista, campo) => lista.forEach(x => x[campo] = false);
  function zerar() {
    Object.assign(C, limpo(), { feito: nada(), shows: 0, fase: 0, nivel: 1, feitos: 0 });
    apagar(TECLAS, 'acesa'); apagar(LETRAS, 'acesa'); apagar(ALTAS, 'acesa'); apagar(ALVOS, 'aceso');
    Object.assign(COMETA, { vivo: true, batidas: 0 });
    aplicar();
    saida.fase(0, 1);
  }
  // bola perdida: o que já foi conquistado fica; o resto esfria
  function perdeuBola() {
    const acabou = C.fase === 5;
    Object.assign(C, limpo());
    if (acabou) proximaFase();
    if (TECLAS.every(t => t.acesa)) apagar(TECLAS, 'acesa');
    aplicar();
  }
  const pontuar = n => { const v = n * C.vinil; saida.pontuar(v); return v; };

  // ---------- Vinil ----------
  function acelerar(de) {
    const antes = C.vinil;
    C.vinil = Math.min(4, C.vinil + 1); C.tVinil = T_VINIL;
    if (de) saida.faisca(de, 'vinil');
    aplicar();
    return C.vinil > antes ? (C.vinil === 4 ? 'TURBO NO MÁXIMO! x4' : `TURBO x${C.vinil}`) : '';
  }

  // ---------- Missões ----------
  const alvoDaFase = () => FASES[C.fase].alvo + (C.fase === 2 ? 0 : C.nivel - 1);
  function completar(qual) { C.feito[qual] = true; return false; }
  // um acontecimento conta para a missão? Devolve true se ele terminou a fase
  function missao(evento) {
    const f = FASES[C.fase];
    if (!f.conta.includes(evento)) return false;
    C.feitos++;
    saida.efeito('missao');
    if (C.feitos < alvoDaFase()) return false;
    const v = pontuar(25000 * (C.fase + 1) * C.nivel), nome = f.nome;
    proximaFase();
    if (C.fase === 5) saida.msg(`REENTRADA!\n3 BOLAS\n${fmt(v)}`, 2.8);
    else saida.msg(`${nome}\nCOMPLETA! ${fmt(v)}\nFASE ${C.fase + 1}: ${FASES[C.fase].nome}`, 2.8);
    return true;
  }
  function proximaFase() {
    C.fase = (C.fase + 1) % FASES.length; C.feitos = 0;
    if (C.fase === 0) C.nivel++;
    if (C.fase === 2) Object.assign(COMETA, { vivo: true, batidas: 0 });
    if (C.fase === 5) {
      C.show = T_SHOW; C.shows++;
      C.vinil = Math.max(C.vinil, 2); C.tVinil = T_VINIL; C.ponte = T_SHOW; aplicar();
      saida.salvar(T_SALVA * 1.5);
      saida.bolaExtra(2);
    }
    saida.fase(C.fase, C.nivel);
  }

  // ---------- Um caminho completo ----------
  function caminho(nome) {
    if (nome === 'elevE' || nome === 'elevD') nome = 'elevador';
    const info = CAMINHOS[nome];
    if (!info) return;
    if (info.quieto) { pontuar(info.pontos); return; }
    // repetir o mesmo caminho mantém o combo, mas não aumenta
    if (C.tCombo <= 0) C.combo = 1;
    else if (nome !== C.ultimo) C.combo = Math.min(6, C.combo + 1);
    C.tCombo = T_COMBO; C.ultimo = nome;
    let base = info.pontos, aviso = '';
    if (['canoE', 'loopD', 'miniE', 'volta'].includes(nome)) aviso = acelerar(nome);
    else if (nome === 'elevador' && C.elevadorOuro) { base *= 3; C.elevadorOuro = false; aviso = 'ELEVADOR DOURADO x3'; }
    else if (nome === 'ponte') { C.ponte = C.show > 0 ? C.ponte : 0; aviso = acelerar('ponte'); }
    else if (nome === 'tunel') { C.tunel = 0; apagar(TECLAS, 'acesa'); }
    if (C.show > 0) base += PREMIO;
    const v = pontuar(base * C.combo);
    aplicar();
    saida.efeito('caminho', nome, C.combo);
    if (missao(nome)) return;
    const titulo = C.show > 0 ? 'PRÊMIO DA REENTRADA!' : C.combo > 1 ? `COMBO x${C.combo}!` : info.nome;
    saida.msg(`${titulo}\n${fmt(v)}${aviso ? '\n' + aviso : ''}`, aviso ? 1.8 : 1.4);
  }

  // ---------- Peças ----------
  function derrubarTecla(t, de) {
    if (t.acesa) return;
    t.acesa = true;
    if (de) saida.faisca(de, 'tecla' + t.i);
    if (!TECLAS.every(x => x.acesa)) return;
    C.tunel = T_TUNEL; aplicar();
    saida.faisca('tecla2', 'tunel');
    const v = pontuar(10000);
    if (!completar('teclas')) saida.msg(`PAINEL!\n${fmt(v)}\nTÚNEL ABERTO`, 1.9);
  }
  function tecla(t) { pontuar(1000); derrubarTecla(t, null); }
  function bumper(u) {
    pontuar(150);
    if (++C.batidas % 8) return;
    const t = TECLAS.find(x => !x.acesa);
    if (t) derrubarTecla(t, 'bumper' + u.i);
  }
  // ---------- Cometa ----------
  function cometa(n = 1) {
    if (!COMETA.vivo) return;
    COMETA.batidas = Math.min(COMETA.precisa, COMETA.batidas + n);
    const faltam = COMETA.precisa - COMETA.batidas;
    const v = pontuar(2000 * n);
    if (faltam > 0) { saida.msg(`COMETA ${COMETA.batidas}/${COMETA.precisa}`, .9); return; }
    COMETA.vivo = false;
    saida.explodir(3, T_COMETA);
    if (missao('explosao')) { pontuar(30000); return; }
    saida.msg(`COMETA EXPLODIU!\n3 BOLAS BÔNUS\n${fmt(v + pontuar(30000))}`, 2.4);
  }
  function alvo(a) {
    pontuar(1500);
    if (a.andar && missao('alvo')) { a.aceso = false; return; }
    if (a.aceso) return;
    a.aceso = true;
    const grupo = ALVOS.filter(x => x.grupo === a.grupo);
    if (!grupo.every(x => x.aceso)) return;
    grupo.forEach(x => x.aceso = false);
    const v = pontuar(10000);
    if (a.grupo === 'estrelas') {
      saida.faisca('estrelas', 'cometa');
      if (COMETA.vivo) cometa(3);
      return;
    }
    if (a.grupo === 'djs') {
      C.ponte = T_PONTE; aplicar();
      saida.faisca('djs', 'ponte');
      if (!completar('djs')) saida.msg(`ASTRONAUTA!\n${fmt(v)}\nPONTE ABERTA`, 1.9);
    } else {
      saida.salvar(T_SALVA);
      saida.faisca('casal', 'palhetas');
      if (!completar('casal')) saida.msg(`NAVE PRONTA!\n${fmt(v)}\nBOLA SALVA LIGADA`, 1.9);
    }
  }
  function alta(l) {
    pontuar(500);
    l.acesa = true;
    if (!ALTAS.every(x => x.acesa)) return;
    apagar(ALTAS, 'acesa');
    C.elevadorOuro = true;
    saida.faisca('alta1', 'elevador');
    saida.msg(`ELEVADOR\nDOURADO!\n${fmt(pontuar(5000))}`, 1.6);
  }
  function letra(l) {
    pontuar(500);
    if (l.acesa) return;
    l.acesa = true;
    if (!LETRAS.every(x => x.acesa)) return;
    apagar(LETRAS, 'acesa');
    C.vinil = 4; C.tVinil = T_VINIL * 1.5; aplicar();
    saida.faisca('letra' + l.i, 'vinil');
    saida.salvar(T_SALVA);
    const v = pontuar(5000);
    if (!completar('letras')) saida.msg(`S-T-A-R!\n${fmt(v)}\nTURBO NO MÁXIMO`, 2);
  }
  function girouNoVinil() {
    pontuar(500);
    const aviso = acelerar(null);
    if (aviso) saida.msg(aviso, 1.2);
  }
  const catraca = () => pontuar(100);
  // cada palheta empurra as letras acesas para o lado
  function girarLetras(lado) {
    for (const lista of [LETRAS, ALTAS]) {
      const n = lista.length, a = lista.map(l => l.acesa), k = lado === 'E' ? 1 : n - 1;
      lista.forEach((l, i) => l.acesa = a[(i + k) % n]);
    }
  }

  // ---------- Relógios ----------
  function passar(dt) {
    const desce = n => C[n] = Math.max(0, C[n] - dt);
    desce('ponte');
    if (C.show > 0) { desce('show'); if (!C.show) { proximaFase(); saida.msg(`NÍVEL ${C.nivel}\nFASE 1: ${FASES[0].nome}`, 2.4); } }
    if (C.fase === 4) C.ponte = Math.max(C.ponte, 1);      // no Resgate a ponte fica aberta
    if (C.tunel > 0) { desce('tunel'); if (!C.tunel) apagar(TECLAS, 'acesa'); }
    if (C.tCombo > 0) { desce('tCombo'); if (!C.tCombo) C.combo = 0; }
    if (C.vinil > 1) { desce('tVinil'); if (!C.tVinil) { C.vinil--; C.tVinil = T_VINIL; } }
    aplicar();
  }

  // Luz das setas: 0 apagada, 1 acesa, 2 piscando (vale mais agora)
  function luz(nome) {
    if (C.show > 0 && nome !== 'tunel') return 2;
    switch (nome) {
      case 'tunel': return C.tunel > 0 ? 2 : 0;
      case 'ponte': return C.ponte > 0 ? 2 : 0;
      case 'elevador': return C.elevadorOuro || FASES[C.fase].conta.includes('elevador') ? 2 : 1;
      default: return FASES[C.fase].conta.includes(nome) || C.tCombo > 0 ? 2 : 1;
    }
  }
  // Frase que ensina o próximo passo
  function dica() {
    const f = FASES[C.fase];
    if (C.show > 0) return `Reentrada: todo caminho vale +${fmt(PREMIO)}!`;
    if (C.fase === 2) return `${f.texto} (${COMETA.batidas}/${COMETA.precisa})`;
    return `${f.texto} (${C.feitos}/${alvoDaFase()})`;
  }

  Object.assign(C, { T_COMBO, T_SHOW, zerar, perdeuBola, caminho, tecla, bumper, cometa, alvo, alta, letra, catraca, girouNoVinil, girarLetras, passar, luz, dica });
  aplicar();
  return C;
}
