/**
 * Agent-driven CDP batch runner. Writes pending step; waits for MCP response file.
 * Usage: node .cdp-agent-batch-run.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const viewId = process.argv[4] || 'dc48c3';

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  if (!fs.existsSync(callPath)) {
    spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'prep', String(n), viewId], { cwd: dir, stdio: 'inherit' });
  }
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  const args = { method: call.method, params: call.params, viewId };
  const pending = { step: n, args, exprLen: call.params?.expression?.length ?? 0 };
  fs.writeFileSync(path.join(dir, '.cdp-pending-step.json'), JSON.stringify(pending, null, 2));
  fs.unlinkSync(path.join(dir, `.cdp-mcp-resp-${n}.json`)).catch?.(() => {});
  try { fs.unlinkSync(path.join(dir, `.cdp-mcp-resp-${n}.json`)); } catch {}
  console.log(`PENDING ${JSON.stringify(pending.stepInfo ?? { step: n, exprLen: pending.exprLen })}`);
  console.log(`WAIT .cdp-mcp-resp-${n}.json`);

  const deadline = Date.now() + 600000;
  const respPath = path.join(dir, `.cdp-mcp-resp-${n}.json`);
  while (!fs.existsSync(respPath) && Date.now() < deadline) {
    spawnSync(process.platform === 'win32' ? 'powershell' : 'sleep', process.platform === 'win32' ? ['-Command', 'Start-Sleep -Milliseconds 300'] : ['0.3'], { stdio: 'ignore' });
  }
  if (!fs.existsSync(respPath)) {
    console.error(`TIMEOUT step ${n}`);
    process.exit(1);
  }
  const proc = spawnSync('node', ['.cdp-do-step.mjs', 'save', String(n)], { cwd: dir, stdio: 'inherit' });
  if (proc.status !== 0) {
    console.error(`RECORD_FAIL step ${n}`);
    process.exit(proc.status ?? 1);
  }
  console.log(`DONE step ${n}`);
}

console.log('ALL_DONE');
