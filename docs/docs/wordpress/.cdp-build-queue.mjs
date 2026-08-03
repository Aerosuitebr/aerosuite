/**
 * Run steps start..end by reading .cdp-mcp-payload-N.json and evaluating
 * via page context injected through browser_cdp handshake files.
 * Agent must call browser_cdp for each AWAIT in .cdp-agent-queue.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '84ede5';
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 29);
const queueFile = path.join(dir, '.cdp-agent-queue.json');
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const logPath = path.join(dir, '.cdp-orchestrate.log');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function awaitStepFromLog() {
  const log = fs.readFileSync(logPath, 'utf8');
  const m = log.match(/AWAIT_STEP (\d+)(?!.*AWAIT_STEP)/s) || log.match(/AWAIT_STEP (\d+)\s*$/m);
  return m ? Number(m[1]) : null;
}

const queue = [];
for (let n = start; n <= end; n++) {
  const p = path.join(dir, `.cdp-mcp-payload-${n}.json`);
  if (!fs.existsSync(p)) continue;
  const call = JSON.parse(fs.readFileSync(p, 'utf8'));
  call.viewId = viewId;
  queue.push({ step: n, call });
}
fs.writeFileSync(queueFile, JSON.stringify({ viewId, queue }, null, 2));
console.log(JSON.stringify({ queued: queue.length, steps: queue.map((q) => q.step) }));
