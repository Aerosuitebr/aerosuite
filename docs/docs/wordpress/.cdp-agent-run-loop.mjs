/**
 * Agent loop helper: emit next step args; record MCP response.
 * node .cdp-agent-run-loop.mjs next [start] [end]
 * node .cdp-agent-run-loop.mjs record <n> <response.json>
 * node .cdp-agent-run-loop.mjs summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-agent-run-state.json');
const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { next: 0, recorded: {}, errors: [], viewId: 'd0bf03' };
}
function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}
function extractValue(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? null;
}
function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (n === 6 && !value?.ok) return 'step6 ok';
  if (n === 7 && !value?.ok) return 'step7 ok';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

const cmd = process.argv[2];
if (cmd === 'reset') {
  save({ next: 0, recorded: {}, errors: [], viewId: process.argv[3] || 'd0bf03' });
  process.exit(0);
}

if (cmd === 'next') {
  const s = load();
  const start = Number(process.argv[3] ?? s.next);
  const end = Number(process.argv[4] ?? 29);
  for (let n = start; n <= end; n++) {
    const p = path.join(dir, `.cdp-call-${n}.json`);
    if (!fs.existsSync(p)) {
      console.log(JSON.stringify({ done: true, reason: 'no-file', n }));
      process.exit(0);
    }
    const args = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(JSON.stringify({ step: n, method: args.method, params: args.params, viewId: args.viewId }));
    process.exit(0);
  }
  console.log(JSON.stringify({ done: true }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const respPath = process.argv[4];
  const raw = fs.readFileSync(respPath, 'utf8');
  const resp = JSON.parse(raw);
  const value = extractValue(resp);
  const s = load();
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), raw);
  if (summaryKeys[n]) s.recorded[summaryKeys[n]] = value;
  const fail = checkStep(n, value);
  if (fail) {
    s.errors.push({ step: n, reason: fail, value });
    if (n === 4) {
      s.next = 0;
      save(s);
      console.log(JSON.stringify({ ok: false, retryFrom: 0, step: n, value, reason: fail }));
      process.exit(1);
    }
    save(s);
    console.log(JSON.stringify({ ok: false, step: n, value, reason: fail }));
    process.exit(1);
  }
  s.next = n + 1;
  save(s);
  console.log(JSON.stringify({ ok: true, step: n, value, next: s.next }));
  process.exit(0);
}

if (cmd === 'summary') {
  const s = load();
  const out = {
    viewId: 'a9930e',
    activeViewId: s.viewId,
    cssFullRun: s.recorded.cssFullRun ?? null,
    cssVerify: s.recorded.cssVerify ?? null,
    cssFinalize: s.recorded.cssFinalize ?? null,
    encInit: s.recorded.encInit ?? null,
    enc0: s.recorded.enc0 ?? null,
    enc1: s.recorded.enc1 ?? null,
    enc2: s.recorded.enc2 ?? null,
    enc3: s.recorded.enc3 ?? null,
    encRun: s.recorded.encRun ?? null,
    errors: s.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(0);
}

console.error('usage: reset|next|record|summary');
process.exit(2);
