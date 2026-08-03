import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '4b143e';
const n = parseInt(process.argv[3] || '2', 10);
const file =
  n === 14
    ? 'deploy-manifest-run.js'
    : `deploy-manifest-${n}.js`;
const expr = fs.readFileSync(path.join(dir, file), 'utf8');
const payload = {
  method: 'Runtime.evaluate',
  params: { awaitPromise: true, expression: expr, returnByValue: true },
  viewId,
  step: n === 14 ? 'run' : n,
};
const out = path.join(dir, '.manifest-exec-payload.json');
fs.writeFileSync(out, JSON.stringify(payload));
console.log(JSON.stringify({ step: payload.step, file, exprLen: expr.length, out }));
