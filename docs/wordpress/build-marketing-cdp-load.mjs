import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-marketing-chunks.json'), 'utf8'));
const half = Math.ceil(j.chunks.length / 2);
function loadExpr(chunks, offset) {
  const body = chunks
    .map((x, i) => `window.__mktB64[${offset + i}]=${JSON.stringify(x)};`)
    .join('');
  return `(async()=>{window.__mktB64=window.__mktB64||[];${body}return{loaded:${chunks.length},offset:${offset}}})()`;
}
fs.writeFileSync(path.join(dir, '.cdp-marketing-load-a.js'), loadExpr(j.chunks.slice(0, half), 0));
fs.writeFileSync(path.join(dir, '.cdp-marketing-load-b.js'), loadExpr(j.chunks.slice(half), half));
console.log('a', fs.statSync(path.join(dir, '.cdp-marketing-load-a.js')).size);
console.log('b', fs.statSync(path.join(dir, '.cdp-marketing-load-b.js')).size);
