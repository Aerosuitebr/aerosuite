/**
 * Run CDP steps 0-29 by reading invoke args and writing results.
 * Requires MCP responses saved to .cdp-step-N.mcp-out.json by the agent.
 * This script only prepares args and validates - agent calls browser_cdp.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '06e2fc';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

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

const results = {};
const errors = [];

function extractValue(mcpOut) {
  const r = typeof mcpOut === 'string' ? JSON.parse(mcpOut) : mcpOut;
  if (r?.isError || r?.error) throw new Error(JSON.stringify(r));
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value;
  if (v === undefined) throw new Error('no value: ' + JSON.stringify(r).slice(0, 500));
  return v;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: `cssFullRun len=${value?.len} ok=${value?.ok}` };
  }
  if (i === 5 && !value?.hasGrid) return { fail: true, reason: 'cssVerify hasGrid' };
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize ok' };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit ok' };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: `encRun ok=${value?.ok} hasHeroV2=${value?.hasHeroV2}` };
  }
  return { fail: false };
}

for (let n = start; n <= end; n++) {
  const outPath = path.join(dir, `.cdp-step-${n}.mcp-out.json`);
  if (!fs.existsSync(outPath)) {
    const args = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    fs.writeFileSync(path.join(dir, '.cdp-pending-step.json'), JSON.stringify({ step: n, args: JSON.parse(args) }));
    console.log(JSON.stringify({ pending: n, argsFile: '.cdp-pending-step.json' }));
    process.exit(0);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const value = extractValue(raw);
    results[n] = value;
    const key = summaryKeys[n];
    if (key) results[`_${key}`] = value;
    const chk = checkStep(n, value);
    if (chk.fail) {
      errors.push({ step: n, value, reason: chk.reason });
      break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

if (errors.length || !fs.existsSync(path.join(dir, `.cdp-step-${end}.mcp-out.json`))) {
  if (errors.length) {
    console.log(JSON.stringify({ done: false, errors, results: Object.keys(results) }));
    process.exit(1);
  }
}

const out = {
  viewId: 'a9930e',
  activeViewId: '4a20d1',
  cssFullRun: results._cssFullRun ?? results[4] ?? null,
  cssVerify: results._cssVerify ?? results[5] ?? null,
  cssFinalize: results._cssFinalize ?? results[6] ?? null,
  encInit: results._encInit ?? results[7] ?? null,
  enc0: results._enc0 ?? results[13] ?? null,
  enc1: results._enc1 ?? results[19] ?? null,
  enc2: results._enc2 ?? results[25] ?? null,
  enc3: results._enc3 ?? results[28] ?? null,
  encRun: results._encRun ?? results[29] ?? null,
  errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
