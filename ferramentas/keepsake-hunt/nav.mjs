import { spawn } from 'node:child_process'; import { createServer } from 'node:http'; import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'; import { tmpdir } from 'node:os'; import path from 'node:path';
const RAIZ='C:/Users/Minhoca/Projetos/JogosOffline', T={'.html':'text/html',".css":"text/css",".webp":"image/webp",'.js':'text/javascript'};
export const dorme=ms=>new Promise(r=>setTimeout(r,ms));
export async function abrir({w=1280,h=760,movel=false,url='/jogos/keepsake-hunt/index.html',dpr=1,semNet=false}={}){
 const srv=createServer((q,r)=>{if(q.url.split('?')[0]==='/')q.url='/index.html';const f=path.join(RAIZ,decodeURIComponent(q.url.split('?')[0]));try{const d=readFileSync(f);r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});r.end(d);}catch{r.writeHead(404);r.end();}});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const perfil=mkdtempSync(path.join(tmpdir(),'keeps-')),porta=9300+Math.floor(Math.random()*400);
 const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--remote-debugging-port=${porta}`,`--user-data-dir=${perfil}`,'--no-first-run','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio',...(semNet?['--host-resolver-rules=MAP cdn.jsdelivr.net 0.0.0.0:1']:[]),'about:blank'],{stdio:'ignore'});
 let a; for(let i=0;i<60&&!a;i++){await dorme(250);try{a=(await(await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t=>t.type==='page');}catch{}}
 const ws=new WebSocket(a.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let n=0;const esp={},erros=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id)esp[m.id]?.(m.result||m);else if(m.method==='Runtime.exceptionThrown')erros.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&/error|warn/.test(m.params.type))erros.push(m.params.type+' '+m.params.args.map(a=>a.value??a.description).join(' ').slice(0,1800));};
 const cmd=(method,params={})=>new Promise(r=>{const id=++n;esp[id]=r;ws.send(JSON.stringify({id,method,params}));});
 const av=async x=>{const r=await cmd('Runtime.evaluate',{expression:x,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 const vp=(w,h,movel=false,dpr=1)=>cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:dpr,mobile:movel});
 await cmd('Runtime.enable');await cmd('Page.enable');await vp(w,h,movel,dpr);if(movel)await cmd('Emulation.setTouchEmulationEnabled',{enabled:true});
 await cmd('Page.navigate',{url:`http://127.0.0.1:${srv.address().port}${url}`});
 for(let i=0;i<(url.includes("manifest")?1:60);i++){if(await av('!!window.__keepsake').catch(()=>0))break;await dorme(250);}
 if(!url.includes("manifest")&&!(await av("!!window.__keepsake").catch(()=>0)))console.log("NAO ABRIU",erros.slice(0,3).join(String.fromCharCode(10)));
 const foto=async f=>{const r=await cmd('Page.captureScreenshot',{format:'png'});writeFileSync(f,Buffer.from(r.data,'base64'));};
 const clique=async(x,y,b='left')=>{await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});for(const t of['mousePressed','mouseReleased'])await cmd('Input.dispatchMouseEvent',{type:t,x,y,button:b,clickCount:1});};
 const toque=async(x,y)=>{await cmd('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await dorme(40);await cmd('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 return{base:`http://127.0.0.1:${srv.address().port}`,cmd,av,vp,foto,clique,toque,erros,recarregar:()=>cmd('Page.reload'),fim:()=>{ws.close();ch.kill();srv.close();setTimeout(()=>{try{rmSync(perfil,{recursive:true,force:true})}catch{};process.exit(0)},600);}};
}
