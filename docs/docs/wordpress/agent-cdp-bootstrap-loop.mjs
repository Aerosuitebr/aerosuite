/**
 * Drive steps via expr-server + MCP bootstrap (agent runs MCP per AWAIT).
 * Usage: node agent-cdp-bootstrap-loop.mjs prep
 *        node agent-cdp-bootstrap-loop.mjs write-result <mcpResponseFile>
 *        node agent-cdp-bootstrap-loop.mjs advance
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-bootstrap-state.json');
const viewId = process.argv[3] || '37aca3';
const cmd = process.argv[2];

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { step: 2, viewId, serverPid: null };
}

function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

if (cmd === 'init-server') {
  const child = spawn('node', ['.cdp-expr-server.mjs', 'start'], { cwd: dir, detached: true, stdio: 'ignore' });
  child.unref();
  const s = load();
  s.serverPid = child.pid;
  save(s);
  console.log(JSON.stringify({ serverPid: child.pid }));
  process.exit(0);
}

if (cmd === 'prep') {
  const s = load();
  const n = Number(process.argv[4] ?? s.step);
  execSync(`node agent-mcp-step-loop.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const boot = execSync('node .cdp-expr-server.mjs bootstrap', { cwd: dir, encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(dir, '.cdp-mcp-bootstrap-args.json'), boot);
  if (fs.existsSync(path.join(dir, '.cdp-mcp-result.json'))) fs.unlinkSync(path.join(dir, '.cdp-mcp-result.json'));
  console.log(JSON.stringify({ step: n, bootstrap: true, viewId }));
  process.exit(0);
}

if (cmd === 'write-result') {
  const src = process.argv[4] || path.join(dir, '.cdp-mcp-result-raw.json');
  const raw = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), raw);
  const s = load();
  const out = execSync(`node record-step-result.mjs ${s.step}`, { cwd: dir, encoding: 'utf8' });
  console.log(out.trim());
  process.exit(0);
}

if (cmd === 'advance') {
  const s = load();
  s.step = Math.min(29, s.step + 1);
  save(s);
  console.log(JSON.stringify({ next: s.step }));
  process.exit(0);
}

console.error('usage: init-server|prep|write-result|advance');
process.exit(2);
