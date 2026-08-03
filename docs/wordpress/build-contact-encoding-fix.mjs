/**
 * Gera deploy UTF-8 da página Contato (ID 18) + chunks CDP.
 * Uso: node build-contact-encoding-fix.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildContactContent, CONTACT_SEO } from './aerosuite-contact-page.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const contatoContent = buildContactContent();

const deployScript = `(async()=>{
  const contatoContent=${JSON.stringify(contatoContent)};
  const r=await wp.apiFetch({path:'/wp/v2/pages/18',method:'POST',data:{content:contatoContent,title:${JSON.stringify(CONTACT_SEO.title)},excerpt:${JSON.stringify(CONTACT_SEO.excerpt)},status:'publish'}});
  return{ok:true,id:r.id,sample:contatoContent.includes('demonstração'),title:r.title?.rendered||r.title};
})()`;

fs.writeFileSync(path.join(dir, '.deploy-contact-utf8-once.js'), deployScript);

const b64 = Buffer.from(deployScript, 'utf8').toString('base64');
const cs = 2000;
const chunks = [];
for (let i = 0; i < b64.length; i += cs) chunks.push(b64.slice(i, i + cs));

const out = {
  init: '(async()=>{window.__encB64=[];return{ok:1}})()',
  chunks: chunks.map(
    (x, i) =>
      `(async()=>{window.__encB64=window.__encB64||[];window.__encB64[${i}]=${JSON.stringify(x)};return{i:${i},n:${chunks.length}}})()`
  ),
  run: `(async()=>{
  const bin=atob((window.__encB64||[]).join(''));
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const src=new TextDecoder('utf-8').decode(bytes);
  window.__encB64=null;
  return await eval(src);
})()`,
};
fs.writeFileSync(path.join(dir, '.cdp-contact-utf8-chunks.json'), JSON.stringify(out));

chunks.forEach((_, i) => {
  const expr = out.chunks[i];
  fs.writeFileSync(path.join(dir, `expr-contact-utf8-${i}.txt`), expr);
});
fs.writeFileSync(path.join(dir, 'expr-contact-utf8-run.txt'), out.run);

console.log('deploy bytes', deployScript.length, 'chunks', chunks.length);
console.log('sample ok', contatoContent.includes('demonstração'));
