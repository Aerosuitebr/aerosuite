/**
 * Build one Runtime.evaluate that runs steps start..end from .step-out-N.json in order.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '46863b';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

const steps = [];
for (let n = start; n <= end; n++) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, `.step-out-${n}.json`), 'utf8'));
  steps.push({ i: n, expr: raw.params.expression });
}

const wrapper = `(async()=>{
  const steps = ${JSON.stringify(steps)};
  const out = {};
  for (const {i, expr} of steps) {
    try {
      let v = eval(expr);
      if (v && typeof v.then === 'function') v = await v;
      out[i] = v;
    } catch (e) {
      out[i] = { __error: String(e) };
      return { ok: false, failedAt: i, out, error: String(e) };
    }
  }
  return { ok: true, out };
})()`;

const invoke = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};

const outPath = path.join(dir, '.cdp-all-steps-invoke.json');
fs.writeFileSync(outPath, JSON.stringify(invoke));
console.log(JSON.stringify({ path: outPath, exprLen: wrapper.length, steps: steps.length }));
