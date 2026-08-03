/**
 * Orchestrator: prepares each step, waits for .cdp-mcp-result.json, records.
 * Usage: node agent-step-orchestrator.mjs <viewId> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '7c1495';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const callPath = path.join(dir, '.cdp-mcp-call-min.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  execSync(`node step-payload.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const payload = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-step-payload.json'), 'utf8'));
  fs.writeFileSync(
    callPath,
    JSON.stringify({ method: payload.method, params: payload.params, viewId: payload.viewId })
  );
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(`AWAIT ${n} exprLen=${payload.params?.expression?.length ?? 0}`);
  let result = null;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultPath)) {
      result = fs.readFileSync(resultPath, 'utf8');
      break;
    }
    await sleep(200);
  }
  if (!result) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  try {
    const rec = execSync(`node record-step-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
    console.log(`DONE ${n} ${rec.trim()}`);
    if (rec.includes('"stopped":true') || rec.includes('"ok":false')) {
      process.exit(1);
    }
  } catch (e) {
    console.log(`FAIL ${n} ${e.stdout || e.message}`);
    process.exit(1);
  }
}

const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' });
console.log('FINAL', summary.trim());
