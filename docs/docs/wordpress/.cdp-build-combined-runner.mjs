import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] || 1);
const end = Number(process.argv[3] || 29);
const viewId = process.argv[4] || 'c6921c';

const steps = [];
for (let i = start; i <= end; i++) {
  const invoke = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${i}.invoke.json`), 'utf8'));
  const expr =
    invoke.params?.expression ??
    invoke.arguments?.params?.expression ??
    invoke.expression;
  if (!expr) throw new Error(`no expression in step ${i}`);
  steps.push({ i, expr });
}

const runner = `(async()=>{
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

const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: runner, awaitPromise: true, returnByValue: true },
};
const outFile = path.join(dir, `.cdp-combined-${start}-${end}.mcp-ready.json`);
fs.writeFileSync(outFile, JSON.stringify(args));
console.log(JSON.stringify({ start, end, exprLen: runner.length, file: path.basename(outFile) }));
