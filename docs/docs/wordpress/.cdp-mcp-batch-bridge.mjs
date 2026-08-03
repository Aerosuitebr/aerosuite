/**
 * Bridge for .cdp-call-N.json batch: writes .cdp-mcp-invoke-now.json, waits for .cdp-mcp-result.json
 * Usage: node .cdp-mcp-batch-bridge.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'a3746c';
const invokeFile = path.join(dir, '.cdp-mcp-invoke-now.json');
const resultFile = path.join(dir, '.cdp-mcp-result.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  if (!fs.existsSync(callPath)) {
    execSync(`node .cdp-run-mcp-batch.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  }
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  call.viewId = viewId;
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(invokeFile, JSON.stringify({ step: n, ...call }));
  process.stderr.write(`AWAIT ${n}\n`);

  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultFile)) {
      result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      fs.unlinkSync(resultFile);
      break;
    }
    await sleep(200);
  }
  if (!result) {
    console.error(JSON.stringify({ ok: false, step: n, error: 'timeout' }));
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), JSON.stringify(result));
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: JSON.stringify(result),
    encoding: 'utf8',
  });
  process.stderr.write(proc.stdout || proc.stderr || '');
  if (proc.status !== 0) {
    process.exit(proc.status || 1);
  }
  process.stderr.write(`OK ${n}\n`);
}

console.log(JSON.stringify({ ok: true, from: start, to: end }));
