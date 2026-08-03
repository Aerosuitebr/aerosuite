import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
let js = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');
css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
js = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();

const ex = `(async () => {
  const cssText = ${JSON.stringify(css)};
  const jsText = ${JSON.stringify(js)};
  const fd1 = new FormData();
  fd1.append('file', new Blob([cssText], { type: 'text/css' }), 'aerosuite-premium.css');
  const m1 = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd1 });
  const fd2 = new FormData();
  fd2.append('file', new Blob([jsText], { type: 'application/javascript' }), 'aerosuite-phone-mask.js');
  const m2 = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd2 });
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block = '<!-- wp:html -->\\n<link rel="stylesheet" href="' + m1.source_url + '" id="aerosuite-premium-css" />\\n<script src="' + m2.source_url + '" id="aerosuite-phone-mask-js" defer></script>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('aerosuite-premium-css')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { css: m1.source_url, js: m2.source_url, footerLen: footer.length };
})()`;

fs.writeFileSync(path.join(dir, 'expr-upload-assets.txt'), ex);
console.log('css', css.length, 'js', js.length, 'expr', ex.length);
