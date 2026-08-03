/**
 * Run steps via browser_cdp by reading .cdp-mcp-payload-N.json
 * Writes NEED_MCP N to stderr; reads .cdp-step-N.mcp-in.json after agent CallMcpTool
 * Usage: node .cdp-mcp-orchestrator.mjs 2 29 f8a339
 */
import fs from 'fs';
import { execSync } from 'child_process';

const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f8a339';

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

const errors = [];

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
  fs.writeFileSync(`.cdp-mcp-payload-${n}.json`, JSON.stringify(args));
  const inPath = `.cdp-step-${n}.mcp-in.json`;
  if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  process.stderr.write(`NEED_MCP ${n}\n`);
  let raw = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(inPath)) {
      raw = JSON.parse(fs.readFileSync(inPath, 'utf8'));
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  if (!raw) {
    errors.push({ step: n, error: 'timeout waiting mcp-in' });
    break;
  }
  fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify(raw));
  const value = extract(raw);
  const chk = checkStep(n, value, raw);
  if (chk.fail) {
    errors.push({ step: n, ...chk });
    break;
  }
  process.stderr.write(`OK ${n} ${JSON.stringify(value).slice(0, 80)}\n`);
}

console.log(JSON.stringify({ done: !errors.length, errors, start, end, viewId }));
process.exit(errors.length ? 1 : 0);
