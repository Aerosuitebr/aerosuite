/**
 * Orchestrator: emits AWAIT_STEP N, waits for .cdp-current-mcp-result.json
 * Usage: node cdp-mcp-orchestrator.mjs [start] [end] [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '041fe0';
const argsPath = path.join(dir, '.cdp-current-mcp-args.json');
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const summaryPath = path.join(dir, '.cdp-orchestrator-summary.json');

const keys = {
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

const summary = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: null,
  cssVerify: null,
  cssFinalize: null,
  encInit: null,
  enc0: null,
  enc1: null,
  enc2: null,
  enc3: null,
  encRun: null,
  errors: [],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { step: n, reason: 'cssFullRun', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { step: n, reason: 'cssVerify', value };
  if (n === 6 && !value?.ok) return { step: n, reason: 'cssFinalize', value };
  if (n === 7 && !value?.ok) return { step: n, reason: 'encInit', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { step: n, reason: 'encRun', value };
  return null;
}

for (let n = start; n <= end; n++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.call.json`), 'utf8'));
  call.viewId = viewId;
  fs.writeFileSync(argsPath, JSON.stringify(call));
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(`AWAIT_STEP ${n}`);
  let result = null;
  for (let t = 0; t < 1200; t++) {
    if (fs.existsSync(resultPath)) {
      result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      break;
    }
    await sleep(250);
  }
  if (!result) {
    summary.errors.push({ step: n, error: 'timeout' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(result));
  const key = keys[n];
  if (key) summary[key] = value;
  const fail = checkStep(n, value);
  if (fail) {
    summary.errors.push(fail);
    break;
  }
  console.log(`DONE_STEP ${n} ${JSON.stringify(value).slice(0, 120)}`);
}

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log('FINAL ' + JSON.stringify(summary));
