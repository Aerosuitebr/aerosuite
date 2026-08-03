import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const CHUNK = 18000;

const files = [
  { file: 'os-list-web.webp', key: 'URL_OS', title: 'Aero Suite — Ordens de serviço' },
  { file: 'estoque-itens-web.webp', key: 'URL_ESTOQUE', title: 'Aero Suite — Estoque' },
  { file: 'propostas-comerciais-web.webp', key: 'URL_COMERCIAL', title: 'Aero Suite — Propostas comerciais' },
  { file: 'dashboard-web.webp', key: 'URL_DASHBOARD', title: 'Aero Suite — Painel operacional' },
];

const steps = [];
steps.push({ name: 'init', expr: 'window.__asUrls={};window.__b64buf="";return {ok:true};' });

for (const item of files) {
  const b64 = fs.readFileSync(path.join(dir, 'screenshots', 'web', item.file)).toString('base64');
  for (let i = 0; i < b64.length; i += CHUNK) {
    const part = b64.slice(i, i + CHUNK);
    steps.push({
      name: `chunk-${item.key}-${i}`,
      expr: `window.__b64buf+=${JSON.stringify(part)};return window.__b64buf.length;`,
    });
  }
  steps.push({
    name: `upload-${item.key}`,
    expr: `(async()=>{
      const b64=window.__b64buf;window.__b64buf='';
      const bin=atob(b64);const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const fd=new FormData();
      fd.append('file',new Blob([arr],{type:'image/webp'}),${JSON.stringify(item.file)});
      fd.append('title',${JSON.stringify(item.title)});
      fd.append('alt_text',${JSON.stringify(item.title)});
      const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
      window.__asUrls[${JSON.stringify(item.key)}]=m.source_url;
      return {key:${JSON.stringify(item.key)},url:m.source_url};
    })()`,
    await: true,
  });
}

const showcaseTpl = fs.readFileSync(
  path.join(dir, 'snippets', 'showcase-modules-screenshots.html'),
  'utf8'
);
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');

steps.push({
  name: 'finalize',
  expr: `(async()=>{
    const showcaseTpl=${JSON.stringify(showcaseTpl)};
    const css=${JSON.stringify(css)};
    const js=${JSON.stringify(js)};
    const u=window.__asUrls;
    let showcase=showcaseTpl.replace('{{URL_OS}}',u.URL_OS).replace('{{URL_ESTOQUE}}',u.URL_ESTOQUE).replace('{{URL_COMERCIAL}}',u.URL_COMERCIAL).replace('{{URL_DASHBOARD}}',u.URL_DASHBOARD);
    const pageResults=[];
    for(const id of [21,20]){
      const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
      let content=page.content.raw||'';
      if(!content.includes('as-showcase')){pageResults.push({id,skip:true});continue;}
      content=content.replace(/<section class="as-showcase"[\\s\\S]*?<\\/section>/,showcase);
      await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content}});
      pageResults.push({id,ok:true});
    }
    let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    footer=footer.replace(/<link[^>]*aerosuite-premium[^>]*>\\s*/gi,'');
    footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g,'');
    const block='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<script id="aerosuite-phone-mask-js">'+js+'</script>\\n<!-- /wp:html -->\\n';
    footer=block+footer;
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    const media=await wp.apiFetch({path:'/wp/v2/media?search=aerosuite-premium&per_page=50'});
    const deleted=[];
    for(const m of media){
      if(/\\.txt$/i.test(m.source_url||'')||m.mime_type==='text/plain'){
        await wp.apiFetch({path:'/wp/v2/media/'+m.id+'?force=true',method:'DELETE'});
        deleted.push({id:m.id,url:m.source_url});
      }
    }
    return {urls:u,pageResults,deleted};
  })()`,
  await: true,
});

fs.writeFileSync(path.join(dir, 'deploy-steps.json'), JSON.stringify(steps));
console.log('steps', steps.length, 'max expr', Math.max(...steps.map((s) => s.expr.length)));
