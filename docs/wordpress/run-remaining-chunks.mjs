import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pending = path.join(dir, 'cdp-exec-pending');
const results = [];

for (let i = 6; i <= 13; i++) {
  const p = JSON.parse(fs.readFileSync(path.join(pending, `chunk-${String(i).padStart(2, '0')}.json`), 'utf8'));
  results.push({ chunk: i, exprFile: `chunk-${String(i).padStart(2, '0')}.json`, exprLen: p.params.expression.length });
}

const run = JSON.parse(fs.readFileSync(path.join(pending, 'run.json'), 'utf8'));
results.push({ chunk: 'run', exprLen: run.params.expression.length });
console.log(JSON.stringify(results, null, 2));
