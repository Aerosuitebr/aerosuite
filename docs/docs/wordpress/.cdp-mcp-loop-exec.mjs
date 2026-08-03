/**
 * Agent helper: prep all steps, record results, print summary.
 * Agent calls browser_cdp with each .cdp-call-N.json then:
 *   node .cdp-mcp-loop-exec.mjs record <n> < mcp-response.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[3] || '0fe248';
const cmd = process.argv[2];
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
    : { results: { 0: { batch: 0, from: 0, to: 4 }, 1: { batch: 1, from: 5, to: 9 } }, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

if (cmd === 'prep-all') {
  const start = Number(process.argv[4] ?? 2);
  const end = Number(process.argv[5] ?? 29);
  for (let n = start; n <= end; n++) {
    const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    fs.writeFileSync(path.join(dir, `.cdp-call-${n}.json`), out);
  }
  console.log(JSON.stringify({ ok: true, start, end, viewId }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[4]);
  const raw = fs.readFileSync(0, 'utf8');
  const resp = JSON.parse(raw);
  const value = resp?.result?.value;
  const state = loadState();
  state.results[n] = value;
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), raw);
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

if (cmd === 'next') {
  const start = Number(process.argv[4] ?? 2);
  const end = Number(process.argv[5] ?? 29);
  const state = loadState();
  for (let n = start; n <= end; n++) {
    if (state.results[n] !== undefined) continue;
    const callPath = path.join(dir, `.cdp-call-${n}.json`);
    if (!fs.existsSync(callPath)) {
      const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
        cwd: dir,
        encoding: 'utf8',
      }).trim();
      fs.writeFileSync(callPath, out);
    }
    const args = JSON.parse(fs.readFileSync(callPath, 'utf8'));
    console.log(JSON.stringify({ step: n, args }));
    process.exit(0);
  }
  console.log('DONE');
  process.exit(0);
}

console.error('usage: prep-all|record|summary|next');
process.exit(2);
