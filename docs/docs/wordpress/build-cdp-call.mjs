import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || '165b2f';
const expr = fs.readFileSync(path.join(dir, `step-${step}.expr.txt`), 'utf8');
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, `cdp-call-${step}.json`), JSON.stringify(payload));
console.log(step, expr.length);
