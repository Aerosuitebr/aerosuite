import fs from 'fs';
import { execSync } from 'child_process';

const cmd = process.argv[2];
const viewId = '86ffcf';
const statePath = '.cdp-inline-state.json';
const callPath = '.cdp-mcp-call-inline.json';

function load() {
  return fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { next: 8 };
}

function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s));
}

function check(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return false;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return false;
  if (n === 6 && !value?.ok) return false;
  if (n === 7 && !value?.ok) return false;
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return false;
  return true;
}

if (cmd === 'next') {
  const s = load();
  const n = s.next;
  if (n > 29) {
    console.log('DONE');
    process.exit(0);
  }
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
  fs.writeFileSync(callPath, JSON.stringify(args));
  console.log(JSON.stringify({ step: n, viewId: args.viewId, exprLen: args.params.expression.length }));
  process.exit(0);
}

if (cmd === 'save') {
  const n = Number(process.argv[3]);
  const raw = process.argv[4] || fs.readFileSync(0, 'utf8');
  const j = JSON.parse(raw);
  const value = j?.result?.value ?? j?.value ?? j;
  fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value } }));
  if (!check(n, value)) {
    console.log(JSON.stringify({ fail: true, step: n, value }));
    process.exit(1);
  }
  const s = load();
  s.next = n + 1;
  save(s);
  console.log(JSON.stringify({ ok: true, step: n, value, next: s.next }));
  process.exit(0);
}

console.error('usage: next | save <n> <json>');
process.exit(2);
