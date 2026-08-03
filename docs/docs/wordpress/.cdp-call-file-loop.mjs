/** Drive steps start..end: writes .cdp-mcp-pending.json, waits for .cdp-mcp-result-now.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '2effaf';
const pendingPath = path.join(dir, '.cdp-mcp-pending.json');
const resultPath = path.join(dir, '.cdp-mcp-result-now.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (n === 6 && !value?.ok) return 'step6 ok';
  if (n === 7 && !value?.ok) return 'step7 ok';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-step-${n}.call.json`);
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(pendingPath, JSON.stringify({ step: n, method: call.method, params: call.params, viewId }));
  process.stderr.write(`NEED_MCP ${n}\n`);

  let raw = null;
  for (let t = 0; t < 3600; t++) {
    if (fs.existsSync(resultPath)) {
      raw = fs.readFileSync(resultPath, 'utf8').trim();
      fs.unlinkSync(resultPath);
      break;
    }
    await sleep(100);
  }
  if (!raw) {
    console.error(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}-mcp-response.json`), raw);
  const proc = spawnSync('node', ['.cdp-agent-record.mjs', String(n)], { cwd: dir, encoding: 'utf8' });
  if (proc.status !== 0) {
    process.stderr.write(proc.stdout || proc.stderr || '');
    process.exit(1);
  }
  let value;
  try {
    value = JSON.parse(raw).result?.value ?? JSON.parse(raw).value;
  } catch {
    value = null;
  }
  const fail = checkStep(n, value);
  process.stderr.write(`OK ${n} ${JSON.stringify(value).slice(0, 120)}\n`);
  if (fail) {
    console.error(JSON.stringify({ fail, step: n, value }));
    process.exit(1);
  }
}
console.log(JSON.stringify({ done: true, start, end }));
