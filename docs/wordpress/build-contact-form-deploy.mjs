/**
 * Gera script de deploy só da página Contato (fix WPForms).
 * Uso: node build-contact-form-deploy.mjs && node run-contact-form-deploy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildContactContent, CONTACT_SEO } from './aerosuite-contact-page.mjs';
import { WP_PAGE_IDS } from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const contatoContent = buildContactContent();

const deployScript = `(async()=>{
  const contatoContent=${JSON.stringify(contatoContent)};
  const r=await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.contato}',method:'POST',data:{
    content:contatoContent,
    title:${JSON.stringify(CONTACT_SEO.title)},
    excerpt:${JSON.stringify(CONTACT_SEO.excerpt)},
    status:'publish'
  }});
  return{
    ok:true,
    id:r.id,
    hasWpformsBlock:contatoContent.includes('[wpforms id="12"]'),
  };
})()`;

fs.writeFileSync(path.join(dir, '.deploy-contact-form-once.js'), deployScript);
console.log('contact deploy script', deployScript.length, 'bytes');
console.log('has wpforms shortcode:', contatoContent.includes('[wpforms id="12"]'));
