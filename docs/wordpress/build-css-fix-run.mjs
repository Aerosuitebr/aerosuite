import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = {
  hero: fs.readFileSync(path.join(dir, 'aerosuite-hero.js'), 'utf8'),
  phone: fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8'),
  zoom: fs.readFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), 'utf8'),
};

const script = `(async()=>{
  const css=atob(window.__cssb64||window.__cssfixb64||'');
  if(!css) throw new Error('css buffer missing');
  const j=${JSON.stringify(j)};
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g,'');
  const block='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<script id="aerosuite-phone-mask-js">'+j.phone+'</script>\\n<script id="aerosuite-showcase-zoom-js">'+j.zoom+'</script>\\n<script id="aerosuite-hero-js">'+j.hero+'</script>\\n<!-- /wp:html -->\\n';
  if(footer.includes('aerosuite-premium-css')){
    footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium-css[\\s\\S]*?<!-- \\/wp:html -->/,block.trim());
  } else { footer=block+footer; }
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  return{ok:true,cssLen:css.length,hasHeroV2:css.includes('as-hero-v2__grid'),footerLen:footer.length};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-css-fix-run.js'), script);
console.log('deploy-css-fix-run.js', script.length);
