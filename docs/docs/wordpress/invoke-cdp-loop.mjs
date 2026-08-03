/**
 * Sequential CDP invoke loop for agent.
 * Usage: node invoke-cdp-loop.mjs <viewId> [startIndex]
 * Writes .cdp-loop-state.json with current index; agent calls MCP per INVOKE line.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '5c671d';
const start = Number(process.argv[3] || 0);
const statePath = path.join(dir, '.cdp-loop-state.json');

const steps = JSON.parse(execSync(`node cdp-bridge.mjs steps ${viewId}`, { cwd: dir, encoding: 'utf8' }));

if (process.argv[2] === '--record') {
  const idx = Number(process.argv[3]);
  const rel = steps[idx].replace(/\\/g, '/');
  const rec = execSync(`node cdp-bridge.mjs save "${rel}"`, { cwd: dir, encoding: 'utf8' });
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.lastResult = JSON.parse(rec);
  state.nextIndex = idx + 1;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  if (state.lastResult.ok === false && state.lastResult.stopped) {
    console.log(JSON.stringify({ done: true, stopped: true, idx, rel, rec: state.lastResult }));
    process.exit(1);
  }
  console.log(JSON.stringify({ recorded: rel, next: state.nextIndex }));
  process.exit(0);
}

if (start === 0 && !process.argv.includes('--resume')) {
  execSync('node mcp-deploy-runner.mjs reset', { cwd: dir, stdio: 'inherit' });
}

const idx = start;
if (idx >= steps.length) {
  const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' });
  console.log('FINAL', summary.trim());
  process.exit(0);
}

const rel = steps[idx].replace(/\\/g, '/');
const prep = JSON.parse(execSync(`node cdp-bridge.mjs prep "${rel}" ${viewId}`, { cwd: dir, encoding: 'utf8' }));
fs.writeFileSync(statePath, JSON.stringify({ viewId, idx, rel, prep, total: steps.length }, null, 2));
console.log(JSON.stringify({ action: 'INVOKE', idx, rel, exprLen: prep.exprLen, viewId }));
