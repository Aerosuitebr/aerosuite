import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-estoque-deploy-chunks.json'), 'utf8'));
const parts = j.chunks.map((c) => {
  const start = c.indexOf(']=') + 2;
  const end = c.indexOf(';return');
  return JSON.parse(c.slice(start, end));
});
const b64 = parts.join('');
const expr = `(async()=>{
  const b64=${JSON.stringify(b64)};
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const fd=new FormData();
  fd.append('file',new Blob([bytes],{type:'image/webp'}),'estoque-fifo-web.webp');
  fd.append('title','Aero Suite — Estoque FIFO');
  fd.append('alt_text','Itens em estoque com rastreio FIFO');
  const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
  const est=m.source_url;
  const results=[];
  for(const id of [21,20]){
    const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
    let c=page.content.raw||'';
    c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*estoque-(fifo|itens)[^"'\\s]*/gi,est);
    await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
    results.push({id,est});
  }
  return {ok:true,est,results};
})()`;
fs.writeFileSync(path.join(dir, 'expr-deploy-estoque-oneshot.txt'), expr);
console.log('expr len', expr.length);
