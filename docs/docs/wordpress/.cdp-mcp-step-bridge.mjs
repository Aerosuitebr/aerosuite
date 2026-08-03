/**
 * Emit next step MCP args to .cdp-mcp-do-now.json; agent CallMcpTool then: node .cdp-mcp-step-bridge.mjs done '<json>'
 * Usage: node .cdp-mcp-step-bridge.mjs next 3 29 f8a339
 */
import fs from 'fs';
import { execSync } from 'child_process';

const cmd = process.argv[2];
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 29);
const viewId = process.argv[5] ?? 'f8a339';
const stateFile = '.cdp-mcp-bridge-state.json';

function loadState() {
  if (fs.existsSync(stateFile)) return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  return { next: start, end, viewId, errors: [] };
}
function saveState(s) {
  fs.writeFileSync(stateFile, JSON.stringify(s));
}

function checkStep(n, value, raw) {
  if (raw?.exceptionDetails) return { fail: true, reason: 'exception', value: raw.exceptionDetails };
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: 'step4', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { fail: true, reason: 'step5', value };
  if (n === 6 && !value?.ok) return { fail: true, reason: 'step6', value };
  if (n === 7 && !value?.ok) return { fail: true, reason: 'step7', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'step29', value };
  return { fail: false };
}
function extract(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

if (cmd === 'reset') {
  saveState({ next: start, end, viewId, errors: [] });
  console.log(JSON.stringify({ reset: true, start, end, viewId }));
  process.exit(0);
}

if (cmd === 'next') {
  const s = loadState();
  if (s.next > s.end) {
    console.log(JSON.stringify({ done: true, errors: s.errors }));
    process.exit(0);
  }
  const n = s.next;
  execSync(`node .cdp-prep-ready.mjs ${n} ${s.viewId}`, { stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
  fs.writeFileSync('.cdp-mcp-do-now.json', JSON.stringify({ step: n, ...args }));
  console.log(JSON.stringify({ step: n, viewId: args.viewId, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'done') {
  const raw = JSON.parse(process.argv[3]);
  const s = loadState();
  const n = s.next;
  fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify(raw));
  const value = extract(raw);
  const chk = checkStep(n, value, raw);
  if (chk.fail) {
    s.errors.push({ step: n, ...chk });
    saveState(s);
    console.log(JSON.stringify({ ok: false, step: n, ...chk }));
    process.exit(1);
  }
  s.next = n + 1;
  saveState(s);
  console.log(JSON.stringify({ ok: true, step: n, value, next: s.next }));
  process.exit(0);
}

console.error('usage: reset|next|done');
process.exit(2);
