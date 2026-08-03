/**
 * Deploy mínimo: só footer (analytics.js com fix Calendly popup).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GA4_MEASUREMENT_ID,
  CALENDLY_EMBED_URL,
  isGa4Configured,
  isCalendlyConfigured,
} from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const analyticsJs = fs.readFileSync(path.join(dir, 'aerosuite-analytics.js'), 'utf8');
const siteConfigSnippet = `window.AEROSUITE_SITE=${JSON.stringify({
  ga4: isGa4Configured() ? GA4_MEASUREMENT_ID : '',
  calendly: isCalendlyConfigured() ? CALENDLY_EMBED_URL : '',
})};`;

const deployScript = `(async()=>{
  const siteCfg=${JSON.stringify(siteConfigSnippet)};
  const analyticsJs=${JSON.stringify(analyticsJs)};

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>[\\s\\S]*?<!-- \\/wp:html -->/g,'');
  const cfgBlock='<!-- wp:html -->\\n<script id="aerosuite-site-config">'+siteCfg+'</script>\\n<!-- /wp:html -->\\n';
  footer=cfgBlock+footer;

  const tag='<script id="aerosuite-analytics">';
  const full=tag+analyticsJs+'</script>';
  const re=/<script id="aerosuite-analytics">[\\s\\S]*?<\\/script>\\n?/;
  if(re.test(footer)) footer=footer.replace(re,full+'\\n');
  else footer=footer.replace(/(<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>)/, '$1\\n'+full);

  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});

  return{ok:true,hasPopupFix:analyticsJs.includes('fallbackTimer'),calendly:${JSON.stringify(CALENDLY_EMBED_URL)}};
})()`;

fs.writeFileSync(path.join(dir, '.deploy-analytics-fix-once.js'), deployScript);
console.log('analytics fix deploy', deployScript.length, 'bytes');
