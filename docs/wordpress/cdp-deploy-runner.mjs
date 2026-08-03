/**
 * Serial deploy: steps start-end via chunked MCP handshake (.cdp-mcp-current-call.json)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '7c1495';
const callPath = path.join(dir, '.cdp-mcp-current-call.json');
const respPath = path.join(dir, '.cdp-mcp-current-response.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadArgs(n) {
  const p = path.join(dir, `.cdp-step-${n}-args.json`);
  if (!fs.existsSync(p)) execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  a.viewId = viewId;
  return a;
}

function buildCalls(n) {
  const args = loadArgs(n);
  const expr = args.params.expression;
  if (expr.length <= 3500) return [{ viewId, method: args.method, params: args.params }];
  execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
  const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
  return [...plan.calls, fin];
}

async function waitResp(label) {
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(respPath)) {
      try {
        return JSON.parse(fs.readFileSync(respPath, 'utf8'));
      } catch {
        /* partial */
      }
    }
    await sleep(100);
  }
  throw new Error(`timeout ${label}`);
}

(async () => {
  for (let n = start; n <= end; n++) {
    const calls = buildCalls(n);
    fs.writeFileSync(path.join(dir, '.cdp-needs-mcp-step'), String(n));
    console.log(`STEP ${n} calls=${calls.length}`);
    const results = [];
    for (let i = 0; i < calls.length; i++) {
      if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
      fs.writeFileSync(callPath, JSON.stringify(calls[i]));
      fs.writeFileSync(path.join(dir, '.cdp-needs-mcp-call'), `${n}:${i}`);
      console.log(`AWAIT_CALL ${n}:${i}/${calls.length}`);
      const r = await waitResp(`${n}:${i}`);
      results.push(r);
      fs.unlinkSync(respPath);
      console.log(`DONE_CALL ${n}:${i + 1}/${calls.length}`);
    }
    const last = results[results.length - 1];
    const value = last?.result?.value ?? last?.value;
    fs.writeFileSync(resultPath, JSON.stringify({ result: { type: 'object', value } }));
    const rec = execSync(`node apply-step-result.mjs ${n} "${resultPath.replace(/\\/g, '/')}"`, {
      cwd: dir,
      encoding: 'utf8',
    });
    console.log(`DONE_STEP ${n} ${rec.trim()}`);
    if (rec.includes('"stopped":true') || (rec.includes('"ok":false') && !rec.includes('"ok":true'))) {
      process.exit(1);
    }
  }
  console.log('ALL_DONE');
})();
