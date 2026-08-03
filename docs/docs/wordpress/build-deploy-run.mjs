import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const home = buildHomeContent();
const js = {
  hero: fs.readFileSync(path.join(dir, 'aerosuite-hero.js'), 'utf8'),
  phone: fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8'),
  zoom: fs.readFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), 'utf8'),
};

const b64 = Buffer.from(css).toString('base64');
const chunkSize = 7000;
const cssChunks = [];
for (let i = 0; i < b64.length; i += chunkSize) cssChunks.push(b64.slice(i, i + chunkSize));

// Home via base64 (UTF-8 bytes) — evita mojibake ao concatenar chunks no browser
const homeB64 = Buffer.from(home, 'utf8').toString('base64');
const homeChunkSize = 6000;
const homeB64Chunks = [];
for (let i = 0; i < homeB64.length; i += homeChunkSize) homeB64Chunks.push(homeB64.slice(i, i + homeChunkSize));

const steps = [
  `(async()=>{window.__cssb64='';window.__homeb64='';return{ok:true};})()`,
  ...cssChunks.map(
    (c, i) =>
      `(async()=>{window.__cssb64=(window.__cssb64||'')+${JSON.stringify(c)};return{cssChunk:${i},len:window.__cssb64.length};})()`
  ),
  `(async()=>{window.__homeb64='';return{ok:true};})()`,
  ...homeB64Chunks.map(
    (c, i) =>
      `(async()=>{window.__homeb64=(window.__homeb64||'')+${JSON.stringify(c)};return{homeChunk:${i},len:window.__homeb64.length};})()`
  ),
  `(async()=>{window.__jsBundle=${JSON.stringify(js)};return{ok:true,keys:Object.keys(window.__jsBundle)};})()`,
  `(async()=>{
    const seo=${JSON.stringify(SEO)};
    const css=atob(window.__cssb64||'');
    const bin=atob(window.__homeb64||'');
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    const homeContent=new TextDecoder('utf-8').decode(bytes);
    const j=window.__jsBundle||{};
    if(!css||!homeContent||!j.hero) throw new Error('missing buffers');
    let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g,'');
    const block='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<script id="aerosuite-phone-mask-js">'+j.phone+'</script>\\n<script id="aerosuite-showcase-zoom-js">'+j.zoom+'</script>\\n<script id="aerosuite-hero-js">'+j.hero+'</script>\\n<!-- /wp:html -->\\n';
    if(footer.includes('aerosuite-premium-css')){
      footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium-css[\\s\\S]*?<!-- \\/wp:html -->/,block.trim());
    } else { footer=block+footer; }
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
    return {ok:true,homeLen:homeContent.length,footerLen:footer.length,title:seo.title,hasHeroV2:homeContent.includes('as-hero-v2')};
  })()`,
];

steps.forEach((s, i) => fs.writeFileSync(path.join(dir, `deploy-run-${i}.js`), s));
fs.writeFileSync(path.join(dir, 'deploy-run-manifest.json'), JSON.stringify({ count: steps.length, sizes: steps.map((s) => s.length) }));
console.log('steps', steps.length, 'sizes', steps.map((s) => s.length));
