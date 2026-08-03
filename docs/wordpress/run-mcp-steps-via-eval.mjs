/**
 * Run invoke steps start..end via MCP-equivalent page.evaluate when CDP unavailable.
 * Writes .cdp-mcp-result.json and runs agent-mcp-step-loop record for each step.
 * Usage: node run-mcp-steps-via-eval.mjs <viewId> <start> <end>
 *
 * When CDP ports fail, this script outputs step numbers needing agent CallMcpTool.
 * Agent should call: node run-mcp-steps-via-eval.mjs apply <n> '<mcpResultJson>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[3] || 'ac636f';
const resultPath = path.join(dir, '.cdp-mcp-result.json');

function loadCall(n) {
  const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
  const inv = path.join(dir, `.invoke-step-${n}.json`);
  let payload = fs.existsSync(mcp)
    ? JSON.parse(fs.readFileSync(mcp, 'utf8'))
    : JSON.parse(fs.readFileSync(inv, 'utf8'));
  payload.viewId = viewId;
  return payload;
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: 'cssFullRun', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { fail: true, reason: 'cssVerify', value };
  if (n === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize', value };
  if (n === 7 && !value?.ok) return { fail: true, reason: 'encInit', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'encRun', value };
  return { fail: false };
}

if (cmd === 'args') {
  const n = Number(process.argv[4]);
  process.stdout.write(JSON.stringify(loadCall(n)));
  process.exit(0);
}

if (cmd === 'apply') {
  const n = Number(process.argv[4]);
  const raw = process.argv[5];
  fs.writeFileSync(resultPath, raw);
  const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
  let value;
  try {
    const parsed = JSON.parse(raw);
    value = parsed?.result?.value ?? parsed?.value ?? parsed;
  } catch {
    value = null;
  }
  const chk = checkStep(n, value);
  console.log(JSON.stringify({ step: n, record: JSON.parse(out.trim()), check: chk }));
  process.exit(chk.fail ? 1 : 0);
}

if (cmd === 'write-result') {
  const n = Number(process.argv[4]);
  const value = JSON.parse(process.argv[5]);
  fs.writeFileSync(resultPath, JSON.stringify({ result: { type: 'object', value } }));
  const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
  const chk = checkStep(n, value);
  console.log(JSON.stringify({ step: n, record: JSON.parse(out.trim()), check: chk }));
  process.exit(chk.fail ? 1 : 0);
}

console.error('usage: args|apply|write-result <viewId> <n> [json]');
process.exit(2);
