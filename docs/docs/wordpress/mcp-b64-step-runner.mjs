/**
 * Run one runner step via b64 parts + agent CallMcpTool per part.
 * node mcp-b64-step-runner.mjs init <step> [viewId]
 * node mcp-b64-step-runner.mjs next  -> writes .mcp-chunk-invoke.json, prints meta
 * node mcp-b64-step-runner.mjs save -> reads .mcp-chunk-result.json, advances
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.mcp-b64-step-state.json');
const invokePath = path.join(dir, '.mcp-chunk-invoke.json');
const resultPath = path.join(dir, '.mcp-chunk-result.json');

const cmd = process.argv[2];

if (cmd === 'init') {
  const step = Number(process.argv[3]);
  const viewId = process.argv[4] || '4efe11';
  execSync(`node "${path.join(dir, 'mcp-b64-parts.mjs')}" emit ${step} ${viewId}`, { stdio: 'inherit', cwd: dir });
  const calls = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-b64-calls-${step}.json`), 'utf8'));
  fs.writeFileSync(statePath, JSON.stringify({ step, viewId, idx: 0, total: calls.length, final: null }));
  console.log(JSON.stringify({ step, total: calls.length }));
  process.exit(0);
}

function loadState() {
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

if (cmd === 'next') {
  const state = loadState();
  if (state.idx >= state.total) {
    console.log(JSON.stringify({ done: true, step: state.step, final: state.final }));
    process.exit(0);
  }
  execSync(`node "${path.join(dir, 'mcp-b64-parts.mjs')}" invoke ${state.step} ${state.idx} ${state.viewId}`, {
    stdio: 'inherit',
    cwd: dir,
  });
  console.log(JSON.stringify({ done: false, step: state.step, part: state.idx, total: state.total }));
  process.exit(0);
}

if (cmd === 'save') {
  const state = loadState();
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  try {
    fs.unlinkSync(resultPath);
  } catch {
    /* ok */
  }
  const isLast = state.idx === state.total - 1;
  if (isLast) state.final = raw;
  state.idx += 1;
  fs.writeFileSync(statePath, JSON.stringify(state));
  if (state.idx >= state.total) {
    console.log(JSON.stringify({ done: true, step: state.step, final: state.final }));
    process.exit(0);
  }
  console.log(JSON.stringify({ done: false, step: state.step, part: state.idx, total: state.total }));
  process.exit(0);
}

if (cmd === 'write-runner-result') {
  const state = loadState();
  if (!state.final) {
    console.error('no final');
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, '.mcp-runner-result.json'), JSON.stringify(state.final));
  console.log(JSON.stringify({ ok: true, step: state.step }));
  process.exit(0);
}

console.error('init|next|save|write-runner-result');
process.exit(2);
