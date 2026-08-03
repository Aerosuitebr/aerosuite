import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chunks = [2, 3, 4].map((n) => {
  const raw = fs.readFileSync(path.join(dir, `.cdp-css-b64-q${n}-expr.txt`), 'utf8');
  const m = raw.match(/window\.__cssb64\+="([\s\S]*)";return\{q:/);
  if (!m) throw new Error(`parse q${n}`);
  return m[1];
});
const expr =
  '(async()=>{window.__cssb64=window.__cssb64||"";window.__cssb64+="' +
  chunks.join('') +
  '";return{q:"234",len:window.__cssb64.length}})()';
fs.writeFileSync(path.join(dir, '.cdp-css-b64-q234-expr.txt'), expr);
console.log('combined len', expr.length);
