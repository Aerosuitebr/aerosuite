import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '1031af';
const outDir = path.join(dir, '.cdp-mcp-results');
fs.mkdirSync(outDir, { recursive: true });

for (let n = 0; n <= 29; n++) {
  const expression =
    `(async()=>{const p=await fetch('http://127.0.0.1:8769/step/${n}').then(r=>r.json());let v=eval(p.expression);if(p.awaitPromise&&v&&typeof v.then==='function')v=await v;return v;})()`;
  const args = {
    viewId,
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
  };
  fs.writeFileSync(path.join(outDir, `${n}-fetch-invoke.json`), JSON.stringify(args));
}
console.log(JSON.stringify({ ok: true, viewId, count: 30 }));
