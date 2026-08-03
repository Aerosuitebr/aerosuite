/**
 * Run steps via b64 MCP handshake. Writes .cdp-mcp-b64-now.json, waits for .cdp-last-mcp-response.json update.
 * Usage: node .cdp-run-mcp-range.mjs <start> <end> [viewId]
 * Agent: after AWAIT line, CallMcpTool with .cdp-mcp-b64-now.json, write .cdp-last-mcp-response.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '847540';

const plan = [];
for (let n = 1; n <= 3; n++) if (n >= start && n <= end) plan.push({ kind: 'step', n });
const batches = [
  { name: '4-7', file: '.cdp-batch-4-7-call.json', steps: [4, 5, 6, 7] },
  { name: '8-13', file: '.cdp-batch-8-13-call.json', steps: [8, 9, 10, 11, 12, 13] },
  { name: '14-19', file: '.cdp-batch-14-19-call.json', steps: [14, 15, 16, 17, 18, 19] },
  { name: '20-25', file: '.cdp-batch-20-25-call.json', steps: [20, 21, 22, 23, 24, 25] },
  { name: '26-29', file: '.cdp-batch-26-29-call.json', steps: [26, 27, 28, 29] },
];
for (const b of batches) {
  if (Math.min(...b.steps) >= start && Math.max(...b.steps) <= end) plan.push({ kind: 'batch', ...b });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function prep(item) {
  if (item.kind === 'step') {
    execSync(`node .cdp-mcp-b64-wrap.mjs ${item.n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    fs.copyFileSync(path.join(dir, `.cdp-mcp-b64-step-${item.n}.json`), path.join(dir, '.cdp-mcp-b64-now.json'));
    return { tag: String(item.n), record: ['node', '.cdp-save-record.mjs', String(item.n), '.cdp-last-mcp-response.json'] };
  }
  execSync(`node .cdp-mcp-b64-from.mjs ${item.file} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  return { tag: item.name, record: ['node', '.cdp-record-batch.mjs', '.cdp-last-mcp-response.json'] };
}

function record(item) {
  const cmd = prep(item);
  const r = spawnSync(cmd.record[0], cmd.record.slice(1), { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'record failed');
}

for (const item of plan) {
  const respPath = path.join(dir, '.cdp-last-mcp-response.json');
  if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
  prep(item);
  console.log(`AWAIT ${item.kind === 'step' ? item.n : item.name}`);
  process.exit(0);
}

console.log('DONE');
