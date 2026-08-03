/**
 * Deploy mínimo: página contato + footer (config Calendly + analytics.js).
 * Cabe no CDP sem fetch localhost (mixed content em wp-admin HTTPS).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildContactContent, CONTACT_SEO } from './aerosuite-contact-page.mjs';
import {
  GA4_MEASUREMENT_ID,
  CALENDLY_EMBED_URL,
  WP_PAGE_IDS,
  isGa4Configured,
  isCalendlyConfigured,
} from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const analyticsJs = fs.readFileSync(path.join(dir, 'aerosuite-analytics.js'), 'utf8');

const siteConfigSnippet = `window.AEROSUITE_SITE=${JSON.stringify({
  ga4: isGa4Configured() ? GA4_MEASUREMENT_ID : '',
  calendly: isCalendlyConfigured() ? CALENDLY_EMBED_URL : '',
})};`;

const contatoContent = buildContactContent();

const deployScript = `(async()=>{
  const contatoContent=${JSON.stringify(contatoContent)};
  const siteCfg=${JSON.stringify(siteConfigSnippet)};
  const analyticsJs=${JSON.stringify(analyticsJs)};

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>[\\s\\S]*?<!-- \\/wp:html -->/g,'');
  const cfgBlock='<!-- wp:html -->\\n<script id="aerosuite-site-config">'+siteCfg+'</script>\\n<!-- /wp:html -->\\n';
  if(!footer.includes('aerosuite-site-config')) footer=cfgBlock+footer;
  else footer=cfgBlock+footer;

  const tag='<script id="aerosuite-analytics">';
  const full=tag+analyticsJs+'</script>';
  const re=/<script id="aerosuite-analytics">[\\s\\S]*?<\\/script>\\n?/;
  if(re.test(footer)) footer=footer.replace(re,full+'\\n');
  else footer=footer.replace(/(<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>)/, '$1\\n'+full);

  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.contato}',method:'POST',data:{content:contatoContent,title:${JSON.stringify(CONTACT_SEO.title)},excerpt:${JSON.stringify(CONTACT_SEO.excerpt)},status:'publish'}});

  return{ok:true,calendly:${JSON.stringify(CALENDLY_EMBED_URL)},hasWidget:contatoContent.includes('calendly-inline-widget'),footerHasCfg:footer.includes('comercial-aerosuite')};
})()`;

fs.writeFileSync(path.join(dir, '.deploy-calendly-once.js'), deployScript);
console.log('calendly deploy', deployScript.length, 'bytes');
