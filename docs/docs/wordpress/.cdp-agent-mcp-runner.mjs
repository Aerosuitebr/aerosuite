/**
 * Prepares per-step MCP payloads and records results.
 * Usage:
 *   node .cdp-agent-mcp-runner.mjs prepare <step> [viewId]
 *   node .cdp-agent-mcp-runner.mjs record <step> '<mcp-response-json>'
 *   node .cdp-agent-mcp-runner.mjs summary [requestedViewId] [activeViewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-agent-run-state.json');
const cmd = process.argv[2];
const step = Number(process.argv[3]);
const viewId = process.argv[4] || 'ac5057';

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

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { next: 0, results: {}, summary: {}, errors: [] };

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r?.result?.value ?? r?.value ?? r?.result ?? r;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: 'cssFullRun checkpoint', value };
  }
  if (i === 5 && !value?.hasGrid) {
    return { fail: true, reason: 'cssVerify hasGrid', value };
  }
  if (i === 6 && !value?.ok) {
    return { fail: true, reason: 'cssFinalize ok', value };
  }
  if (i === 7 && !value?.ok) {
    return { fail: true, reason: 'encInit ok', value };
  }
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: 'encRun checkpoint', value };
  }
  return { fail: false };
}

if (cmd === 'reset') {
  state = { next: 0, results: {}, summary: {}, errors: [] };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset');
  process.exit(0);
}

if (cmd === 'prepare') {
  const ready = path.join(dir, `.cdp-step-${step}.mcp-ready.json`);
  const fallback = path.join(dir, `.cdp-step-${step}.args.json`);
  const src = fs.existsSync(ready) ? ready : fallback;
  const a = JSON.parse(fs.readFileSync(src, 'utf8'));
  a.viewId = viewId;
  const payload = { viewId: a.viewId, method: a.method, params: a.params };
  const out = path.join(dir, '.cdp-current-mcp-args.json');
  fs.writeFileSync(out, JSON.stringify(payload));
  console.log(JSON.stringify({ step, exprLen: payload.params?.expression?.length ?? 0, out }));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = process.argv[4] || '{}';
  try {
    const value = extractValue(raw);
    state.results[step] = value;
    const key = summaryKeys[step];
    if (key) state.summary[key] = value;
    const chk = checkStep(step, value);
    if (chk.fail) {
      state.errors.push({ step, value: chk.value, reason: chk.reason });
      fs.writeFileSync(statePath, JSON.stringify(state));
      console.log(JSON.stringify({ ok: false, step, value, stopped: true }));
      process.exit(1);
    }
    state.next = step + 1;
    fs.writeFileSync(statePath, JSON.stringify(state));
    console.log(JSON.stringify({ ok: true, step, value }));
    process.exit(0);
  } catch (e) {
    state.errors.push({ step, error: String(e) });
    fs.writeFileSync(statePath, JSON.stringify(state));
    console.log(JSON.stringify({ ok: false, step, error: String(e) }));
    process.exit(1);
  }
}

if (cmd === 'summary') {
  const requestedViewId = process.argv[3] || 'a9930e';
  const activeViewId = process.argv[4] || 'c11c39';
  const s = state.summary || {};
  const out = {
    viewId: requestedViewId,
    activeViewId,
    cssFullRun: s.cssFullRun ?? null,
    cssVerify: s.cssVerify ?? null,
    cssFinalize: s.cssFinalize ?? null,
    encInit: s.encInit ?? null,
    enc0: s.enc0 ?? null,
    enc1: s.enc1 ?? null,
    enc2: s.enc2 ?? null,
    enc3: s.enc3 ?? null,
    encRun: s.encRun ?? null,
    errors: state.errors,
  };
  fs.writeFileSync(path.join(dir, '.cdp-manifest-summary.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: prepare|record|summary|reset');
process.exit(2);
