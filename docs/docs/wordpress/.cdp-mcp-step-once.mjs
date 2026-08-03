/**
 * Run full deploy: for each step writes .cdp-invoke-min.json and waits for .cdp-mcp-done-now.json
 * Agent loop: node .cdp-mcp-step-once.mjs call | (CallMcpTool) | node .cdp-mcp-step-once.mjs done
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '84ede5';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const doneFile = path.join(dir, '.cdp-mcp-done-now.json');
const invokeFile = path.join(dir, '.cdp-invoke-min.json');
const finalPath = path.join(dir, '.cdp-final-out.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (n === 6 && !value?.ok) return 'step6 ok';
  if (n === 7 && !value?.ok) return 'step7 ok';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

function extractValue(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

const cmd = process.argv[5];

if (cmd === 'call') {
  const call = JSON.parse(fs.readFileSync(invokeFile, 'utf8'));
  process.stdout.write(JSON.stringify(call));
  process.exit(0);
}

if (cmd === 'done') {
  const raw = process.argv[6] || fs.readFileSync(0, 'utf8');
  fs.writeFileSync(doneFile, raw);
  process.exit(0);
}

const recorded = {};
const errors = [];

for (let n = start; n <= end; ) {
  execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
  if (fs.existsSync(doneFile)) fs.unlinkSync(doneFile);
  fs.writeFileSync(invokeFile, JSON.stringify({ method: call.method, params: call.params, viewId: call.viewId }));
  fs.writeFileSync(path.join(dir, '.cdp-current-step.txt'), String(n));
  process.stderr.write(`NEED_MCP ${n}\n`);

  let result = null;
  for (let t = 0; t < 1800; t++) {
    if (fs.existsSync(doneFile)) {
      result = JSON.parse(fs.readFileSync(doneFile, 'utf8'));
      fs.unlinkSync(doneFile);
      break;
    }
    await sleep(100);
  }
  if (!result) {
    errors.push({ step: n, error: 'timeout' });
    break;
  }
  const value = extractValue(result);
  if (summaryKeys[n]) recorded[summaryKeys[n]] = value;
  const fail = checkStep(n, value);
  if (fail) {
    errors.push({ step: n, reason: fail, value });
    if (n === 4) {
      process.stderr.write('RETRY_CLEAR\n');
      fs.writeFileSync(path.join(dir, '.cdp-needs-clear.txt'), '1');
      for (let t = 0; t < 300 && fs.existsSync(path.join(dir, '.cdp-needs-clear.txt')); t++) await sleep(150);
      n = 0;
      continue;
    }
    break;
  }
  process.stderr.write(`OK ${n} ${JSON.stringify(value).slice(0, 100)}\n`);
  n++;
}

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: recorded.cssFullRun ?? null,
  cssVerify: recorded.cssVerify ?? null,
  cssFinalize: recorded.cssFinalize ?? null,
  encInit: recorded.encInit ?? null,
  enc0: recorded.enc0 ?? null,
  enc1: recorded.enc1 ?? null,
  enc2: recorded.enc2 ?? null,
  enc3: recorded.enc3 ?? null,
  encRun: recorded.encRun ?? null,
  errors,
};
fs.writeFileSync(finalPath, JSON.stringify(out, null, 2));
process.stdout.write(`FINAL ${JSON.stringify(out)}\n`);
process.exit(errors.length ? 1 : 0);
