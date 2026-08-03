/**
 * Orchestrate CDP batches via MCP args files.
 * node .cdp-mcp-orchestrate.mjs prep <batchIndex> [viewId]
 * node .cdp-mcp-orchestrate.mjs save <batchIndex> <mcpResultJsonPath>
 * node .cdp-mcp-orchestrate.mjs final
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-mcp-orchestrate-state.json');
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { stepResults: {}, errors: [], done: [] };
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
function checkpoint(stepResults) {
  const errors = [];
  const s = stepResults;
  if (s[4] && (s[4].len !== 34708 || !s[4].ok)) errors.push({ step: 4, value: s[4] });
  if (s[5] && (s[5].b64 !== 34708 || !s[5].hasGrid)) errors.push({ step: 5, value: s[5] });
  if (s[6] && !s[6].ok) errors.push({ step: 6, value: s[6] });
  if (s[7] && !s[7].ok) errors.push({ step: 7, value: s[7] });
  if (s[29] && (!s[29].ok || !s[29].hasHeroV2)) errors.push({ step: 29, value: s[29] });
  return errors;
}

const cmd = process.argv[2];
const bi = Number(process.argv[3]);
const viewId = process.argv[4] || '6115f3';

if (cmd === 'prep') {
  const j = JSON.parse(fs.readFileSync(path.join(dir, batches[bi]), 'utf8'));
  const payload = { viewId, method: j.method, params: j.params };
  const out = path.join(dir, '.cdp-mcp-current.json');
  fs.writeFileSync(out, JSON.stringify(payload));
  console.log(JSON.stringify({ batch: bi, file: batches[bi], exprLen: j.params.expression.length, out }));
} else if (cmd === 'save') {
  const rawPath = process.argv[4];
  const raw = fs.readFileSync(rawPath, 'utf8');
  const mcp = JSON.parse(raw);
  const value = mcp?.result?.value ?? mcp?.value ?? mcp;
  const state = loadState();
  extractSteps(value, state.stepResults);
  if (value && typeof value === 'object' && value.batch === 0) {
    /* batch 0 returns {batch:0,...} not numbered steps */
  }
  state.done.push(bi);
  state.errors = checkpoint(state.stepResults);
  saveState(state);
  console.log(JSON.stringify({ batch: bi, value, stepResults: state.stepResults, errors: state.errors }));
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
  saveState({ stepResults: {}, errors: [], done: [] });
  console.log('init ok');
}
