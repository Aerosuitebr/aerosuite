/** Prepare step N and wait for .cdp-step-N-mcp-response.json. Usage: node .cdp-agent-step-wait.mjs <n> <viewId> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '2effaf';
const respPath = path.join(dir, `.cdp-step-${n}-mcp-response.json`);

if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
execSync(`node .cdp-mcp-run-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
fs.writeFileSync(path.join(dir, '.cdp-mcp-do-now.json'), JSON.stringify({ step: n, ...call, viewId }));
console.log(JSON.stringify({ needMcp: n, viewId, method: call.method, params: call.params }));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let t = 0; t < 1800; t++) {
  if (fs.existsSync(respPath)) {
    console.log(JSON.stringify({ done: n, ok: true }));
    process.exit(0);
  }
  await sleep(100);
}
console.error(JSON.stringify({ done: n, ok: false, error: 'timeout' }));
process.exit(1);
