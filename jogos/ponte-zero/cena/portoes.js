// Portões de energia e barris, com os números sempre iguais ao efeito real.
import * as THREE from 'three';

const LARG = 5, ALT = 3.1;
const texto = l => l.tipo === 'soma' || l.tipo === 'tiro' ? (l.v >= 0 ? '+' : '−') + Math.abs(l.v) : l.tipo === 'vezes' ? '×' + l.v : l.tipo === 'divide' ? '÷' + l.v : l.tipo === 'arma' ? 'ARMA' : `+${l.v}%`;
const legenda = l => l.tipo === 'tiro' ? 'ATIRE' : l.tipo === 'arma' ? 'MELHOR' : l.tipo === 'cadencia' ? 'CADÊNCIA' : l.tipo === 'vezes' || l.v > 0 ? 'SOLDADOS' : 'PERDE';

function letreiro(w = 256, h = 160) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { c, t, escrever(a, b) { const x = c.getContext('2d'); x.clearRect(0, 0, w, h); x.textAlign = 'center'; x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,8,20,.75)'; x.fillStyle = '#fff'; const f = b === undefined ? h * .62 : a.length > 3 ? 74 : 104; x.font = `900 ${f}px system-ui, sans-serif`; x.lineWidth = 12; const y = b === undefined ? h * .72 : 100; x.strokeText(a, w / 2, y); x.fillText(a, w / 2, y); if (b) { x.font = '800 30px system-ui, sans-serif'; x.lineWidth = 7; x.strokeText(b, w / 2, 144); x.fillText(b, w / 2, 144); } t.needsUpdate = true; } };
}
const VERT = 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';

export function criarPortoes(cena, S, ruido) {
  const lixo = [], D = o => (lixo.push(o), o), grupos = [];
  const gPainel = D(new THREE.PlaneGeometry(LARG - .3, ALT - .2)), gPoste = D(new THREE.CylinderGeometry(.11, .15, ALT + .5, 8)), gBase = D(new THREE.CylinderGeometry(.3, .38, .28, 8)), gFio = D(new THREE.BoxGeometry(LARG - .3, .06, .06)), gTubo = D(new THREE.BoxGeometry(.05, ALT - .1, .05)), gTxt = D(new THREE.PlaneGeometry(2.9, 1.8));
  const mPoste = D(new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: .4, metalness: .85 }));
  const AZUL = new THREE.Color(.08, .42, 1), VERM = new THREE.Color(1, .1, .05), OURO = new THREE.Color(1, .62, .08);
  for (const p of S.portoes) {
    const g = new THREE.Group(); g.position.z = -p.d; cena.add(g);
    for (const x of [-LARG, 0, LARG]) { const a = new THREE.Mesh(gPoste, mPoste); a.position.set(x, (ALT + .5) / 2, 0); a.castShadow = true; const b = new THREE.Mesh(gBase, mPoste); b.position.set(x, .14, 0); g.add(a, b); }
    const lados = p.lados.map((l, k) => {
      const u = { uCor: { value: new THREE.Color() }, uA: { value: 1 }, tRuido: { value: ruido }, uT: { value: 0 } };
      const m = D(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: u, vertexShader: VERT, fragmentShader: 'varying vec2 vU; uniform vec3 uCor; uniform float uA, uT; uniform sampler2D tRuido; void main(){ vec2 e = abs(vU - .5) * 2.; float b = pow(max(e.x, e.y), 7.), n = texture2D(tRuido, vU * vec2(1.2, .7) + vec2(0., uT * .02)).r; float a = .20 + .16 * n + .5 * b + .12 * (1. - vU.y); gl_FragColor = vec4(uCor * (.75 + b * 1.1), a * uA); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }' }));
      const mF = D(new THREE.MeshBasicMaterial({ fog: false, transparent: true })), x = (k ? 1 : -1) * LARG / 2;
      const painel = new THREE.Mesh(gPainel, m); painel.position.set(x, ALT / 2 + .15, 0); painel.renderOrder = 3;
      const fios = [.1, ALT + .2].map(y => { const f = new THREE.Mesh(gFio, mF); f.position.set(x, y, 0); return f; }), tubos = [-1, 1].map(s => { const f = new THREE.Mesh(gTubo, mF); f.position.set(x + s * (LARG / 2 - .2), ALT / 2 + .15, .02); return f; });
      const L = letreiro(), mL = D(new THREE.MeshBasicMaterial({ map: D(L.t), transparent: true, depthWrite: false, fog: false, toneMapped: false })), txt = new THREE.Mesh(gTxt, mL); txt.position.set(x, ALT / 2 + .2, .06); txt.renderOrder = 4;
      g.add(painel, ...fios, ...tubos, txt);
      return { l, u, mF, L, mL, txt, pulo: 0, ultimo: '' };
    });
    grupos.push({ p, g, lados, sumir: 0 });
  }
  // barris
  const perf = [[0, 0], [.3, 0], [.31, .03], [.29, .06], [.29, .28], [.31, .31], [.29, .34], [.29, .56], [.31, .59], [.29, .62], [.29, .84], [.31, .87], [.3, .9], [.27, .88], [0, .88]].map(([x, y]) => new THREE.Vector2(x, y));
  const gBar = D(new THREE.LatheGeometry(perf, 18)), mBar = D(new THREE.MeshStandardMaterial({ color: '#a5240f', roughness: .45, metalness: .45 }));
  mBar.onBeforeCompile = sh => { sh.uniforms.tRuido = { value: ruido }; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvL = position;'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRuido; varying vec3 vL;').replace('#include <color_fragment>', '#include <color_fragment>\nfloat fx = step(.38, vL.y) * step(vL.y, .52) * step(.0, vL.z); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.75, .5, .05), fx * .8); float fr = smoothstep(.52, .66, texture2D(tRuido, vL.xy * 1.1 + vL.z).r); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.1, .045, .025), fr);').replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(roughness, .9, fr);'); };
  const barris = S.barris.map(b => {
    const g = new THREE.Group(); g.position.set(b.x, 0, -b.d); cena.add(g);
    for (const [x, z, e] of [[0, 0, 1], [.55, -.25, .96], [-.5, -.35, 1.02]]) { const m = new THREE.Mesh(gBar, mBar); m.position.set(x * .8, 0, z); m.scale.setScalar(e * 1.12); m.rotation.y = x * 3; m.castShadow = m.receiveShadow = true; g.add(m); }
    const L = letreiro(160, 80), mL = D(new THREE.SpriteMaterial({ map: D(L.t), depthWrite: false, fog: false, toneMapped: false })), s = new THREE.Sprite(mL); s.position.y = 1.55; s.scale.set(1.2, .6, 1); s.renderOrder = 4; g.add(s);
    return { b, g, L, ultimo: '' };
  });
  return {
    // prepara=true força tudo visível para compilar antes de jogar
    atualizar(dt, t, d) {
      for (const o of grupos) {
        const perto = o.p.d - d; o.g.visible = perto < 120 && perto > -20 && o.sumir < 1; if (!o.g.visible) continue;
        if (o.p.usado >= 0) o.sumir = Math.min(1, o.sumir + dt * 2.2);
        o.lados.forEach((k, i) => {
          const tx = texto(k.l), bom = S.bom(k.l), ouro = k.l.tipo === 'arma' || k.l.tipo === 'cadencia';
          if (tx !== k.ultimo) { if (k.ultimo) k.pulo = 1; k.ultimo = tx; k.L.escrever(tx, legenda(k.l)); }
          const c = ouro ? OURO : bom ? AZUL : VERM; k.u.uCor.value.lerp(c, k.pronto ? Math.min(1, dt * 6) : 1); k.pronto = true; k.mF.color.copy(k.u.uCor.value).multiplyScalar(2.4);
          k.pulo = Math.max(0, k.pulo - dt * 5); const a = o.p.usado < 0 ? 1 : o.p.usado === i ? 1 - o.sumir : Math.max(0, .5 - o.sumir); k.u.uA.value = a; k.mF.opacity = a; k.mL.opacity = a; k.u.uT.value = t;
          const e = 1 + k.pulo * .14 + (o.p.usado === i ? o.sumir * .5 : 0); k.txt.scale.set(e, e, 1);
        });
      }
      for (const o of barris) { const perto = o.b.d - d; o.g.visible = o.b.vivo && perto < 110 && perto > -15; if (!o.g.visible) continue; const v = String(Math.max(1, Math.ceil(o.b.vida))); if (v !== o.ultimo) { o.ultimo = v; o.L.escrever(v); } o.g.scale.setScalar(1 + o.b.dano * .04); }
    },
    dispose() { for (const o of lixo) o.dispose(); for (const o of [...grupos, ...barris]) o.g.removeFromParent(); },
  };
}
