import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .trim();

const ex = `(async () => {
  const cssText = ${JSON.stringify(css)};
  const fd = new FormData();
  fd.append('file', new Blob([cssText], { type: 'text/css' }), 'aerosuite-premium.css');
  const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  if (!footer.includes('aerosuite-premium-css')) {
    const link = '<!-- wp:html -->\\n<link rel="stylesheet" href="' + m.source_url + '" id="aerosuite-premium-css" />\\n<!-- /wp:html -->\\n';
    footer = link + footer;
    await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  }
  return { css: m.source_url };
})()`;

fs.writeFileSync(path.join(dir, 'expr-css-upload.txt'), ex);
console.log('size', ex.length);
