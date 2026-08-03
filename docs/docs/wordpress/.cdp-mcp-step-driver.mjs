/**
 * Print next step MCP args; agent writes .cdp-mcp-result.json then re-runs with --continue.
 * Usage: node .cdp-mcp-step-driver.mjs start <n> <viewId>
 *        node .cdp-mcp-step-driver.mjs continue
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-mcp-driver-state.json');
const cmd = process.argv[2];

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { n: 2, end: 29, viewId: '51e397' };
}
function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s));
}

if (cmd === 'start') {
  const s = { n: Number(process.argv[3]), end: Number(process.argv[4]), viewId: process.argv[5] || '51e397' };
  save(s);
  console.log(JSON.stringify({ action: 'run', step: s.n, viewId: s.viewId }));
  process.exit(0);
}

if (cmd === 'continue') {
  const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-result.json'), 'utf8');
  const s = load();
  try {
    execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(s.n), raw], { cwd: dir, stdio: 'pipe' });
  } catch (e) {
    console.log(JSON.stringify({ action: 'fail', step: s.n, err: String(e.stdout || e.stderr || e.message) }));
    process.exit(1);
  }
  if (s.n >= s.end) {
    fs.unlinkSync(statePath);
    console.log(JSON.stringify({ action: 'done' }));
    process.exit(0);
  }
  s.n += 1;
  save(s);
  console.log(JSON.stringify({ action: 'run', step: s.n, viewId: s.viewId }));
  process.exit(0);
}

if (cmd === 'args') {
  const n = Number(process.argv[3]);
  const viewId = process.argv[4] || '51e397';
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-temp-call.json'), JSON.stringify({ viewId, method: j.method, params: j.params }));
  console.log(JSON.stringify({ step: n, exprLen: j.params?.expression?.length ?? 0 }));
  process.exit(0);
}

console.error('usage: start|continue|args');
process.exit(2);
