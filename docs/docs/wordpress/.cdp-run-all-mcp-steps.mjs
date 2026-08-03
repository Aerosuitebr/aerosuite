/**
 * Run steps 0..29 via inline MCP: writes .cdp-mcp-invoke-N.json for agent CallMcpTool.
 * Agent loop: read .cdp-mcp-invoke-N.json, browser_cdp, save .cdp-mcp-result-N.json
 * Then: node .cdp-run-all-mcp-steps.mjs collect 87550c
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[3] || '87550c';
const n = Number(process.argv[4]);

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

if (cmd === 'emit') {
  const start = Number(process.argv[4] ?? 0);
  const end = Number(process.argv[5] ?? 29);
  for (let i = start; i <= end; i++) {
    const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-call-${i}.json`), 'utf8'));
    call.viewId = viewId;
    fs.writeFileSync(path.join(dir, `.cdp-mcp-invoke-${i}.json`), JSON.stringify(call));
  }
  console.log(JSON.stringify({ emit: true, from: start, to: end, viewId }));
  process.exit(0);
}

if (cmd === 'collect') {
  const recorded = {};
  const errors = [];
  for (let i = 0; i <= 29; i++) {
    const rp = path.join(dir, `.cdp-mcp-result-${i}.json`);
    if (!fs.existsSync(rp)) continue;
    const raw = JSON.parse(fs.readFileSync(rp, 'utf8'));
    const value = raw?.result?.value ?? raw?.result?.result?.value ?? raw?.value;
    if (summaryKeys[i]) recorded[summaryKeys[i]] = value;
    const fail = checkStep(i, value);
    if (fail) errors.push({ step: i, reason: fail, value });
  }
  const out = {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: recorded.cssFullRun ?? null,
    cssVerify: recorded.cssVerify ?? null,
    cssFinalize: recorded.cssFinalize ?? null,
    encInit: recorded.encInit ?? null,
    enc0: recorded.enc0 ?? null,
    enc1: recorded.enc1 ?? null,
    enc2: recorded.enc2 ?? null,
    enc3: recorded.enc3 ?? null,
    encRun: recorded.encRun ?? null,
    errors,
  };
  fs.writeFileSync(path.join(dir, '.cdp-final-out.json'), JSON.stringify(out, null, 2));
  console.log(`FINAL ${JSON.stringify(out)}`);
  process.exit(errors.length ? 1 : 0);
}

const stepsStatePath = path.join(dir, '.cdp-run-all-mcp-steps-state.json');

function loadStepsState() {
  return fs.existsSync(stepsStatePath)
    ? JSON.parse(fs.readFileSync(stepsStatePath, 'utf8'))
    : { results: {}, errors: [] };
}

function saveStepsState(s) {
  fs.writeFileSync(stepsStatePath, JSON.stringify(s, null, 2));
}

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

if (cmd === 'record') {
  const stepN = Number(process.argv[3]);
  const raw = process.argv[4] || '{}';
  const state = loadStepsState();
  try {
    const parsed = JSON.parse(raw);
    const value = extractValue(parsed);
    state.results[stepN] = value;
    fs.writeFileSync(path.join(dir, `.cdp-mcp-result-${stepN}.json`), raw);
    const fail = checkStep(stepN, value);
    if (fail) {
      state.errors.push({ step: stepN, value, reason: fail });
      saveStepsState(state);
      console.log(JSON.stringify({ ok: false, step: stepN, value, reason: fail }));
      process.exit(1);
    }
    saveStepsState(state);
    console.log(JSON.stringify({ ok: true, step: stepN, value }));
    process.exit(0);
  } catch (e) {
    state.errors.push({ step: stepN, error: String(e) });
    saveStepsState(state);
    console.log(JSON.stringify({ ok: false, step: stepN, error: String(e) }));
    process.exit(1);
  }
}

if (cmd === 'summary') {
  const logicalViewId = process.argv[3] || 'a9930e';
  const activeViewId = process.argv[4] || viewId;
  const state = loadStepsState();
  const recorded = {};
  for (const [step, key] of Object.entries(summaryKeys)) {
    recorded[key] = state.results[Number(step)] ?? null;
  }
  const out = {
    viewId: logicalViewId,
    activeViewId,
    cssFullRun: recorded.cssFullRun ?? null,
    cssVerify: recorded.cssVerify ?? null,
    cssFinalize: recorded.cssFinalize ?? null,
    encInit: recorded.encInit ?? null,
    enc0: recorded.enc0 ?? null,
    enc1: recorded.enc1 ?? null,
    enc2: recorded.enc2 ?? null,
    enc3: recorded.enc3 ?? null,
    encRun: recorded.encRun ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: emit <viewId> <start> <end> | collect <viewId> | record <n> <json> | summary [logicalViewId] [activeViewId]');
