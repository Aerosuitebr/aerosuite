import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'e81202';
const map = {
  'css-q1': '.cdp-css-b64-q1-expr.txt',
  'css-q2': '.cdp-css-b64-q2-expr.txt',
  'css-q3': '.cdp-css-b64-q3-expr.txt',
  'css-q4': '.cdp-css-b64-q4-expr.txt',
};
const file = map[step];
if (!file) throw new Error('unknown step ' + step);
const expression = fs.readFileSync(path.join(dir, file), 'utf8').trim();
fs.writeFileSync(
  path.join(dir, '.cdp-step-call.json'),
  JSON.stringify({
    viewId,
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
  })
);
