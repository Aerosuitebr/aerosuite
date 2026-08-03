import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] ?? '5f37a3';
const label = process.argv[3];
const nums = process.argv.slice(4).map(Number);

function loadStep(n) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.step-out-${n}.json`), 'utf8'));
  return j.params.expression;
}

const steps = nums.map((n) => ({ n, expr: loadStep(n) }));
const payload = {
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{const steps=${JSON.stringify(steps)};const out={};for(const s of steps){out[s.n]=await eval(s.expr);}return out;})()`,
    awaitPromise: true,
    returnByValue: true,
  },
};
fs.writeFileSync(path.join(dir, `.mcp-invoke-custom-${label}.json`), JSON.stringify(payload));
console.log(label, 'steps', nums.join(','), 'exprLen', payload.params.expression.length);
