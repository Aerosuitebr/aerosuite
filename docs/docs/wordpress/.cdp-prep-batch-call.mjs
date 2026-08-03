import fs from 'fs';
import { execSync } from 'child_process';
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const viewId = process.argv[4] || '9e0614';
const expr = execSync(`node .cdp-build-combined-expr.mjs ${start} ${end}`, { encoding: 'utf8' });
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync('.cdp-batch-call.json', JSON.stringify(payload));
console.log(JSON.stringify({ start, end, exprLen: expr.length, viewId }));
