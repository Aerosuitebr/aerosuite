/**
 * Execute all CDP emit batches via browser_cdp MCP calls.
 * Reads .cdp-mcp-exec-{1-8}.json and writes consolidated state.
 * Agent must call: node run-cdp-mcp-executor.mjs call <batchIndex>
 * which prints MCP args JSON, then agent runs browser_cdp and:
 * node run-cdp-mcp-executor.mjs save <batchIndex> '<mcpResultJson>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const bi = Number(process.argv[3]);
const statePath = path.join(dir, '.cdp-deploy-state.json');

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { stepResults: {}, batchResults: {}, errors: [], viewId: '548005' };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function extractSteps(value, stepResults) {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) stepResults[Number(k)] = v;
  }
}

function checkpoint(state) {
  const s = state.stepResults;
  const errors = [];
  if (s[4] && (s[4].len !== 34708 || !s[4].ok)) errors.push({ step: 4, value: s[4] });
  if (s[5] && (s[5].b64 !== 34708 || !s[5].hasGrid)) errors.push({ step: 5, value: s[5] });
  if (s[6] && !s[6].ok) errors.push({ step: 6, value: s[6] });
  if (s[7] && !s[7].ok) errors.push({ step: 7, value: s[7] });
  if (s[29] && (!s[29].ok || !s[29].hasHeroV2)) errors.push({ step: 29, value: s[29] });
  return errors;
}

if (cmd === 'call') {
  const files = [
    null, '.cdp-mcp-exec-1.json', '.cdp-mcp-exec-2.json', '.cdp-mcp-exec-3.json',
    '.cdp-mcp-exec-4.json', '.cdp-mcp-exec-5.json', '.cdp-mcp-exec-6.json',
    '.cdp-mcp-exec-7.json', '.cdp-mcp-exec-8.json',
  ];
  if (bi === 0) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-invoke-0.json'), 'utf8'));
    process.stdout.write(JSON.stringify({ viewId: j.viewId, method: j.method, params: j.params }));
  } else {
    const j = JSON.parse(fs.readFileSync(path.join(dir, files[bi]), 'utf8'));
    process.stdout.write(JSON.stringify({ viewId: j.viewId, method: j.method, params: j.params }));
  }
} else if (cmd === 'save') {
  const raw = process.argv[4];
  const mcp = JSON.parse(raw);
  const value = mcp?.result?.value ?? mcp?.value ?? mcp;
  const state = loadState();
  state.batchResults[bi] = value;
  extractSteps(value, state.stepResults);
  state.errors = checkpoint(state);
  saveState(state);
  console.log(JSON.stringify({ batch: bi, stepResults: state.stepResults, errors: state.errors }));
} else if (cmd === 'final') {
  const state = loadState();
  const out = {
    viewId: 'a9930e',
    activeViewId: '8e6349',
    cssFullRun: state.stepResults[4] ?? null,
    cssVerify: state.stepResults[5] ?? null,
    cssFinalize: state.stepResults[6] ?? null,
    encInit: state.stepResults[7] ?? null,
    enc0: state.stepResults[13] ?? null,
    enc1: state.stepResults[19] ?? null,
    enc2: state.stepResults[25] ?? null,
    enc3: state.stepResults[28] ?? null,
    encRun: state.stepResults[29] ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
} else if (cmd === 'init') {
  saveState({ stepResults: { 0: { batch: 0, from: 0, to: 4 } }, batchResults: { 0: { batch: 0, from: 0, to: 4 } }, errors: [], viewId: '548005' });
  console.log('init ok');
} else {
  console.error('usage: init | call <0-8> | save <0-8> <json> | final');
  process.exit(1);
}
