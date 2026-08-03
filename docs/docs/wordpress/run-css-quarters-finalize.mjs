import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b639e2';
const steps = [
  ['css-q1', '.cdp-css-b64-q1-expr.txt'],
  ['css-q2', '.cdp-css-b64-q2-expr.txt'],
  ['css-q3', '.cdp-css-b64-q3-expr.txt'],
  ['css-q4', '.cdp-css-b64-q4-expr.txt'],
  ['css-finalize', 'deploy-css-fix-finalize.js'],
];
const out = steps.map(([name, file]) => {
  const expr = fs.readFileSync(path.join(dir, file), 'utf8').trim();
  return { name, viewId, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } };
});
fs.writeFileSync(path.join(dir, '.css-deploy-batch.json'), JSON.stringify(out, null, 2));
console.log('wrote', out.length, 'steps');
