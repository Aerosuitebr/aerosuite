/**
 * Agent helper: prep step N args; record MCP response from argv.
 * Usage:
 *   node .cdp-mcp-exec-loop.mjs prep <n> [viewId]
 *   node .cdp-mcp-exec-loop.mjs record <n> '<mcp-json>'
 *   node .cdp-mcp-exec-loop.mjs summary [activeViewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const statePath = path.join(dir, '.cdp-mcp-exec-state.json');

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

function loadArgs(n, viewId) {
  const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
  const call = path.join(dir, `.cdp-call-${n}.json`);
  const src = fs.existsSync(ready) ? ready : call;
  const a = JSON.parse(fs.readFileSync(src, 'utf8'));
  a.viewId = viewId;
  return a;
}

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r?.result?.value ?? r?.value ?? null;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

if (cmd === 'prep') {
  const n = Number(process.argv[3]);
  const viewId = process.argv[4] || '754d2e';
  const args = loadArgs(n, viewId);
  const outPath = path.join(dir, `.cdp-live-step-${n}.json`);
  fs.writeFileSync(outPath, JSON.stringify(args));
  console.log(JSON.stringify({ step: n, exprLen: args.params?.expression?.length ?? 0, outPath }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const raw = process.argv[4] || '{}';
  const state = loadState();
  try {
    const parsed = JSON.parse(raw);
    const value = extractValue(parsed);
    state.results[n] = value;
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(parsed));
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
  } catch (e) {
    state.errors.push({ step: n, error: String(e) });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, error: String(e) }));
    process.exit(1);
  }
}

if (cmd === 'summary') {
  const activeViewId = process.argv[3] || '4a20d1';
  const state = loadState();
  const s = {};
  for (const [step, key] of Object.entries(summaryKeys)) {
    s[key] = state.results[Number(step)] ?? null;
  }
  const out = { viewId: 'a9930e', activeViewId, ...s, errors: state.errors };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: prep|record|summary');
process.exit(2);
