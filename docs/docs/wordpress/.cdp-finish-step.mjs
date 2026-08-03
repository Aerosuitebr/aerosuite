import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const file = process.argv[3] || path.join(dir, '.cdp-last-mcp.json');
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

const raw = fs.readFileSync(file, 'utf8');
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
