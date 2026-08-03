import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const viewId = process.argv[3] || '483e84';
const exprPath = path.join(dir, `.cdp-step${step}-expr.txt`);
const expr = fs.readFileSync(exprPath, 'utf8');
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId,
};
const out = path.join(dir, `.cdp-invoke-step${step}.json`);
fs.writeFileSync(out, JSON.stringify(payload), 'utf8');
console.log(out, expr.length);
