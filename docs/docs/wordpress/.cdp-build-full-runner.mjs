/**
 * Build one Runtime.evaluate that runs steps start..end sequentially and maps summary keys.
 * Usage: node .cdp-build-full-runner.mjs [start] [end] [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '4a20d1';

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

const steps = [];
for (let i = start; i <= end; i++) {
  const ready = path.join(dir, `.cdp-step-${i}.mcp-ready.json`);
  const invoke = path.join(dir, `.cdp-step-${i}.invoke.json`);
  const src = fs.existsSync(ready) ? ready : invoke;
  const j = JSON.parse(fs.readFileSync(src, 'utf8'));
  steps.push({ i, expr: j.params.expression });
}

const runner = `(async()=>{
  const steps = ${JSON.stringify(steps)};
  const out = {};
  for (const {i, expr} of steps) {
    try {
      let v = (0, eval)(expr.startsWith('(') ? expr : '(' + expr + ')');
      if (v && typeof v.then === 'function') v = await v;
      out[i] = v;
    } catch (e) {
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

fs.writeFileSync(path.join(dir, '.cdp-full-runner.mcp-ready.json'), JSON.stringify(args));

if (process.argv.includes('--summary-from')) {
  const raw = fs.readFileSync(process.argv[process.argv.indexOf('--summary-from') + 1], 'utf8');
  const resp = JSON.parse(raw);
  const val = resp?.result?.value ?? resp?.value ?? resp?.result?.result?.value;
  const out = val?.out || {};
  const summary = {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: out[4] ?? null,
    cssVerify: out[5] ?? null,
    cssFinalize: out[6] ?? null,
    encInit: out[7] ?? null,
    enc0: out[13] ?? null,
    enc1: out[19] ?? null,
    enc2: out[25] ?? null,
    enc3: out[28] ?? null,
    encRun: out[29] ?? null,
    errors: [],
  };
  if (!val?.ok) summary.errors.push({ failedAt: val?.failedAt, error: val?.error, out: val?.out });
  else {
    if (!summary.cssFullRun?.ok || summary.cssFullRun?.len !== 34708)
      summary.errors.push({ step: 4, reason: 'cssFullRun', value: summary.cssFullRun });
    if (!summary.cssVerify?.hasGrid)
      summary.errors.push({ step: 5, reason: 'cssVerify', value: summary.cssVerify });
    if (!summary.cssFinalize?.ok)
      summary.errors.push({ step: 6, reason: 'cssFinalize', value: summary.cssFinalize });
    if (!summary.encRun?.ok || !summary.encRun?.hasHeroV2)
      summary.errors.push({ step: 29, reason: 'encRun', value: summary.encRun });
  }
  console.log(JSON.stringify(summary));
  process.exit(summary.errors.length ? 1 : 0);
}

console.log(JSON.stringify({ start, end, viewId, exprLen: runner.length }));
