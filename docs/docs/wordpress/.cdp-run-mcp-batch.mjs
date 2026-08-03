/**
 * Prepare step N args file; record MCP response from stdin.
 * Usage: node .cdp-run-mcp-batch.mjs prep <n> <viewId>
 *        node .cdp-run-mcp-batch.mjs record <n> < response.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '0fe248';
const statePath = path.join(dir, '.cdp-run-all-state.json');

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

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

if (cmd === 'prep') {
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  fs.writeFileSync(callPath, out);
  const a = JSON.parse(out);
  console.log(JSON.stringify({ step: n, callPath, exprLen: a.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync(0, 'utf8');
  const resp = JSON.parse(raw);
  const value = resp?.result?.value;
  const state = loadState();
  state.results[n] = value;
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(resp));
  const fail = checkStep(n, value);
  if (fail) {
    state.errors.push({ step: n, value, reason: fail });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, value, reason: fail }));
    process.exit(1);
  }
  saveState(state);
  console.log(JSON.stringify({ ok: true, step: n, value }));
  process.exit(0);
}

if (cmd === 'summary') {
  const state = loadState();
  const out = {
    viewId: 'a9930e',
    activeViewId: '4a20d1',
    cssFullRun: state.results[4] ?? null,
    cssVerify: state.results[5] ?? null,
    cssFinalize: state.results[6] ?? null,
    encInit: state.results[7] ?? null,
    enc0: state.results[13] ?? null,
    enc1: state.results[19] ?? null,
    enc2: state.results[25] ?? null,
    enc3: state.results[28] ?? null,
    encRun: state.results[29] ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: prep|record|summary');
process.exit(2);
