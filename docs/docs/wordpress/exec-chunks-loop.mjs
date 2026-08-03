import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '4b143e';
const start = Number(process.argv[3] || 5);
const end = Number(process.argv[4] || 13);
const outDir = path.join(dir, 'cdp-exec-pending');
fs.mkdirSync(outDir, { recursive: true });

for (let i = start; i <= end; i++) {
  const expr = fs.readFileSync(path.join(dir, `deploy-manifest-${i}.js`), 'utf8');
  const payload = {
    method: 'Runtime.evaluate',
    params: { awaitPromise: true, expression: expr, returnByValue: true },
    viewId,
  };
  fs.writeFileSync(path.join(outDir, `chunk-${String(i).padStart(2, '0')}.json`), JSON.stringify(payload));
}
const runExpr = fs.readFileSync(path.join(dir, 'deploy-manifest-run.js'), 'utf8');
fs.writeFileSync(
  path.join(outDir, 'run.json'),
  JSON.stringify({
    method: 'Runtime.evaluate',
    params: { awaitPromise: true, expression: runExpr, returnByValue: true },
    viewId,
  })
);
console.log(`Wrote ${end - start + 2} payloads to ${outDir}`);
