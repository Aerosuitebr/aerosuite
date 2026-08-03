/**
 * Execute steps via MCP browser_cdp using invoke file handshake (agent fills .cdp-mcp-result-now.json).
 * Usage: node .cdp-auto-mcp-runner.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'dc48c3';
const invokeFile = path.join(dir, '.cdp-mcp-invoke-now.json');
const respFile = path.join(dir, '.cdp-mcp-result-now.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

execSync(`node .cdp-mcp-handshake.mjs init ${start} ${viewId} ${end}`, { cwd: dir, stdio: 'pipe' });

for (;;) {
  const emit = spawnSync('node', ['.cdp-mcp-handshake.mjs', 'emit'], { cwd: dir, encoding: 'utf8' });
  const info = JSON.parse(emit.stdout.trim());
  if (info.done) {
    console.log(JSON.stringify({ ok: true, from: start, to: end }));
    process.exit(0);
  }
  const n = info.step;
  process.stderr.write(`AWAIT_MCP ${n}\n`);
  if (fs.existsSync(respFile)) fs.unlinkSync(respFile);
  let got = null;
  for (let t = 0; t < 3600; t++) {
    if (fs.existsSync(respFile)) {
      got = fs.readFileSync(respFile, 'utf8');
      break;
    }
    await sleep(100);
  }
  if (!got) {
    console.error(JSON.stringify({ ok: false, step: n, error: 'timeout' }));
    process.exit(1);
  }
  const done = spawnSync('node', ['.cdp-mcp-handshake.mjs', 'done'], {
    cwd: dir,
    input: got,
    encoding: 'utf8',
  });
  process.stdout.write(done.stdout || '');
  if (done.status !== 0) {
    process.stderr.write(done.stderr || '');
    process.exit(done.status || 1);
  }
}
