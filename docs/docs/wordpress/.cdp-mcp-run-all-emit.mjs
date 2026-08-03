/**
 * Run all emit batches: writes each call to .cdp-mcp-current-call.json
 * Agent must CallMcpTool browser_cdp with that JSON, then:
 *   node .cdp-mcp-run-all-emit.mjs done <mcp-response-json>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-mcp-run-all-state.json');
const callPath = path.join(dir, '.cdp-mcp-current-call.json');
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];

function load() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { viewId: 'd0b754', idx: 0, steps: {}, errors: [], awaiting: false };
}

function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkpointFail(step, v) {
  if (step === 4) return !(v?.len === 34708 && v?.ok === true);
  if (step === 5) return !(v?.b64 === 34708 && v?.hasGrid === true);
  if (step === 6) return v?.ok !== true;
  if (step === 7) return v?.ok !== true;
  if (step === 29) return !(v?.ok === true && v?.hasHeroV2 === true);
  return false;
}

function mergeValue(state, value, batch) {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) {
      const n = Number(k);
      state.steps[n] = v;
      if ([4, 5, 6, 7, 29].includes(n) && checkpointFail(n, v)) {
        state.errors.push({ batch, step: n, checkpoint: 'fail', value: v });
        return false;
      }
    }
  }
  return true;
}

const cmd = process.argv[2];

if (cmd === 'init') {
  const viewId = process.argv[3] || 'd0b754';
  save({ viewId, idx: 0, steps: {}, errors: [], awaiting: false });
  console.log(JSON.stringify({ ok: true, viewId }));
  process.exit(0);
}

if (cmd === 'next') {
  const state = load();
  if (state.idx >= batches.length) {
    console.log(JSON.stringify({ done: true, final: true, state }));
    process.exit(0);
  }
  const batch = batches[state.idx];
  const args = JSON.parse(fs.readFileSync(path.join(dir, batch), 'utf8'));
  args.viewId = state.viewId;
  fs.writeFileSync(callPath, JSON.stringify(args));
  state.awaiting = true;
  state.currentBatch = batch;
  save(state);
  console.log(
    JSON.stringify({
      done: false,
      batch,
      idx: state.idx,
      viewId: state.viewId,
      exprLen: args.params?.expression?.length ?? 0,
      callFile: '.cdp-mcp-current-call.json',
    })
  );
  process.exit(0);
}

if (cmd === 'done') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  const mcpRes = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(fs.readFileSync(raw, 'utf8'));
  const value = mcpRes?.result?.result?.value ?? mcpRes?.result?.value ?? null;
  const state = load();
  const batch = state.currentBatch || batches[state.idx];
  if (!mergeValue(state, value, batch)) {
    save(state);
    console.log(JSON.stringify({ ok: false, stopped: true, state }));
    process.exit(1);
  }
  state.idx += 1;
  state.awaiting = false;
  save(state);
  console.log(JSON.stringify({ ok: true, batch, value, idx: state.idx }));
  process.exit(0);
}

if (cmd === 'final') {
  const state = load();
  console.log(
    JSON.stringify({
      cssFullRun: state.steps[4],
      cssVerify: state.steps[5],
      cssFinalize: state.steps[6],
      encInit: state.steps[7],
      enc0: state.steps[13],
      enc1: state.steps[19],
      enc2: state.steps[25],
      enc3: state.steps[28],
      encRun: state.steps[29],
      errors: state.errors,
      steps: state.steps,
    })
  );
  process.exit(0);
}

console.error('init|next|done|final');
process.exit(2);
