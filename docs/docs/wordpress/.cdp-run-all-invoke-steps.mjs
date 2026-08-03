/**
 * Run steps 0-29: writes .cdp-step-N.response.json from MCP responses in .cdp-step-N.mcp-out.json
 * Agent loop: for each N, CallMcpTool browser_cdp with JSON.parse(mcp-ready), save full MCP response to mcp-out, then node this script continue N
 * Or: node .cdp-run-all-invoke-steps.mjs collect N  (records value from mcp-out)
 *      node .cdp-run-all-invoke-steps.mjs summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2] || 'next';
const viewId = process.argv[3] || 'c6921c';

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

const statePath = path.join(dir, '.cdp-run-all-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { next: 0, results: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function extractValue(mcpOut) {
  const r = typeof mcpOut === 'string' ? JSON.parse(mcpOut) : mcpOut;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value;
  if (v === undefined && r?.isError) throw new Error(JSON.stringify(r));
  return v;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: `cssFullRun len=${value?.len} ok=${value?.ok}` };
  }
  if (i === 5 && !value?.hasGrid) {
    return { fail: true, reason: 'cssVerify hasGrid' };
  }
  if (i === 6 && !value?.ok) {
    return { fail: true, reason: 'cssFinalize ok' };
  }
  if (i === 7 && !value?.ok) {
    return { fail: true, reason: 'encInit ok' };
  }
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: `encRun ok=${value?.ok} hasHeroV2=${value?.hasHeroV2}` };
  }
  return { fail: false };
}

if (cmd === 'reset') {
  saveState({ next: 0, results: {}, errors: [] });
  console.log('reset');
  process.exit(0);
}

if (cmd === 'args') {
  const n = Number(process.argv[3]);
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  console.log(out);
  process.exit(0);
}

if (cmd === 'collect') {
  const n = Number(process.argv[3]);
  const state = loadState();
  const outPath = path.join(dir, `.cdp-step-${n}.mcp-out.json`);
  if (!fs.existsSync(outPath)) {
    console.error('missing', outPath);
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  try {
    const value = extractValue(raw);
    state.results[n] = value;
    const chk = checkStep(n, value);
    if (chk.fail) {
      state.errors.push({ step: n, value, reason: chk.reason });
      saveState(state);
      console.log(JSON.stringify({ ok: false, step: n, value, reason: chk.reason }));
      process.exit(1);
    }
    state.next = n + 1;
    saveState(state);
    console.log(JSON.stringify({ ok: true, step: n, value }));
    process.exit(0);
  } catch (e) {
    state.errors.push({ step: n, error: String(e) });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, error: String(e) }));
    process.exit(1);
  }
}

if (cmd === 'summary') {
  const state = loadState();
  const s = {};
  for (const [step, key] of Object.entries(summaryKeys)) {
    s[key] = state.results[step] ?? null;
  }
  const out = {
    viewId: 'a9930e',
    activeViewId: '4a20d1',
    ...s,
    errors: state.errors,
  };
  fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

if (cmd === 'next') {
  const state = loadState();
  const n = state.next;
  if (n > 29) {
    console.log('DONE');
    process.exit(0);
  }
  const args = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  fs.writeFileSync(path.join(dir, '.cdp-next-args.json'), args);
  console.log(JSON.stringify({ step: n, argsPath: '.cdp-next-args.json' }));
  process.exit(0);
}

console.error('unknown cmd', cmd);
process.exit(2);
