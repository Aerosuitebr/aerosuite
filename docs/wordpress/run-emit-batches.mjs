/**
 * Execute all .cdp-emit-*.txt batches via agent CallMcpTool handshake.
 * Writes .cdp-current-batch.json with next batch to invoke.
 * Agent: CallMcpTool browser_cdp with parsed JSON, save response to .cdp-batch-response.json, then node this script record
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2] || 'next';
const viewId = process.argv[3] || '8e6349';

const batches = [
  { file: '.cdp-emit-0.txt', key: '0', steps: [0] },
  { file: '.cdp-emit-1-3.txt', key: '1-3', steps: [1, 2, 3] },
  { file: '.cdp-emit-4.txt', key: '4', steps: [4] },
  { file: '.cdp-emit-5-7.txt', key: '5-7', steps: [5, 6, 7] },
  { file: '.cdp-emit-8-12.txt', key: '8-12', steps: [8, 9, 10, 11, 12] },
  { file: '.cdp-emit-13-18.txt', key: '13-18', steps: [13, 14, 15, 16, 17, 18] },
  { file: '.cdp-emit-19-24.txt', key: '19-24', steps: [19, 20, 21, 22, 23, 24] },
  { file: '.cdp-emit-25-28.txt', key: '25-28', steps: [25, 26, 27, 28] },
  { file: '.cdp-emit-29.txt', key: '29', steps: [29] },
];

const statePath = path.join(dir, '.cdp-batch-run-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { idx: 0, results: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 ${JSON.stringify(value)}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 ${JSON.stringify(value)}`;
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ${JSON.stringify(value)}`;
  return null;
}

if (cmd === 'reset') {
  saveState({ idx: 0, results: {}, errors: [] });
  console.log('reset');
  process.exit(0);
}

if (cmd === 'next') {
  const state = loadState();
  if (state.idx >= batches.length) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  const b = batches[state.idx];
  const args = JSON.parse(fs.readFileSync(path.join(dir, b.file), 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-batch.json'), JSON.stringify(args));
  console.log(JSON.stringify({ idx: state.idx, batch: b.key, steps: b.steps, argsFile: '.cdp-current-batch.json' }));
  process.exit(0);
}

if (cmd === 'record') {
  const state = loadState();
  const b = batches[state.idx];
  const respPath = path.join(dir, '.cdp-batch-response.json');
  if (!fs.existsSync(respPath)) {
    console.error('missing response');
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(respPath, 'utf8'));
  const batchValue = raw?.result?.value ?? raw?.value ?? raw;
  fs.writeFileSync(path.join(dir, `.cdp-step-batch-${b.steps[0]}.mcp-out.json`), JSON.stringify(raw));
  for (const s of b.steps) {
    const v = batchValue[s] ?? batchValue;
    state.results[s] = v;
    fs.writeFileSync(path.join(dir, `.cdp-step-${s}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value: v } }));
    const fail = checkStep(s, v);
    if (fail) {
      state.errors.push({ step: s, reason: fail, value: v });
      saveState(state);
      console.log(JSON.stringify({ ok: false, step: s, value: v, stopped: true }));
      process.exit(1);
    }
  }
  state.idx += 1;
  saveState(state);
  console.log(JSON.stringify({ ok: true, batch: b.key, value: batchValue }));
  process.exit(0);
}

if (cmd === 'summary') {
  const state = loadState();
  const r = state.results;
  const out = {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: r[4] ?? null,
    cssVerify: r[5] ?? null,
    cssFinalize: r[6] ?? null,
    encInit: r[7] ?? null,
    enc0: r[13] ?? null,
    enc1: r[19] ?? null,
    enc2: r[25] ?? null,
    enc3: r[28] ?? null,
    encRun: r[29] ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: reset|next|record|summary');
process.exit(2);
