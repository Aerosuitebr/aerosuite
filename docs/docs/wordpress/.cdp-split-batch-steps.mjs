/** Split combined batch into individual step MCP payloads */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batchFile = process.argv[2] || '.cdp-emit-1-3.txt';
const viewId = process.argv[3] || '6115f3';
const stepNum = Number(process.argv[4]);

const j = JSON.parse(fs.readFileSync(path.join(dir, batchFile), 'utf8'));
const expr = j.params.expression;

const stepRe = /\/\* step (\d+) \*\/ const __r(\d+) = await \(async\(\)=>([\s\S]*?)\)\(\);/g;
const steps = [];
let m;
while ((m = stepRe.exec(expr)) !== null) {
  steps.push({ n: Number(m[1]), inner: m[3] });
}

if (stepNum) {
  const s = steps.find((x) => x.n === stepNum);
  if (!s) {
    console.error('step not found', stepNum);
    process.exit(1);
  }
  const payload = {
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async()=>${s.inner})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  };
  fs.writeFileSync(path.join(dir, `.cdp-step-${stepNum}-args.json`), JSON.stringify(payload));
  console.log(JSON.stringify({ step: stepNum, exprLen: payload.params.expression.length }));
} else {
  console.log(JSON.stringify(steps.map((s) => ({ step: s.n, len: s.inner.length + 20 }))));
}
