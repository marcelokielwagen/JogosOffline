// Monta tudo o que aparece na tela e acompanha a simulação a cada quadro.
import * as THREE from 'three';
import { EffectComposer } from '../../../lib/three/addons/EffectComposer.js';
import { RenderPass } from '../../../lib/three/addons/RenderPass.js';
import { UnrealBloomPass } from '../../../lib/three/addons/UnrealBloomPass.js';
import { OutputPass } from '../../../lib/three/addons/OutputPass.js';
import { carregarModelos, texturaRuido, Multidao } from './personagens.js';
import { pistola, submetralhadora, fuzil, BOCA } from './armas.js';
import { PEGADAS } from './animacoes.js';
import { criarCenario, SOL } from './ponte.js';
import { criarEfeitos } from './efeitos.js';
import { criarPortoes } from './portoes.js';
import { ARMAS } from '../dados/balanco.js';
import { MAX_TIROS, MAX_ZUMBIS } from '../nucleo/simulacao.js';

const TEXTURAS = { asfalto_cor: 1, asfalto_relevo: 0, concreto_cor: 1, concreto_relevo: 0, ferrugem_cor: 1, ferrugem_relevo: 0 };

export async function carregarRecursos(base, progresso) {
  const nomes = Object.keys(TEXTURAS); let feito = 0; const total = nomes.length + 1, andou = () => progresso?.(++feito / total);
  const ld = new THREE.TextureLoader();
  const [modelos, ...tx] = await Promise.all([carregarModelos(new URL('personagens.bin', base)).then(m => (andou(), m)), ...nomes.map(n => ld.loadAsync(new URL(n + '.webp', base).href).then(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (TEXTURAS[n]) t.colorSpace = THREE.SRGBColorSpace; andou(); return t; }))]);
  const texturas = {}; nomes.forEach((n, i) => { texturas[n] = tx[i]; });
  return { modelos, texturas, ruido: texturaRuido(), dispose() { for (const n in texturas) texturas[n].dispose(); this.ruido.dispose(); for (const m in modelos) for (const g of modelos[m].lods) g.dispose(); } };
}

export class Cena {
  constructor(caixa, rec, qual) {
    this.caixa = caixa; this.qual = qual; this.rec = rec;
    const R = this.R = new THREE.WebGLRenderer({ antialias: qual === 0, powerPreference: 'high-performance' });
    R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.2; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.info.autoReset = false;
    R.domElement.className = 'pz-tela'; caixa.prepend(R.domElement);
    this.cena = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(48, 1, .5, 480);
    // luz: sol baixo à frente, céu, e um preenchimento suave atrás da câmera para ver bem os zumbis
    const sol = this.sol = new THREE.DirectionalLight('#ffb070', 4.6); sol.castShadow = true; sol.shadow.mapSize.setScalar(qual > 1 ? 2048 : 1024);
    Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 24, bottom: -14, near: 1, far: 90 }); sol.shadow.bias = -.0012; sol.shadow.normalBias = .03; sol.shadow.radius = 2; this.cena.add(sol, sol.target);
    const frente = this.preenche = new THREE.DirectionalLight('#d3daee', 2); this.cena.add(frente, frente.target);
    this.cena.add(new THREE.HemisphereLight('#a9b4d6', '#70503a', .75));
    this.cenario = criarCenario(this.cena, R, rec.texturas, rec.ruido, qual);
    const lods = qual > 1 ? [0, 1, 2] : [1, 2, 3];
    this.sold = new Multidao(this.cena, rec.modelos.soldado, 'soldado', { max: 130, tipo: 0, ruido: rec.ruido, qual, lods: qual > 1 ? [0, 1, 2] : [1, 2], limites: qual > 1 ? [22, 40] : [30] });
    this.zum = new Multidao(this.cena, rec.modelos.zumbi, 'zumbi', { max: MAX_ZUMBIS + 80, tipo: 1, ruido: rec.ruido, qual, lods, limites: qual > 1 ? [23, 42] : qual === 1 ? [20, 36] : [16, 32] });
    for (const f of [pistola, submetralhadora, fuzil]) this.sold.acessorio(f());
    this.fx = criarEfeitos(this.cena, rec.ruido, MAX_TIROS);
    this.portoes = null; this.t = 0; this.camX = 0; this.camD = 0; this.zoom = 1; this.tremor = 0; this.V = new THREE.Vector3(); this.arma = -1; this.comPos = qual > 0;
    this.#posproc(); this.medir();
  }
  #posproc() {
    if (!this.comPos) return;
    const alvo = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: this.qual > 1 ? 4 : 2 });
    this.comp = new EffectComposer(this.R, alvo); this.comp.addPass(new RenderPass(this.cena, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), .32, .55, 1.05); this.comp.addPass(this.bloom); this.out = new OutputPass(); this.comp.addPass(this.out);
  }
  medir() {
    const w = this.caixa.clientWidth || 1, h = this.caixa.clientHeight || 1; if (w === this.w && h === this.h) return; this.w = w; this.h = h;
    const pr = Math.min(devicePixelRatio || 1, [1, 1.4, 2][this.qual]); this.R.setPixelRatio(pr); this.R.setSize(w, h); if (this.comp) { this.comp.setPixelRatio(pr); this.comp.setSize(w, h); this.bloom.setSize(w * pr / 2, h * pr / 2); }
    const as = w / h; this.cam.aspect = as; this.emPe = as < 1; this.cam.fov = this.emPe ? 50 : 42; this.cam.updateProjectionMatrix(); this.fx.altura(h * pr);
    // distância para caber a largura da pista
    const larg = this.emPe ? 8.6 : 15; this.dist = THREE.MathUtils.clamp(larg / 2 / (Math.tan(this.cam.fov * Math.PI / 360) * as), 14.5, 24);
  }
  novaPartida(S) {
    this.portoes?.dispose(); this.portoes = criarPortoes(this.cena, S, this.rec.ruido); this.camX = S.x; this.camD = S.d; this.zoom = 1; this.S = S; this.arma = -1; this.noMenu = true; this.menu = this.menu ?? 1;
  }
  async preparar() { // compila tudo antes, para não travar no começo
    this.zum.limpar(); this.zum.por(0, 0, -this.S.d - 20, 0, 1, 1, 0, .5, 0, 10); this.zum.fechar(); this.quadro(.016, this.S);
    try { await this.R.compileAsync(this.cena, this.cam); } catch (e) { /* alguns aparelhos não aceitam */ }
    if (this.R) this.quadro(.016, this.S);
  }
  evento(nome, d) {
    const fx = this.fx;
    switch (nome) {
      case 'acerto': fx.sangue(d.x, 1.15 * d.z.esc, -d.d, 2, .7); if (d.z.tipo === 'blindado') fx.faisca(d.x, 1.3, -d.d + .4, 2); break;
      case 'morte': fx.sangue(d.x, 1.2, -d.d, 8, 1); if (Math.random() < .5) fx.mancha(d.x + (Math.random() - .5) * .4, -d.d - .7, .8 + Math.random() * .7); break;
      case 'soldado': fx.sangue(d.x, 1.2, -d.d, 6, .8); fx.mancha(d.x, -d.d, 1.2); this.tremor = Math.min(.25, this.tremor + .06); break;
      case 'faisca': fx.faisca(d.x, .7, -d.d, 4); break;
      case 'faiscaPortao': fx.faisca(d.x, 1.3 + Math.random() * .6, -d.d + .1, 2, d.bom); break;
      case 'barril': fx.explosao(d.x, -d.d); this.tremor = .35; break;
      case 'portao': fx.portal((d.k ? 1 : -1) * 2.5, -d.p.d, 2.3, d.bom); break;
    }
  }
  camera(dt, S) {
    const cam = this.cam, pe = this.emPe;
    const n = Math.min(100, S.n), alvoZoom = 1 + Math.sqrt(n) * (pe ? .012 : .016); this.zoom += (alvoZoom - this.zoom) * Math.min(1, dt * 1.5);
    this.camX += (S.x * (pe ? .62 : .4) - this.camX) * Math.min(1, dt * 5); this.camD += (S.d + S.frente * .35 - this.camD) * Math.min(1, dt * 8); this.tremor = Math.max(0, this.tremor - dt * .9);
    this.menu += (+this.noMenu - this.menu) * Math.min(1, dt * 3);
    const mn = this.menu, D = this.dist * this.zoom * (1 - mn * (pe ? .62 : .5)), ang = (pe ? .56 : .37) - mn * .27, tr = this.tremor, bal = Math.sin(this.t * 9) * .012;
    cam.position.set(this.camX + Math.sin(this.t * 41) * tr * .25, Math.sin(ang) * D + 1 + bal + Math.sin(this.t * 37) * tr * .25, -this.camD + Math.cos(ang) * D);
    this.V.set(this.camX * .92, (pe ? 1.0 : 1.4) - mn * (pe ? .55 : .1), -this.camD - (pe ? 6.5 : 5) + mn * (pe ? 3 : 2)); cam.lookAt(this.V);
    const foco = -this.camD - 9; this.sol.target.position.set(this.camX * .5, 0, foco); this.sol.position.copy(this.sol.target.position).addScaledVector(SOL, 42); this.sol.position.y += 6;
    this.preenche.target.position.set(this.camX, 1, foco); this.preenche.position.set(this.camX - 5, 9, foco + 18);
    this.cenario.atualizar(this.camD, this.t, cam);
  }
  quadro(dt, S) {
    this.t += dt; this.camera(dt, S); const cam = this.cam;

    // soldados
    const A = ARMAS[S.arma], pg = A.pegada; if (this.arma !== S.arma) { this.arma = S.arma; this.sold.usar(S.arma); this.fx.tamanhoTiro(S.arma); }
    const so = this.sold, zu = this.zum, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z, [bz, by] = BOCA[pg], pos = PEGADAS[pg].pos, distancia = (x, z) => Math.hypot(x - cx, cy, z - cz);
    // pelotão grande: modelos mais leves (na tela eles ficam menores mesmo)
    if (this.qual > 1) { so.limites[0] = S.n > 55 ? 13 : 22; so.limites[1] = S.n > 55 ? 24 : 40; }
    else so.limites[0] = S.n > 45 ? 0 : S.n > 25 ? 22 : 30;
    so.limpar(); zu.limpar();
    for (const s of S.soldados) {
      const idade = s.nasceu ? Math.min(1, (S.tempo - s.nasceu) * 3.5) : 1, e = (.97 + s.semente * .07) * (.4 + .6 * idade);
      so.por(s.x, 0, -s.d, Math.PI - s.inclina, e, e, so.quadro('corre_' + pg, s.fase), s.semente, 0, distancia(s.x, -s.d));
      if (s.tiro !== undefined) { const q = S.tempo - s.tiro; if (q < .09) this.fx.boca(s.x - pos[0], pos[1] + by, -s.d - pos[2] - bz - .05, (1 - q / .09) * .9); }
    }
    this.fx.fecharBocas();
    for (const z of S.zumbis) {
      const e = z.esc, larg = z.tipo === 'blindado' ? 1.18 : 1, clipe = z.tipo === 'corredor' ? 'corre' : z.jeito ? 'anda1' : 'anda0';
      zu.por(z.x, 0, -z.d, z.ang, e * larg, e, zu.quadro(clipe, z.fase), z.semente, z.dano, distancia(z.x, -z.d), z.tipo === 'blindado' ? 1 : 0, z.d - S.d < 34);
    }
    const leve = this.qual < 2 || S.caidos.length > 50 ? this.zum.limites[0] + .1 : 0; // muitos corpos no chão: modelo leve
    for (const c of S.caidos) {
      const afunda = Math.max(0, c.t - 4.5) * .5;
      if (c.quem === 'soldado') so.por(c.x, -afunda, -c.d, Math.PI, 1, 1, so.quadro('morre_' + pg, Math.min(1, c.t / .8), false), c.semente, 0, Math.max(distancia(c.x, -c.d), leve), 0, c.t < 1.2);
      else zu.por(c.x, -afunda, -c.d, c.ang || 0, c.esc, c.esc, zu.quadro(c.jeito ? 'morre1' : 'morre0', Math.min(1, c.t / .75), false), c.semente, 0, Math.max(distancia(c.x, -c.d), leve), 0, c.t < 1.2);
    }
    so.fechar(); zu.fechar();
    this.fx.atualizar(dt, S); this.portoes.atualizar(dt, this.t, S.d);
    this.R.info.reset();
    if (this.comp) this.comp.render(dt); else this.R.render(this.cena, cam);
  }
  // muda a qualidade sem recomeçar (resolução, sombras do cenário, brilho e detalhe à distância)
  ajustar(q) { this.lz ??= this.zum.limites.slice(); this.ls ??= this.sold.limites.slice(); this.qual0 ??= this.qual; const k = q < this.qual0 ? .7 : 1; this.qual = q; this.w = 0; this.zum.limites = this.lz.map(x => x * k); this.sold.limites = this.ls.map(x => x * k); this.cenario.sombras(q > 0); if (this.bloom) this.bloom.enabled = q > 0; this.medir(); }
  // posição na tela de um ponto da pista
  naTela(x, y, d) { this.V.set(x, y, -d).project(this.cam); return [(this.V.x * .5 + .5) * this.w, (-this.V.y * .5 + .5) * this.h]; }
  dispose() {
    this.portoes?.dispose(); this.fx.dispose(); this.sold.dispose(); this.zum.dispose(); this.cenario.dispose(); this.sol.shadow.map?.dispose();
    if (this.comp) { this.bloom.dispose(); this.out.dispose(); this.comp.dispose(); }
    const R = this.R; R.renderLists.dispose(); R.dispose(); this.restou = { ...R.info.memory }; R.forceContextLoss(); R.domElement.remove(); this.R = null;
  }
}
