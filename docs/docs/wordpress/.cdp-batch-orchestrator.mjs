/**
 * Prepare batch N (0-5), save MCP response, split step outs.
 * Usage:
 *   node .cdp-batch-orchestrator.mjs prep <batchIndex> [buildViewId] [mcpViewId]
 *   node .cdp-batch-orchestrator.mjs save '<mcpResponseJson>'
 *   node .cdp-batch-orchestrator.mjs summary
 */
import fs from 'fs';
import { execSync } from 'child_process';

const batches = [
  [0, 3],
  [4, 7],
  [8, 13],
  [14, 19],
  [20, 25],
  [26, 29],
];

const cmd = process.argv[2];
const buildViewId = process.argv[4] || '379d4b';
const mcpViewId = process.argv[5] || 'f8a339';

if (cmd === 'prep') {
  const idx = Number(process.argv[3]);
  const [start, end] = batches[idx];
  execSync(`node .cdp-build-full-runner.mjs ${start} ${end} ${buildViewId}`, { stdio: 'inherit' });
  execSync(`node .cdp-save-batch-out.mjs load ${mcpViewId}`, { stdio: 'inherit' });
  const a = JSON.parse(fs.readFileSync('.cdp-mcp-call.json', 'utf8'));
  fs.writeFileSync('.cdp-invoke-now.json', JSON.stringify({ method: a.method, params: a.params, viewId: a.viewId }));
  console.log(JSON.stringify({ batch: idx, start, end, viewId: a.viewId, exprLen: a.params.expression.length }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = JSON.parse(process.argv[3]);
  fs.writeFileSync('.cdp-batch-out.json', JSON.stringify(raw));
  const out = raw?.result?.value?.out ?? raw?.result?.value?.out ?? {};
  for (const [k, v] of Object.entries(out)) {
    fs.writeFileSync(`.cdp-step-${k}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value: v } }));
  }
  const val = raw?.result?.value;
  console.log(JSON.stringify({ ok: val?.ok ?? true, failedAt: val?.failedAt, keys: Object.keys(out) }));
  process.exit(val?.ok === false ? 1 : 0);
}

if (cmd === 'summary') {
  const extract = (r) => r?.result?.value ?? r?.result?.result?.value ?? r?.value;
  const keys = { 4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit', 13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun' };
  const out = { viewId: 'a9930e', activeViewId: mcpViewId, cssFullRun: null, cssVerify: null, cssFinalize: null, encInit: null, enc0: null, enc1: null, enc2: null, enc3: null, encRun: null, errors: [] };
  for (const [step, key] of Object.entries(keys)) {
    const p = `.cdp-step-${step}.mcp-out.json`;
    if (!fs.existsSync(p)) { out.errors.push({ step, error: 'missing out' }); continue; }
    try { out[key] = extract(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch (e) { out.errors.push({ step, error: String(e) }); }
  }
  console.log(JSON.stringify(out));
  process.exit(0);
}

console.error('usage: prep|save|summary');
process.exit(2);
