/**
 * Deploy focado: analytics (form + Calendly) + páginas Soluções/Sobre + footer JS.
 * Uso: node build-conversion-deploy.mjs && node run-conversion-deploy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSolucoesContent, SOLUCOES_SEO } from './aerosuite-solucoes-page.mjs';
import { buildSobreContent, SOBRE_SEO } from './aerosuite-sobre-page.mjs';
import { WP_PAGE_IDS } from './aerosuite-site-config.mjs';
import { buildSiteConfigSnippet, loadFooterJsParts } from './aerosuite-footer-bundle.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

const jsParts = loadFooterJsParts();
const siteConfigSnippet = buildSiteConfigSnippet();

const solucoesContent = buildSolucoesContent();
const sobreContent = buildSobreContent();

const deployScript = `(async()=>{
  const siteCfg=${JSON.stringify(siteConfigSnippet)};
  const jsParts=${JSON.stringify(jsParts)};
  const solucoesContent=${JSON.stringify(solucoesContent)};
  const sobreContent=${JSON.stringify(sobreContent)};

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>[\\s\\S]*?<!-- \\/wp:html -->/g,'');
  const cfgBlock='<!-- wp:html -->\\n<script id="aerosuite-site-config">'+siteCfg+'</script>\\n<!-- /wp:html -->\\n';
  footer=cfgBlock+footer;

  for(const j of jsParts){
    const tag='<script id="'+j.id+'">';
    const full=tag+j.body+'</script>';
    const re=new RegExp('<script id="'+j.id+'">[\\\\s\\\\S]*?<\\\\/script>\\\\n?');
    if(re.test(footer)) footer=footer.replace(re,full+'\\n');
    else footer=footer.replace(/(<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>)/, '$1\\n'+full);
  }

  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});

  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.solucoes}',method:'POST',data:{content:solucoesContent,title:${JSON.stringify(SOLUCOES_SEO.title)},excerpt:${JSON.stringify(SOLUCOES_SEO.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.sobre}',method:'POST',data:{content:sobreContent,title:${JSON.stringify(SOBRE_SEO.title)},excerpt:${JSON.stringify(SOBRE_SEO.excerpt)},status:'publish'}});

  return{
    ok:true,
    solucoesLen:solucoesContent.length,
    sobreLen:sobreContent.length,
    hasFormTracking:footer.includes('form_submit'),
    hasCalendlyScheduled:footer.includes('calendly.event_scheduled'),
    scripts:jsParts.map(j=>j.id),
    noAmpAmp:!footer.includes('&#038;&#038;')
  };
})()`;

fs.writeFileSync(path.join(dir, '.deploy-conversion-once.js'), deployScript);
console.log('conversion deploy', deployScript.length, 'bytes');
