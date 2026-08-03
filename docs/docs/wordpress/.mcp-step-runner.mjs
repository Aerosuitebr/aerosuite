/**
 * Run steps 1-29 via file handshake: writes await file, reads result file.
 * Agent loop: while await exists, CallMcpTool with args, write result, delete await.
 * Usage: node .mcp-step-runner.mjs prepare <n> <viewId>
 *        node .mcp-step-runner.mjs record <n> '<json>'
 *        node .mcp-step-runner.mjs next <viewId>
 *        node .mcp-step-runner.mjs summary <activeViewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.mcp-step-runner-state.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [], next: 1 };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 fail ${JSON.stringify(value)}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 fail ${JSON.stringify(value)}`;
  if (n === 6 && !value?.ok) return 'step6 ok false';
  if (n === 7 && !value?.ok) return 'step7 ok false';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 fail ${JSON.stringify(value)}`;
  return null;
}

function stepFile(n) {
  return path.join(dir, `.step-out-${n}.json`);
}

const cmd = process.argv[2];

if (cmd === 'reset') {
  saveState({ results: {}, errors: [], next: 1 });
  console.log('reset');
  process.exit(0);
}

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  const viewId = process.argv[4] || '8e6349';
  const raw = JSON.parse(fs.readFileSync(stepFile(n), 'utf8'));
  raw.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-step-args.json'), JSON.stringify(raw));
  fs.writeFileSync(path.join(dir, '.cdp-await-step.json'), JSON.stringify({ step: n, viewId }));
  console.log(JSON.stringify({ step: n, viewId, exprLen: raw.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const raw = process.argv[4] || '{}';
  const state = loadState();
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    state.errors.push({ step: n, error: String(e) });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, error: String(e) }));
    process.exit(1);
  }
  const value = parsed?.result?.value ?? parsed?.value ?? parsed;
  state.results[n] = value;
  state.next = n + 1;
  const fail = checkStep(n, value);
  if (fail) {
    state.errors.push({ step: n, reason: fail, value });
    saveState(state);
    if (fs.existsSync(path.join(dir, '.cdp-await-step.json'))) fs.unlinkSync(path.join(dir, '.cdp-await-step.json'));
    console.log(JSON.stringify({ ok: false, step: n, value, stopped: true }));
    process.exit(1);
  }
  saveState(state);
  if (fs.existsSync(path.join(dir, '.cdp-await-step.json'))) fs.unlinkSync(path.join(dir, '.cdp-await-step.json'));
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
  console.log(JSON.stringify({ ok: true, step: n, value }));
  process.exit(0);
}

if (cmd === 'next') {
  const viewId = process.argv[3] || '8e6349';
  const state = loadState();
  const n = state.next;
  if (n > 29) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  const raw = JSON.parse(fs.readFileSync(stepFile(n), 'utf8'));
  raw.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-step-args.json'), JSON.stringify(raw));
  console.log(JSON.stringify({ step: n, viewId, exprLen: raw.params?.expression?.length ?? 0, argsFile: '.cdp-current-step-args.json' }));
  process.exit(0);
}

if (cmd === 'summary') {
  const activeViewId = process.argv[3] || '8e6349';
  const state = loadState();
  const r = state.results;
  const out = {
    viewId: 'a9930e',
    activeViewId,
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

console.error('usage: reset|prepare|record|next|summary');
process.exit(2);
