/**
 * Run steps 1-29 via exact .step-out-N.json payloads.
 * Writes each step's MCP args to .cdp-next-call.json and waits for .cdp-last-result.json
 * Agent loop: read .cdp-next-call.json -> CallMcpTool -> write .cdp-last-result.json
 *
 * Or run standalone if CURSOR_AGENT=1 and agent drives loop.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '8e6349';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);
const nextFile = path.join(dir, '.cdp-next-call.json');
const resultFile = path.join(dir, '.cdp-last-result.json');
const stateFile = path.join(dir, '.cdp-loop-progress.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 ${JSON.stringify(value)}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 ${JSON.stringify(value)}`;
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ${JSON.stringify(value)}`;
  return null;
}

function loadState() {
  return fs.existsSync(stateFile)
    ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
    : { results: {}, errors: [], next: start };
}

function saveState(s) {
  fs.writeFileSync(stateFile, JSON.stringify(s, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const cmd = process.argv[5];

if (cmd === 'prepare') {
  const n = Number(process.argv[6]);
  const raw = JSON.parse(fs.readFileSync(path.join(dir, `.step-out-${n}.json`), 'utf8'));
  raw.viewId = viewId;
  fs.writeFileSync(nextFile, JSON.stringify(raw));
  console.log(JSON.stringify({ action: 'CALL_MCP', step: n, viewId }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[6]);
  const raw = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  const state = loadState();
  state.results[n] = value;
  state.next = n + 1;
  const fail = checkStep(n, value);
  if (fail) {
    state.errors.push({ step: n, reason: fail, value });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, value, stopped: true }));
    process.exit(1);
  }
  saveState(state);
  console.log(JSON.stringify({ ok: true, step: n, value }));
  process.exit(0);
}

if (cmd === 'summary') {
  const state = loadState();
  const r = state.results;
  console.log(JSON.stringify({
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: r[4] ?? null,
    cssVerify: r[5] ?? null,
    cssFinalize: r[6] ?? null,
    encInit: r[7] ?? null,
    enc0: r[13] ?? null,
    enc1: r[19] ?? null,
    enc2: r[25] ?? null,
    enc3: r[28] ?? null,
    encRun: r[29] ?? null,
    errors: state.errors,
  }));
  process.exit(state.errors.length ? 1 : 0);
}

// auto loop waiting for agent (optional)
(async () => {
  const state = loadState();
  for (let n = state.next; n <= end; n++) {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, `.step-out-${n}.json`), 'utf8'));
    raw.viewId = viewId;
    if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
    fs.writeFileSync(nextFile, JSON.stringify(raw));
    console.log(JSON.stringify({ action: 'AWAIT_MCP', step: n }));
    let result = null;
    for (let t = 0; t < 900; t++) {
      if (fs.existsSync(resultFile)) {
        result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
        break;
      }
      await sleep(200);
    }
    if (!result) {
      state.errors.push({ step: n, error: 'timeout' });
      saveState(state);
      break;
    }
    const value = result?.result?.value ?? result?.value ?? result;
    state.results[n] = value;
    state.next = n + 1;
    const fail = checkStep(n, value);
    if (fail) {
      state.errors.push({ step: n, reason: fail, value });
      saveState(state);
      break;
    }
    saveState(state);
  }
  const r = state.results;
  console.log(JSON.stringify({
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: r[4] ?? null,
    cssVerify: r[5] ?? null,
    cssFinalize: r[6] ?? null,
    encInit: r[7] ?? null,
    enc0: r[13] ?? null,
    enc1: r[19] ?? null,
    enc2: r[25] ?? null,
    enc3: r[28] ?? null,
    encRun: r[29] ?? null,
    errors: state.errors,
  }));
})();
