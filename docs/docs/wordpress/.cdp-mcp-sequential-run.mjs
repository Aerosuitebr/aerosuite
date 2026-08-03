/**
 * Sequential MCP step runner: reads .cdp-step-N.invoke.json, prints step result JSON lines.
 * Parent agent must call browser_cdp; this script only validates checkpoints from saved results.
 * Usage: node .cdp-mcp-sequential-run.mjs record <step> '<mcp-response-json>'
 *        node .cdp-mcp-sequential-run.mjs next [viewId]
 *        node .cdp-mcp-sequential-run.mjs summary [viewId] [activeViewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-mcp-seq-state.json');
const cmd = process.argv[2] || 'next';
const viewId = process.argv[3] || 'd15c6f';
const activeViewId = process.argv[4] || '4a20d1';
const requestedViewId = 'a9930e';

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { next: 1, results: {}, errors: [] };

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

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r?.result?.value ?? r?.value ?? r?.result ?? r;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: 'cssFullRun checkpoint' };
  }
  if (i === 5 && !value?.hasGrid) {
    return { fail: true, reason: 'cssVerify hasGrid' };
  }
  if (i === 6 && !value?.ok) {
    return { fail: true, reason: 'cssFinalize ok' };
  }
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: 'encRun checkpoint' };
  }
  return { fail: false };
}

if (cmd === 'reset') {
  state = { next: 1, results: {}, errors: [] };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset');
  process.exit(0);
}

if (cmd === 'record') {
  const step = Number(process.argv[3]);
  const raw = process.argv[4] || '{}';
  try {
    const value = extractValue(raw);
    state.results[step] = value;
    const key = summaryKeys[step];
    if (key) state.summary = state.summary || {};
    if (key) state.summary[key] = value;
    const chk = checkStep(step, value);
    if (chk.fail) {
      state.errors.push({ step, value, reason: chk.reason });
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

if (cmd === 'next') {
  const i = state.next;
  if (i > 29) {
    console.log('DONE');
    process.exit(0);
  }
  const invokePath = path.join(dir, `.cdp-step-${i}.invoke.json`);
  const args = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-next-mcp-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ step: i, invokePath, argsPath: invokePath, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'summary') {
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

console.error('unknown cmd');
process.exit(2);
