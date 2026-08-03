/**
 * Execute steps start..end from .step-out-N.json via sequential MCP result files.
 * Agent loop: node .mcp-step-out-runner.mjs prepare N
 *             CallMcpTool browser_cdp with .cdp-current-call.json
 *             node .mcp-step-out-runner.mjs save N '<json result>'
 * Or: node .mcp-step-out-runner.mjs run-all (prints instructions)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.env.MCP_VIEW_ID || '46863b';
const cmd = process.argv[2];
const nArg = process.argv[3];

function loadStep(n) {
  const file = Number(n) === 0 ? '.cdp-invoke-0.json' : `.step-out-${n}.json`;
  const args = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  args.viewId = viewId;
  return args;
}

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function finalSummary(results, errors) {
  return {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: results[4] ?? null,
    cssVerify: results[5] ?? null,
    cssFinalize: results[6] ?? null,
    encInit: results[7] ?? null,
    enc0: results[13] ?? null,
    enc1: results[19] ?? null,
    enc2: results[25] ?? null,
    enc3: results[28] ?? null,
    encRun: results[29] ?? null,
    errors,
  };
}

if (cmd === 'prepare') {
  const n = Number(nArg);
  fs.writeFileSync(path.join(dir, '.cdp-current-call.json'), JSON.stringify(loadStep(n)));
  console.log(n);
  process.exit(0);
}

if (cmd === 'save') {
  const n = Number(nArg);
  const raw = JSON.parse(process.argv[4] || fs.readFileSync(0, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  const statePath = path.join(dir, '.mcp-step-out-results.json');
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { results: {}, errors: [] };
  state.results[n] = value;
  const fail =
    (n === 4 && (!value?.ok || value?.len !== 34708)) ? 'step4' :
    (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) ? 'step5' :
    (n === 6 && !value?.ok) ? 'step6' :
    (n === 7 && !value?.ok) ? 'step7' :
    (n === 29 && (!value?.ok || !value?.hasHeroV2)) ? 'step29' : null;
  if (fail) state.errors.push({ step: n, reason: fail, value });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
  if (fail) {
    console.log(JSON.stringify(finalSummary(state.results, state.errors)));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, step: n, value }));
  process.exit(0);
}

if (cmd === 'summary') {
  const statePath = path.join(dir, '.mcp-step-out-results.json');
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { results: {}, errors: [] };
  console.log(JSON.stringify(finalSummary(state.results, state.errors)));
  process.exit(0);
}

console.log('usage: prepare|save|summary');
