/**
 * Run steps via MCP by writing pending invoke files; uses node to read payload and agent calls MCP.
 * node .cdp-run-steps-batch.mjs run 0 29 dc48c3
 * After each AWAIT line, agent must: read .cdp-pending-mcp.json -> CallMcpTool -> node .cdp-run-steps-batch.mjs resp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const pending = path.join(dir, '.cdp-pending-mcp.json');
const statePath = path.join(dir, '.cdp-batch-run-state.json');

function load() {
  return fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
}
function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

if (cmd === 'run') {
  const start = Number(process.argv[3] ?? 0);
  const end = Number(process.argv[4] ?? 29);
  const viewId = process.argv[5] ?? 'dc48c3';
  save({ next: start, end, viewId });
  const s = load();
  const n = s.next;
  execSync(`node .cdp-mcp-payload.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const payload = JSON.parse(
    spawnSync('node', ['.cdp-mcp-payload.mjs', String(n), viewId], { cwd: dir, encoding: 'utf8' }).stdout.trim()
  );
  // payload is stdout JSON from mcp-payload - fix: read from file
  const p = JSON.parse(
    fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8')
  );
  const invoke = { method: p.method, params: p.params, viewId };
  fs.writeFileSync(pending, JSON.stringify({ step: n, ...invoke }));
  console.log(JSON.stringify({ await: n, exprLen: p.params.expression.length }));
  process.exit(0);
}

if (cmd === 'resp') {
  const s = load();
  const n = s.next;
  const raw = fs.readFileSync(process.argv[3] || path.join(dir, `.cdp-mcp-resp-${n}.json`), 'utf8');
  const resp = JSON.parse(raw);
  const out = resp.result ? { result: resp.result } : resp;
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), JSON.stringify(out));
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: JSON.stringify(out),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  if (proc.status !== 0) {
    process.stderr.write(proc.stderr || '');
    process.exit(proc.status || 1);
  }
  s.next = n + 1;
  save(s);
  if (s.next > s.end) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  execSync(`node .cdp-run-steps-batch.mjs run ${s.next} ${s.end} ${s.viewId}`, { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

console.error('usage: run start end viewId | resp [respFile]');
process.exit(2);
