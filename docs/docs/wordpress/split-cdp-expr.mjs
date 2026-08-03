import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const max = 3500;
const src = process.argv[2];
const prefix = process.argv[3] || 'part';
if (!src) {
  console.error('usage: node split-cdp-expr.mjs <source-expr-file> [prefix]');
  process.exit(1);
}
const raw = fs.readFileSync(path.join(dir, src), 'utf8');
const m = raw.match(/window\.__cssb64\+="([\s\S]*)";return/);
if (!m) {
  console.error('no b64 chunk in', src);
  process.exit(1);
}
const b64 = m[1];
const parts = [];
for (let i = 0; i < b64.length; i += max) {
  parts.push(b64.slice(i, i + max));
}
parts.forEach((p, i) => {
  const expr =
    '(async()=>{window.__cssb64=window.__cssb64||"";window.__cssb64+="' +
    p +
    '";return{part:"' +
    prefix +
    '-' +
    i +
    '",len:window.__cssb64.length}})()';
  const out = path.join(dir, `.cdp-${prefix}-${i}-expr.txt`);
  fs.writeFileSync(out, expr);
  console.log(out, expr.length);
});
