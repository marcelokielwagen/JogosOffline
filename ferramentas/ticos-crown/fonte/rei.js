'use strict';
// Rei Tico: personagem caricato 3D em estilo anime. O rosto é desenhado ao vivo numa textura (olhos grandes,
// sobrancelhas, boca, rubor, suor, lágrimas), e o corpo reage: pula, gira, treme, segura a cabeça.
const Rei = (() => {
  const cena = new THREE.Scene(); cena.environment = ENV;
  const cam = new THREE.PerspectiveCamera(26, 1, .1, 60);
  cena.add(new THREE.HemisphereLight(0xfff0dc, 0x7a4a9a, .85));
  const sol = new THREE.DirectionalLight(0xfff2e0, 1.9); sol.position.set(-2, 4, 5); cena.add(sol);
  const contra = new THREE.DirectionalLight(0xffb0e0, 1.6); contra.position.set(3, 2.5, -4); cena.add(contra);
  const M = o => new THREE.MeshStandardMaterial(o);
  const mPele = new THREE.MeshPhysicalMaterial({ color: 0xffbf9a, roughness: .6, sheen: .6, sheenColor: new THREE.Color(0xff9a8a) });
  const mCabelo = new THREE.MeshPhysicalMaterial({ color: 0xff8a1f, roughness: .35, clearcoat: .6, sheen: .5, sheenColor: new THREE.Color(0xffd27a) });
  const mRoupa = new THREE.MeshPhysicalMaterial({ color: 0x2f5dff, roughness: .35, clearcoat: .7 });
  const mCalca = M({ color: 0xfff6e8, roughness: .6 });
  const mCapa = new THREE.MeshPhysicalMaterial({ color: 0xe0193c, roughness: .45, sheen: 1, sheenColor: new THREE.Color(0xff7090), side: THREE.DoubleSide });
  const mBranco = M({ color: 0xffffff, roughness: .8 });
  const mPreto = M({ color: 0x1a1420, roughness: .6 });
  const mBota = new THREE.MeshPhysicalMaterial({ color: 0x7a3a12, roughness: .3, clearcoat: .8 });
  const mRubi = new THREE.MeshPhysicalMaterial({ color: 0xff1744, roughness: .05, clearcoat: 1, flatShading: true, emissive: 0x600014, envMapIntensity: 2 });
  const mSafira = new THREE.MeshPhysicalMaterial({ color: 0x2979ff, roughness: .05, clearcoat: 1, flatShading: true, emissive: 0x001a60, envMapIntensity: 2 });

  const raiz = new THREE.Group(); cena.add(raiz);
  // palco redondo de veludo com aro de ouro
  const palco = new THREE.Mesh(new THREE.CylinderGeometry(.95, 1.02, .22, 48), new THREE.MeshPhysicalMaterial({ color: 0xb3123a, roughness: .6, sheen: 1, sheenColor: new THREE.Color(0xff5577) }));
  palco.position.y = -.11; cena.add(palco);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(.99, .045, 12, 64), MAT.ouro); aro.rotation.x = Math.PI / 2; cena.add(aro);
  const corpo = new THREE.Group(); raiz.add(corpo);
  const tronco = new THREE.Group(); corpo.add(tronco);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .14, 6, 12), mCalca); p.position.set(.16 * s, .27, 0); tronco.add(p);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.15, 18, 12), mBota); b.scale.set(1, .65, 1.4); b.position.set(.17 * s, .1, .06); tronco.add(b);
  }
  const barriga = new THREE.Mesh(new THREE.SphereGeometry(.5, 32, 24), mRoupa); barriga.scale.set(1, 1.02, .9); barriga.position.y = .78; tronco.add(barriga);
  const cinto = new THREE.Mesh(new THREE.TorusGeometry(.47, .05, 10, 40), MAT.ouro); cinto.rotation.x = Math.PI / 2; cinto.scale.set(1, .9, 1); cinto.position.y = .64; tronco.add(cinto);
  const fivela = new THREE.Mesh(new THREE.BoxGeometry(.16, .12, .05), MAT.ouro); fivela.position.set(0, .64, .44); tronco.add(fivela);
  const fivG = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), mRubi); fivG.position.set(0, .64, .47); tronco.add(fivG);
  for (const y of [.86, 1.0]) { const b = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), MAT.ouro); b.position.set(0, y, .43 - (y - .86) * .3); tronco.add(b); }
  const gola = new THREE.Mesh(new THREE.TorusGeometry(.3, .12, 12, 32), mBranco); gola.rotation.x = Math.PI / 2; gola.position.y = 1.2; tronco.add(gola);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + .3, m = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), mPreto); m.scale.set(.6, 1.4, .6); m.position.set(Math.cos(a) * .36, 1.22, Math.sin(a) * .36); tronco.add(m); }
  function braco(s) {
    const g = new THREE.Group(); g.position.set(.43 * s, 1.08, 0);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .24, 6, 12), mRoupa); a.position.y = -.2; g.add(a);
    const p = new THREE.Mesh(new THREE.TorusGeometry(.1, .04, 8, 20), mBranco); p.rotation.x = Math.PI / 2; p.position.y = -.35; g.add(p);
    const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), mPele); m.position.y = -.45; g.add(m);
    tronco.add(g); return g;
  }
  const bE = braco(-1), bD = braco(1);
  // capa que balança
  const capaGeo = new THREE.PlaneGeometry(1.05, 1.15, 8, 10); capaGeo.translate(0, -.575, 0);
  const capa = new THREE.Mesh(capaGeo, mCapa); capa.position.set(0, 1.2, -.3); tronco.add(capa);
  const capaOrig = capaGeo.attributes.position.array.slice();

  // cabeça grande (caricatura)
  const cabeca = new THREE.Group(); cabeca.position.y = 1.68; tronco.add(cabeca);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(.62, 48, 32), mPele); cranio.scale.set(1, .94, .92); cabeca.add(cranio);
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), mPele); o.scale.set(.55, 1, .8); o.position.set(.6 * s, -.02, -.02); cabeca.add(o); }
  // rosto desenhado
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 348; const g2 = cv.getContext('2d');
  const texRosto = new THREE.CanvasTexture(cv); texRosto.colorSpace = THREE.SRGBColorSpace; texRosto.anisotropy = 8;
  const rosto = new THREE.Mesh(new THREE.SphereGeometry(.624, 48, 32, Math.PI / 2 - 1.1, 2.2, .72, 1.5),
    new THREE.MeshStandardMaterial({ map: texRosto, transparent: true, roughness: .5, polygonOffset: true, polygonOffsetFactor: -2 }));
  cranio.add(rosto);
  // cabelo: calota + espetos de anime + franja + "antena"
  const calota = new THREE.Mesh(new THREE.SphereGeometry(.655, 40, 24, 0, Math.PI * 2, 0, 1.05), mCabelo); calota.scale.set(1, .94, .93); cabeca.add(calota);
  const nuca = new THREE.Mesh(new THREE.SphereGeometry(.65, 32, 20, Math.PI * 1.5 - 1.75, 3.5, 0, 2.05), mCabelo); nuca.scale.set(1, .94, .93); cabeca.add(nuca);
  const geoEsp = new THREE.ConeGeometry(.17, .46, 10), up = new THREE.Vector3(0, 1, 0);
  const espeto = (th, ph, dir, esc = 1) => {
    const n = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const m = new THREE.Mesh(geoEsp, mCabelo); m.position.copy(n).multiplyScalar(.56); m.position.y *= .94; m.scale.setScalar(esc);
    m.quaternion.setFromUnitVectors(up, (dir || n).clone().normalize()); m.position.addScaledVector((dir || n).clone().normalize(), .2 * esc); cabeca.add(m);
  };
  const nrm = (th, ph) => new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
  for (let i = 0; i < 7; i++) { const ph = Math.PI * 1.5 + (i - 3) * .3, th = 1.05 + Math.abs(i - 3) * .12, n = nrm(th, ph); espeto(th, ph, new THREE.Vector3(n.x * .5, .55, n.z * 1.3 - .25), .95 - Math.abs(i - 3) * .07); }
  for (let i = 0; i < 3; i++) { const ph = Math.PI * 1.5 + (i - 1) * .7, n = nrm(.45, ph); espeto(.45, ph, new THREE.Vector3(n.x * .6, 1, n.z - .3), .85); }
  for (let i = 0; i < 5; i++) { const ph = Math.PI / 2 + (i - 2) * .32, th = .85; const n = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); espeto(th, ph, new THREE.Vector3(n.x * .7 + (i - 2) * .12, -1, n.z * .7), .62 - Math.abs(i - 2) * .05); }
  const antena = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.05, .55, .05), new THREE.Vector3(-.12, .78, .12), new THREE.Vector3(.02, .9, .2), new THREE.Vector3(.12, .82, .22)]), 16, .035, 8), mCabelo);
  cabeca.add(antena);
  // coroa torta
  const coroa = new THREE.Group(); coroa.position.set(.1, .56, -.02); cabeca.add(coroa);
  const banda = new THREE.Mesh(new THREE.CylinderGeometry(.3, .27, .2, 32, 1, true), MAT.ouro); banda.material = MAT.ouro.clone(); banda.material.side = THREE.DoubleSide; coroa.add(banda);
  const veludo = new THREE.Mesh(new THREE.SphereGeometry(.27, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mCapa); veludo.position.y = .02; coroa.add(veludo);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, p = new THREE.Mesh(new THREE.ConeGeometry(.075, .2, 8), MAT.ouro); p.position.set(Math.cos(a) * .29, .19, Math.sin(a) * .29); coroa.add(p);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.042, 10, 8), MAT.ouro); b.position.set(Math.cos(a) * .29, .31, Math.sin(a) * .29); coroa.add(b);
    const j = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), i % 2 ? mSafira : mRubi); j.scale.set(1, 1, .5); j.position.set(Math.cos(a + .52) * .3, 0, Math.sin(a + .52) * .3); j.lookAt(Math.cos(a + .52) * 2, 0, Math.sin(a + .52) * 2); coroa.add(j);
  }
  // gotas de suor 3D
  const geoGota = new THREE.SphereGeometry(.05, 12, 10); geoGota.scale(1, 1.5, 1);
  const mGota = new THREE.MeshPhysicalMaterial({ color: 0x8fd8ff, roughness: .05, clearcoat: 1, transparent: true, opacity: .9, emissive: 0x1a5a90, emissiveIntensity: .4 });
  const gotas = [];
  const fx = new Particulas(cena, 300, TEX_BRILHO);

  // ---------- rosto ----------
  const EXP = {
    normal: { olho: 'aberto', boca: 'sorriso', sob: 'normal', rubor: .35 },
    esforco: { olho: 'aberto', boca: 'dentes', sob: 'bravo', rubor: .65, suor: true },
    aceno: { olho: 'aberto', boca: 'aberta', sob: 'alto', rubor: .5 },
    feliz: { olho: 'feliz', boca: 'aberta', sob: 'alto', rubor: .7 },
    combo: { olho: 'estrela', boca: 'enorme', sob: 'alto', rubor: .8, brilho: true },
    susto: { olho: 'arregalado', boca: 'o', sob: 'alto', rubor: 0 },
    panico: { olho: 'panico', boca: 'onda', sob: 'preoc', rubor: 0, azul: true, suor: true },
    vitoria: { olho: 'feliz', boca: 'enorme', sob: 'alto', rubor: .85, brilho: true },
    triste: { olho: 'choro', boca: 'triste', sob: 'preoc', rubor: .2, lagrima: true },
  };
  const elipse = (x, y, rx, ry) => { g2.beginPath(); g2.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2); };
  function estrelaC(x, y, r, cor) { g2.fillStyle = cor; g2.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * .32 : r; g2.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g2.closePath(); g2.fill(); }
  function olho(x, y, s, E, pisca, lx, ly) {
    const tipo = E.olho, linha = '#2b1710'; g2.save(); g2.translate(x, y); g2.lineCap = 'round';
    if (tipo === 'feliz' || (pisca > .85 && tipo !== 'panico')) {
      g2.strokeStyle = linha; g2.lineWidth = 9; g2.beginPath();
      if (tipo === 'feliz') { g2.moveTo(-30, 10); g2.quadraticCurveTo(0, -32, 30, 10); } else { g2.moveTo(-32, 6); g2.quadraticCurveTo(0, 18, 32, 6); }
      g2.stroke(); g2.restore(); return;
    }
    let ry = 46 * (1 - pisca * .9), rx = 36, pup = 1, iris = 1;
    if (tipo === 'arregalado') { rx = 39; ry *= 1.08; pup = .45; iris = .66; }
    if (tipo === 'panico') { pup = .3; iris = .5; ry = 44; }
    const ix = lx * 9, iy = ly * 7 + (tipo === 'choro' ? 4 : 0);
    g2.fillStyle = '#fff'; elipse(0, 0, rx, ry); g2.fill();
    g2.save(); elipse(0, 0, rx, ry); g2.clip();
    const gr = g2.createRadialGradient(ix, iy - 14 * iris, 2, ix, iy + 4, 34 * iris);
    gr.addColorStop(0, '#a8e6ff'); gr.addColorStop(.5, '#2a6bff'); gr.addColorStop(1, '#0b1e70');
    g2.fillStyle = gr; elipse(ix, iy + 4, 26 * iris, 35 * iris); g2.fill();
    g2.fillStyle = '#08102c'; elipse(ix, iy + 7, 12 * pup, 16 * pup); g2.fill();
    g2.fillStyle = 'rgba(170,235,255,.7)'; elipse(ix + 2, iy + 25 * iris, 14 * iris, 6 * iris); g2.fill();
    if (tipo === 'choro') { g2.fillStyle = 'rgba(150,215,255,.6)'; elipse(0, ry * .6, rx, ry * .4); g2.fill(); }
    g2.restore();
    if (tipo === 'estrela') { estrelaC(ix - 7, iy - 8, 16, '#fff'); estrelaC(ix + 11, iy + 13, 7, '#fff'); }
    else if (tipo === 'panico') { g2.strokeStyle = '#08102c'; g2.lineWidth = 2.5; g2.beginPath(); for (let a = 0; a < 12; a += .3) g2.lineTo(ix + Math.cos(a) * a * 1.4, iy + 4 + Math.sin(a) * a * 1.4); g2.stroke(); }
    else { g2.fillStyle = '#fff'; elipse(ix - 10, iy - 12, 9, 11); g2.fill(); elipse(ix + 9, iy + 13, 4.5, 4.5); g2.fill(); }
    g2.strokeStyle = linha; g2.lineWidth = 8; g2.beginPath(); g2.ellipse(0, 0, rx + 1, ry + 1, 0, Math.PI * 1.06, Math.PI * 1.94); g2.stroke();
    g2.lineWidth = 6; g2.beginPath(); const ex = s * (rx - 3); g2.moveTo(ex, -ry * .62); g2.lineTo(ex + s * 15, -ry * .9); g2.stroke();
    g2.lineWidth = 2.5; g2.beginPath(); g2.ellipse(0, 0, rx, ry, 0, Math.PI * .28, Math.PI * .72); g2.stroke();
    g2.restore();
  }
  function sobrancelhas(t) {
    g2.strokeStyle = '#d0601a'; g2.lineWidth = 10; g2.lineCap = 'round';
    for (const s of [-1, 1]) {
      const x = 256 + s * 64; g2.beginPath();
      if (t === 'alto') { g2.moveTo(x - s * 28, 122); g2.quadraticCurveTo(x, 102, x + s * 30, 118); }
      else if (t === 'preoc') { g2.moveTo(x - s * 28, 116); g2.quadraticCurveTo(x - s * 4, 122, x + s * 28, 140); }
      else if (t === 'bravo') { g2.moveTo(x - s * 28, 144); g2.quadraticCurveTo(x, 128, x + s * 30, 118); }
      else { g2.moveTo(x - s * 28, 136); g2.quadraticCurveTo(x, 122, x + s * 30, 134); }
      g2.stroke();
    }
  }
  function boca(t) {
    const x = 256, y = 272, escuro = '#6e1626', lingua = '#ff7b8e', linha = '#4a1018'; g2.lineCap = 'round'; g2.lineJoin = 'round';
    const aberta = (w, h) => {
      g2.fillStyle = escuro; g2.beginPath(); g2.moveTo(x - w, y - 8); g2.quadraticCurveTo(x, y - 2, x + w, y - 8); g2.quadraticCurveTo(x, y + h * 1.45, x - w, y - 8); g2.fill();
      g2.save(); g2.clip(); g2.fillStyle = lingua; elipse(x, y + h * .75, w * .55, h * .35); g2.fill(); g2.fillStyle = '#fff'; g2.fillRect(x - w, y - 12, w * 2, 9); g2.restore();
      g2.strokeStyle = linha; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(x - w, y - 8); g2.quadraticCurveTo(x, y - 2, x + w, y - 8); g2.quadraticCurveTo(x, y + h * 1.45, x - w, y - 8); g2.stroke();
    };
    if (t === 'sorriso') { g2.fillStyle = escuro; g2.beginPath(); g2.moveTo(x - 20, y - 4); g2.quadraticCurveTo(x, y + 4, x + 20, y - 4); g2.quadraticCurveTo(x, y + 22, x - 20, y - 4); g2.fill(); g2.fillStyle = lingua; elipse(x, y + 8, 8, 3.5); g2.fill(); }
    else if (t === 'aberta') aberta(28, 30);
    else if (t === 'enorme') aberta(40, 40);
    else if (t === 'o') { g2.fillStyle = escuro; elipse(x, y + 8, 11, 15); g2.fill(); }
    else if (t === 'onda') { g2.strokeStyle = linha; g2.lineWidth = 5; g2.beginPath(); g2.moveTo(x - 30, y + 6); for (let i = 0; i < 6; i++) g2.quadraticCurveTo(x - 25 + i * 10, y + (i % 2 ? 14 : -2), x - 20 + i * 10, y + 6); g2.stroke(); }
    else if (t === 'dentes') { g2.fillStyle = '#fff'; g2.strokeStyle = linha; g2.lineWidth = 3; g2.beginPath(); g2.roundRect(x - 28, y - 8, 56, 22, 8); g2.fill(); g2.stroke(); g2.lineWidth = 2; g2.beginPath(); g2.moveTo(x - 28, y + 3); g2.lineTo(x + 28, y + 3); for (let i = -2; i <= 2; i++) { g2.moveTo(x + i * 10, y - 8); g2.lineTo(x + i * 10, y + 14); } g2.stroke(); }
    else if (t === 'triste') { g2.strokeStyle = linha; g2.lineWidth = 6; g2.beginPath(); g2.moveTo(x - 22, y + 14); g2.quadraticCurveTo(x, y - 8, x + 22, y + 14); g2.stroke(); }
  }
  let chave = '';
  function desenharRosto(ex, pisca, lx, ly, t) {
    const E = EXP[ex] || EXP.normal, k = ex + (pisca > .85 ? 'P' : pisca > .3 ? 'p' : '') + Math.round(lx * 5) + ',' + Math.round(ly * 5) + (E.lagrima ? Math.floor(t * 6) % 3 : '');
    if (k === chave) return; chave = k;
    g2.clearRect(0, 0, 512, 348);
    if (E.azul) {
      const gr = g2.createLinearGradient(0, 30, 0, 170); gr.addColorStop(0, 'rgba(70,90,230,.6)'); gr.addColorStop(1, 'rgba(70,90,230,0)'); g2.fillStyle = gr; g2.fillRect(110, 30, 292, 140);
      g2.strokeStyle = 'rgba(40,50,170,.55)'; g2.lineWidth = 4; for (let i = 0; i < 5; i++) { g2.beginPath(); g2.moveTo(200 + i * 28, 60); g2.lineTo(200 + i * 28, 104 + (i % 2) * 14); g2.stroke(); }
    }
    if (E.rubor) {
      for (const s of [-1, 1]) { const cx = 256 + s * 112, gr = g2.createRadialGradient(cx, 248, 0, cx, 248, 40); gr.addColorStop(0, `rgba(255,110,140,${E.rubor})`); gr.addColorStop(1, 'rgba(255,110,140,0)'); g2.fillStyle = gr; g2.fillRect(cx - 42, 206, 84, 84); }
      g2.strokeStyle = `rgba(225,70,105,${E.rubor * .8})`; g2.lineWidth = 3; g2.lineCap = 'round';
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = 256 + s * 112 - 12 + i * 12; g2.beginPath(); g2.moveTo(x + 4, 240); g2.lineTo(x - 3, 256); g2.stroke(); }
    }
    for (const s of [-1, 1]) olho(256 + s * 64, 190, s, E, ex === 'feliz' || ex === 'vitoria' ? 0 : pisca, lx, ly);
    sobrancelhas(E.sob);
    g2.strokeStyle = 'rgba(200,120,95,.85)'; g2.lineWidth = 3; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(259, 236); g2.lineTo(253, 247); g2.lineTo(260, 248); g2.stroke();
    boca(E.boca);
    if (E.suor) { g2.fillStyle = '#9fe0ff'; g2.strokeStyle = '#3a8fd0'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(392, 100); g2.quadraticCurveTo(410, 130, 400, 142); g2.quadraticCurveTo(384, 148, 382, 132); g2.quadraticCurveTo(382, 120, 392, 100); g2.fill(); g2.stroke(); g2.fillStyle = '#fff'; elipse(392, 132, 3, 5); g2.fill(); }
    if (E.lagrima) { const o = Math.floor(t * 6) % 3; for (const s of [-1, 1]) { const gr = g2.createLinearGradient(0, 228, 0, 348); gr.addColorStop(0, 'rgba(120,200,255,.9)'); gr.addColorStop(1, 'rgba(120,200,255,.2)'); g2.fillStyle = gr; g2.fillRect(256 + s * 64 + s * 8 - 7, 226, 14, 122); g2.fillStyle = 'rgba(255,255,255,.8)'; elipse(256 + s * 64 + s * 8, 250 + o * 28, 3, 6); g2.fill(); } }
    if (E.brilho) { estrelaC(150, 120, 16, '#ffe680'); estrelaC(372, 108, 12, '#ffe680'); estrelaC(395, 150, 7, '#fff'); }
    texRosto.needsUpdate = true;
  }

  // ---------- comportamento ----------
  const extra = { y: 0, sx: 1, sy: 1, rz: 0, ry: 0 }; // o resgate usa: boiar, esmagar, tombar
  let base = 'normal', reacao = null, tR = 0, durR = 0, t = 0, piscaT = 2, piscaV = 0, lookX = 0, lookY = 0, alvoLX = 0, alvoLY = 0, lookTempo = 0;
  let coroaA = 0, coroaV = 0, yAnt = 0, vAnt = 0, suorT = 0, brilhoT = 0;
  const pose = { y: 0, sy: 1, rotY: 0, rotX: 0, bE: .22, bD: .22, bEx: 0, bDx: 0, cabX: 0, cabY: 0, cabZ: 0, x: 0 };
  const DUR = { feliz: 1.5, combo: 2.1, susto: 1.1, aceno: 2.4, vitoria: 1e9, triste: 1e9 };
  const vTmp = new THREE.Vector3();
  function reagir(tipo) {
    reacao = tipo; tR = 0; durR = DUR[tipo] || 1.5;
    if (tipo === 'combo' || tipo === 'vitoria') { coroaV += 6; for (let i = 0; i < 30; i++) { cabeca.getWorldPosition(vTmp); fx.emitir(vTmp.x + rnd(-.8, .8), vTmp.y + rnd(-.5, .8), .5, { vy: rnd(.3, 1.2), vida: rnd(.6, 1.2), tam: rnd(.12, .25), cor: pega([[1, .9, .4], [1, 1, 1], [1, .6, .9]]), arr: 1 }); } }
    if (tipo === 'feliz') coroaV += 3;
    if (tipo === 'susto') coroaV -= 6;
  }
  function update(dt) {
    t += dt; tR += dt; if (reacao && tR > durR) reacao = null;
    const ex = reacao || base;
    piscaT -= dt; if (piscaT < 0) { piscaV += dt * 12; if (piscaV >= 2) { piscaV = 0; piscaT = rnd(1.6, 4.2); } }
    const pisca = piscaV > 0 ? 1 - Math.abs(piscaV - 1) : 0;
    lookTempo -= dt; if (lookTempo < 0) { const k = Math.exp(-dt * 1.5); alvoLX *= k; alvoLY *= k; if (Math.random() < dt * .4) { alvoLX = rnd(-.6, .6); alvoLY = rnd(-.4, .4); lookTempo = rnd(.6, 1.4); } }
    const kl = 1 - Math.exp(-dt * 10); lookX = lerp(lookX, alvoLX, kl); lookY = lerp(lookY, alvoLY, kl);
    const P = { y: 0, sy: 1, rotY: 0, rotX: 0, bE: .22, bD: .22, bEx: 0, bDx: 0, cabX: -lookY * .2, cabY: lookX * .45, cabZ: 0, x: 0 };
    const S = Math.sin;
    switch (ex) {
      case 'normal': P.y = S(t * 2.2) * .025; P.sy = 1 + S(t * 2.2) * .012; P.bE = P.bD = .22 + S(t * 2.2) * .05; P.cabZ = S(t * 1.1) * .06; break;
      case 'aceno': P.bD = 2.5 + S(t * 10) * .45; P.bE = .3; P.y = Math.abs(S(t * 3)) * .05; P.cabZ = -.14; break;
      case 'feliz': case 'combo': {
        const f = ex === 'combo' ? 2.8 : 2.3, s = Math.abs(S(tR * f * Math.PI));
        P.y = s * (ex === 'combo' ? .6 : .4); P.sy = s > .15 ? 1.06 : .9 + s * .6; P.bE = P.bD = 2.5 + S(t * 14) * .25; P.cabZ = S(t * 7) * .12;
        if (ex === 'combo') P.rotY = Ease.out(Math.min(1, tR / .9)) * Math.PI * 2;
        break;
      }
      case 'susto': { const k = Math.max(0, 1 - tR * 2); P.y = S(Math.min(1, tR * 4) * Math.PI) * .25; P.rotX = -.15; P.bE = P.bD = 1.5; P.bEx = P.bDx = -.7; P.x = S(t * 50) * .025 * k; break; }
      case 'panico': P.x = S(t * 42) * .018; P.bE = P.bD = 2.75; P.bEx = P.bDx = -.45; P.cabY = S(t * 6) * .28; P.y = Math.abs(S(t * 9)) * .035; break;
      case 'vitoria': { P.rotY = Ease.out(Math.min(1, tR / 1.2)) * Math.PI * 2; P.y = Math.abs(S(tR * 2 * Math.PI / 1.1)) * .5; P.sy = 1.04; P.bE = P.bD = 2.7 + S(t * 12) * .15; P.cabZ = S(t * 5) * .1; break; }
      case 'esforco': P.rotX = .2; P.bE = P.bD = 1.25; P.bEx = P.bDx = -1.25; P.x = S(t * 32) * .012; P.y = Math.abs(S(t * 3)) * .02; P.cabZ = -.08; P.cabY = .2; break;
      case 'triste': P.y = -.03 + S(t * 1.4) * .01; P.rotX = .1; P.cabX = .32; P.cabY = S(t * .8) * .1; P.bE = P.bD = .06; P.sy = .97; break;
    }
    const k = 1 - Math.exp(-dt * 16); for (const n in P) pose[n] = lerp(pose[n], P[n], n === 'rotY' ? 1 : k);
    corpo.position.set(pose.x, pose.y + extra.y, 0); const q = 1 / Math.sqrt(pose.sy); tronco.scale.set(q * extra.sx, pose.sy * extra.sy, q * extra.sx); tronco.rotation.z = extra.rz;
    raiz.rotation.y = pose.rotY + extra.ry; tronco.rotation.x = pose.rotX;
    bE.rotation.set(pose.bEx, 0, -pose.bE); bD.rotation.set(pose.bDx, 0, pose.bD);
    cabeca.rotation.set(pose.cabX, pose.cabY, pose.cabZ);
    // coroa com mola (fica mais torta nos pulos)
    const sdt = Math.max(dt, 1e-3), vy = (pose.y - yAnt) / sdt, ay = (vy - vAnt) / sdt; yAnt = pose.y; vAnt = vy;
    coroaV += (-70 * coroaA - 6 * coroaV + clamp(-ay * .05, -8, 8)) * dt; coroaA = clamp(coroaA + coroaV * dt, -.45, .45);
    coroa.rotation.set(coroaA * .3, 0, -.24 + coroaA); coroa.position.y = .56 + Math.abs(coroaA) * .08;
    // capa
    const pa = capaGeo.attributes.position, vento = clamp(Math.abs(vy) * .12, 0, .45);
    for (let i = 0; i < pa.count; i++) {
      const ox = capaOrig[i * 3], oy = capaOrig[i * 3 + 1], f = -oy / 1.15;
      pa.setXYZ(i, ox * (1 + f * .4), oy + f * vento * .3, -f * f * (.24 + vento) - f * .07 * S(t * 3 + ox * 3) - Math.abs(ox) * f * .12);
    }
    pa.needsUpdate = true; capaGeo.computeVertexNormals();
    // suor e brilhos
    if (ex === 'panico' || ex === 'susto') {
      suorT -= dt; if (suorT < 0) { suorT = ex === 'panico' ? .28 : .5; const s = Math.random() < .5 ? -1 : 1; cabeca.getWorldPosition(vTmp);
        const m = new THREE.Mesh(geoGota, mGota); m.position.set(vTmp.x + s * .5, vTmp.y + .25, .25); cena.add(m); gotas.push({ m, vx: s * rnd(.6, 1.2), vy: rnd(1, 1.7), t: 0 }); }
    }
    for (let i = gotas.length - 1; i >= 0; i--) { const g = gotas[i]; g.t += dt; g.vy -= 6 * dt; g.m.position.x += g.vx * dt; g.m.position.y += g.vy * dt; g.m.rotation.z = Math.atan2(g.vx, -g.vy); if (g.t > .8) { cena.remove(g.m); gotas.splice(i, 1); } }
    if (ex === 'vitoria' || ex === 'combo') { brilhoT -= dt; if (brilhoT < 0) { brilhoT = .06; fx.emitir(rnd(-1.3, 1.3), rnd(.3, 2.6), rnd(-.5, .5), { vy: .4, vida: .8, tam: rnd(.1, .22), cor: [1, .9, .5] }); } }
    fx.tick(dt);
    desenharRosto(ex, pisca, lookX, lookY, t);
  }
  return {
    cena, cam, fx, update, reagir, dbg: { corpo, raiz, tronco, pose, bE }, extra,
    palcoVisivel(v) { palco.visible = aro.visible = v; },
    moverPara(pai, x = 0, y = 0, s = 1) { (pai || cena).add(raiz); raiz.position.set(x, y, 0); raiz.scale.setScalar(s); },
    cabecaMundo() { cabeca.getWorldPosition(vTmp); return vTmp.clone(); },
    base: b => { base = b; }, get estado() { return reacao || base; }, parar() { reacao = null; },
    olhar(nx, ny) { alvoLX = clamp(nx, -1, 1); alvoLY = clamp(ny, -1, 1); lookTempo = 1.8; },
    enquadrar(r, deslocar, largo) {
      const a = r.w / r.h, f = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const d = largo ? Math.max(2.05 / f, 2.4 / (f * a)) : Math.max(1.72 / f, 1.35 / (f * a)) * 1.02, tx = deslocar ? -Math.min(1.5, Math.max(0, (d * f * a - 1.3) * .55)) : 0;
      const cy = largo ? 1.5 : 1.32; cam.aspect = a; cam.position.set(-tx, cy + .23, d); cam.lookAt(-tx, cy, 0); cam.updateProjectionMatrix();
    },
    pontoBalao() { cabeca.getWorldPosition(vTmp); vTmp.x += .62; vTmp.y += .35; return vTmp.clone(); },
  };
})();
