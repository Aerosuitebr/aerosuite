/**
 * Prepared MCP file sequence runner.
 * Usage:
 *   node run-prepared-mcp-sequence.mjs list
 *   node run-prepared-mcp-sequence.mjs args <index> [viewId]
 *   node run-prepared-mcp-sequence.mjs record <index> <resultJsonPath>
 *   node run-prepared-mcp-sequence.mjs summary [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.mcp-sequence-state.json');

function buildFileList() {
  const files = [
    '.mcp-cssfull-batch-0.json',
    '.mcp-cssfull-batch-1.json',
    '.mcp-cssfull-batch-2.json',
    '.mcp-cssfull-batch-3.json',
    '.mcp-cssfull-run.json',
    '.mcp-css-verify.json',
    '.mcp-css-finalize.json',
    '.mcp-enc-init.json',
  ];
  for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
    const encDir = path.join(dir, `.mcp-${enc}`);
    const uploads = fs.readdirSync(encDir)
      .filter((f) => f.startsWith('upload-') && f.endsWith('.json'))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
      .map((f) => path.join(`.mcp-${enc}`, f));
    files.push(...uploads, path.join(`.mcp-${enc}`, 'run.json'));
  }
  files.push('.mcp-enc-run.json');
  return files;
}

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { results: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

const cmd = process.argv[2];
const files = buildFileList();

if (cmd === 'list') {
  console.log(JSON.stringify({ count: files.length, files }));
  process.exit(0);
}

function loadArgs(rel, viewId) {
  const full = path.join(dir, rel);
  const j = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId };
  return { viewId, method: 'Runtime.evaluate', params: j };
}

if (cmd === 'args') {
  const idx = Number(process.argv[3]);
  const viewId = process.argv[4] || 'f29abe';
  const rel = files[idx];
  const args = loadArgs(rel, viewId);
  const outPath = path.join(dir, '.mcp-call-args.json');
  fs.writeFileSync(outPath, JSON.stringify(args));
  console.log(JSON.stringify({ idx, file: rel, viewId, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const idx = Number(process.argv[3]);
  const resultPath = process.argv[4];
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const value = extractValue(raw);
  const state = loadState();
  state.results[idx] = { file: files[idx], value, raw };
  saveState(state);
  console.log(JSON.stringify({ idx, file: files[idx], value }));
  process.exit(0);
}

if (cmd === 'summary') {
  const requestedViewId = process.argv[3] || 'a9930e';
  const activeViewId = process.argv[4] || 'f29abe';
  const state = loadState();
  const byFile = {};
  for (const [k, v] of Object.entries(state.results)) {
    byFile[files[Number(k)]] = v.value;
  }
  const encRunIdx = files.indexOf('.mcp-enc-run.json');
  const encRun = state.results[encRunIdx]?.value ?? null;
  const runIdx = files.indexOf('.mcp-cssfull-run.json');
  const verifyIdx = files.indexOf('.mcp-css-verify.json');
  const finalizeIdx = files.indexOf('.mcp-css-finalize.json');
  const initIdx = files.indexOf('.mcp-enc-init.json');
  const encRunKeys = ['enc-0', 'enc-1', 'enc-2', 'enc-3'].map((enc) => {
    const ri = files.indexOf(path.join(`.mcp-${enc}`, 'run.json'));
    return state.results[ri]?.value ?? null;
  });
  const errors = [];
  const cssFullRun = state.results[runIdx]?.value;
  const cssVerify = state.results[verifyIdx]?.value;
  const cssFinalize = state.results[finalizeIdx]?.value;
  const encInit = state.results[initIdx]?.value;
  if (cssFullRun && (cssFullRun.len !== 34708 || !cssFullRun.ok)) errors.push({ step: 'cssFullRun', value: cssFullRun });
  if (cssVerify && (cssVerify.b64 !== 34708 || !cssVerify.hasGrid)) errors.push({ step: 'cssVerify', value: cssVerify });
  if (cssFinalize && !cssFinalize.ok) errors.push({ step: 'cssFinalize', value: cssFinalize });
  if (encInit && !encInit.ok) errors.push({ step: 'encInit', value: encInit });
  if (encRun && (!encRun.ok || !encRun.hasHeroV2)) errors.push({ step: 'encRun', value: encRun });
  const out = {
    viewId: requestedViewId,
    activeViewId,
    cssFullRun: cssFullRun ?? null,
    cssVerify: cssVerify ?? null,
    cssFinalize: cssFinalize ?? null,
    encInit: encInit ?? null,
    enc0: encRunKeys[0],
    enc1: encRunKeys[1],
    enc2: encRunKeys[2],
    enc3: encRunKeys[3],
    encRun,
    errors: [...state.errors, ...errors],
  };
  console.log(JSON.stringify(out));
  process.exit(0);
}

console.error('usage: list | args <index> [viewId] | record <index> <resultPath> | summary [viewId] [activeViewId]');
process.exit(2);
