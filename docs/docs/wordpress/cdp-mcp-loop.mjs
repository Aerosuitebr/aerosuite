/**
 * Loop steps 1-29: write args for viewId, wait for .cdp-mcp-response.json, record summary.
 * Agent: after each AWAIT, CallMcpTool browser_cdp with .cdp-mcp-current.json contents, write full response to .cdp-mcp-response.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '8a2e1a';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);
const cmd = process.argv[5] || 'await';
const step = Number(process.argv[6]);
const statePath = path.join(dir, '.cdp-loop-state.json');
const currentPath = path.join(dir, '.cdp-mcp-current.json');
const respPath = path.join(dir, '.cdp-mcp-response.json');

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
    : { results: {}, summary: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r?.result?.value ?? r?.value ?? r?.result ?? r;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708))
    return { fail: true, reason: 'cssFullRun', value };
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708))
    return { fail: true, reason: 'cssVerify', value };
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize', value };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit', value };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2))
    return { fail: true, reason: 'encRun', value };
  return { fail: false };
}

if (cmd === 'prepare') {
  const a = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${step}.args.json`), 'utf8'));
  a.viewId = viewId;
  fs.writeFileSync(currentPath, JSON.stringify({ viewId: a.viewId, method: a.method, params: a.params }));
  if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
  console.log(JSON.stringify({ await: step, exprLen: a.params?.expression?.length ?? 0 }));
} else if (cmd === 'record') {
  const state = loadState();
  const resp = JSON.parse(fs.readFileSync(respPath, 'utf8'));
  const value = extractValue(resp);
  state.results[step] = value;
  const key = summaryKeys[step];
  if (key) state.summary[key] = value;
  const chk = checkStep(step, value);
  if (chk.fail) {
    state.errors.push({ step, reason: chk.reason, value: chk.value });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step, value, stopped: true }));
    process.exit(1);
  }
  saveState(state);
  console.log(JSON.stringify({ ok: true, step, value }));
} else if (cmd === 'summary') {
  const state = loadState();
  const out = {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: state.summary.cssFullRun ?? null,
    cssVerify: state.summary.cssVerify ?? null,
    cssFinalize: state.summary.cssFinalize ?? null,
    encInit: state.summary.encInit ?? null,
    enc0: state.summary.enc0 ?? null,
    enc1: state.summary.enc1 ?? null,
    enc2: state.summary.enc2 ?? null,
    enc3: state.summary.enc3 ?? null,
    encRun: state.summary.encRun ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
} else if (cmd === 'reset') {
  saveState({ results: {}, summary: {}, errors: [] });
  console.log('reset');
} else {
  console.error('usage: prepare|record|summary|reset');
  process.exit(2);
}
