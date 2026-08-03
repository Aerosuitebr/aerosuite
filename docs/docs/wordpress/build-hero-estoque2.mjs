import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const CHUNK = 18000;

const files = [
  {
    key: 'hero',
    path: path.join(dir, 'screenshots/web/hero-logo-transparent.png'),
    file: 'hero-logo-transparent.png',
    mime: 'image/png',
    title: 'Aero Suite — logo hero',
  },
  {
    key: 'estoque',
    path: path.join(dir, 'screenshots/web/estoque-fifo-web.webp'),
    file: 'estoque-fifo-web.webp',
    mime: 'image/webp',
    title: 'Aero Suite — Estoque FIFO',
  },
];

const steps = [{ name: 'init', expr: 'window.__b64buf="";window.__urls={};return {ok:true};' }];

for (const item of files) {
  const b64 = fs.readFileSync(item.path).toString('base64');
  for (let i = 0; i < b64.length; i += CHUNK) {
    steps.push({
      name: `${item.key}-chunk-${i}`,
      expr: `window.__b64buf+=${JSON.stringify(b64.slice(i, i + CHUNK))};return window.__b64buf.length;`,
    });
  }
  steps.push({
    name: `${item.key}-upload`,
    await: true,
    expr: `(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:${JSON.stringify(item.mime)}}),${JSON.stringify(item.file)});
      fd.append('title',${JSON.stringify(item.title)});
      fd.append('alt_text',${JSON.stringify(item.title)});
      const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
      window.__urls[${JSON.stringify(item.key)}]=m.source_url;
      return m.source_url;
    })()`,
  });
}

steps.push({
  name: 'apply',
  await: true,
  expr: `(async()=>{
    const hero=window.__urls.hero;
    const est=window.__urls.estoque;
    for(const id of [21,20]){
      let c=(await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'})).content.raw||'';
      c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*(Pictureandletter|aerosuite-logo-light)[^"'\\s]*/gi,hero);
      c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*estoque-(fifo|itens)[^"'\\s]*/gi,est);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
    }
    return {hero,est,ok:true};
  })()`,
});

const outDir = path.join(dir, 'steps-hero-estoque2');
fs.mkdirSync(outDir, { recursive: true });
steps.forEach((s) => fs.writeFileSync(path.join(outDir, s.name + '.js'), s.expr));
fs.writeFileSync(path.join(outDir, 'order.json'), JSON.stringify(steps.map((s) => s.name)));
console.log('steps', steps.length);
