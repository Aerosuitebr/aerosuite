import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const from = Number(process.argv[2] || 3);
const to = Number(process.argv[3] || 5);
const parts = [];
for (let i = from; i <= to; i++) {
  const src = fs.readFileSync(path.join(dir, `deploy-css-step-${i}.js`), 'utf8');
  const m = src.match(/\+\"([\s\S]*)\";return\{chunk/);
  if (!m) throw new Error('parse fail ' + i);
  parts.push(m[1]);
}
const ex = `(async()=>{window.__cssb64=window.__cssb64||'';${parts
  .map((c, idx) => `window.__cssb64+=${JSON.stringify(c)};`)
  .join('')}return{from:${from},to:${to},len:window.__cssb64.length,dec:atob(window.__cssb64).length}})()`;
const out = path.join(dir, `.cdp-steps${from}-${to}-expr.txt`);
fs.writeFileSync(out, ex, 'utf8');
console.log(out, ex.length);
