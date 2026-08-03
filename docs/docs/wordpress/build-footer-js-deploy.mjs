/**
 * Deploy footer: todos os JS Aero Suite (evita && que o WordPress codifica).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GA4_MEASUREMENT_ID,
  CALENDLY_EMBED_URL,
  WHATSAPP_PHONE,
  WHATSAPP_MESSAGE,
  isGa4Configured,
  isCalendlyConfigured,
} from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const jsFiles = [
  'aerosuite-hero.js',
  'aerosuite-showcase-zoom.js',
  'aerosuite-phone-mask.js',
  'aerosuite-analytics.js',
];

const jsParts = jsFiles.map((f) => ({
  id: f.replace('.js', '').replace(/\./g, '-'),
  body: fs.readFileSync(path.join(dir, f), 'utf8'),
}));

for (const part of jsParts) {
  if (part.body.includes('&&')) {
    console.warn('WARN: && found in', part.id, '— WordPress pode quebrar o script');
  }
}

const siteConfigSnippet = `window.AEROSUITE_SITE=${JSON.stringify({
  ga4: isGa4Configured() ? GA4_MEASUREMENT_ID : '',
  calendly: isCalendlyConfigured() ? CALENDLY_EMBED_URL : '',
  whatsappPhone: WHATSAPP_PHONE,
  whatsappText: WHATSAPP_MESSAGE,
})};`;

const deployScript = `(async()=>{
  const siteCfg=${JSON.stringify(siteConfigSnippet)};
  const jsParts=${JSON.stringify(jsParts)};

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

  return{ok:true,scripts:jsParts.map(j=>j.id),noAmpAmp:!footer.includes('&#038;&#038;')};
})()`;

fs.writeFileSync(path.join(dir, '.deploy-footer-js-once.js'), deployScript);
console.log('footer js deploy', deployScript.length, 'bytes');
