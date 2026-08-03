/**
 * Handshake: prep step N, emit AWAIT_MCP N, wait for .cdp-mcp-resp-N.json, record.
 * Usage: node .cdp-handshake-batch.mjs <viewId> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'c11c39';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-run-mcp-batch.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const respPath = path.join(dir, `.cdp-mcp-resp-${n}.json`);
  if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
  process.stderr.write(`AWAIT_MCP ${n}\n`);
  let found = false;
  for (let t = 0; t < 3600; t++) {
    if (fs.existsSync(respPath)) {
      found = true;
      break;
    }
    await sleep(100);
  }
  if (!found) {
    process.stderr.write(`TIMEOUT ${n}\n`);
    process.exit(1);
  }
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: fs.readFileSync(respPath, 'utf8'),
    encoding: 'utf8',
  });
  if (proc.stdout) process.stdout.write(proc.stdout);
  if (proc.stderr) process.stderr.write(proc.stderr);
  if (proc.status !== 0) process.exit(proc.status || 1);
}
