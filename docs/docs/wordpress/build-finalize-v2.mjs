import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

const finalize = `(async()=>{
  const seo=${JSON.stringify(SEO)};
  const homeContent=window.__homebuf;
  const css=atob(window.__cssb64||'');
  if(!homeContent||!css) throw new Error('buffers missing home='+!!homeContent+' css='+!!css);
  const u=window.__asDeploy||{};
  const fetchJs=async(k,fallback)=>{if(u[k])return fetch(u[k]).then(r=>r.text());return fallback;};
  const heroJs=await fetchJs('hero','');
  const phoneJs=await fetchJs('phone','');
  const zoomJs=await fetchJs('zoom','');
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g,'');
  const block='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<script id="aerosuite-phone-mask-js">'+phoneJs+'</script>\\n<script id="aerosuite-showcase-zoom-js">'+zoomJs+'</script>\\n<script id="aerosuite-hero-js">'+heroJs+'</script>\\n<!-- /wp:html -->\\n';
  if(footer.includes('aerosuite-premium-css')){
    footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium-css[\\s\\S]*?<!-- \\/wp:html -->/,block.trim());
  } else { footer=block+footer; }
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return {ok:true,homeLen:homeContent.length,footerLen:footer.length,title:seo.title};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-finalize-v2.js'), finalize);
console.log('finalize v2', finalize.length);
