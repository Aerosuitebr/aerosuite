/**
 * Execute steps start..end: writes .cdp-mcp-do-now.json, waits for .cdp-mcp-done-now.json
 * Agent: while running, read do-now -> CallMcpTool -> write done-now with MCP response
 * Usage: node .cdp-subagent-loop.mjs 3 29 84ede5
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 3);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '84ede5';
const doFile = path.join(dir, '.cdp-mcp-do-now.json');
const doneFile = path.join(dir, '.cdp-mcp-done-now.json');
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

const recorded = {};
const errors = [];

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
  if (fs.existsSync(doneFile)) fs.unlinkSync(doneFile);
  fs.writeFileSync(doFile, JSON.stringify({ step: n, ...call }));
  process.stderr.write(`NEED_MCP ${n}\n`);

  let result = null;
  for (let t = 0; t < 1200; t++) {
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
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
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
  process.stderr.write(`OK ${n} ${JSON.stringify(value).slice(0, 120)}\n`);
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
