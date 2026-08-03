/**
 * Run steps start..end via browser fetch to local step-expr server (agent runs short MCP per step).
 * Usage: node .cdp-run-all-via-fetch.mjs <start> <end> <viewId> [port]
 * Prints one line per step: RUN <n> then expects agent to write .cdp-mcp-last-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '6eb035';
const port = process.argv[5] ?? 18766;
const resultPath = path.join(dir, '.cdp-mcp-last-result.json');
const statePath = path.join(dir, '.cdp-steps-run-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: { 1: { batch: 1, from: 5, to: 9 } }, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function check(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 ${JSON.stringify(value)}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 ${JSON.stringify(value)}`;
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ${JSON.stringify(value)}`;
  return null;
}

const state = loadState();
for (let n = start; n <= end && !state.errors.length; n++) {
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  const expr = `(async()=>{const {expr}=await (await fetch('http://127.0.0.1:${port}/${n}')).json();let v=eval(expr);if(v&&typeof v.then==='function')v=await v;return v;})()`;
  const payload = {
    viewId,
    method: 'Runtime.evaluate',
    params: { expression: expr, awaitPromise: true, returnByValue: true },
  };
  fs.writeFileSync(path.join(dir, '.cdp-mcp-short-args.json'), JSON.stringify(payload));
  console.log(`RUN ${n} exprLen ${expr.length}`);
  process.exit(0);
}

saveState(state);
const r = state.results;
console.log(
  JSON.stringify({
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
  }),
);
