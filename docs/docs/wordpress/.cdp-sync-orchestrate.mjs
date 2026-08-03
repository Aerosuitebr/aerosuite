/**
 * Run steps 0-29: writes .cdp-current-mcp-args.json, waits for .cdp-current-mcp-result.json
 * Agent: read args file, CallMcpTool browser_cdp exact args, write result JSON
 * Usage: node .cdp-sync-orchestrate.mjs 84ede5
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '84ede5';
const argsPath = path.join(dir, '.cdp-current-mcp-args.json');
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const finalPath = path.join(dir, '.cdp-final-out.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function prepare(n) {
  execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
  fs.writeFileSync(argsPath, JSON.stringify(call));
}

const recorded = {};
const errors = [];
let start = 0;

for (let n = start; n <= 29; n++) {
  prepare(n);
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  process.stdout.write(`AWAIT_STEP ${n}\n`);

  let result = null;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultPath)) {
      result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      fs.unlinkSync(resultPath);
      break;
    }
    await sleep(150);
  }
  if (!result) {
    errors.push({ step: n, error: 'timeout' });
    break;
  }

  const value = extractValue(result);
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
  if (summaryKeys[n]) recorded[summaryKeys[n]] = value;

  const fail = checkStep(n, value);
  if (fail) {
    errors.push({ step: n, reason: fail, value });
    if (n === 4) {
      process.stdout.write('RETRY_CLEAR\n');
      fs.writeFileSync(path.join(dir, '.cdp-needs-clear.txt'), '1');
      for (let t = 0; t < 300 && fs.existsSync(path.join(dir, '.cdp-needs-clear.txt')); t++) await sleep(150);
      n = -1;
      continue;
    }
    break;
  }
  process.stderr.write(`OK ${n}\n`);
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
