/**
 * Run steps start..end via browser_cdp MCP handshake files.
 * Agent loop: node .cdp-mcp-handshake.mjs emit -> CallMcpTool -> save resp -> node .cdp-mcp-handshake.mjs done
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[4] || 'dc48c3';
const invokeFile = path.join(dir, '.cdp-mcp-invoke-now.json');
const respFile = path.join(dir, '.cdp-mcp-result-now.json');
const stateFile = path.join(dir, '.cdp-mcp-handshake-state.json');

function loadState() {
  return fs.existsSync(stateFile)
    ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
    : { next: 0, end: 29, viewId };
}

function saveState(s) {
  fs.writeFileSync(stateFile, JSON.stringify(s, null, 2));
}

if (cmd === 'init') {
  saveState({ next: Number(process.argv[3] ?? 0), end: Number(process.argv[5] ?? 29), viewId });
  console.log(JSON.stringify({ ok: true }));
  process.exit(0);
}

if (cmd === 'emit') {
  const s = loadState();
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
  if (fs.existsSync(respFile)) fs.unlinkSync(respFile);
  fs.writeFileSync(invokeFile, JSON.stringify(call));
  console.log(JSON.stringify({ step: n, exprLen: call.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'done') {
  const s = loadState();
  const n = s.next;
  const raw = process.argv[3] || fs.readFileSync(respFile, 'utf8');
  const resp = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const out = resp.result ? { result: resp.result } : resp;
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), JSON.stringify(out));
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: JSON.stringify(out),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  process.stderr.write(proc.stderr || '');
  if (proc.status !== 0) process.exit(proc.status || 1);
  s.next = n + 1;
  saveState(s);
  console.log(JSON.stringify({ ok: true, next: s.next }));
  process.exit(0);
}

console.error('usage: init start end viewId | emit | done [json]');
process.exit(2);
