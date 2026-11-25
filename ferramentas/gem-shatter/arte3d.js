// Gem Shatter: cenas 3D das galerias e minerais (usado só por gerar-arte.mjs; o jogo recebe as imagens prontas)
const Arte3D = (() => {
  const COMUM = `precision highp float;uniform vec2 R;uniform float w[5];uniform vec4 U;uniform vec3 K1,K2;
float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float nz(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float cil(vec3 p,float r,float h){vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float oct(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.577;}
float hexa(vec3 p,float r,float h){vec3 q=abs(p);float k=max(q.x*.866+q.z*.5,q.z);return max(max(k-r,-p.y-h),(p.y-h)*.62+(k-r*.15)*.78);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float rep(float x,float c){return mod(x+.5*c,c)-.5*c;}
vec2 m(vec2 a,float d,float k){return d<a.x?vec2(d,k):a;}
float gE;
`;
  // materiais: 1 rocha, 2 madeira, 3 ferro, 4 ouro, 5 cristal, 6 luz, 7 água, 8 lava, 9 pedra lavrada
  const GRUTA = `float cava(vec3 p,float ch){float b=min(min(3.3-length(vec2(p.x,(p.y-.1)*1.2)),7.-p.z),p.y+1.2+ch);if(b>1.1)return b-.6;float n=nz(p*.9)*.6+nz(p*2.1)*.28+nz(p*5.3)*.08;
float dw=3.3-length(vec2(p.x,(p.y-.1)*1.2))+(n-.45)*.95,de=7.-p.z+(n-.45)*1.3,df=p.y+1.28+ch-n*.28;return min(min(dw,de),df);}
// entulho no lugar da obra que ainda não foi feita
float entulho(vec3 p,vec3 c,float f){if(f>.97)return 9.;vec3 q=p-c;float b=length(q*vec3(1.,1.4,1.))-1.05;if(b>.5)return b;q.xz=mod(q.xz+.22,.44)-.22;float r=.17+.1*h31(floor((p-c)*2.27));return max(length(q+vec3(0,.05,0))-r*(1.-f),b);}
`;
  const FIM = `
vec3 normal(vec3 p){vec2 e=vec2(1,-1)*.004;return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}
vec3 base(float k,vec3 p,vec3 n){float g=nz(p*7.)*.6+nz(p*19.)*.4;
if(k<1.5){vec3 c=ROCHA*(.55+g*.8);
#ifdef VEIO
float v=abs(nz(p*1.15+4.)-.5)+abs(nz(p*2.3)-.5)*.35;c=mix(c,vec3(1.,.66,.16)*(.7+g*.8),smoothstep(.075,.03,v)*w[1]*smoothstep(-1.05,-.7,p.y));
#endif
return c;}
if(k<2.5){float f=nz(vec3(p.x*14.,p.y*14.,p.z*14.)*vec3(.5,1.,.5));return mix(vec3(.30,.17,.08),vec3(.55,.35,.18),f)*(.75+g*.4);}
if(k<3.5)return vec3(.30,.31,.33)*(.6+g*.6);if(k<4.5)return vec3(1.,.70,.22)*(.8+g*.25);if(k<5.5)return CRI*(.75+g*.4);if(k<6.5)return CE;return mix(vec3(.46,.43,.40),ROCHA*1.6,.4)*(.7+g*.5);}
float sombra(vec3 p,vec3 l,float mx){float s=1.,t=.06;for(int i=0;i<22;i++){float d=map(p+l*t).x;s=min(s,9.*d/t);t+=clamp(d,.04,.45);if(s<.02||t>mx)break;}return clamp(s,0.,1.);}
vec3 luz(vec3 p,vec3 n,vec3 v,vec3 L,vec3 c,float k,bool sm){vec3 l=L-p;float d=length(l);l/=d;float s=sm?sombra(p,l,d-.3):1.;float df=max(0.,dot(n,l)),sp=pow(max(0.,dot(n,normalize(l-v))),k>2.5&&k<5.5?42.:14.)*(k>2.5&&k<5.5?1.6:.12);return c*(df*(k>3.5&&k<4.5?.55:1.)+sp)*s/(1.+d*d*.16);}
vec3 cor(vec3 p,vec3 v,float k){if(k>5.5&&k<6.5)return CE*1.7;if(k>7.5&&k<8.5){float f=nz(vec3(p.xz*1.7,1.))*.6+nz(vec3(p.xz*4.,2.))*.4;return mix(vec3(.16,.02,.01),mix(vec3(1.5,.32,.03),vec3(2.2,1.2,.3),smoothstep(.55,.85,f)),smoothstep(.36,.58,f));}
vec3 n=normal(p);if(k<1.5||k>8.5)n=normalize(n+.35*(vec3(nz(p*11.),nz(p*11.+7.),nz(p*11.+13.))-.5));
vec3 b=base(k,p,n);float ao=0.;for(int i=1;i<4;i++){float h=.13*float(i);ao+=(h-map(p+n*h).x)/h*.33;}ao=clamp(1.-ao*.8,0.,1.);
float viva=1.2+.1*(w[0]+w[1]+w[2]+w[3]+w[4])*.4;vec3 c=b*AMB*ao*viva*(.7+.3*n.y);
c+=b*luz(p,n,v,L0,C0,k,true)*(.35+.65*ao);c+=b*luz(p,n,v,L1,C1,k,false)*ao;c+=b*luz(p,n,v,L2,C2,k,false)*ao;
if(k>4.5&&k<5.5){float fr=pow(1.+dot(n,v),2.);c+=CRI*(fr*.7+.22)+vec3(.5)*pow(max(0.,dot(reflect(v,n),normalize(vec3(-.3,.8,-.5)))),20.);}
if(k>3.5&&k<4.5){vec3 r=reflect(v,n);c+=b*(.18+.5*smoothstep(.2,.9,r.y)+.35*nz(r*3.));}
#ifdef VEIO
if(k<1.5){float vv=abs(nz(p*1.15+4.)-.5)+abs(nz(p*2.3)-.5)*.35;c+=vec3(1.,.62,.15)*smoothstep(.075,.03,vv)*w[1]*.3*smoothstep(-1.05,-.7,p.y);}
#endif
return c;}
vec2 marcha(vec3 o,vec3 d,inout vec3 gl){float t=.1;vec2 h=vec2(9.);for(int i=0;i<PASSOS;i++){gE=9.;h=map(o+d*t);gl+=CE*.0011/(.005+gE*gE);if(h.x<.0015*t||t>15.)break;t+=h.x*.78;}return vec2(t,t>15.?0.:h.y);}
void main(){vec2 u=(gl_FragCoord.xy*2.-R)/R.y;vec3 o=vec3(0,.25,-4.4),d=normalize(vec3(u*vec2(.72,.72)+vec2(0,-.02),1.25));vec3 gl=vec3(0);vec2 h=marcha(o,d,gl);vec3 p=o+d*h.x,c;
if(h.y>6.5&&h.y<7.5){vec3 n=normalize(vec3((nz(vec3(p.xz*2.6,3.))-.5)*.16,1.,(nz(vec3(p.xz*2.6,9.))-.5)*.16));vec3 r=reflect(d,n),g2=vec3(0);float t=.08;vec2 q=vec2(9.);for(int i=0;i<110;i++){gE=9.;q=map(p+r*t);g2+=CE*.0012/(.01+gE*gE);if(q.x<.004*t||t>10.)break;t+=q.x*.9;}
vec3 s=t<10.&&q.y<6.9?cor(p+r*t,r,q.y):FOG;float f=.16+.84*pow(1.-max(0.,dot(n,-d)),4.);c=mix(vec3(.01,.06,.075)+C1*.008,s*.95+g2,clamp(f*smoothstep(1.2,3.,h.x)+.22*smoothstep(1.8,4.,h.x),0.,1.));}
else c=h.y<.5?FOG:cor(p,d,h.y);
c=mix(c,FOG,1.-exp(-h.x*h.x*.0065));c+=gl;c*=.62*(1.-.30*dot(u*.62,u*.62));c=mix(vec3(dot(c,vec3(.3,.59,.11))),c,1.12);c=c*c*.35+c*.72;c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);c=pow(max(c,0.),vec3(.52));c+=(h31(vec3(gl_FragCoord.xy,1.))-.5)*.02;gl_FragColor=vec4(c,1.);}`;
  const CENAS = [
    // Boca da mina
    `#define PASSOS 96
#define ROCHA vec3(.36,.25,.17)
#define CRI (p.x>.12?vec3(.85,.10,.14):p.x<-.14?vec3(.12,.42,.95):vec3(.10,.72,.38))
#define CE vec3(1.,.66,.26)
#define FOG vec3(.055,.036,.022)
#define AMB vec3(.20,.155,.12)
#define L0 vec3(.6,1.2,-2.4)
#define C0 vec3(1.5,1.1,.72)
#define L1 vec3(-1.3,1.1,1.6)
#define C1 (vec3(1.9,1.1,.45)*w[2])
#define L2 vec3(1.3,1.,4.)
#define C2 (vec3(2.1,1.2,.5)*(.25+w[2]))
` + GRUTA + `vec2 map(vec3 p){vec2 r=vec2(cava(p,0.),1.);
if(w[0]>.01){vec3 q=p+vec3(0,(1.-w[0])*.5,0);r=m(r,bx(vec3(abs(q.x)-.46,q.y+1.02,q.z-2.),vec3(.035,.05,6.)),3.);r=m(r,bx(vec3(q.x,q.y+1.09,rep(q.z,.55)),vec3(.78,.045,.1))*.9,2.);}
if(w[1]>.01){vec3 q=p+vec3(0,(1.-w[1])*3.4,0);float z=q.z-1.4-2.4*clamp(floor((q.z-1.4)/2.4+.5),-1.,1.);r=m(r,bx(vec3(abs(q.x)-1.95-.06*q.y,q.y-.35,z),vec3(.15,1.75,.16)),2.);r=m(r,bx(vec3(q.x,q.y-1.95,z),vec3(2.35,.16,.17)),2.);vec3 k=vec3(abs(q.x)-1.5,q.y-1.5,z);k.xy*=rot(.78);r=m(r,bx(k,vec3(.55,.07,.08)),2.);}
if(w[2]>.01){vec3 q=p-vec3(0,(1.-w[2])*1.5,0);float z=q.z-1.4-2.4*clamp(floor((q.z-1.4)/2.4+.5),-1.,1.);vec3 l=vec3(abs(q.x)-1.25,q.y-1.28,z);float e=length(l)-.11;gE=max(0.,e);r=m(r,e,6.);r=m(r,cil(l-vec3(0,.2,0),.02,.42),3.);r=m(r,cil(l-vec3(0,.14,0),.13,.025),3.);r=m(r,cil(l+vec3(0,.13,0),.1,.02),3.);}
if(w[3]>.01){vec3 q=p-vec3(1.55,-.1-(1.-w[3])*2.6,2.55);q.xz*=rot(.35);float a=length(q.xy);r=m(r,length(vec2(a-.95,q.z))-.075,2.);r=m(r,length(vec2(a-.95,abs(q.z)-.13))-.04,3.);float an=atan(q.y,q.x),s=rep(an,.785)*a;r=m(r,max(bx(vec3(s,0.,q.z),vec3(.045,1.,.05)),a-.95),2.);r=m(r,length(vec2(a,abs(q.z)*.5))-.14,3.);r=m(r,bx(q+vec3(0,.65,-.3),vec3(.12,.75,.09)),2.);}
if(w[4]>.01){vec3 q=p-vec3(0,-.52-(1.-w[4])*1.2,.55);vec3 b=q;b.x/=1.+.32*q.y;float c=max(bx(b,vec3(.6,.36,.72)),-bx(b-vec3(0,.12,0),vec3(.53,.36,.65)))*.8;r=m(r,c,3.);r=m(r,max(bx(vec3(q.x,q.y-.34,q.z),vec3(.71,.035,.79)),-bx(vec3(q.x,q.y-.34,q.z),vec3(.6,.2,.66))),3.);vec3 k=vec3(abs(q.x)-.46,q.y+.42,abs(q.z)-.45);r=m(r,max(length(k.yz)-.17,abs(k.x)-.05),3.);
vec3 g=q-vec3(0,.3,0);vec3 id=floor(g/.3+.5);vec3 gg=g-id*.3;gg+=(h31(id+3.)-.5)*.1;gg.xy*=rot(h31(id)*3.);gg.yz*=rot(h31(id+9.)*3.);r=m(r,max(oct(gg,.23),bx(g*vec3(1,1.6,1)+vec3(0,g.x*g.x*.9+g.z*g.z*.6-.02,0),vec3(.52,.24,.64)))*.8,5.);}
r=m(r,entulho(p,vec3(0,-1.15,.5),w[4]),1.);r=m(r,entulho(p,vec3(1.7,-1.1,2.2),w[3]),1.);return r;}`,
    // Lago fundo
    `#define PASSOS 100
#define ROCHA vec3(.17,.26,.28)
#define CRI vec3(.25,.75,.95)
#define CE vec3(1.,.78,.42)
#define FOG vec3(.012,.04,.05)
#define AMB vec3(.11,.2,.22)
#define L0 vec3(-.8,2.0,-1.4)
#define C0 vec3(.7,1.15,1.25)
#define L1 vec3(1.2,-.3,2.)
#define C1 (vec3(2.,1.25,.6)*w[3])
#define L2 vec3(0.,1.4,4.6)
#define C2 (vec3(.4,1.2,1.5)*(.45+w[4]*1.4))
` + GRUTA + `vec2 map(vec3 p){vec2 r=vec2(cava(p,.9-1.15*smoothstep(1.7,3.,abs(p.x))),1.);r=m(r,p.y+1.,7.);
if(w[0]>.01){vec3 q=p-vec3(-1.45,-.72-(1.-w[0])*.8,-.4);r=m(r,bx(vec3(q.x,q.y,rep(q.z,.26)),vec3(.8,.045,.11))>bx(q,vec3(.8,.05,1.9))?max(bx(vec3(q.x,q.y,rep(q.z,.26)),vec3(.8,.045,.11)),bx(q,vec3(.8,.06,1.9))):bx(q,vec3(.8,.05,1.9)),2.);r=m(r,cil(vec3(abs(q.x)-.72,q.y+.1,q.z-.1-1.1*clamp(floor((q.z-.1)/1.1+.5),-1.,1.)),.09,.62),2.);}
if(w[1]>.01){vec3 q=p-vec3(0,-(1.-w[1])*2.2,3.3);float y=-.35+.62*(1.-q.x*q.x*.13);r=m(r,max(bx(vec3(q.x,q.y-y,q.z),vec3(3.1,.09,.5))*.75,-length(vec2(q.x,q.y+1.35))+1.1),9.);float s=rep(q.x,.55);r=m(r,bx(vec3(s,q.y-y-.3,abs(q.z)-.45),vec3(.05,.28,.05))*.8,9.);r=m(r,bx(vec3(q.x,q.y-y-.58,abs(q.z)-.45),vec3(3.1,.05,.07))*.75,9.);}
if(w[2]>.01){vec3 q=p-vec3(.95,-.86-(1.-w[2])*.9,.25);q.xz*=rot(-.5);vec3 k=q;k.x/=(1.-.16*k.z*k.z);float o=(length(k*vec3(1.9,1.8,.75))-.78)*.45,i=(length((k-vec3(0,.1,0))*vec3(2.1,1.9,.79))-.74)*.45;r=m(r,max(max(o,-i),q.y-.13),2.);r=m(r,max(bx(vec3(q.x,q.y-.03,abs(q.z)-.3),vec3(.36,.025,.08)),o),2.);vec3 e=q-vec3(.38,.25,-.1);e.xy*=rot(.9);r=m(r,cil(e,.025,.6),2.);}
if(w[3]>.01){vec3 q=p;q.xz-=vec2(1.1,1.1);vec2 id=clamp(floor(q.xz/vec2(1.25,1.5)+.5),vec2(-1.,-1.),vec2(1.,1.));q.xz-=id*vec2(1.25,1.5)+vec2(h31(vec3(id,1.))-.5,h31(vec3(id,5.))-.5)*.7;float e=length((q+vec3(0,.86+(1.-w[3])*.5,0))*vec3(1,.8,1))-.085;gE=min(gE,max(0.,e));r=m(r,e,6.);r=m(r,cil(q+vec3(0,.96+(1.-w[3])*.5,0),.17,.02),2.);}
if(w[4]>.01){vec3 q=p-vec3(0,(1.-w[4])*2.,0);vec2 id=clamp(floor(q.xz/.8+.5),vec2(-2.,0.),vec2(2.,6.));float a=h31(vec3(id,2.));q.xz-=id*.8+(vec2(a,h31(vec3(id,8.)))-.5)*.5;vec3 k=vec3(q.x,2.6-q.y-.4*a,q.z);k.xz*=rot(a*6.);r=m(r,hexa(k,.11+.09*a,.55+.75*a)*.7,5.);}
r=m(r,entulho(p,vec3(-1.7,-1.02,-.2),w[0]),1.);return r;}`,
    // Gruta violeta
    `#define PASSOS 100
#define ROCHA vec3(.23,.17,.30)
#define CRI vec3(.62,.28,.98)
#define CE vec3(1.,.72,.5)
#define FOG vec3(.034,.018,.05)
#define AMB vec3(.17,.13,.23)
#define L0 vec3(.9,1.5,-2.2)
#define C0 vec3(1.05,.85,1.25)
#define L1 vec3(0.,.8,4.2)
#define C1 (vec3(1.5,.7,2.4)*(.35+1.5*w[4]))
#define L2 vec3(0.,.1,1.6)
#define C2 (vec3(1.8,1.1,.6)*w[2])
` + GRUTA + `float tufo(vec3 p,float s){float d=9.;for(int i=0;i<5;i++){float f=float(i);vec3 q=p;q.xz*=rot(f*1.26+s);q.x-=.16+.03*f;q.xy*=rot(.32+.07*f);d=min(d,hexa(q-vec3(0,.25+.1*sin(f*2.+s),0),.13-.012*f,.35+.22*sin(f*3.1+s)));}return min(d,hexa(p-vec3(0,.5,0),.17,.62));}
vec2 map(vec3 p){vec2 r=vec2(cava(p,0.),1.);
if(w[0]>.01){vec3 q=p+vec3(0,(1.-w[0])*1.6,0);float i=clamp(floor((q.z-.6)/.42),0.,7.);for(int k=0;k<2;k++){float j=clamp(i+float(k),0.,7.);r=m(r,bx(q-vec3(0,-1.15+j*.085,.81+j*.42),vec3(1.25-.05*j,.085+j*.085,.23)),9.);}}
if(w[1]>.01){vec3 q=p+vec3(0,(1.-w[1])*1.6,0);q.x=abs(q.x);if(q.x>.7){r=m(r,tufo(q-vec3(1.95,-1.1,.2),p.x>0.?1.:2.4)*.8,5.);r=m(r,tufo((q-vec3(2.3,-1.05,2.2))*.75,p.x>0.?3.:.4)*1.,5.);r=m(r,tufo((q-vec3(1.55,-1.1,-1.4))*1.5,2.)*.55,5.);}}
if(w[2]>.01){vec3 q=p;float j=clamp(floor((q.z-1.1)/1.15+.5),0.,2.);vec3 l=q-vec3(0,-.45+j*.22-(1.-w[2])*1.4,1.1+j*1.15);l.x=abs(l.x)-1.42;r=m(r,cil(l+vec3(0,.42,0),.07,.45),3.);r=m(r,cil(l,.16,.04),3.);float e=length((l-vec3(0,.16,0))*vec3(1,.75,1))-.09;gE=min(gE,max(0.,e));r=m(r,e,6.);}
if(w[3]>.01){vec3 q=p-vec3(0,.35-(1.-w[3])*3.,4.1);float a=length(vec2(q.x,max(q.y,0.)));float d=max(abs(a-1.5)-.26,abs(q.z)-.32);if(q.y<0.)d=max(bx(vec3(abs(q.x)-1.5,q.y+.7,q.z),vec3(.26,.9,.32)),-9.);float an=q.y>0.?atan(q.y,q.x):q.y;d+=.03*smoothstep(.06,.0,abs(rep(an,.35)))*step(0.,1.);r=m(r,d*.85,9.);}
if(w[4]>.01){vec3 q=p-vec3(0,.72+(1.-w[4])*3.,5.1);float s=length(q),o=s-1.18+.06*nz(q*4.),i=s-.95;vec3 c=q-vec3(0,0,-1.25);float ab=length(c*vec3(1.,.95,.8))-.98;r=m(r,max(max(o,-i),-ab),9.);vec3 k=normalize(q);vec2 st=vec2(atan(k.x,-k.z),asin(k.y))*3.4;vec2 id=floor(st+.5);vec2 f=st-id;float hh=h31(vec3(id,3.));float dd=max(max(abs(f.x),abs(f.y))*.26*s-.1,abs(s-.9)-.04-.28*hh*(1.-length(f)*1.4));float g=max(dd*.5,q.z-.4);gE=min(gE,max(0.,g)+.16);r=m(r,g,5.);}
r=m(r,entulho(p,vec3(0,-1.15,1.3),w[0]),1.);r=m(r,entulho(p,vec3(-1.9,-1.1,.3),w[1]),1.);r=m(r,entulho(p,vec3(1.9,-1.1,.3),w[1]),1.);return r;}`,
    // Veio dourado
    `#define PASSOS 100
#define VEIO 1
#define ROCHA vec3(.30,.235,.14)
#define CRI vec3(1.,.7,.2)
#define CE vec3(1.,.5,.14)
#define FOG vec3(.05,.035,.012)
#define AMB vec3(.19,.15,.09)
#define L0 vec3(-.6,1.5,-2.3)
#define C0 vec3(1.35,1.05,.65)
#define L1 vec3(1.35,-.45,1.5)
#define C1 (vec3(2.6,1.1,.3)*w[2])
#define L2 vec3(-.4,1.5,4.2)
#define C2 (vec3(1.5,1.15,.5)*(.5+w[1]))
` + GRUTA + `vec2 map(vec3 p){vec2 r=vec2(cava(p,0.),1.);
if(w[0]>.01){vec3 q=p-vec3(-1.95,0.-(1.-w[0])*3.2,1.5);q.xz*=rot(-.25);vec3 k=vec3(abs(q.x)-.42,q.y,q.z-1.3*clamp(floor(q.z/1.3+.5),-1.,1.));r=m(r,bx(k-vec3(0,-.05,0),vec3(.06,1.45,.06)),2.);float l=q.y-.15-.95*clamp(floor((q.y-.15)/.95+.5),-.0,1.);r=m(r,bx(vec3(q.x,l+.35,q.z),vec3(.55,.045,1.55)),2.);vec3 e=vec3(q.x-.45,q.y,q.z-.65);e.zy*=rot(.75);r=m(r,bx(e,vec3(.035,1.,.035)),2.);r=m(r,bx(vec3(q.x-.44,q.y-1.1,q.z),vec3(.04,.05,1.5)),2.);}
if(w[2]>.01){vec3 q=p-vec3(1.75,-.45-(1.-w[2])*2.4,2.1);q.xz*=rot(.5);float b=length(vec3(q.x,max(q.y,0.),q.z))-.82;b=max(b,q.y<0.?length(q.xz)-.82:-9.);b=max(b,-q.y-.8);float bo=length(vec2(q.x,(q.y+.15)))-.36;b=max(b,-max(bo,q.z+.2));float bl=.02*smoothstep(.05,0.,abs(rep(q.y,.24)));r=m(r,(b+bl)*.85,9.);r=m(r,cil(q-vec3(0,1.3,.1),.24,.75),9.);float e=length(q-vec3(0,-.2,-.35))-.27;gE=min(gE,max(0.,e)+.05);r=m(r,e,6.);}
if(w[3]>.01){vec3 q=p-vec3(-.35,-1.03-(1.-w[3])*.9,.35);q.xz*=rot(.35);for(int i=0;i<3;i++){float f=float(i);vec3 k=q-vec3(0,f*.17,0);float n=1.-f*.5;float x=k.x-.36*clamp(floor(k.x/.36+.5+.0),-n,n);if(i==1)x=k.x-.36*(clamp(floor(k.x/.36),-1.,0.)+.5);r=m(r,bx(vec3(x/(1.-.5*k.y),k.y,k.z),vec3(.145,.07,.42))*.85-.012,4.);}}
if(w[4]>.01){vec3 q=p-vec3(.15,-(1.-w[4])*3.4,4.1);r=m(r,bx(q+vec3(0,1.,0),vec3(.75,.2,.75)),9.);r=m(r,bx(q+vec3(0,.7,0),vec3(.55,.14,.55)),9.);float t=clamp((q.y+.6)/2.3,0.,1.);float o=bx(vec3(q.x,q.y-.5,q.z),vec3(.34-.12*t,1.15,.34-.12*t));vec3 k=q-vec3(0,1.65,0);o=min(o,max(oct(k*vec3(1,.75,1),.34),-k.y));r=m(r,(o+.012*smoothstep(.03,0.,abs(rep(q.y,.3))))*.8,4.);}
r=m(r,entulho(p,vec3(-.3,-1.15,.4),w[3]),1.);r=m(r,entulho(p,vec3(1.7,-1.12,1.9),w[2]),1.);r=m(r,entulho(p,vec3(.15,-1.12,3.9),w[4]),1.);return r;}`,
    // Coração da terra
    `#define PASSOS 100
#define ROCHA vec3(.22,.13,.11)
#define CRI vec3(1.,.16,.14)
#define CE vec3(1.,.36,.12)
#define FOG vec3(.06,.014,.006)
#define AMB vec3(.21,.11,.085)
#define L0 vec3(.4,1.5,-2.4)
#define C0 vec3(1.1,.75,.6)
#define L1 vec3(0.,-1.1,2.2)
#define C1 vec3(2.1,.62,.12)
#define L2 vec3(0.,.9,3.0)
#define C2 (vec3(2.6,.5,.3)*w[4])
` + GRUTA + `vec2 map(vec3 p){vec2 r=vec2(cava(p,.7-1.*smoothstep(1.,2.7,abs(p.x))),1.);r=m(r,p.y+1.35,8.);
if(w[0]>.01){vec3 q=p-vec3(0,-.78-(1.-w[0])*1.2,2.9);float z=rep(q.z,2.2);r=m(r,max(bx(q,vec3(.85,.3,4.6)),-(length(vec2(z,q.y+.42))-.85)),9.);r=m(r,bx(vec3(abs(q.x)-.8,q.y-.36,q.z),vec3(.07,.1,4.6)),9.);r=m(r,max(bx(vec3(abs(q.x)-.8,q.y-.42,rep(q.z,1.1)),vec3(.11,.2,.11)),abs(q.z)-4.6),9.);}
if(w[1]>.01){vec3 q=p+vec3(0,(1.-w[1])*4.,0);float z=q.z-1.2-1.9*clamp(floor((q.z-1.2)/1.9+.5),-1.,2.);vec3 k=vec3(abs(q.x)-1.85,q.y-.4,z);float an=atan(k.x,k.z);r=m(r,(cil(k,.27+.012*cos(an*12.),1.9))*.9,9.);r=m(r,bx(k+vec3(0,1.35,0),vec3(.38,.14,.38)),9.);r=m(r,bx(k-vec3(0,1.3,0),vec3(.37,.12,.37)),9.);}
if(w[2]>.01){vec3 q=p-vec3(0,.75+(1.-w[2])*2.5,3.2);q.x=abs(q.x);vec3 k=q-vec3(.35,.2,0);k.xy*=rot(-.62);float y=rep(k.x,.19);float on=step(0.,k.x)*step(k.x,1.9);vec3 e=vec3(k.x-.095-.19*clamp(floor(k.x/.19),0.,9.),k.y,k.z);r=m(r,max(length(vec2(length(vec2(e.x*.62,e.y))-.062,e.z))-.022,-9.)*.7,3.);}
if(w[3]>.01){vec3 q=p;float z=q.z-.6-1.1*2.*clamp(floor((q.z-.6)/2.2+.5),-1.,1.);vec3 l=vec3(abs(q.x)-.8,q.y+.12+(1.-w[3])*1.2,z);r=m(r,cil(l+vec3(0,.12,0),.05,.16),3.);r=m(r,max(length(l*vec3(1,1.3,1))-.2,l.y-.02),3.);float e=length((l-vec3(0,.1,0))*vec3(1,.62,1))-.1-.03*nz(l*14.);gE=min(gE,max(0.,e));r=m(r,e,6.);}
if(w[4]>.01){vec3 q=p-vec3(0,.72+(1.-w[4])*2.6,3.2);q.xz*=rot(.5);float o=max(oct(q*vec3(1,.62,1),.62),max(abs(q.x),abs(q.z))-.5);o=min(o,max(oct((q-vec3(.42,-.12,0))*vec3(1.2,.7,1.2),.34),-9.));o=min(o,oct((q-vec3(-.42,.14,.1))*vec3(1.2,.7,1.2),.32));gE=min(gE,max(0.,o)+.11);r=m(r,o*.8,5.);}
r=m(r,entulho(p,vec3(-1.6,-1.0,1.),w[1]),1.);r=m(r,entulho(p,vec3(1.6,-1.0,1.4),w[1]),1.);return r;}`,
  ];
  // um mineral da coleção. U = (forma, semente, brilho, -)
  const MINERAL = `
float forma(vec3 p){float f=U.x,s=U.y;float d=9.;
if(f<.5){for(int i=0;i<6;i++){float a=float(i);vec3 q=p+vec3(0,.75,0);q.xz*=rot(a*1.05+s);q.x-=.22;q.xy*=rot(.25+.17*fract(a*.37+s));d=min(d,hexa(q-vec3(0,.45,0),.19-.02*fract(a*.6),.42+.28*fract(a*.71+s)));}d=min(d,hexa(p+vec3(0,.2,0),.27,.78));return max(d,-p.y-.8)*.85;}
if(f<1.5){for(int i=0;i<5;i++){float a=float(i);vec3 q=p-vec3(sin(a*2.4+s)*.42,-.28+.32*fract(a*.43),cos(a*2.4+s)*.36);q.xz*=rot(a*.9+s);q.xy*=rot(.35*sin(a*3.+s));d=min(d,bx(q,vec3(.46-.06*a))-.012);}return d*.9;}
if(f<2.5){for(int i=0;i<9;i++){float a=float(i);vec3 q=p-vec3(sin(a*2.39+s)*.5*sqrt(a/9.)*1.15,-.25+.4*fract(a*.31+s*.1),cos(a*2.39+s)*.5*sqrt(a/9.));float e=length(q)-.42+.14*fract(a*.57);float k=clamp(.5+.5*(d-e)/.07,0.,1.);d=mix(d,e,k)-.07*k*(1.-k);}return max(d,-p.y-.72)*.9;}
if(f<3.5){vec3 q=p;q.xy*=rot(.35);float e=length(q*vec3(.86,1.18,1.))-.82+.16*nz(q*1.5+s)-.1*nz(q*3.+s);return e*.75;}
if(f<4.5){for(int i=0;i<7;i++){float a=float(i);vec3 q=p+vec3(0,.35,0);q.xz*=rot(a*.9+s);q.xy*=rot(.55+.25*sin(a*2.));vec3 b=abs(q-vec3(0,.35,0));d=min(d,max(max(b.x*.86+b.y*.5,b.y)-.55,b.z-.045));}return max(d,-p.y-.75)*.85;}
if(f<5.5){for(int i=0;i<3;i++){float a=float(i);vec3 q=p-vec3(.34*sin(a*2.2+s),-.2+.22*a*.6,.3*cos(a*2.2+s)*step(.5,a));q.xz*=rot(a*1.1+.5);q.x+=q.y*.42;q.z+=q.y*.2;d=min(d,bx(q,vec3(.52,.4,.4)*(1.-.22*a)));}return d*.8;}
if(f<6.5){vec3 q=p;q.xz*=rot(.5+s);d=oct(q*vec3(1.,.92,1.),.98);q=p-vec3(.58,-.42,.2);q.xz*=rot(1.2);d=min(d,oct(q,.46));q=p-vec3(-.55,-.5,.25);d=min(d,oct(q,.36));return d*.9;}
if(f<7.5){vec3 q=p;q.yz*=rot(.12);q.xz*=rot(.3);float r=length(q.xy*vec2(.92,1.08))-.86+.12*nz(vec3(q.xy*2.2,s));return max(r,abs(q.z)-.17)*.8;}
if(f<8.5){for(int i=0;i<11;i++){float a=float(i);vec3 q=p+vec3(0,.75,0);q.xz*=rot(a*2.39+s);q.xy*=rot(.12+.5*fract(a*.37));d=min(d,hexa(q-vec3(.04,.65,0),.075-.02*fract(a*.7),.6+.2*fract(a*.53)));}return max(d,-p.y-.8)*.8;}
vec3 q=p;q.xz*=rot(.4+s);q.xy*=rot(.2);vec3 b=abs(q);float g=max(max(b.x+b.y,b.y+b.z),b.x+b.z)*.707-.7;return max(g,max(b.x,max(b.y*.92,b.z))-.82)*.95;}
vec2 map(vec3 p){return vec2(min(forma(p),9.),1.);}
vec3 nor(vec3 p){vec2 e=vec2(1,-1)*.003;return normalize(e.xyy*forma(p+e.xyy)+e.yyx*forma(p+e.yyx)+e.yxy*forma(p+e.yxy)+e.xxx*forma(p+e.xxx));}
void main(){vec2 u=(gl_FragCoord.xy*2.-R)/R.y;vec3 o=vec3(0,.75,-4.6),f=normalize(vec3(0,-.02,0)-o),x=normalize(cross(vec3(0,1,0),f)),y=cross(f,x);vec3 d=normalize(f*3.15+u.x*x+u.y*y);float t=3.,h=1.;for(int i=0;i<90;i++){h=forma(o+d*t);if(h<.0012||t>7.)break;t+=h*.85;}
if(t>7.){gl_FragColor=vec4(0);return;}vec3 p=o+d*t,n=nor(p);float F=U.x;vec3 q=p;float g=nz(p*6.+U.y)*.6+nz(p*17.)*.4;
float mx=g;if(F>6.5&&F<7.5){vec3 k=p;k.yz*=rot(.12);k.xz*=rot(.3);float r=length(k.xy*vec2(.92,1.08))+.12*nz(vec3(k.xy*2.2,U.y));mx=.5+.5*sin(r*34.+3.*nz(vec3(k.xy*3.,2.)));if(r<.28)mx=1.2*nz(k*22.);}else if(F>2.5&&F<3.5)mx=.5+.5*sin(p.y*9.+p.x*3.+5.*nz(p*1.8+U.y));else if(F>1.5&&F<2.5)mx=smoothstep(.2,.9,g);else mx=clamp(g*.7+.25-p.y*.25,0.,1.);
vec3 c=mix(K2,K1,clamp(mx,0.,1.));if(F<2.5||F>3.5)n=normalize(n+.05*(vec3(nz(p*24.),nz(p*24.+5.),nz(p*24.+9.))-.5));
vec3 L=normalize(vec3(-.55,.85,-.7)),r=reflect(d,n);float nl=max(0.,dot(n,L)),ao=clamp(.45+forma(p+n*.18)/.18*.55,0.,1.),fr=pow(1.+dot(n,d),2.5);float me=U.z,tr=1.-me,liso=step(1.5,F)*step(F,3.5);
c=mix(vec3(dot(c,vec3(.33))),c,1.25);vec3 e=max(c,0.)*(.16+.8*nl)*ao;e+=c*tr*.35*max(0.,dot(n,vec3(.5,-.5,.3))+.35)*ao;float s1=smoothstep(.86,.97,dot(r,L)),s2=smoothstep(.8,.96,dot(r,normalize(vec3(.8,.25,-.3))));e+=mix(vec3(1),c,me*.8)*(s1*mix(.2,.75,liso)+s2*mix(.1,.22,liso))+mix(vec3(.8,.9,1.),c,me)*fr*mix(.22,.35,liso);e+=c*me*(.25+.5*smoothstep(-.2,.8,r.y))*.6;
e=e*(2.51*e+.03)/(e*(2.43*e+.59)+.14);e=pow(e,vec3(.52));gl_FragColor=vec4(e,1.);}`;

  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  let cv, gl, falhou = false; const progs = {};
  function contexto() {
    if (gl || falhou) return gl; cv = document.createElement('canvas'); try { gl = cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: true, premultipliedAlpha: true, depth: false }); } catch (e) { gl = null; }
    if (!gl || !gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision) { gl = null; falhou = true; return null; }
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); for (const k in progs) delete progs[k]; gl = null; });
    return gl;
  }
  function programa(chave) {
    if (progs[chave] !== undefined) return progs[chave]; const src = COMUM + (chave === 'mineral' ? MINERAL : CENAS[chave] + FIM);
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, p = gl.createProgram(), fs = sh(gl.FRAGMENT_SHADER, src); gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, fs); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('cena ' + chave, gl.getShaderInfoLog(fs)); return progs[chave] = null; }
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const u = {}; for (const n of ['R', 'w', 'U', 'K1', 'K2']) u[n] = gl.getUniformLocation(p, n); return progs[chave] = { p, b, u };
  }
  // desenha num canvas comum. Devolve false se o aparelho não tem WebGL
  function pinta(destino, chave, larg, alt, { w = [0, 0, 0, 0, 0], U = [0, 0, 0, 0], K1 = [1, 1, 1], K2 = [1, 1, 1] } = {}) {
    if (!contexto()) return false; const pr = programa(chave); if (!pr) return false; if (cv.width !== larg || cv.height !== alt) { cv.width = larg; cv.height = alt; }
    gl.viewport(0, 0, larg, alt); gl.useProgram(pr.p); gl.bindBuffer(gl.ARRAY_BUFFER, pr.b); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.disable(gl.BLEND); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(pr.u.R, larg, alt); if (pr.u.w) gl.uniform1fv(pr.u.w, w); if (pr.u.U) gl.uniform4fv(pr.u.U, U); if (pr.u.K1) gl.uniform3fv(pr.u.K1, K1); if (pr.u.K2) gl.uniform3fv(pr.u.K2, K2); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (destino.width !== larg || destino.height !== alt) { destino.width = larg; destino.height = alt; } const q = destino.getContext('2d'); q.clearRect(0, 0, larg, alt); q.drawImage(cv, 0, 0); return true;
  }
  const hex = h => [0, 2, 4].map(i => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2));
  const mineral = (c, e, tam) => pinta(c, 'mineral', tam, tam, { U: [e.forma, (e.i * .7) % 6.2, /Pirita|Hematita|Calcopirita|Ouro/.test(e.nome) ? 1 : e.nome === 'Obsidiana' ? .3 : 0, 0], K1: hex(e.c1), K2: hex(e.c2) });
  return { pinta, mineral };
})();
