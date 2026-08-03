import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = fs.readFileSync(path.join(dir, 'screenshots', 'web', 'estoque-itens-web.png')).toString('base64');
const CHUNK = 18000;

const steps = [{ name: 'init', expr: 'window.__b64buf="";return {ok:true};' }];
for (let i = 0; i < b64.length; i += CHUNK) {
  const part = b64.slice(i, i + CHUNK);
  steps.push({
    name: `chunk-${i}`,
    expr: `window.__b64buf+=${JSON.stringify(part)};return window.__b64buf.length;`,
  });
}
steps.push({
  name: 'upload-replace',
  expr: `(async()=>{
    const b64=window.__b64buf;window.__b64buf='';
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const fd=new FormData();
    fd.append('file',new Blob([arr],{type:'image/png'}),'estoque-itens-web.png');
    fd.append('title','Aero Suite — Estoque FIFO');
    fd.append('alt_text','Módulo de estoque com rastreio FIFO');
    const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    const url=m.source_url;
    const results=[];
    for(const id of [21,20]){
      const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
      let c=page.content.raw||'';
      c=c.replace(/estoque-itens-web\\.webp/g,url.split('/').pop());
      c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"']*estoque-itens[^"']*/g,url);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
      results.push({id,url});
    }
    return {url,results};
  })()`,
  await: true,
});

fs.writeFileSync(path.join(dir, 'replace-estoque-steps.json'), JSON.stringify(steps));
console.log('steps', steps.length, 'png b64', b64.length);
