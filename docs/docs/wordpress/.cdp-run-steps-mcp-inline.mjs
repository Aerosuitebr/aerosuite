/**
 * Run steps start..end: for each step output .cdp-call-N.json path;
 * Agent must call browser_cdp and: node .cdp-finish-step.mjs <n> <responseFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'af93cf';
const statePath = path.join(dir, '.cdp-run-all-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [] };
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

function record(n, raw) {
  const resp = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const value = resp?.result?.value;
  const state = loadState();
  state.results[n] = value;
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(resp));
  const fail = checkStep(n, value);
  if (fail) {
    state.errors.push({ step: n, value, reason: fail });
    saveState(state);
    return { ok: false, step: n, value, reason: fail };
  }
  saveState(state);
  return { ok: true, step: n, value };
}

const cmd = process.argv[1].includes('finish-step') ? 'finish' : process.argv[2];

if (process.argv[1].endsWith('.cdp-finish-step.mjs') || cmd === 'finish') {
  const n = Number(process.argv[2]);
  const file = process.argv[3] || path.join(dir, '.cdp-last-mcp.json');
  const raw = fs.readFileSync(file, 'utf8');
  const r = record(n, raw);
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  const args = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-next-args.json'), JSON.stringify(args));
  console.log(`STEP ${n}`);
  process.exit(0);
}
