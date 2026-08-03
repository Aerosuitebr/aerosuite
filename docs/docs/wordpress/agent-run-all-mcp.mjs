/**
 * Prepare step N for agent MCP: writes .cdp-mcp-args-now.json
 * After agent writes .cdp-mcp-result.json, run: node agent-run-all-mcp.mjs done N
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.agent-mcp-run-state.json');
const argsPath = path.join(dir, '.cdp-mcp-args-now.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const viewId = process.argv[3] || 'edc223';

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { next: 0, summary: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return 'step5 verify';
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7 enc-init';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
  return null;
}

function extractValue(r) {
  const j = typeof r === 'string' ? JSON.parse(r) : r;
  return j?.result?.value ?? j?.value ?? j?.result?.result?.value ?? null;
}

const cmd = process.argv[2];

if (cmd === 'prep') {
  const n = Number(process.argv[4] ?? 0);
  const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
  const inv = path.join(dir, `.invoke-step-${n}.json`);
  let payload = fs.existsSync(mcp)
    ? JSON.parse(fs.readFileSync(mcp, 'utf8'))
    : (() => {
        const a = JSON.parse(fs.readFileSync(inv, 'utf8'));
        return { viewId, method: a.method, params: a.params };
      })();
  payload.viewId = viewId;
  fs.writeFileSync(argsPath, JSON.stringify({ viewId: payload.viewId, method: payload.method, params: payload.params }));
  console.log(JSON.stringify({ step: n, viewId, exprLen: payload.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'done') {
  const n = Number(process.argv[4]);
  const state = loadState();
  if (!fs.existsSync(resultPath)) {
    console.error(JSON.stringify({ error: 'missing result' }));
    process.exit(1);
  }
  const raw = fs.readFileSync(resultPath, 'utf8');
  const value = extractValue(raw);
  const fail = checkStep(n, value);
  const key = summaryKeys[n];
  if (key) state.summary[key] = value;
  try {
    execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, stdio: 'pipe' });
  } catch (e) {
    state.errors.push({ step: n, record: String(e) });
    saveState(state);
    process.exit(1);
  }
  if (fail) {
    state.errors.push({ step: n, reason: fail, value });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, value, fail }));
    process.exit(1);
  }
  state.next = n + 1;
  saveState(state);
  console.log(JSON.stringify({ ok: true, step: n, value, next: state.next }));
  process.exit(0);
}

if (cmd === 'summary') {
  const state = loadState();
  console.log(
    JSON.stringify({
      viewId,
      cssFullRun: state.summary.cssFullRun ?? null,
      cssVerify: state.summary.cssVerify ?? null,
      cssFinalize: state.summary.cssFinalize ?? null,
      encInit: state.summary.encInit ?? null,
      enc0: state.summary.enc0 ?? null,
      enc1: state.summary.enc1 ?? null,
      enc2: state.summary.enc2 ?? null,
      enc3: state.summary.enc3 ?? null,
      encRun: state.summary.encRun ?? null,
      errors: state.errors,
    })
  );
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: prep|done|summary [viewId] [step]');
process.exit(2);
