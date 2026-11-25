import {writeFileSync,readFileSync} from 'fs'; import {abrir,dorme} from './nav.mjs';
const [saida,cols,...fs]=process.argv.slice(2); const p=await abrir({w:+cols*760,h:Math.ceil(fs.length/cols)*517,url:'/manifest.webmanifest'}).catch(e=>{throw e});
const h=fs.map(f=>`<img style="width:760px;display:block" src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('');
await p.av(`document.documentElement.innerHTML='<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},760px)"></body>'`);
for(const f of fs) await p.av(`(()=>{const i=new Image();i.style='width:760px;display:block';i.src='data:image/png;base64,${readFileSync(f).toString('base64')}';document.body.append(i);return i.decode()})()`);
await p.foto(saida); p.fim();
