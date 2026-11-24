// Monta tudo o que aparece na tela e acompanha a simulação a cada quadro.
import * as THREE from 'three';
import { EffectComposer } from '../../../lib/three/addons/EffectComposer.js';
import { RenderPass } from '../../../lib/three/addons/RenderPass.js';
import { UnrealBloomPass } from '../../../lib/three/addons/UnrealBloomPass.js';
import { OutputPass } from '../../../lib/three/addons/OutputPass.js';
import { carregarModelos, texturaRuido, Multidao } from './personagens.js';
import { MODELOS } from './armas.js';
import { Chefe } from './chefes.js';
import { criarCenario, CLIMAS } from './ponte.js';
import { criarEfeitos } from './efeitos.js';
import { criarPortoes } from './portoes.js';
import { ARMAS } from '../dados/balanco.js';
import { MAX_TIROS, MAX_ZUMBIS } from '../nucleo/simulacao.js';

export async function carregarRecursos(base, progresso) {
  const modelos = await carregarModelos(new URL('personagens.bin', base)); progresso?.(1);
  return { modelos, ruido: texturaRuido(), dispose() { this.ruido.dispose(); for (const m in modelos) for (const g of modelos[m].lods) g.dispose(); } };
}
const CHAVE = new THREE.Vector3(-.5, 1, .42).normalize(); // luz principal: alta e por trás da câmera, para tudo aparecer claro

export class Cena {
  constructor(caixa, rec, qual) {
    this.caixa = caixa; this.qual = qual; this.rec = rec;
    const R = this.R = new THREE.WebGLRenderer({ antialias: qual === 0, powerPreference: 'high-performance' });
    R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.info.autoReset = false;
    R.domElement.className = 'pz-tela'; caixa.prepend(R.domElement);
    this.cena = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(48, 1, .5, 480);
    const sol = this.sol = new THREE.DirectionalLight('#ffe2b0', 3.2); sol.castShadow = true; sol.shadow.mapSize.setScalar(qual > 1 ? 2048 : 1024);
    Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 26, bottom: -14, near: 1, far: 90 }); sol.shadow.bias = -.0012; sol.shadow.normalBias = .03; sol.shadow.radius = 1.5; sol.shadow.intensity = .72; this.cena.add(sol, sol.target);
    this.hemi = new THREE.HemisphereLight('#b9d4ff', '#b06a58', 1.5); this.cena.add(this.hemi);
    this.cenario = criarCenario(this.cena, R, null, rec.ruido, qual);
    const M = rec.modelos, r = rec.ruido, lods = qual > 1 ? [0, 1, 2] : [1, 2, 3], esp = qual > 1 ? .021 : .024;
    this.sold = new Multidao(this.cena, M.soldado, 'soldado', { max: 130, tipo: 0, ruido: r, lods, limites: [22, 40], comContorno: qual > 0 ? 2 : 0, esp });
    const lz = qual > 1 ? [20, 36] : qual === 1 ? [17, 30] : [15, 30];
    this.zum = new Multidao(this.cena, M.zumbi, 'zumbi', { max: MAX_ZUMBIS + 80, tipo: 1, ruido: r, lods, limites: lz, comContorno: qual > 0 ? 1 : 0, esp });
    this.gor = new Multidao(this.cena, M.gordo, 'gordo', { max: 60, tipo: 1, ruido: r, lods, limites: lz.map(x => x + 8), comContorno: qual > 0 ? 2 : 0, esp, pal: { metal: '#9aa6b8' } });
    MODELOS.forEach(f => this.sold.acessorio(f(), qual > 0));
    this.fx = criarEfeitos(this.cena, r, MAX_TIROS);
    this.portoes = null; this.chefe = null; this.t = 0; this.camX = 0; this.camD = 0; this.zoom = 1; this.tremor = 0; this.luta = 0; this.V = new THREE.Vector3(); this.comPos = qual > 0; this.espera = [];
    this.#posproc(); this.medir();
  }
  #posproc() {
    if (!this.comPos) return;
    const alvo = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: this.qual > 1 ? 4 : 2 });
    this.comp = new EffectComposer(this.R, alvo); this.comp.addPass(new RenderPass(this.cena, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), .16, .5, 1.1); this.comp.addPass(this.bloom); this.out = new OutputPass(); this.comp.addPass(this.out);
  }
  medir() {
    const w = this.caixa.clientWidth || 1, h = this.caixa.clientHeight || 1; if (w === this.w && h === this.h) return; this.w = w; this.h = h;
    const pr = Math.min(devicePixelRatio || 1, [1, 1.5, 2][this.qual]); this.R.setPixelRatio(pr); this.R.setSize(w, h); if (this.comp) { this.comp.setPixelRatio(pr); this.comp.setSize(w, h); this.bloom.setSize(w * pr / 2, h * pr / 2); }
    const as = w / h; this.cam.aspect = as; this.emPe = as < 1; this.cam.fov = this.emPe ? 50 : 42; this.cam.updateProjectionMatrix(); this.fx.altura(h * pr);
    // distância para caber a largura da pista
    const larg = this.emPe ? 8.3 : 15; this.dist = THREE.MathUtils.clamp(larg / 2 / (Math.tan(this.cam.fov * Math.PI / 360) * as), 14, 24);
  }
  novaPartida(S) {
    this.portoes?.dispose(); this.portoes = criarPortoes(this.cena, S, this.rec.ruido); this.camX = S.x; this.camD = S.d; this.zoom = 1; this.luta = 0; this.S = S; this.noMenu = true; this.menu = this.menu ?? 1; this.fx.limpar(); this.espera.length = 0;
    if (this.chefe?.id !== S.trecho.chefe) { this.chefe?.dispose(); this.chefe = new Chefe(this.cena, this.rec.modelos, S.trecho.chefe, this.rec.ruido, this.qual); } else { this.chefe.dispose(); this.chefe = new Chefe(this.cena, this.rec.modelos, S.trecho.chefe, this.rec.ruido, this.qual); }
    const c = this.cenario.clima(S.trecho.cenario); this.sol.color.set(c.chave); this.sol.intensity = c.forca; this.hemi.color.set(c.ceu); this.hemi.groundColor.set(c.chao); this.hemi.intensity = c.hemi;
  }
  async preparar() { // compila tudo antes, para não travar no começo
    for (const [m, z] of [[this.zum, -20], [this.gor, -22]]) { m.limpar(); m.por(0, 0, -this.S.d + z, 0, 1, 1, 0, .5, 0, 10); m.fechar(); }
    this.sold.limpar(); MODELOS.forEach((f, i) => this.sold.por(i, 0, -this.S.d - 18, 0, 1, 1, 0, .5, 0, 10, 0, true, i)); this.sold.fechar();
    try { await this.R.compileAsync(this.cena, this.cam); } catch (e) { /* alguns aparelhos não aceitam */ }
    if (this.R) this.quadro(.016, this.S);
  }
  evento(nome, d) {
    const fx = this.fx, V = this.V;
    switch (nome) {
      case 'acerto': fx.impacto(d.x, 1.05 * d.z.esc, -d.d + .25, d.arma, .85); fx.sangue(d.x, 1.0 * d.z.esc, -d.d, 1, .7); break;
      case 'acertoChefe': fx.impacto(d.x, d.y, -d.d + .4, d.arma, 1.5); break;
      case 'morte': fx.sangue(d.x, 1, -d.d, 6, 1); if (Math.random() < .4) fx.mancha(d.x + (Math.random() - .5) * .4, -d.d - .7, .8 + Math.random() * .7); break;
      case 'soldado': fx.sangue(d.x, 1, -d.d, 5, .8); this.tremor = Math.min(.2, this.tremor + .05); break;
      case 'faisca': fx.impacto(d.x, .8, -d.d, d.arma, .9); break;
      case 'faiscaPortao': fx.impacto(d.x, 1.1 + Math.random() * .6, -d.d + .15, d.arma, .7); break;
      case 'explosao': fx.explosao(d.x, -d.d, d.raio, .8); this.tremor = Math.min(.22, this.tremor + .08); break;
      case 'barril': fx.explosao(d.x, -d.d, 3.6); this.tremor = .32; break;
      case 'reforco': fx.confete(d.b.x, .8, -d.b.d, 26); fx.anel(d.b.x, -d.b.d, 2.4, [.3, .9, .3], .6); break;
      case 'portao': fx.portal((d.k ? 1 : -1) * 2.5, -d.p.d, 2.3, d.l.tipo === 'arma' || d.l.tipo === 'especial' || d.l.tipo === 'cadencia' ? 2 : d.bom); break;
      case 'chefePousa': fx.pouso(d.x, -d.d, d.T.raio); this.tremor = .55; break;
      case 'passoChefe': fx.nuvem(d.x + (Math.floor(d.passo * 2) % 2 ? .9 : -.9), .2, -d.d + .6, 4, [.5, .42, .36], .7, 1.4); this.tremor = Math.max(this.tremor, .1); break;
      case 'fase': fx.anel(d.x, -d.d, 6, [1, .3, .1], .8); fx.anel(d.x, -d.d, 4, [1, .72, .12], .7, .12); this.tremor = .3; break;
      case 'golpe': { const c = this.S.chefe; fx.golpe(d.m); if (d.m.som === 'grito') this.tremor = .2; else { this.tremor = Math.min(.5, .28 + (d.dentro ? .12 : 0)); if (d.m.som === 'pancada' && d.m.forma === 'faixa') fx.nuvem(c.x, .4, -(c.d - c.T.raio - 1.5), 8, [.5, .42, .36], 1.2, 3); } break; }
      case 'placaCaiu': { this.chefe.soltar(d.i); V.copy(this.chefe.ponto(2, 0, .95, .45)); fx.explosao(V.x, V.z + 1, 2.2, V.y); this.tremor = .25; break; }
      case 'chefeMorre': { this.tremor = .5; for (let i = 0; i < 9; i++) this.espera.push([i * .26, () => { const c = this.S.chefe; fx.explosao(c.x + (Math.random() - .5) * 4, -c.d + 1 + Math.random() * 1.5, 2.6 + Math.random() * 1.4, .8 + Math.random() * c.T.altura * .6); this.tremor = Math.min(.4, this.tremor + .14); }]); this.espera.push([2.5, () => { const c = this.S.chefe; fx.explosao(c.x, -c.d, 6.5, 1.4); fx.pouso(c.x, -c.d, 2); this.tremor = .6; }], [2.9, () => fx.confete(this.S.x, 4, -(this.S.d + 3), 90)], [4.2, () => fx.confete(this.S.x, 4, -(this.S.d + 2), 90)]); break; }
      case 'alcancou': this.tremor = .6; fx.pouso(d.x, -d.d + 2, 2.4); break;
    }
  }
  camera(dt, S) {
    const cam = this.cam, pe = this.emPe;
    const n = Math.min(100, S.n), alvoZoom = 1 + Math.sqrt(n) * (pe ? .012 : .016); this.zoom += (alvoZoom - this.zoom) * Math.min(1, dt * 1.5);
    this.camX += (S.x * (pe ? .62 : .4) - this.camX) * Math.min(1, dt * 5); this.camD += (S.d + S.frente * (S.luta ? .2 : .35) - this.camD) * Math.min(1, dt * 8); this.tremor = Math.max(0, this.tremor - dt * .9);
    this.menu += (+this.noMenu - this.menu) * Math.min(1, dt * 3); this.luta += ((S.luta && S.luta !== 'fim' ? 1 : 0) - this.luta) * Math.min(1, dt * 1.6);
    const mn = this.menu, L = this.luta * (1 - mn), D = this.dist * this.zoom * (1 - mn * (pe ? .64 : .5)) * (1 + L * (pe ? .06 : -.1)), ang = (pe ? .56 : .37) - mn * .3 - L * (pe ? .14 : .08), tr = this.tremor;
    cam.position.set(this.camX + Math.sin(this.t * 41) * tr * .25, Math.sin(ang) * D + 1 + Math.sin(this.t * 37) * tr * .25, -this.camD + Math.cos(ang) * D);
    this.V.set(this.camX * .92, (pe ? .9 : 1.2) - mn * (pe ? .95 : .25) + L * (pe ? 1.6 : 1.5), -this.camD - (pe ? 6.5 : 5) + mn * (pe ? 4 : 2) - L * 2.5); const fp = this.fimP = (this.fimP || 0) + ((this.noMenu && this.noMenu !== true ? 1 : 0) - (this.fimP || 0)) * Math.min(1, dt * 3); const fov = pe ? 50 : 42 - L * 7; if (Math.abs(cam.fov - fov) > .05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    const lado = !pe && this.h < 480 ? Math.max(mn, fp) : 0; this.V.x -= lado * D * .3; cam.position.x -= lado * D * .3; if (pe) { this.V.y -= fp * (2.4 + D * .19); } cam.lookAt(this.V);
    const foco = -this.camD - 9; this.sol.target.position.set(this.camX * .5, 0, foco); this.sol.position.copy(this.sol.target.position).addScaledVector(CHAVE, 42);
    this.cenario.atualizar(this.camD, this.t, cam);
  }
  quadro(dt, S) {
    this.t += dt; this.camera(dt, S); const cam = this.cam, q2 = this.qual > 1, n = S.soldados.length;
    for (let i = this.espera.length - 1; i >= 0; i--) if ((this.espera[i][0] -= dt) <= 0) this.espera.splice(i, 1)[0][1]();
    const so = this.sold, zu = this.zum, go = this.gor, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z, distancia = (x, z) => Math.hypot(x - cx, cy, z - cz);
    // pelotão grande: modelos mais leves (na tela eles ficam menores mesmo)
    so.limites[0] = n <= 14 ? 26 : n <= 40 && q2 ? 14 : 0; so.limites[1] = n <= 40 ? 34 : q2 ? 18 : 14; if (this.leve) so.limites[0] = n <= 8 ? 20 : 0;
    so.mat.userData.u.uGiro.value = this.t * 14; so.limpar(); zu.limpar(); go.limpar();
    const vira = Math.min(1, this.menu * 1.15) * (S.estado === 'jogando' && !S.luta ? 1 : 0), festa = S.estado === 'vitoria' || S.luta === 'morre' && S.tLuta > 2.6;
    for (const s of S.soldados) {
      const idade = s.nasceu ? Math.min(1, (S.tempo - s.nasceu) * 3.5) : 1, arma = s.arma || S.arma, pg = ARMAS[arma].pegada, e = (.97 + s.semente * .07) * (.4 + .6 * idade + Math.sin(idade * Math.PI) * .22) * (s.arma ? 1.09 : 1);
      const move = S.ritmo > .3 && !this.noMenu || Math.abs(s.vx) > .9 || Math.abs(s.vd - 5.2 * S.ritmo) > 1.1 && S.luta, clipe = festa ? 'comemora' : move ? 'corre_' + pg : 'mira_' + pg, ang = festa ? (s.semente - .5) * .9 : Math.PI * (1 - vira) - s.inclina + vira * (s.semente - .5) * .5 - (S.luta && !move ? Math.atan2((S.chefe?.x ?? 0) - s.x, 25) : 0);
      so.por(s.x, 0, -s.d, ang, e, e, so.quadro(clipe, festa ? s.fase * .7 + s.semente : move ? s.fase : this.t * .5 + s.semente), s.semente, S.atordoado > 0 ? .35 : 0, distancia(s.x, -s.d), s.arma ? s.arma - 2 : 0, true, arma);
    }
    for (const z of S.zumbis) {
      const e = z.esc, m = z.tipo === 'blindado' ? go : zu, clipe = z.tipo === 'corredor' ? 'corre' : z.jeito ? 'anda1' : 'anda0';
      m.por(z.x, 0, -z.d, z.ang, e, e, m.quadro(clipe, z.fase), z.semente, z.dano, distancia(z.x, -z.d), (z.tipo === 'corredor' ? 1 : 0) + (z.fogo > 0 ? .5 : 0), z.d - S.d < 34);
    }
    const leve = !q2 || S.caidos.length > 50; // muitos corpos no chão: modelo leve
    for (const c of S.caidos) {
      const afunda = Math.max(0, c.t - 4.5) * .5, m = c.quem === 'soldado' ? so : c.tipo === 'blindado' ? go : zu, dz = leve ? Math.max(distancia(c.x, -c.d), m.limites[1] + .1) : distancia(c.x, -c.d);
      if (m === so) so.por(c.x, -afunda, -c.d, Math.PI, 1, 1, so.quadro('morre_' + ARMAS[c.arma || S.arma].pegada, Math.min(1, c.t / .8), false), c.semente, 0, dz, c.arma ? c.arma - 2 : 0, c.t < 1.2);
      else m.por(c.x, -afunda, -c.d, c.ang || 0, c.esc, c.esc, m.quadro(c.jeito ? 'morre1' : 'morre0', Math.min(1, c.t / .75), false), c.semente, 0, dz, (c.tipo === 'corredor' ? 1 : 0) + (c.fogo ? .5 : 0), c.t < 1.2);
    }
    so.fechar(); zu.fechar(); go.fechar();
    this.chefe.atualizar(dt, S); this.fx.atualizar(dt, S); this.portoes.atualizar(dt, this.t, S.d);
    this.R.info.reset();
    if (this.comp) this.comp.render(dt); else this.R.render(this.cena, cam);
  }
  // muda a qualidade sem recomeçar (resolução, sombras do cenário, brilho e detalhe à distância)
  ajustar(q) { this.lz ??= this.zum.limites.slice(); this.lg ??= this.gor.limites.slice(); this.qual0 ??= this.qual; const k = q < this.qual0 ? .7 : 1; this.qual = q; this.w = 0; this.leve = k < 1; this.zum.limites = this.lz.map(x => x * k); this.gor.limites = this.lg.map(x => x * k); this.cenario.sombras(q > 0); if (this.bloom) this.bloom.enabled = q > 0; this.medir(); }
  // posição na tela de um ponto da pista
  naTela(x, y, d) { this.V.set(x, y, -d).project(this.cam); return [(this.V.x * .5 + .5) * this.w, (-this.V.y * .5 + .5) * this.h]; }
  dispose() {
    this.portoes?.dispose(); this.chefe?.dispose(); this.fx.dispose(); this.sold.dispose(); this.zum.dispose(); this.gor.dispose(); this.cenario.dispose(); this.sol.shadow.map?.dispose(); this.sol.dispose();
    if (this.comp) { this.bloom.dispose(); this.out.dispose(); this.comp.dispose(); }
    const R = this.R; R.renderLists.dispose(); R.dispose(); this.restou = { ...R.info.memory }; R.forceContextLoss(); R.domElement.remove(); this.R = null;
  }
}
export { CLIMAS };
