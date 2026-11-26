/* Cena: luz, céu, névoa, água e o monumento da abertura. As cores são pintadas por direção
   (topo, face esquerda, face direita), como numa gravura, e mudam com a hora do dia. */
THREE.ColorManagement.enabled = false;
const HORAS = [
  { id: 'entardecer', nome: 'entardecer', ceu: ['#8fa79b', '#e7c79f', '#f1d9b8'], topo: '#fff0d6', esq: '#f6c8a2', dir: '#b57c70', nada: '#7d5350', sombra: '#b77f78', nevoa: '#eccfa9', sol: '#fff4d8', solPos: [.6, .66, .15], borda: .2, janela: '#ffd98a', aguaA: '#5f9a92', aguaB: '#a8d0bd', tinta: '#6b4438' },
  { id: 'alvorada', nome: 'alvorada', ceu: ['#c5d8cb', '#efe3cf', '#f6e8d6'], topo: '#fffaf0', esq: '#f4d9c6', dir: '#c3a39c', nada: '#94807c', sombra: '#c3aaa6', nevoa: '#f1e1cc', sol: '#ffffff', solPos: [.3, .56, .1], borda: .22, janela: '#ffeebf', aguaA: '#7fb5a8', aguaB: '#cfe6d6', tinta: '#7a5a4c' },
  { id: 'crepusculo', nome: 'crepúsculo', ceu: ['#75758a', '#bd8d8c', '#e9b18a'], topo: '#f3c7a6', esq: '#dd9a80', dir: '#7f6076', nada: '#51405a', sombra: '#80607a', nevoa: '#dfa283', sol: '#ffd9a0', solPos: [.36, .5, .13], borda: .17, janela: '#ffc66b', aguaA: '#57727c', aguaB: '#d0a39c', tinta: '#4b2f3d' },
  { id: 'luar', nome: 'luar', ceu: ['#3d5a58', '#6f928a', '#a9bfa8'], topo: '#d3dcc9', esq: '#a6b5a3', dir: '#647a74', nada: '#43544f', sombra: '#5f7570', nevoa: '#93ad9b', sol: '#f6f3dc', solPos: [.62, .7, .085], borda: .16, janela: '#ffd27a', aguaA: '#3f736d', aguaB: '#a8c7b5', tinta: '#22403c' }
];
const U = { uTempo: { value: 0 } }, NOMES_COR = ['topo', 'esq', 'dir', 'nada', 'sombra', 'nevoa', 'sol', 'janela', 'aguaA', 'aguaB'];
for (const n of NOMES_COR) U['c_' + n] = { value: new THREE.Color() };
U.c_ceu = { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] }; U.uSol = { value: new THREE.Vector3() }; U.uBorda = { value: .2 }; U.uAspecto = { value: 1 };
U.uOndas = { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, -99, 0, 9)) };   // toques: ponto e idade
function aplicarHora(h, k) {   // k=1 aplica de uma vez; menor aproxima aos poucos
  for (const n of NOMES_COR) U['c_' + n].value.lerp(cor(h[n]), k);
  h.ceu.forEach((c, i) => U.c_ceu.value[i].lerp(cor(c), k)); U.uSol.value.lerp(new THREE.Vector3(...h.solPos), k); U.uBorda.value += (h.borda - U.uBorda.value) * k;
}
const RUIDO = `float sorte(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sorte(i),sorte(i+vec2(1,0)),f.x),mix(sorte(i+vec2(0,1)),sorte(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*ruido(p);p=p*2.03+7.1;a*=.5;}return s;}`;

/* Material de pedra. longe: 0 perto, 1 sumindo no céu. nevoa: alturas onde a névoa começa e termina. */
function pedra({ longe = 0, nevoa = [-9.5, -.5] } = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true }); m.shadowSide = THREE.DoubleSide;
  const prop = { uLonge: { value: longe }, uNev: { value: new THREE.Vector2(...nevoa) }, uRealce: { value: 0 } }; m.userData = prop;
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, U, prop);
    s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>
attribute vec2 aUv,aTam;attribute vec4 aBorda;attribute vec3 aExtra;varying vec2 vU,vTam;varying vec4 vBo;varying vec3 vEx,vNM,vPM;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vU=aUv;vTam=aTam;vBo=aBorda;vEx=aExtra;vNM=normalize(mat3(modelMatrix)*normal);vPM=(modelMatrix*vec4(transformed,1.)).xyz;`);
    s.fragmentShader = s.fragmentShader.replace('#include <shadowmap_pars_fragment>', `#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform vec3 c_topo,c_esq,c_dir,c_nada,c_sombra,c_nevoa,c_janela;uniform float uBorda,uTempo,uLonge,uRealce;uniform vec4 uOndas[4];uniform vec2 uNev;
varying vec2 vU,vTam;varying vec4 vBo;varying vec3 vEx,vNM,vPM;${RUIDO}
float fio(float d,float l){float w=fwidth(d);return 1.-smoothstep(l-w,l+w,d);}`)
      .replace('#include <opaque_fragment>', `
vec3 n=normalize(vNM),q=n*n;
vec3 luz=q.x*(n.x>0.?c_dir:mix(c_nada,c_esq,.35))+q.y*(n.y>0.?c_topo:c_nada)+q.z*(n.z>0.?c_esq:c_nada);
float recebe=smoothstep(.02,.3,dot(n,normalize(vec3(-.42,1.,.62))));
float sm=mix(1.,getShadowMask(),recebe*.8);
vec3 alb=vColor.rgb;
float lat=1.-q.y;   // paredes: camadas finas de pedra
alb*=1.-lat*.055*smoothstep(.45,.75,ruido(vec2(vPM.y*5.5,floor((vPM.x-vPM.z)*.13)*3.)));
alb*=.985+.03*ruido(vPM.xz*3.1+vPM.y*2.3);
luz*=mix(c_sombra*.86+.1,vec3(1.),vEx.x);
luz=mix(luz*c_sombra,luz,sm);
vec3 c=alb*luz*1.06;
float e=max(max(vBo.x*fio(vU.x,.035),vBo.y*fio(vTam.x-vU.x,.035)),max(vBo.z*fio(vU.y,.035),vBo.w*fio(vTam.y-vU.y,.035)));
c=mix(c,min(c*1.12+c_topo*.16,vec3(1.)),e*uBorda*3.2*(.4+.6*sm));
if(vEx.z>.5){vec2 k=min(vU,vTam-vU);c*=1.-.1*fio(abs(min(k.x,k.y)-.15),.014);}   // ladrilho do caminho
c=mix(c,c_janela*(.94+.06*sin(uTempo*1.3+vPM.x*3.)),vEx.y);
for(int i=0;i<4;i++){vec4 o=uOndas[i];c+=c_janela*.3*smoothstep(.55,0.,abs(distance(vPM,o.xyz)-o.w*4.2))*max(0.,1.-o.w*.8);}
c+=c_janela*uRealce*(.11+.07*sin(uTempo*3.4-(vPM.x+vPM.y+vPM.z)*1.6));   // peça que gira: brilho que passa por ela
float h=smoothstep(uNev.x,uNev.y,vPM.y+(fbm(vec2((vPM.x-vPM.z)*.35+uTempo*.04,vPM.y*.5))-.5)*1.6);
c=mix(c_nevoa,c,h*(1.-uLonge));
c+=(sorte(gl_FragCoord.xy)-.5)*.012;
gl_FragColor=vec4(c,1.);`);
  };
  m.customProgramCacheKey = () => 'pedra'; return m;
}
const matPlano = (frag, vert, uniforms, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...uniforms }, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, ...extra });

/* ---------- céu ---------- */
function criarCeu() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matPlano(`varying vec2 vU;uniform vec3 c_ceu[3],c_nevoa,c_sol;uniform vec3 uSol;uniform float uAspecto,uTempo;${RUIDO}
void main(){float y=vU.y;vec3 c=mix(c_ceu[2],c_ceu[1],smoothstep(.3,.62,y));c=mix(c,c_ceu[0],smoothstep(.5,1.05,y));
vec2 p=vec2((vU.x-.5)*uAspecto,y),s=vec2((uSol.x-.5)*min(uAspecto,1.1),uSol.y);float d=distance(p,s),r=uSol.z*min(1.,.55+uAspecto*.45);
float f=fbm(vec2(p.x*1.6+uTempo*.006,y*9.));c=mix(c,mix(c_ceu[2],c_sol,.35),smoothstep(.52,.8,f)*.3*smoothstep(.25,.5,y)*smoothstep(1.,.6,y));
c=mix(c,c_sol,.34*exp(-max(0.,d-r)*5.5));c=mix(c,c_sol,.82*smoothstep(r+.0015,r-.0015,d)*(.72+.28*smoothstep(s.y-r,s.y+r,y)));
c=mix(c_nevoa,c,smoothstep(.08,.42,y));c+=(sorte(gl_FragCoord.xy)-.5)*.014;gl_FragColor=vec4(c,1.);}`,
    `varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,.9999,1.);}`, {}, { transparent: false, depthTest: false }));
  m.frustumCulled = false; m.renderOrder = -10; return m;
}
/* ---------- névoa: faixas macias viradas para a câmera ---------- */
const EIXO = { dir: new THREE.Vector3(1, 0, -1).normalize(), cima: new THREE.Vector3(-1, 2, -1).normalize(), olho: new THREE.Vector3(1, 1, 1).normalize() };
const naTela = (x, y, fundo = 0) => new THREE.Vector3().addScaledVector(EIXO.dir, x).addScaledVector(EIXO.cima, y).addScaledVector(EIXO.olho, -fundo);
function criarNevoa(x, y, fundo, l, a, forca, semente) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(l, a), matPlano(`varying vec2 vU;uniform vec3 c_nevoa,c_sol;uniform float uTempo,uF,uS;${RUIDO}
void main(){vec2 p=vU*2.-1.;float n=fbm(vec2(vU.x*3.+uS+uTempo*.016,vU.y*1.7+uS-uTempo*.006));float b=1.-smoothstep(.1,1.,length(p*vec2(1.,.95)));
float a=b*smoothstep(.22,.72,n+b*.3)*uF;gl_FragColor=vec4(mix(c_nevoa,c_sol,.22*smoothstep(-.2,.8,p.y)),a);}`,
    `varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, { uF: { value: forca }, uS: { value: semente } }));
  m.position.copy(naTela(x, y, fundo)); m.lookAt(m.position.clone().add(EIXO.olho)); m.renderOrder = fundo < 0 ? 5 : -5; return m;
}
/* ---------- água parada e cascata ---------- */
function criarAgua(x0, x1, z0, z1, y) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, matPlano(`varying vec3 vP;uniform vec3 c_aguaA,c_aguaB,c_sol;uniform vec4 uOndas[4];uniform float uTempo;uniform vec4 uCaixa;${RUIDO}
void main(){vec2 p=vP.xz;float t=uTempo*.16;float n=fbm(p*.8+vec2(t,-t*.7));float k=fbm(p*1.7-vec2(t*.8,t)+n*1.4);
vec3 c=mix(c_aguaA,c_aguaB,smoothstep(.2,.8,n*.5+k*.5));c=mix(c,c_sol,smoothstep(.025,0.,abs(k-.52))*smoothstep(.35,.6,n)*.5);
for(int i=0;i<4;i++){vec4 o=uOndas[i];float d=distance(vP,o.xyz);c+=c_sol*.35*(.5+.5*sin(d*11.-o.w*13.))*smoothstep(o.w*2.6,o.w*2.6-.9,d)*max(0.,1.-o.w*.55);}
for(int j=0;j<3;j++){float fj=float(j),tt=uTempo/(2.7+fj*.9)+fj*.37,id=floor(tt),ph=fract(tt);   // gotas: anéis que nascem e se abrem sozinhos
 vec2 g=uCaixa.xy+(vec2(sorte(vec2(id,fj)),sorte(vec2(fj+3.,id)))-.5)*uCaixa.zw*1.6;float d=distance(p,g);
 c+=c_sol*.28*smoothstep(.05,0.,abs(d-ph*.75))*(1.-ph)*(1.-ph);}
gl_FragColor=vec4(c,.94);}`, `varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`, { uCaixa: { value: new THREE.Vector4((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2) } }));
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.userData.tipo = 'agua'; return m;
}
function criarCascata(x, y, z, l, a) {
  const g = new THREE.PlaneGeometry(l, a); g.translate(0, -a / 2, 0);
  const m = new THREE.Mesh(g, matPlano(`varying vec2 vU;uniform vec3 c_aguaB,c_sol,c_nevoa;uniform float uTempo;${RUIDO}
void main(){float q=1.-vU.y;float n=fbm(vec2(vU.x*9.,vU.y*2.2+uTempo*.5)),f=ruido(vec2(vU.x*22.,vU.y*3.+uTempo*.85));
vec3 c=mix(c_aguaB,c_sol,.2+.55*smoothstep(.4,.8,f*.5+n*.5));c=mix(c,c_nevoa,smoothstep(.1,.85,q));
float b=smoothstep(0.,.07,vU.x)*smoothstep(1.,.93,vU.x);gl_FragColor=vec4(c,b*(1.-smoothstep(.3,.98,q+n*.22))*.9);}`,
    `varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, {}));
  m.position.set(x, y, z); m.userData.tipo = 'agua'; m.renderOrder = 2; return m;
}
/* ---------- sino ---------- */
function perfilSino(r, h) {
  const p = [[.02, .82], [.3, .75], [.45, .5], [.6, .2], [.86, .03], [.93, -.005], [1, 0], [.95, .04], [.78, .14], [.64, .3], [.57, .48], [.53, .68], [.47, .83], [.34, .93], [.16, .985], [.02, 1]];
  return new THREE.LatheGeometry(p.map(([a, b]) => new THREE.Vector2(a * r, b * h)), 40);
}
const mover = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z), deitar = (x, y, z) => new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(x, y, z);

/* ---------- o monumento da abertura ---------- */
const BARRO = { terra: '#dc9b78', terra2: '#d18f6d', ocre: '#e0b07c', creme: '#f0dcbc', rosa: '#dca588', ouro: '#e0b05a', vao: '#7a4a44' };
function criarMonumento() {
  const grupo = new THREE.Group(), mat = pedra(), o = new Obra();
  const faixa = y => ['#dd9d7a', '#d79572', '#e0a883', '#d18f6d', '#e2b288'][((y % 5) + 5) % 5];
  const base = (x, y) => ({ lado: faixa(y), topo: y === 0 ? BARRO.creme : BARRO.rosa });
  // ilha: platô e degraus que somem na névoa
  o.cheio(-4, 4, -3, 0, -4, 4, base); o.cheio(-4, 3, -7, -4, -4, 3, base); o.cheio(-4, 2, -11, -8, -4, 2, base);
  // poço de degraus no centro: cava dois níveis, depois a água
  for (let x = -1; x <= 3; x++) for (let z = -1; z <= 3; z++) for (let y = -1; y <= 0; y++) o.tira(x, y, z);
  for (let x = 0; x <= 2; x++) for (let z = 0; z <= 2; z++) for (let y = -3; y <= -2; y++) o.tira(x, y, z);
  for (let x = -1; x <= 3; x++) for (let z = -1; z <= 3; z++) if (o.tem(x, -2, z)) o.bloco(x, -2, z, { lado: BARRO.ocre, topo: BARRO.creme, piso: 1 });
  // canal por onde a água sai, na borda da frente
  for (const x of [0, 1]) { for (const y of [-2, -1, 0]) o.tira(x, y, 4); o.tira(x, -2, 3); }
  // caminho de ladrilhos em volta
  for (let i = -2; i <= 4; i++) for (const [x, z] of [[-2, i], [i, -2], [4, i]]) if (o.tem(x, 0, z)) o.bloco(x, 0, z, { ...base(x, 0), piso: 1 });
  for (const x of [-1, 2, 3]) o.bloco(x, 0, 4, { ...base(x, 0), piso: 1 });
  // torre
  o.cheio(-4, -3, 1, 7, -4, -3, (x, y) => ({ lado: y === 7 ? BARRO.creme : ['#e6b090', '#e2a987'][y & 1], topo: BARRO.creme, piso: y === 7 ? 1 : 0 }));
  // terraço e escadaria da esquerda
  const muro = (x, y) => ({ lado: faixa(y), topo: BARRO.creme, piso: 1 });
  o.cheio(-4, -3, 1, 3, -2, -2, muro); o.cheio(-4, -4, 1, 2, -1, -1, muro); o.cheio(-4, -4, 1, 1, 0, 0, muro);
  for (const [y, z] of [[3, -1], [2, 0], [1, 1]]) o.escada(-4, y, z, '-z', BARRO.terra2, BARRO.creme);
  // passarela no alto, apoiada na arcada (primeiro lado do triângulo impossível)
  for (let x = -2; x <= 2; x++) o.bloco(x, 7, -4, { lado: BARRO.creme, topo: BARRO.creme, piso: 1 });
  // canteiro à direita
  o.cheio(3, 4, 1, 1, -4, -3, () => ({ lado: BARRO.rosa, topo: '#b9a27c' })); o.bloco(4, 2, -4, { lado: BARRO.rosa, topo: '#b9a27c' });
  // cais: escada que desce à frente e um pátio pequeno
  o.cheio(7, 8, -5, -2, 2, 3, (x, y) => ({ lado: faixa(y), topo: BARRO.creme, piso: 1 }));
  o.cheio(5, 5, -5, -1, 3, 3, (x, y) => ({ lado: faixa(y) })); o.cheio(6, 6, -5, -2, 3, 3, (x, y) => ({ lado: faixa(y) }));
  o.escada(5, 0, 3, '-x', BARRO.terra2, BARRO.creme); o.escada(6, -1, 3, '-x', BARRO.terra2, BARRO.creme);
  // detalhes
  for (const c of [-.2, 2]) { o.pocoDegraus('+z', c, -1, -1.5, 5, .2, BARRO.ocre, BARRO.creme); o.pocoDegraus('+x', -1.5, -1, c, 5, .2, BARRO.ocre, BARRO.creme); }
  o.caixa(-4.58, 6.72, -4.58, -2.42, 6.9, -2.42, BARRO.ouro);
  o.nicho('+z', -3.5, 4, -2.5, .72, 1.5, BARRO.vao, { moldura: BARRO.creme });
  for (const z of [-3.9, -3.1]) o.nicho('+x', -2.5, 4.9, z, .3, .9, '#ffffff', { luz: 1, moldura: BARRO.creme });
  o.nicho('+x', -2.5, 2, -3.5, .62, 1.35, BARRO.vao, { moldura: BARRO.creme });
  for (const x of [-3.95, -3.05]) o.nicho('+z', x, 5.9, -2.5, .16, .5, '#ffffff', { luz: 1 });
  o.nicho('+x', -2.5, 1, -2, .5, 1.1, '#ffffff', { luz: 1, moldura: BARRO.creme }); o.nicho('+x', -3.5, 1, -1, .46, 1.1, BARRO.vao);
  for (const z of [-3, -1.5, 0, 1.5]) o.nicho('+x', 4.5, -2.7, z, .86, 2.1, '#c4806a');
  for (const x of [-3.2, -1.8, 2.8]) o.nicho('+z', x, -2.7, 4.5, .86, 2.1, '#cf9272');
  // arcada sob a passarela
  for (const x of [-1.25, 1.25]) o.arco('x', x, 1, -4, 2.5, 6, .62, .93, BARRO.terra, 4.2);
  for (const [x, m] of [[-2.3, .2], [0, .4], [2.33, .24]]) o.caixa(x - m, 5, -4.38, x + m, 5.16, -3.62, BARRO.creme, { linha: .6 });
  for (const [x, m] of [[0, .44], [2.33, .28]]) o.caixa(x - m, 1, -4.42, x + m, 1.24, -3.58, BARRO.creme, { linha: .6 });
  // mureta e plantas
  for (const z of [2.5, 3.5]) o.caixa(-4.5, 1, z - .5, -4.26, 1.34, z + .5, BARRO.rosa, { topo: BARRO.creme, linha: .6 });
  o.cipreste(3.98, 3, -4, 2.9); o.cipreste(3.1, 2, -3.8, 2.1, '#abc3a0'); o.arbusto(3.6, 2, -2.9, .34); o.arbusto(4.1, 2, -3.1, .26, '#c2d0ab');
  o.cipreste(-3.1, 1, 3.5, 2.4, '#abc3a0'); o.cipreste(-3.8, 1, 3.9, 1.6); o.arbusto(-3.2, 1, 2.7, .28, '#c2d0ab'); o.cipreste(8.1, -1, 2, 1.9); o.arbusto(7.4, -1, 1.9, .24, '#c2d0ab');
  const principal = new THREE.Mesh(o.fechar(), mat); principal.castShadow = principal.receiveShadow = true; principal.userData.tipo = 'pedra'; grupo.add(principal);

  // ----- o impossível: a coluna sobe e a viga volta para a frente; a ponta (2,13,2) cai, na tela, sobre a torre (-4,7,-4) -----
  const i = new Obra(), ponta = new Obra(), cr = { lado: BARRO.creme, topo: BARRO.creme, piso: 1 };
  for (let y = 8; y <= 12; y++) i.bloco(2, y, -4, { lado: BARRO.creme });
  for (let z = -4; z <= 0; z++) i.bloco(2, 13, z, cr);
  // o último bloco da viga não tem frente, e a ponta é só um ladrilho: o resto dela "é" a própria torre
  i.bloco(2, 13, 1, { ...cr, faces: ['+y', '+x', '-y', '-x'], bordas: { '+y': [0, 0, 1, 1], '+x': [1, 1, 0, 0] } });
  ponta.bloco(2, 13, 2, { ...cr, faces: ['+y'], bordas: { '+y': [0, 0, 1, 0] } });
  for (const y of [8.02, 12.6]) i.caixa(1.42, y, -4.58, 2.58, y + .16, -3.42, BARRO.ouro);
  for (const ob of [i, ponta]) { const m = new THREE.Mesh(ob.fechar(), mat); m.userData.tipo = 'pedra'; grupo.add(m); }

  grupo.add(criarAgua(-.5, 2.5, -.5, 2.5, -1.34), criarAgua(-.5, 1.5, 2.5, 4.5, -1.34), criarCascata(.5, -1.34, 4.515, 2, 9));

  // sinos pendurados (balançam)
  const sinos = [], pendurar = (x, y, z, r, h, fio, nome) => {
    const s = new THREE.Group(), ob = new Obra(); ob.geo(perfilSino(r, h), BARRO.ouro, { m: mover(0, -fio - h, 0), ao: (a, b) => .72 + .28 * Math.min(1, (b + fio + h) / h) });
    ob.geo(new THREE.CylinderGeometry(.022, .022, fio, 8), '#8a5a48', { m: mover(0, -fio / 2, 0) });
    if (r > .5) for (const [k, q] of [[.1, .86], [.62, .56]]) ob.geo(new THREE.TorusGeometry(r * q, .03, 8, 40), '#f0cf86', { m: deitar(0, -fio - h + h * k, 0) });
    const me = new THREE.Mesh(ob.fechar(), mat); me.userData = { tipo: nome, sino: sinos.length };
    s.add(me); s.position.set(x, y, z); s.userData = { ang: 0, vel: 0, fase: x * 3 + z, len: fio + h }; sinos.push(s); grupo.add(s);
  };
  pendurar(2, 13, -1, .92, 1.5, .62, 'sinoGrande'); pendurar(-1.25, 6.1, -4, .2, .32, .3, 'sininho'); pendurar(1.25, 6.1, -4, .2, .32, .42, 'sininho');
  return { grupo, sinos, obras: [o, i, ponta] };
}

/* ---------- ilhotas ao longe ---------- */
function criarLonge() {
  const g = new THREE.Group();
  [[-16, 6, .58, .76, 1], [15, -2.5, .78, .64, 2], [-12.5, -6.5, .5, .72, 3], [20.5, 8, .42, .83, 4], [-24.5, .5, .74, .78, 5], [6.6, 14.2, .2, .87, 6], [-5.6, 12.6, .22, .88, 7]].forEach(([x, y, esc, longe, s]) => {
    const o = new Obra(), al = 3 + s * 5 % 4, c = { lado: '#d9a988', topo: BARRO.creme };
    o.cheio(-2, 2, -2, 0, -2, 2, c); o.cheio(-2, 1, -5, -3, -2, 1, c); o.cheio(-2, 0, -8, -6, -2, 0, c); o.cheio(-2, -1, 1, al, -2, -1, c); if (s % 3 === 1) { o.arco('x', .9, 1, -1.5, 2.8, 3.4, .7, .9, '#d9a988', 2); o.cheio(2, 2, 1, 3, -2, -1, c); }
    else if (s % 3 === 2) { o.cheio(0, 1, 1, 2, -2, -2, c); o.escada(2, 1, -2, '-x', c.lado, c.topo); o.arco('z', 1.6, 1, 1, 2, 2.2, .5, .6, '#d9a988', 1.1); }
    else { o.bloco(-2, 1, 0, c); o.escada(-2, 1, 1, '-z', c.lado, c.topo); o.geo(perfilSino(.7, 1.1), BARRO.ouro, { m: mover(.6, 1.2, -1) }); }
    o.nicho('+z', -1.5, 1, -.5, .6, 1.3, BARRO.vao); o.nicho('+x', -.5, al - .6, -1.5, .4, .9, '#ffffff', { luz: .8 }); o.cipreste(1, 1, 1.2, 2); if (s & 1) o.cipreste(1.6, 1, .4, 1.5);
    const p = naTela(x, y, 26 + s), m = new THREE.Mesh(o.fechar(), pedra({ longe, nevoa: [p.y - 7 * esc, p.y + .5] })); m.scale.setScalar(esc); m.position.copy(p); m.userData.deriva = [p.y, s]; g.add(m);
  });
  return g;
}

/* ---------- personagem: um pequeno sino que anda, sem voz ---------- */
function criarPersonagem() {
  const g = new THREE.Group(), corpo = new THREE.Group(); g.scale.setScalar(1.8); const mat = pedra({ nevoa: [-99, -98] }), o = new Obra();
  o.geo(perfilSino(.235, .4), '#f2c867', { m: mover(0, .13, 0), ao: (a, b) => .74 + .26 * Math.min(1, (b - .13) / .3) });
  o.geo(new THREE.TorusGeometry(.058, .02, 8, 20), '#f0cf86', { m: mover(0, .57, 0) }); o.geo(new THREE.TorusGeometry(.2, .016, 8, 30), '#f7dc9c', { m: deitar(0, .19, 0) });
  for (const s of [-1, 1]) { const b = new THREE.SphereGeometry(.026, 12, 10); b.scale(.85, 1.35, .6); o.geo(b, '#4a3028', { m: mover(.058 * s, .4, .13) }); }
  o.geo(new THREE.TorusGeometry(.122, .034, 10, 26), '#6fc0ae', { m: deitar(0, .5, 0) });
  corpo.add(new THREE.Mesh(o.fechar(), mat));
  const pes = [-1, 1].map(s => { const p = new Obra(), b = new THREE.SphereGeometry(.07, 14, 10); b.scale(.85, .7, 1.2); p.geo(b, '#6d4538'); const m = new THREE.Mesh(p.fechar(), mat); m.position.set(.085 * s, .045, .02); g.add(m); return m; });
  // lenço verde-água que esvoaça
  const N = 9, fg = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 6), idx = [];
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setIndex(idx); fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .4, -.2), .8);
  const lenco = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: '#5fb3a3', side: THREE.DoubleSide })); lenco.frustumCulled = false; corpo.add(lenco);
  const chao = new THREE.Mesh(new THREE.CircleGeometry(.27, 28), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { c_sombra: U.c_sombra }, vertexShader: 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec2 vU;uniform vec3 c_sombra;void main(){gl_FragColor=vec4(c_sombra*.55,.5*smoothstep(1.,.25,length(vU)));}' })); chao.rotation.x = -Math.PI / 2; chao.position.y = .012; g.add(chao);
  g.add(corpo); g.traverse(x => { if (x.isMesh) x.userData.tipo = 'personagem'; });
  // parado: respira e olha em volta; quando tocado, dá um pulinho
  let pulo = 9, olha = .6, olhaAlvo = .6, prox = 3, fase = 0; const volta = d => ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return { grupo: g, andando: 0, rumo: null, pular() { if (pulo > .6) pulo = 0; }, quadro(t, dt) {   // andando: 0 parado, 1 andando; rumo: para onde olhar
    pulo += dt; const k = pulo < .6 ? Math.sin(pulo / .6 * Math.PI) : 0, am = pulo > .6 && pulo < .85 ? Math.sin((pulo - .6) / .25 * Math.PI) * .12 : 0, re = Math.sin(t * 1.9) * .015;
    fase += dt * 12 * this.andando; corpo.position.y = k * .42 + Math.abs(Math.sin(fase)) * .045 * this.andando; corpo.scale.set(1 + am - re * .5, 1 - am + re, 1 + am - re * .5); corpo.rotation.z = Math.sin(t * 1.1) * .035; pes.forEach((p, i) => { const f = Math.sin(fase + i * Math.PI) * this.andando; p.position.y = .045 + k * .36 + Math.max(0, f) * .06; p.position.z = .02 + f * .07; }); chao.scale.setScalar(1 - k * .35);
    if (this.rumo !== null) { olhaAlvo = this.rumo; prox = 1.8; } else if ((prox -= dt) < 0) { prox = 2.5 + Math.random() * 4; olhaAlvo = .75 + (Math.random() - .5) * 1.5; } olha += volta(olhaAlvo - olha) * Math.min(1, dt * (this.rumo !== null ? 10 : 3)); g.rotation.y = olha;
    for (let i = 0; i <= N; i++) { const q = i / N, x = -.05 + Math.sin(t * 1.7 - q * 3) * .05 * q - q * .16, y = .52 - q * .1 + Math.sin(t * 3.1 - q * 4.4) * .075 * q + k * .12 * q, z = -.12 - q * .5, w = .075 * (1 - q * .35); pos.set([x - w * .35, y + w, z, x + w * .35, y - w, z], i * 6); }
    fg.attributes.position.needsUpdate = true;
  } };
}

/* ---------- poeira dourada flutuando na luz ---------- */
function criarPoeira(n = 150) {
  const g = new THREE.BufferGeometry(), b = new Float32Array(n * 3), v = new Float32Array(n * 3), f = new Float32Array(n);
  for (let i = 0; i < n; i++) { b.set([Math.random(), Math.random(), Math.random()], i * 3); v.set([(Math.random() - .5) * .006, .003 + Math.random() * .007, (Math.random() - .5) * .004], i * 3); f[i] = Math.random(); }
  g.setAttribute('position', new THREE.BufferAttribute(b, 3)); g.setAttribute('aVel', new THREE.BufferAttribute(v, 3)); g.setAttribute('aFase', new THREE.BufferAttribute(f, 1));
  const m = new THREE.Points(g, matPlano(`varying float vA;uniform vec3 c_sol,c_janela;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(mix(c_sol,c_janela,.45),smoothstep(.5,0.,d)*vA);}`,
    `attribute vec3 aVel;attribute float aFase;varying float vA;uniform float uTempo,uPx;uniform vec3 uCentro,uTam,uDir,uCima,uOlho;
void main(){vec3 q=fract(position+aVel*uTempo)-.5;vec3 w=uCentro+uDir*q.x*uTam.x+uCima*q.y*uTam.y+uOlho*q.z*uTam.z;
vA=(1.-smoothstep(.36,.5,abs(q.x)))*(1.-smoothstep(.3,.5,abs(q.y)))*(.45+.4*sin(uTempo*(.8+aFase*1.9)+aFase*40.));
gl_PointSize=uPx*(2.+aFase*aFase*4.4);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
    { uPx: { value: 1 }, uCentro: { value: new THREE.Vector3() }, uTam: { value: new THREE.Vector3(30, 30, 30) }, uDir: { value: EIXO.dir }, uCima: { value: EIXO.cima }, uOlho: { value: EIXO.olho } }));
  m.frustumCulled = false; m.renderOrder = 8; return m;
}
/* ---------- brilhos que sobem do sino na chegada ---------- */
function criarBrilhos(n = 70) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vida = new Float32Array(n), vel = Array.from({ length: n }, () => new THREE.Vector3());
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aVida', new THREE.BufferAttribute(vida, 1));
  const m = new THREE.Points(g, matPlano(`varying float vV;uniform vec3 c_janela,c_sol;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(mix(c_janela,c_sol,vV),smoothstep(.5,0.,d)*min(1.,vV*2.5));}`,
    `attribute float aVida;varying float vV;uniform float uPx;void main(){vV=aVida;gl_PointSize=uPx*(2.+4.*aVida);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, { uPx: { value: 1 } }));
  m.frustumCulled = false; m.renderOrder = 9; let prox = 0;
  m.userData = { soltar(p, k = n) { for (let j = 0; j < k; j++) { const i = prox++ % n, a = Math.random() * 6.28, r = .6 + Math.random() * 1.6; pos.set([p.x, p.y, p.z], i * 3); vel[i].set(Math.cos(a) * r, 1.4 + Math.random() * 2.2, Math.sin(a) * r); vida[i] = 1; } },
    quadro(dt) { for (let i = 0; i < n; i++) { if (vida[i] <= 0) continue; vida[i] = Math.max(0, vida[i] - dt / 2.6); vel[i].y -= dt * 1.1; vel[i].multiplyScalar(1 - dt * 1.4); pos[i * 3] += vel[i].x * dt; pos[i * 3 + 1] += vel[i].y * dt; pos[i * 3 + 2] += vel[i].z * dt; } g.attributes.position.needsUpdate = g.attributes.aVida.needsUpdate = true; } };
  return m;
}
