/**
 * Run steps via MCP file handshake: writes .cdp-mcp-next.json, waits for .cdp-mcp-resp-next.json
 * Agent: read next -> CallMcpTool -> write resp -> node .cdp-mcp-run-all.mjs continue
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-mcp-run-all-state.json');
const viewId = process.argv[3] || 'a3746c';
const cmd = process.argv[2];

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { next: 0, end: 29, viewId };
}

function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

if (cmd === 'init') {
  const start = Number(process.argv[4] ?? 0);
  const end = Number(process.argv[5] ?? 29);
  save({ next: start, end, viewId });
  console.log(JSON.stringify({ ok: true, start, end, viewId }));
  process.exit(0);
}

if (cmd === 'emit') {
  const s = load();
  const n = s.next;
  if (n > s.end) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  if (!fs.existsSync(callPath)) {
    execSync(`node .cdp-run-mcp-batch.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  }
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  call.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-mcp-next.json'), JSON.stringify(call));
  console.log(JSON.stringify({ step: n, exprLen: call.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'continue') {
  const s = load();
  const n = s.next;
  const respPath = path.join(dir, `.cdp-mcp-resp-${n}.json`);
  if (!fs.existsSync(respPath)) {
    console.error(`missing ${respPath}`);
    process.exit(1);
  }
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: fs.readFileSync(respPath, 'utf8'),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  if (proc.status !== 0) {
    process.stderr.write(proc.stderr || '');
    process.exit(proc.status || 1);
  }
  s.next = n + 1;
  save(s);
  process.exit(0);
}

console.error('usage: init|emit|continue');
process.exit(1);
