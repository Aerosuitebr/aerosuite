/**
 * Sync runner: prep step, wait for .cdp-mcp-result.json, record. Agent fills result via MCP.
 * Usage: node sync-cdp-runner.mjs <viewId> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '7c1495';
const start = Number(process.argv[3] ?? 3);
const end = Number(process.argv[4] ?? 29);
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const argsPath = path.join(dir, '.cdp-mcp-args-current.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  execSync(`node agent-mcp-step-loop.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  console.log(`AWAIT ${n}`);
  let result = null;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultPath)) {
      const raw = fs.readFileSync(resultPath, 'utf8').trim();
      try {
        JSON.parse(raw);
        result = raw;
        break;
      } catch {
        /* invalid partial write */
      }
    }
    await sleep(200);
  }
  if (!result) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  try {
    const rec = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
    console.log(`DONE ${n} ${rec.trim()}`);
    if (rec.includes('"stopped":true') || rec.includes('"ok":false')) process.exit(1);
  } catch (e) {
    console.log(`FAIL ${n} ${e.stdout || e.message}`);
    process.exit(1);
  }
}
console.log('ALL_DONE');
