import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'd0bf03';
const expr = fs.readFileSync(path.join(dir, '.cdp-expr-out-run.txt'), 'utf8');
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, '.cdp-combined-payload.json'), JSON.stringify(payload));
console.log(JSON.stringify({ ok: true, exprLen: expr.length, viewId }));
