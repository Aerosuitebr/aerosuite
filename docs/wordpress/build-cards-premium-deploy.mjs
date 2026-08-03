/**
 * Deploy CSS premium dos cards + conteúdo da home.
 * Uso: node build-cards-premium-deploy.mjs && node run-cards-premium-deploy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';
import { WP_PAGE_IDS } from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const homeContent = buildHomeContent();

const deployScript = `(async()=>{
  const css=${JSON.stringify(css)};
  const homeContent=${JSON.stringify(homeContent)};

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  const cssRe=/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if(!cssRe.test(footer)) throw new Error('aerosuite-premium-css missing in footer');
  footer=footer.replace(cssRe,'<style id="aerosuite-premium-css">'+css+'</style>');
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});

  const home=await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.home}',method:'POST',data:{
    content:homeContent,
    title:${JSON.stringify(SEO.title)},
    excerpt:${JSON.stringify(SEO.excerpt)},
    status:'publish'
  }});

  return{
    ok:true,
    cssLen:css.length,
    homeId:home.id,
    hasPremiumCards:homeContent.includes('as-premium-card'),
    hasPremiumCss:css.includes('.as-premium-card')
  };
})()`;

fs.writeFileSync(path.join(dir, '.deploy-cards-premium-once.js'), deployScript);
console.log('deploy script', deployScript.length, 'bytes');
console.log('home content', homeContent.length, 'bytes');
