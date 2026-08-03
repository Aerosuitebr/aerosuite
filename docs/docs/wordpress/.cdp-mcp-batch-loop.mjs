/**
 * Agent loop helper:
 *   node .cdp-mcp-batch-loop.mjs prep <emit-file> <viewId>
 *   node .cdp-mcp-batch-loop.mjs record <emit-file> <mcp-response-json>
 *   node .cdp-mcp-batch-loop.mjs final
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-mcp-batch-state.json');
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

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { steps: {}, errors: [], done: [] };
}

function saveState(s) {
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

const cmd = process.argv[2];

if (cmd === 'prep') {
  const emitFile = process.argv[3];
  const viewId = process.argv[4] || 'd0b754';
  const args = JSON.parse(fs.readFileSync(path.join(dir, emitFile), 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-mcp-current-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ emitFile, viewId, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const emitFile = process.argv[3];
  const raw = process.argv[4] || fs.readFileSync(0, 'utf8');
  const mcpRes = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(fs.readFileSync(raw, 'utf8'));
  const value = mcpRes?.result?.result?.value ?? mcpRes?.result?.value ?? null;
  const state = loadState();
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/^\d+$/.test(k)) {
        const n = Number(k);
        state.steps[n] = v;
        if ([4, 5, 6, 7, 29].includes(n) && checkpointFail(n, v)) {
          state.errors.push({ emitFile, step: n, checkpoint: 'fail', value: v });
          saveState(state);
          console.log(JSON.stringify({ ok: false, value, state }));
          process.exit(1);
        }
      }
    }
  }
  state.done.push(emitFile);
  saveState(state);
  console.log(JSON.stringify({ ok: true, value, steps: state.steps }));
  process.exit(0);
}

if (cmd === 'final') {
  const state = loadState();
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

if (cmd === 'reset') {
  saveState({ steps: {}, errors: [], done: [] });
  console.log('reset');
  process.exit(0);
}

console.error('prep|record|final|reset');
process.exit(2);
