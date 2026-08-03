import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(
  fs.readFileSync(path.join(dir, 'cdp-batch-invoke.json'), 'utf8')
);
const expr = j.params.expression;
const CHUNK = 9000;
const parts = [];
for (let i = 0; i < expr.length; i += CHUNK) {
  parts.push(expr.slice(i, i + CHUNK));
}
const outer = `(async()=>{const p=[${parts.map((p) => JSON.stringify(p)).join(',')}];return await eval(p.join(''));})()`;
const out = {
  method: 'Runtime.evaluate',
  viewId: '7b8d4e',
  params: {
    expression: outer,
    awaitPromise: true,
    returnByValue: true,
  },
};
fs.writeFileSync(path.join(dir, 'cdp-full-eval-invoke.json'), JSON.stringify(out));
console.log('outerLen', outer.length, 'parts', parts.length);
