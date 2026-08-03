import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const map = {
  'css-q1': '.expr-only-css-q1.txt',
  'css-q2': '.expr-only-css-q2.txt',
  'css-q3': '.expr-only-css-q3.txt',
  'css-q4': '.expr-only-css-q4.txt',
  'css-finalize': '.expr-only-css-finalize.txt',
  'enc-init': '.expr-only-enc-init.txt',
  'enc-0': '.expr-only-enc-0.txt',
  'enc-1': '.expr-only-enc-1.txt',
  'enc-2': '.expr-only-enc-2.txt',
  'enc-3': '.expr-only-enc-3.txt',
  'enc-run': '.expr-only-enc-run.txt',
};
const file = map[step];
if (!file) {
  console.error('unknown step', step);
  process.exit(1);
}
const expression = fs.readFileSync(path.join(dir, file), 'utf8').trim();
const out = {
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, 'cdp-eval-params.json'), JSON.stringify(out), 'utf8');
console.log(step, expression.length);
