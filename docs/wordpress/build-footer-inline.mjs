import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const phoneJs = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');
const zoomJs = fs.readFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), 'utf8');

const ex = `(async () => {
  const css = ${JSON.stringify(css)};
  const phoneJs = ${JSON.stringify(phoneJs)};
  const zoomJs = ${JSON.stringify(zoomJs)};
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block =
    '<!-- wp:html -->\\n<style id="aerosuite-premium-css">' +
    css +
    '</style>\\n<script id="aerosuite-phone-mask-js">' +
    phoneJs +
    '</script>\\n<script id="aerosuite-showcase-zoom-js">' +
    zoomJs +
    '</script>\\n<!-- /wp:html -->\\n';
  footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, footerLen: footer.length };
})()`;

fs.writeFileSync(path.join(dir, 'deploy-footer-inline.js'), ex);
console.log('size', ex.length);
