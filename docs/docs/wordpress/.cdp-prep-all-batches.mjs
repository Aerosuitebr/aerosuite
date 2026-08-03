import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'dab36f';
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];
for (let i = 0; i < batches.length; i++) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, batches[i]), 'utf8'));
  const payload = { viewId, method: j.method, params: j.params };
  fs.writeFileSync(path.join(dir, `.cdp-mcp-batch-${i}.json`), JSON.stringify(payload));
  console.log(JSON.stringify({ batch: i, file: batches[i], exprLen: j.params.expression.length }));
}
