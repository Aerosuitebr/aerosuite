/**
 * Run steps start..end: writes .cdp-mcp-invoke-now.json per step, waits for .cdp-mcp-result.json
 * Agent loop: read invoke -> CallMcpTool -> write result -> script continues
 * Usage: node .cdp-mcp-agent-bridge.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '3d225d';
const invokeFile = path.join(dir, '.cdp-mcp-invoke-now.json');
const resultFile = path.join(dir, '.cdp-mcp-result.json');
const stateFile = path.join(dir, '.cdp-mcp-run-state.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 ${JSON.stringify(value)}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 ${JSON.stringify(value)}`;
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ${JSON.stringify(value)}`;
  return null;
}

const state = fs.existsSync(stateFile)
  ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  : { summary: {}, results: {}, errors: [] };

for (let n = start; n <= end && state.errors.length === 0; n++) {
  const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
  const args = JSON.parse(fs.readFileSync(ready, 'utf8'));
  args.viewId = viewId;
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(invokeFile, JSON.stringify({ step: n, ...args }));
  process.stderr.write(`AWAIT ${n}\n`);

  let result = null;
  for (let t = 0; t < 1200; t++) {
    if (fs.existsSync(resultFile)) {
      result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      fs.unlinkSync(resultFile);
      break;
    }
    await sleep(250);
  }
  if (!result) {
    state.errors.push({ step: n, error: 'timeout' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  state.results[n] = value;
  const key = summaryKeys[n];
  if (key) state.summary[key] = value;
  const fail = checkStep(n, value);
  if (fail) {
    state.errors.push({ step: n, reason: fail, value });
    break;
  }
  process.stderr.write(`OK ${n} ${JSON.stringify(value).slice(0, 120)}\n`);
}

fs.writeFileSync(stateFile, JSON.stringify(state));
const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: state.summary.cssFullRun ?? null,
  cssVerify: state.summary.cssVerify ?? null,
  cssFinalize: state.summary.cssFinalize ?? null,
  encInit: state.summary.encInit ?? null,
  enc0: state.summary.enc0 ?? null,
  enc1: state.summary.enc1 ?? null,
  enc2: state.summary.enc2 ?? null,
  enc3: state.summary.enc3 ?? null,
  encRun: state.summary.encRun ?? null,
  errors: state.errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(out));
console.log(JSON.stringify(out));
process.exit(state.errors.length ? 1 : 0);
