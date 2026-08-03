import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = Buffer.from(fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8')).toString('base64');
const sizes = [8358, 8677, 8677, 8996];
let off = 0;
const chunks = sizes.map((n) => {
  const p = b64.slice(off, off + n);
  off += n;
  return p;
});
if (off !== b64.length) throw new Error(`split ${off} vs ${b64.length}`);

for (let i = 0; i < chunks.length; i++) {
  const n = i + 1;
  const expr =
    i === 0
      ? `(async()=>{window.__cssb64='';window.__cssb64='${chunks[i]}';return{q:${n},len:window.__cssb64.length}})()`
      : `(async()=>{window.__cssb64+='${chunks[i]}';return{q:${n},len:window.__cssb64.length}})()`;
  fs.writeFileSync(path.join(dir, `step-css-q${n}.expr.txt`), expr);
  fs.writeFileSync(path.join(dir, `.invoke-css-q${n}.json`), JSON.stringify({
    expression: expr,
    awaitPromise: true,
    returnByValue: true,
  }));
  console.log('q' + n, expr.length);
}
