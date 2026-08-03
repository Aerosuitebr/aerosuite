import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = fs.readFileSync(path.join(dir, 'aerosuite-premium.css')).toString('base64');
const n = 4;
const size = Math.ceil(b64.length / n);
for (let i = 0; i < n; i++) {
  const chunk = b64.slice(i * size, (i + 1) * size);
  const init = i === 0 ? "window.__cssb64=''" : '';
  const op = i === 0 ? `window.__cssb64='${chunk}'` : `window.__cssb64+=${JSON.stringify(chunk)}`;
  const ex = `(async()=>{${init};${op};return{q:${i + 1},len:window.__cssb64.length}})()`;
  const out = path.join(dir, `.cdp-css-b64-q${i + 1}-expr.txt`);
  fs.writeFileSync(out, ex);
  console.log(i + 1, ex.length, out);
}
const verify = `(async()=>{const css=atob(window.__cssb64);return{b64:window.__cssb64.length,dec:css.length,hasGrid:css.includes('as-hero-v2__grid')}})()`;
fs.writeFileSync(path.join(dir, '.cdp-css-b64-verify-expr.txt'), verify);
console.log('verify', verify.length);
