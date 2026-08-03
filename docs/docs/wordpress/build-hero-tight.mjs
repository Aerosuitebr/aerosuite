import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = fs.readFileSync(path.join(dir, '../../frontend/src/assets/Aero_Colorido.png')).toString('base64');
const CHUNK = 18000;
const steps = [{ name: 'init', expr: 'window.__b64buf="";return {ok:true};' }];
for (let i = 0; i < b64.length; i += CHUNK) {
  steps.push({
    name: `chunk-${i}`,
    expr: `window.__b64buf+=${JSON.stringify(b64.slice(i, i + CHUNK))};return window.__b64buf.length;`,
  });
}
steps.push({
  name: 'upload-apply',
  await: true,
  expr: `(async()=>{
    const b64=window.__b64buf;window.__b64buf='';
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const fd=new FormData();
    fd.append('file',new Blob([arr],{type:'image/png'}),'hero-logo-transparent-v2.png');
    fd.append('title','Aero Suite — logo hero');
    fd.append('alt_text','Aero Suite');
    const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    const hero=m.source_url;
    for(const id of [21,20,16]){
      let c=(await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'})).content.raw||'';
      c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*(hero-logo-transparent|Pictureandletter|aerosuite-logo-light)[^"'\\s]*/gi,hero);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
    }
    return {hero,ok:true};
  })()`,
});
const out = path.join(dir, 'steps-hero-tight');
fs.mkdirSync(out, { recursive: true });
steps.forEach((s) => fs.writeFileSync(path.join(out, s.name + '.js'), s.expr));
fs.writeFileSync(path.join(out, 'order.json'), JSON.stringify(steps.map((s) => s.name)));
console.log('steps', steps.length, 'b64', b64.length);
