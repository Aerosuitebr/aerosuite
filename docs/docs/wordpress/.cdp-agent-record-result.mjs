/**
 * Record MCP response for step N into deploy state.
 * Usage: node .cdp-agent-record-result.mjs <n> <path-to-mcp-json>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const rawPath = process.argv[3] || path.join(dir, '.cdp-current-mcp-result.json');
const statePath = path.join(dir, '.cdp-agent-deploy-state.json');

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

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, summary: {}, errors: [] };
}

function extractValue(r) {
  const j = typeof r === 'string' ? JSON.parse(r) : r;
  if (j?.exceptionDetails) throw new Error(JSON.stringify(j.exceptionDetails));
  return j?.result?.value ?? j?.result?.result?.value ?? j?.value;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: `cssFullRun len=${value?.len} ok=${value?.ok}` };
  }
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708)) {
    return { fail: true, reason: 'cssVerify' };
  }
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize' };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit' };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: 'encRun' };
  }
  return { fail: false };
}

const state = load();
const raw = fs.readFileSync(rawPath, 'utf8');
try {
  const value = extractValue(raw);
  state.results[n] = value;
  const key = summaryKeys[n];
  if (key) state.summary[key] = value;
  const chk = checkStep(n, value);
  if (chk.fail) {
    state.errors.push({ step: n, value, reason: chk.reason });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log(JSON.stringify({ ok: false, step: n, value, stopped: true }));
    process.exit(1);
  }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ ok: true, step: n, value }));
} catch (e) {
  state.errors.push({ step: n, error: String(e) });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ ok: false, step: n, error: String(e) }));
  process.exit(1);
}
