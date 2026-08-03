/**
 * Synchronous deploy state machine — one MCP call per `next` invocation.
 * Usage:
 *   node cdp-deploy-sync.mjs init [start] [end] [viewId]
 *   node cdp-deploy-sync.mjs next                    -> stdout: {done:false,call:{...}} or {done:true,summary}
 *   node cdp-deploy-sync.mjs result <responseFile>   -> record MCP response, advance
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-sync-state.json');
const cmd = process.argv[2];

function loadState() {
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}
function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function loadArgs(n, viewId) {
  const p = path.join(dir, `.cdp-step-${n}-args.json`);
  if (!fs.existsSync(p)) execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  a.viewId = viewId;
  return a;
}

function buildCalls(n, viewId) {
  const args = loadArgs(n, viewId);
  const expr = args.params.expression;
  if (expr.length <= 3500) return [{ viewId, method: args.method, params: args.params }];
  execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
  const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
  return [...plan.calls, fin];
}

if (cmd === 'init') {
  const start = Number(process.argv[3] ?? 0);
  const end = Number(process.argv[4] ?? 29);
  const viewId = process.argv[5] || '7c1495';
  fs.writeFileSync(
    path.join(dir, 'mcp-deploy-state.json'),
    JSON.stringify({ summary: {}, errors: [], done: [] }, null, 2)
  );
  saveState({ start, end, viewId, step: start, callIndex: 0, calls: null, callResults: [] });
  console.log(JSON.stringify({ ok: true, start, end, viewId }));
  process.exit(0);
}

if (cmd === 'next') {
  let s = loadState();
  if (s.step > s.end) {
    const out = execSync(`node agent-cdp-step.mjs summary 5c671d`, { cwd: dir, encoding: 'utf8' });
    console.log(out.trim());
    process.exit(0);
  }
  if (!s.calls || s.callIndex >= s.calls.length) {
    s.calls = buildCalls(s.step, s.viewId);
    s.callIndex = 0;
    s.callResults = [];
    saveState(s);
  }
  if (s.callIndex < s.calls.length) {
    const payload = {
      done: false,
      step: s.step,
      callIndex: s.callIndex,
      callTotal: s.calls.length,
      call: s.calls[s.callIndex],
    };
    fs.writeFileSync(path.join(dir, '.cdp-sync-next.json'), JSON.stringify(payload));
    console.log(JSON.stringify({ done: false, step: s.step, callIndex: s.callIndex, callTotal: s.calls.length, file: '.cdp-sync-next.json' }));
    process.exit(0);
  }
}

if (cmd === 'result') {
  const respFile = path.resolve(process.argv[3]);
  const raw = fs.readFileSync(respFile, 'utf8');
  const resp = JSON.parse(raw);
  let s = loadState();
  s.callResults.push(resp);
  s.callIndex++;
  if (s.callIndex >= s.calls.length) {
    const last = s.callResults[s.callResults.length - 1];
    const value = last?.result?.value ?? last?.value;
    const resultPath = path.join(dir, '.cdp-mcp-result.json');
    fs.writeFileSync(resultPath, JSON.stringify({ result: { type: 'object', value } }));
    const rec = execSync(`node apply-step-result.mjs ${s.step} "${resultPath.replace(/\\/g, '/')}"`, {
      cwd: dir,
      encoding: 'utf8',
    });
    const recObj = JSON.parse(rec.trim());
    if (!recObj.ok) {
      saveState(s);
      console.log(JSON.stringify({ done: true, failed: true, step: s.step, rec: recObj }));
      process.exit(1);
    }
    s.step++;
    s.calls = null;
    s.callIndex = 0;
    s.callResults = [];
    saveState(s);
    console.log(JSON.stringify({ done: s.step > s.end, stepRecorded: s.step - 1, rec: recObj }));
    process.exit(0);
  }
  saveState(s);
  console.log(JSON.stringify({ done: false, step: s.step, callIndex: s.callIndex, callTotal: s.calls.length }));
  process.exit(0);
}

console.error('usage: init|next|result');
process.exit(2);
