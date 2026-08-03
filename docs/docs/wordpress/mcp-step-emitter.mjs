/**
 * Agent helper: emit next MCP call spec as JSON line.
 * Usage: node mcp-step-emitter.mjs next <index> [viewId]
 *        node mcp-step-emitter.mjs save <index> <resultJsonPath>
 *        node mcp-step-emitter.mjs summary [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const seq = path.join(dir, 'run-prepared-mcp-sequence.mjs');
const statePath = path.join(dir, '.mcp-step-emitter-state.json');
const cmd = process.argv[2];

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { results: {}, errors: [] };
}
function saveState(s) { fs.writeFileSync(statePath, JSON.stringify(s, null, 2)); }

if (cmd === 'next') {
  const idx = Number(process.argv[3]);
  const viewId = process.argv[4] || 'f29abe';
  execSync(`node "${seq}" args ${idx} ${viewId}`, { stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-call-args.json'), 'utf8'));
  const out = { index: idx, argsPath: path.join(dir, '.mcp-call-args.json'), args };
  fs.writeFileSync(path.join(dir, '.mcp-next-spec.json'), JSON.stringify(out));
  console.log(JSON.stringify({ index: idx, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const idx = Number(process.argv[3]);
  const resultPath = process.argv[4];
  execSync(`node "${seq}" record ${idx} "${resultPath}"`, { stdio: 'pipe' });
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? null;
  const state = loadState();
  state.results[idx] = value;
  saveState(state);
  console.log(JSON.stringify({ index: idx, value }));
  process.exit(0);
}

if (cmd === 'summary') {
  const viewId = process.argv[3] || 'a9930e';
  const activeViewId = process.argv[4] || 'f29abe';
  console.log(execSync(`node "${seq}" summary ${viewId} ${activeViewId}`, { encoding: 'utf8' }));
  process.exit(0);
}

process.exit(2);
