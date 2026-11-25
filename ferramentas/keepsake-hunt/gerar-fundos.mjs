// Keepsake Hunt: gera o tampo de mesa de cada cômodo (arte/m0.webp a m4.webp).   node gerar-fundos.mjs
import { writeFileSync, mkdirSync } from 'node:fs'; import { abrir, dorme } from './nav.mjs';
const SAIDA = 'C:/Users/Minhoca/Projetos/JogosOffline/jogos/keepsake-hunt/arte/'; mkdirSync(SAIDA, { recursive: true });
const p = await abrir({ w: 400, h: 300, url: '/index.html?manifest' }); await dorme(500);
const VS = `#version 300 es
void main(){vec2 p=vec2(gl_VertexID&1,gl_VertexID>>1)*4.-1.;gl_Position=vec4(p,0.,1.);}`;
const FS = `#version 300 es
precision highp float;out vec4 o;uniform vec2 R;uniform int T;
float h2(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*ns(p);p=mat2(1.6,1.2,-1.2,1.6)*p+3.1;a*=.5;}return s;}
// devolve cor e altura; o tampo mede 36 x 48
vec4 tabua(vec2 p,float larg,vec3 a,vec3 b,float gasto,float s){float k=floor(p.x/larg),fx=fract(p.x/larg)*larg,r=h2(vec2(k,s));float comp=14.+10.*r,y=p.y+r*40.,j=floor(y/comp);float id=h2(vec2(k,j)+s);
 vec2 q=vec2(fx+id*30.,y*.16+id*60.);float v=fbm(vec2(q.x*.8,q.y)),an=sin(v*26.+q.x*1.5)*.5+.5,g=ns(vec2(q.x*9.,q.y*3.));
 vec3 c=mix(a,b,clamp(an*.5+g*.38,0.,1.))*(.8+.34*id)*(.85+.3*fbm(p*.35));float h=-.05*g-.04*an;
 float d=min(min(fx,larg-fx),min(fract(y/comp)*comp,comp-fract(y/comp)*comp));float f=smoothstep(.0,.16,d);c*=mix(.16,1.,f);h-=.5*(1.-smoothstep(0.,.22,d));
 float rs=smoothstep(.69,.72,ns(vec2(p.x*1.1+p.y*.15,p.y*.06+s)*vec2(6.,1.)))*gasto;c*=1.-.25*rs;h-=rs*.04;return vec4(c,h);}
vec4 mapa(vec2 p){
 if(T==0)return tabua(p,7.2,vec3(.155,.070,.034),vec3(.060,.024,.012),.6,1.);
 if(T==1)return tabua(p+vec2(1.5,0.),3.1,vec3(.46,.27,.115),vec3(.27,.135,.05),.8,7.);
 if(T==2){vec2 q=p*5.2;vec2 c=floor(q),f=fract(q);bool hz=mod(c.x+c.y,2.)<1.;float th=hz?sin(f.y*3.14)*(.8+.2*sin(f.x*3.14)):sin(f.x*3.14)*(.8+.2*sin(f.y*3.14));float id=h2(hz?vec2(c.y,1.):vec2(c.x,9.));vec3 k=mix(vec3(.20,.235,.25),vec3(.27,.30,.30),id)*(.62+.5*th)*(.86+.28*fbm(p*.3));float dob=sin(p.x*.22+p.y*.13+fbm(p*.08)*5.);k*=.94+.08*dob;return vec4(k,th*.12+dob*.6);}
 if(T==3){vec2 g=abs(fract(p/3.+.5)-.5)*3.,g2=abs(fract(p+.5)-.5);float l=smoothstep(.06,.02,min(g.x,g.y)),l2=smoothstep(.03,.012,min(g2.x,g2.y));float n=fbm(p*9.);vec3 c=vec3(.075,.145,.18)*(.86+.3*fbm(p*.4))*(.92+.16*n);c=mix(c,vec3(.23,.33,.36),l*.55);c=mix(c,vec3(.17,.26,.29),l2*.35);float cor=smoothstep(.74,.76,ns(vec2(p.x*2.+p.y*.7,p.y*.25-p.x*.2)*1.4))*.35;c*=1.-.3*cor;return vec4(c,n*.05-cor*.05);}
 vec4 t=tabua(p.yx+vec2(0.,9.),5.6,vec3(.235,.185,.135),vec3(.105,.080,.058),1.,13.);float m=smoothstep(.5,.75,fbm(p*.22+7.));t.rgb=mix(t.rgb,t.rgb*vec3(.72,.86,.86),m*.6);return t;}
void main(){vec2 p=gl_FragCoord.xy/R*vec2(36.,48.);vec4 m=mapa(p);float e=.03;vec2 gr=vec2(mapa(p+vec2(e,0)).a-mapa(p-vec2(e,0)).a,mapa(p+vec2(0,e)).a-mapa(p-vec2(0,e)).a)/(2.*e);
 vec3 n=normalize(vec3(-gr*.55,1.)),L=normalize(vec3(-.42,.5,.76));float d=max(0.,dot(n,L));vec3 c=m.rgb*(.42+.95*d);c+=vec3(1.,.9,.75)*pow(max(0.,dot(n,normalize(L+vec3(0,0,1)))),40.)*.045;
 o=vec4(pow(c,vec3(1./2.2)),1.);}`;
await p.av(`window.VSX=${JSON.stringify(VS)};window.FSX=${JSON.stringify(FS)};window.MESA=t=>{const L=1800,A=2400,c=document.createElement('canvas');c.width=L;c.height=A;const g=c.getContext('webgl2',{preserveDrawingBuffer:true}),sh=(k,s)=>{const x=g.createShader(k);g.shaderSource(x,s);g.compileShader(x);if(!g.getShaderParameter(x,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(x));return x;},P=g.createProgram();g.attachShader(P,sh(g.VERTEX_SHADER,VSX));g.attachShader(P,sh(g.FRAGMENT_SHADER,FSX));g.linkProgram(P);g.useProgram(P);g.viewport(0,0,L,A);g.uniform2f(g.getUniformLocation(P,'R'),L,A);g.uniform1i(g.getUniformLocation(P,'T'),t);g.drawArrays(g.TRIANGLES,0,3);const d=document.createElement('canvas');d.width=900;d.height=1200;const q=d.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(c,0,0,900,1200);return d.toDataURL('image/webp',.8)};1`);
for (let t = 0; t < 5; t++) { const b = Buffer.from((await p.av(`MESA(${t})`)).split(',')[1], 'base64'); writeFileSync(`${SAIDA}m${t}.webp`, b); console.log('mesa', t, Math.round(b.length / 1024), 'KB'); }
console.log(p.erros.slice(0, 2)); p.fim();
