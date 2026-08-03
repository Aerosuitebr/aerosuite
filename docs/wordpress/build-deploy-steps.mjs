import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const home = buildHomeContent();
const chunkSize = 3500;
const chunks = [];
for (let i = 0; i < home.length; i += chunkSize) {
  chunks.push(home.slice(i, i + chunkSize));
}

const steps = chunks.map(
  (c, i) =>
    `(async()=>{window.__homebuf=(window.__homebuf||'')+${JSON.stringify(c)};return{chunk:${i},len:window.__homebuf.length};})()`
);
steps.push(
  `(async()=>{const seo=${JSON.stringify(SEO)};await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:window.__homebuf,title:seo.title,excerpt:seo.excerpt,status:'publish'}});return{ok:true,len:window.__homebuf.length,title:seo.title};})()`
);

fs.writeFileSync(path.join(dir, 'deploy-steps.json'), JSON.stringify({ steps }));
steps.forEach((s, i) => fs.writeFileSync(path.join(dir, `deploy-step-${i}.js`), s));
console.log('chunks', chunks.length, 'sizes', steps.map((s) => s.length));
