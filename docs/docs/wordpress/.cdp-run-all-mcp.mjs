/**
 * Orchestrate full deploy: writes pending step, waits for .cdp-mcp-result.json
 * Usage: node .cdp-run-all-mcp.mjs emit combined|N
 *        node .cdp-run-all-mcp.mjs record <json-file>
 *        node .cdp-run-all-mcp.mjs final
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-run-all-mcp-state.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const viewId = process.argv[4] || 'd0bf03';

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { recorded: {}, errors: [], queue: [], idx: 0, viewId };
}
function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function buildQueue() {
  const q = [{ kind: 'combined', name: 'css0-19' }];
  for (let n = 5; n <= 29; n++) q.push({ kind: 'step', n });
  return q;
}

function extractValue(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? null;
}

function check(name, n, value) {
  if (name === 'css0-19' || n === 4) {
    if (!value?.ok || value?.len !== 34708)
      return `css join len=${value?.len} ok=${value?.ok}`;
  }
  if (n === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (n === 6 && !value?.ok) return 'step6 ok';
  if (n === 7 && !value?.ok) return 'step7 ok';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

const cmd = process.argv[2];

if (cmd === 'init') {
  save({ recorded: {}, errors: [], queue: buildQueue(), idx: 0, viewId });
  console.log(JSON.stringify({ ok: true, steps: buildQueue().length }));
  process.exit(0);
}

if (cmd === 'emit') {
  const s = load();
  const item = s.queue[s.idx];
  if (!item) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  let payload;
  if (item.kind === 'combined') {
    const expr = fs.readFileSync(path.join(dir, '.cdp-expr-out-run.txt'), 'utf8');
    payload = {
      method: 'Runtime.evaluate',
      params: { expression: expr, awaitPromise: true, returnByValue: true },
      viewId: s.viewId,
    };
  } else {
    const src = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${item.n}.json`), 'utf8'));
    payload = { method: src.method, params: src.params, viewId: s.viewId };
  }
  fs.writeFileSync(path.join(dir, '.cdp-pending-payload.json'), JSON.stringify(payload));
  console.log(JSON.stringify({ emit: item, idx: s.idx, exprLen: payload.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync(process.argv[3], 'utf8');
  const resp = JSON.parse(raw);
  const value = extractValue(resp);
  const s = load();
  const item = s.queue[s.idx];
  const n = item.kind === 'step' ? item.n : 4;
  const key = item.kind === 'combined' ? 'cssFullRun' : summaryKeys[n];
  if (key) s.recorded[key] = value;
  const fail = check(item.name || '', n, value);
  if (fail) {
    s.errors.push({ item, reason: fail, value });
    if (item.kind === 'combined' || n === 4) {
      save(s);
      console.log(JSON.stringify({ ok: false, retry: 'clear-and-combined', value, reason: fail }));
      process.exit(1);
    }
    save(s);
    console.log(JSON.stringify({ ok: false, value, reason: fail }));
    process.exit(1);
  }
  s.idx++;
  save(s);
  console.log(JSON.stringify({ ok: true, item, value, nextIdx: s.idx }));
  process.exit(0);
}

if (cmd === 'final') {
  const s = load();
  const out = {
    viewId: 'a9930e',
    activeViewId: s.viewId,
    cssFullRun: s.recorded.cssFullRun ?? null,
    cssVerify: s.recorded.cssVerify ?? null,
    cssFinalize: s.recorded.cssFinalize ?? null,
    encInit: s.recorded.encInit ?? null,
    enc0: s.recorded.enc0 ?? null,
    enc1: s.recorded.enc1 ?? null,
    enc2: s.recorded.enc2 ?? null,
    enc3: s.recorded.enc3 ?? null,
    encRun: s.recorded.encRun ?? null,
    errors: s.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(0);
}

console.error('usage: init|emit|record|final');
process.exit(2);
