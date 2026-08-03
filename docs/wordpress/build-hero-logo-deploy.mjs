import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const b64 = Buffer.from(css).toString('base64');
const ex = `(async()=>{
  const css = atob(${JSON.stringify(b64)});
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  const re = /<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if (!re.test(footer)) throw new Error('style block missing');
  footer = footer.replace(re, '<style id="aerosuite-premium-css">' + css + '</style>');
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, len: footer.length };
})()`;

fs.writeFileSync(path.join(dir, 'deploy-hero-logo-eval.js'), ex);
console.log('len', ex.length);
