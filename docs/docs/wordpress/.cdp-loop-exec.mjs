/**
 * Loop steps start..end: read .cdp-step-N.args-only.json, call browser_cdp via stdin protocol.
 * Agent usage: node .cdp-loop-exec.mjs <start> <end> <viewId> <mcpResultFile>
 * When mcpResultFile provided, records result and continues.
 * When not, prints next pending step args path.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '06e2fc';
const cmd = process.argv[5] ?? 'next';
const stepArg = Number(process.argv[6]);
const statePath = path.join(dir, '.cdp-loop-state.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { next: start, results: {}, errors: [] };

function extractValue(mcpOut) {
  const r = typeof mcpOut === 'string' ? JSON.parse(mcpOut) : mcpOut;
  if (r?.isError) throw new Error(JSON.stringify(r));
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value;
  if (v === undefined) throw new Error('no value');
  return v;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: `len=${value?.len}` };
  if (i === 5 && !value?.hasGrid) return { fail: true, reason: 'hasGrid' };
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize' };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit' };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'encRun' };
  return { fail: false };
}

if (cmd === 'record') {
  const raw = JSON.parse(fs.readFileSync(process.argv[7] || path.join(dir, `.cdp-step-${stepArg}.mcp-out.json`), 'utf8'));
  try {
    const value = extractValue(raw);
    state.results[stepArg] = value;
    const chk = checkStep(stepArg, value);
    if (chk.fail) {
      state.errors.push({ step: stepArg, value, reason: chk.reason });
      fs.writeFileSync(statePath, JSON.stringify(state));
      console.log(JSON.stringify({ ok: false, step: stepArg, value, reason: chk.reason }));
      process.exit(1);
    }
    state.next = stepArg + 1;
    fs.writeFileSync(statePath, JSON.stringify(state));
    console.log(JSON.stringify({ ok: true, step: stepArg, value }));
    process.exit(0);
  } catch (e) {
    state.errors.push({ step: stepArg, error: String(e) });
    fs.writeFileSync(statePath, JSON.stringify(state));
    console.log(JSON.stringify({ ok: false, step: stepArg, error: String(e) }));
    process.exit(1);
  }
}

if (cmd === 'summary') {
  const s = {};
  for (const [step, key] of Object.entries(summaryKeys)) s[key] = state.results[step] ?? null;
  const out = { viewId: 'a9930e', activeViewId: '4a20d1', ...s, errors: state.errors };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

const n = state.next;
if (n > end) {
  console.log('DONE');
  process.exit(0);
}
const argsPath = path.join(dir, `.cdp-step-${n}.args-only.json`);
let args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
args.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-call.json'), JSON.stringify({ viewId: args.viewId, method: args.method, params: args.params }));
console.log(JSON.stringify({ step: n, exprLen: args.params?.expression?.length ?? 0, argsFile: '.cdp-current-mcp-call.json' }));
