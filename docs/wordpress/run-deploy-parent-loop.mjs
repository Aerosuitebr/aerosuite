/**
 * Parent-agent helper: run steps 1-29 via prep/record after each MCP call.
 * Usage (from agent, on viewId c11c39):
 *   node run-deploy-parent-loop.mjs next   -> prints step index + callPath
 *   node run-deploy-parent-loop.mjs record <n> < response.json
 *   node run-deploy-parent-loop.mjs summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.deploy-parent-state.json');
const viewId = process.argv[3] || 'c11c39';

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { next: 1, results: {}, errors: [] };
}
function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

const cmd = process.argv[2];
const s = load();

if (cmd === 'next') {
  const n = s.next;
  if (n > 29) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  execSync(`node .cdp-run-mcp-batch.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'inherit' });
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  console.log(JSON.stringify({ step: n, callPath, viewId }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const raw = fs.readFileSync(0, 'utf8');
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), raw);
  execSync(`node .cdp-run-mcp-batch.mjs record ${n}`, { cwd: dir, input: raw, stdio: ['pipe', 'inherit', 'inherit'] });
  const st = load();
  const resp = JSON.parse(raw);
  st.results[n] = resp?.result?.value;
  st.next = n + 1;
  save(st);
  console.log(JSON.stringify({ recorded: n, next: st.next, value: st.results[n] }));
  process.exit(0);
}

if (cmd === 'summary') {
  execSync('node .cdp-run-mcp-batch.mjs summary', { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

console.error('usage: next | record <n> | summary');
process.exit(2);
