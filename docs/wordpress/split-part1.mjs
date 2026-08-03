import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(
  fs.readFileSync(path.join(dir, 'cdp-batch-invoke.json'), 'utf8')
);
const expr = j.params.expression;
const CHUNK = 9000;
const part0 = expr.slice(0, CHUNK);
const mid = 4500;
const calls = [
  {
    method: 'Runtime.evaluate',
    viewId: '7b8d4e',
    params: {
      expression: `window.__batchParts[0]=${JSON.stringify(part0.slice(0, mid))};`,
      returnByValue: true,
    },
  },
  {
    method: 'Runtime.evaluate',
    viewId: '7b8d4e',
    params: {
      expression: `window.__batchParts[0]+=${JSON.stringify(part0.slice(mid))};`,
      returnByValue: true,
    },
  },
];
fs.writeFileSync(path.join(dir, 'cdp-part1-split.json'), JSON.stringify(calls));
calls.forEach((x, i) => console.log(i, x.params.expression.length));
