import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');

const cssEx = `(async () => {
  window.__asFooterCss = ${JSON.stringify(css)};
  return { ok: true, len: window.__asFooterCss.length };
})()`;

const jsEx = `(async () => {
  window.__asFooterJs = ${JSON.stringify(js)};
  return { ok: true, len: window.__asFooterJs.length };
})()`;

const finalize = `(async () => {
  const css = window.__asFooterCss || '';
  const js = window.__asFooterJs || '';
  if (!css || !js) return { err: 'missing assets', css: css.length, js: js.length };
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block = '<!-- wp:html -->\\n<style id="aerosuite-premium-css">' + css + '</style>\\n<script id="aerosuite-phone-mask-js">' + js + '</script>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('aerosuite-premium-css')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, footerLen: footer.length };
})()`;

fs.writeFileSync(path.join(dir, 'deploy-footer-css-only.js'), cssEx);
fs.writeFileSync(path.join(dir, 'deploy-footer-js-only.js'), jsEx);
fs.writeFileSync(path.join(dir, 'deploy-footer-finalize.js'), finalize);
console.log('css', cssEx.length, 'js', jsEx.length, 'fin', finalize.length);
