/**
 * Prep step N, wait for agent to write .cdp-step-N.mcp-in.json (raw MCP response), save .cdp-step-N.mcp-out.json
 * Usage: node .agent-mcp-step-runner.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import { execSync } from 'child_process';

const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '4610b7';

function checkStep(n, value, raw) {
  if (raw?.exceptionDetails) return { fail: true, reason: 'exception', value: raw.exceptionDetails };
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: 'step4', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { fail: true, reason: 'step5', value };
  if (n === 6 && !value?.ok) return { fail: true, reason: 'step6', value };
  if (n === 7 && !value?.ok) return { fail: true, reason: 'step7', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'step29', value };
  return { fail: false };
}

function extract(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

for (let n = start; n <= end; n++) {
  const inPath = `.cdp-step-${n}.mcp-in.json`;
  const outPath = `.cdp-step-${n}.mcp-out.json`;
  if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'inherit' });
  console.log(`AWAIT_STEP ${n}`);
  let raw = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(inPath)) {
      raw = JSON.parse(fs.readFileSync(inPath, 'utf8'));
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  if (!raw) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  fs.writeFileSync(outPath, JSON.stringify(raw));
  const value = extract(raw);
  const chk = checkStep(n, value, raw);
  if (chk.fail) {
    console.log(JSON.stringify({ error: 'checkpoint', step: n, ...chk }));
    process.exit(1);
  }
  console.log(`OK_STEP ${n} ${JSON.stringify(value).slice(0, 120)}`);
}
console.log('ALL_OK');
