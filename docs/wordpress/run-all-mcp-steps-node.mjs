/**
 * Orchestrator: for each step 0-29, writes .cdp-current-mcp-args.json and waits for
 * .cdp-current-mcp-result.json (agent writes after CallMcpTool).
 * Usage: node run-all-mcp-steps-node.mjs b5108e
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b5108e';
const summary = {
  viewId,
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = 0; n <= 29; n++) {
  const argsPath = path.join(dir, `.step-${n}-args.json`);
  const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (fs.existsSync(rp)) fs.unlinkSync(rp);
  console.log(`AWAIT_STEP ${n} exprLen=${args.params?.expression?.length ?? 0}`);
  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(rp)) {
      result = JSON.parse(fs.readFileSync(rp, 'utf8'));
      break;
    }
    await sleep(500);
  }
  if (!result) {
    summary.errors.push({ step: n, error: 'timeout waiting for MCP result' });
    console.log(JSON.stringify({ stop: true, step: n, error: 'timeout' }));
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  const key = keys[n];
  if (key) summary[key] = value;
  if (n === 4 && (!value?.ok || value?.len !== 34708)) {
    summary.errors.push({ step: n, reason: 'cssFullRun', value });
    break;
  }
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) {
    summary.errors.push({ step: n, reason: 'cssVerify', value });
    break;
  }
  if (n === 6 && !value?.ok) {
    summary.errors.push({ step: n, reason: 'cssFinalize', value });
    break;
  }
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) {
    summary.errors.push({ step: n, reason: 'encRun', value });
    break;
  }
  console.log(`DONE_STEP ${n}`, JSON.stringify(value).slice(0, 200));
}

fs.writeFileSync(path.join(dir, 'deploy-mcp-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL', JSON.stringify(summary));
