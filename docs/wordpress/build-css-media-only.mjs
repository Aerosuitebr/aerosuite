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
  window.__asCssUrl = m.source_url;
  return { css: m.source_url };
})()`;

fs.writeFileSync(path.join(dir, 'expr-css-media.txt'), ex);
console.log('size', ex.length);
