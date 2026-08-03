/**
 * Prepare + record step-out execution. Agent calls browser_cdp per .cdp-current-mcp-args.json.
 * After each MCP call, agent writes .cdp-current-mcp-result.json then runs: node .run-all-step-out.mjs --record
 *
 * Or run full loop hint: node .run-all-step-out.mjs --emit 1
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv.includes('--view') ? process.argv[process.argv.indexOf('--view') + 1] : '46863b';
const emitIdx = process.argv.indexOf('--emit');
const record = process.argv.includes('--record');
const start = Number(process.argv.find((a) => a.startsWith('--from='))?.split('=')[1] ?? 0);
const end = Number(process.argv.find((a) => a.startsWith('--to='))?.split('=')[1] ?? 29);

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function loadStep(n) {
  const file = n === 0 ? '.cdp-invoke-0.json' : `.step-out-${n}.json`;
  const args = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  args.viewId = viewId;
  return args;
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 b64=${value?.b64}`;
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
  return null;
}

if (emitIdx >= 0) {
  const n = Number(process.argv[emitIdx + 1]);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(loadStep(n)));
  process.stdout.write(String(n));
  process.exit(0);
}

const statePath = path.join(dir, '.cdp-step-out-run-state.json');
let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { viewId, activeViewId: viewId, next: start, results: {}, errors: [] };

if (record) {
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (!fs.existsSync(rp)) {
    console.log(JSON.stringify({ error: 'NO_RESULT' }));
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  const n = state.next;
  state.results[n] = value;
  const key = summaryKeys[n];
  if (key) state[key] = value;
  const fail = checkStep(n, value);
  if (fail) state.errors.push({ step: n, reason: fail, value });
  else state.next = n + 1;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.unlinkSync(rp);
  if (fail || n >= end) {
    const out = {
      viewId: 'a9930e',
      activeViewId: viewId,
      cssFullRun: state.results[4] ?? state.cssFullRun ?? null,
      cssVerify: state.results[5] ?? state.cssVerify ?? null,
      cssFinalize: state.results[6] ?? state.cssFinalize ?? null,
      encInit: state.results[7] ?? state.encInit ?? null,
      enc0: state.results[13] ?? state.enc0 ?? null,
      enc1: state.results[19] ?? state.enc1 ?? null,
      enc2: state.results[25] ?? state.enc2 ?? null,
      enc3: state.results[28] ?? state.enc3 ?? null,
      encRun: state.results[29] ?? state.encRun ?? null,
      errors: state.errors,
    };
    fs.writeFileSync(path.join(dir, '.cdp-step-out-final.json'), JSON.stringify(out));
    console.log(JSON.stringify(out));
    process.exit(fail ? 1 : 0);
  }
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(loadStep(state.next)));
  console.log(JSON.stringify({ next: state.next, prev: n, value }));
  process.exit(0);
}

// init
fs.writeFileSync(statePath, JSON.stringify({ ...state, next: start, results: {}, errors: [] }, null, 2));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(loadStep(start)));
console.log(JSON.stringify({ init: true, start, end, viewId }));
