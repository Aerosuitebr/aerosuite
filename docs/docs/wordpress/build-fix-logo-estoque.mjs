import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(dir, '../../frontend/src/assets/LOGO_LETRA_LIGHT.png');
const estoquePath = path.join(dir, 'screenshots/web/estoque-fifo-web.png');
const CHUNK = 18000;

function buildUploadSteps(name, filePath, mime, filename, title) {
  const b64 = fs.readFileSync(filePath).toString('base64');
  const steps = [{ name: `${name}-init`, expr: 'window.__b64buf="";return {ok:true};' }];
  for (let i = 0; i < b64.length; i += CHUNK) {
    steps.push({
      name: `${name}-chunk-${i}`,
      expr: `window.__b64buf+=${JSON.stringify(b64.slice(i, i + CHUNK))};return window.__b64buf.length;`,
    });
  }
  steps.push({
    name: `${name}-upload`,
    expr: `(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:${JSON.stringify(mime)}}),${JSON.stringify(filename)});
      fd.append('title',${JSON.stringify(title)});
      fd.append('alt_text',${JSON.stringify(title)});
      return await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    })()`,
    await: true,
  });
  return steps;
}

const steps = [
  ...buildUploadSteps('logo', logoPath, 'image/png', 'aerosuite-logo-light.png', 'Aero Suite — logotipo claro'),
  ...buildUploadSteps('estoque', estoquePath, 'image/png', 'estoque-fifo-web.png', 'Aero Suite — Estoque FIFO'),
  {
    name: 'apply-pages-footer',
    await: true,
    expr: `(async()=>{
      const logo=(window.__lastLogo||{}).source_url;
      const est=(window.__lastEstoque||{}).source_url;
      if(!logo||!est) return {err:'missing uploads',logo:!!logo,est:!!est};
      for(const id of [21,20]){
        const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
        let c=page.content.raw||'';
        c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*Pictureandletter[^"'\\s]*/gi,logo);
        c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*estoque-itens[^"'\\s]*/gi,est);
        c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*estoque-fifo[^"'\\s]*/gi,est);
        if(!c.includes('as-hero-cover')) c=c.replace('wp-block-cover alignfull','wp-block-cover alignfull as-hero-cover');
        await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
      }
      return {logo,est,ok:true};
    })()`,
  },
];

// patch upload steps to store results
steps.forEach((s) => {
  if (s.name === 'logo-upload') {
    s.expr = s.expr.replace(
      'return await wp.apiFetch',
      'window.__lastLogo=await wp.apiFetch'
    ) + ';return window.__lastLogo;';
  }
  if (s.name === 'estoque-upload') {
    s.expr = s.expr.replace(
      'return await wp.apiFetch',
      'window.__lastEstoque=await wp.apiFetch'
    ) + ';return window.__lastEstoque;';
  }
});

const outDir = path.join(dir, 'steps-fix');
fs.mkdirSync(outDir, { recursive: true });
steps.forEach((s) => fs.writeFileSync(path.join(outDir, s.name + '.js'), s.expr));
fs.writeFileSync(path.join(outDir, 'order.json'), JSON.stringify(steps.map((s) => s.name)));
console.log('steps', steps.length, 'logo b64', fs.readFileSync(logoPath).length, 'estoque', fs.readFileSync(estoquePath).length);
