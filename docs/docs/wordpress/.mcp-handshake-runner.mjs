/**
 * Run steps start..end sequentially by shelling to cursor MCP via reading JSON files
 * and using Playwright page.evaluate through browser_cdp proxy file handshake.
 *
 * This script reads .step-out-N.json and for each step writes .cdp-await-step.json,
 * then waits for .cdp-step-result.json (agent writes after CallMcpTool).
 *
 * Usage: node .mcp-handshake-runner.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '8e6349';
const awaitFile = path.join(dir, '.cdp-await-step.json');
const resultFile = path.join(dir, '.cdp-step-result.json');
const stateFile = path.join(dir, '.mcp-handshake-state.json');

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

const results = {};
const errors = [];

for (let n = start; n <= end && errors.length === 0; n++) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, `.step-out-${n}.json`), 'utf8'));
  raw.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-step-args.json'), JSON.stringify(raw));
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(awaitFile, JSON.stringify({ step: n, viewId }));

  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultFile)) {
      result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      break;
    }
    await sleep(200);
  }
  if (!result) {
    errors.push({ step: n, error: 'timeout waiting for MCP result' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  results[n] = value;
  const fail = checkStep(n, value);
  if (fail) {
    errors.push({ step: n, reason: fail, value });
    break;
  }
  process.stderr.write(`OK ${n}\n`);
}

if (fs.existsSync(awaitFile)) fs.unlinkSync(awaitFile);

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: results[4] ?? null,
  cssVerify: results[5] ?? null,
  cssFinalize: results[6] ?? null,
  encInit: results[7] ?? null,
  enc0: results[13] ?? null,
  enc1: results[19] ?? null,
  enc2: results[25] ?? null,
  enc3: results[28] ?? null,
  encRun: results[29] ?? null,
  errors,
};
fs.writeFileSync(stateFile, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
