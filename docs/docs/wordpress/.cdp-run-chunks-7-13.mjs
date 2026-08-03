import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const parts = [];
for (let n = 7; n <= 13; n++) {
  const src = fs.readFileSync(path.join(base, `deploy-manifest-${n}.js`), 'utf8');
  const m = src.match(/\+\"([\s\S]*)\";return\{chunk/);
  if (!m) throw new Error('parse fail ' + n);
  parts.push({ n, append: m[1] });
}
const expr = `(async()=>{
  const chunks=${JSON.stringify(parts.map((p) => p.append))};
  for(let i=0;i<chunks.length;i++){
    window.__manifestb64=(window.__manifestb64||'')+chunks[i];
  }
  return {chunks:7,through:13,len:window.__manifestb64.length};
})()`;
const out = path.join(base, '.cdp-combined-7-13-expr.txt');
fs.writeFileSync(out, expr);
console.log('len', expr.length, 'wrote', out);
