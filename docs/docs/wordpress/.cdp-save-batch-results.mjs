import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 20);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '1031af';
const out = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = out?.result?.value ?? out?.value ?? out;
for (let n = start; n <= end; n++) {
  const v = results[n];
  if (v == null) {
    console.error(JSON.stringify({ error: 'missing step in batch result', step: n, keys: Object.keys(results || {}) }));
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, `.cdp-mcp-results/${n}.json`), JSON.stringify({ result: { type: 'object', value: v } }));
}
console.log(JSON.stringify({ saved: end - start + 1, from: start, to: end }));
