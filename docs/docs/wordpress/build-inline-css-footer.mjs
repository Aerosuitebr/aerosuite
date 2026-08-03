import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .trim();

const size = 3500;
const parts = [];
for (let i = 0; i < css.length; i += size) {
  parts.push(css.slice(i, i + size));
}

parts.forEach((chunk, i) => {
  const ex = `(async()=>{window.__cssInline=(window.__cssInline||'')+${JSON.stringify(chunk)};return{part:${i},len:window.__cssInline.length}})()`;
  fs.writeFileSync(path.join(dir, `expr-inline-css-${i}.txt`), ex);
  console.log(i, ex.length);
});

const fin = `(async () => {
  const css = window.__cssInline || '';
  if (css.length < 1000) return { err: 'css missing', len: css.length };
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<link[^>]*aerosuite-premium-css[^>]*>/g, '');
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium-css[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block = '<!-- wp:html -->\\n<style id="aerosuite-premium-css">' + css + '</style>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('id="aerosuite-premium-css"')) {
    footer = block + footer;
  } else {
    footer = footer.replace(/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/, '<style id="aerosuite-premium-css">' + css + '</style>');
  }
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, cssLen: css.length };
})()`;
fs.writeFileSync(path.join(dir, 'expr-inline-css-final.txt'), fin);
console.log('final', fin.length, 'parts', parts.length);
