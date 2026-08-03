import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const js = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .trim();

const ex = `(async () => {
  const js = ${JSON.stringify(js)};
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-phone-mask[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block = '<!-- wp:html -->\\n<script id="aerosuite-phone-mask-js">' + js + '</script>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('aerosuite-phone-mask-js')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, jsLen: js.length };
})()`;

fs.writeFileSync(path.join(dir, 'expr-phone-footer.txt'), ex);
console.log('size', ex.length);
