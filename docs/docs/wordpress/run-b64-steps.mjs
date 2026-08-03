/**
 * Run steps start..end: writes .cdp-b64-next.json, waits for .cdp-mcp-result.json per sub-call.
 * Agent: read next -> browser_cdp -> write result -> node run-b64-steps.mjs ack
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-b64-run-state.json');
const nextPath = path.join(dir, '.cdp-b64-next.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const viewId = process.argv[3] || '37aca3';
const start = Number(process.argv[4] ?? 2);
const end = Number(process.argv[5] ?? 29);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { step: start, phase: 'plan', ci: 0, done: false };
}

function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

if (process.argv[2] === 'reset') {
  save({ step: start, phase: 'plan', ci: 0 });
  console.log('reset', start, end);
  process.exit(0);
}

if (process.argv[2] === 'ack') {
  const s = load();
  if (!fs.existsSync(resultPath)) {
    console.log(JSON.stringify({ error: 'missing result' }));
    process.exit(1);
  }
  if (s.phase === 'chunk') {
    s.ci++;
    const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-b64-plan-${s.step}.json`), 'utf8'));
    if (s.ci < plan.chunks) {
      fs.writeFileSync(nextPath, JSON.stringify(plan.calls[s.ci]));
      save(s);
      console.log(JSON.stringify({ step: s.step, phase: 'chunk', ci: s.ci, total: plan.chunks }));
      process.exit(0);
    }
    s.phase = 'final';
    s.ci = 0;
    const fin = JSON.parse(execSync(`node mcp-b64-chunks.mjs final ${s.step} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
    fs.writeFileSync(nextPath, JSON.stringify(fin));
    save(s);
    console.log(JSON.stringify({ step: s.step, phase: 'final' }));
    process.exit(0);
  }
  if (s.phase === 'final') {
    execSync(`node record-step-result.mjs ${s.step}`, { cwd: dir, stdio: 'pipe' });
    s.step++;
    s.phase = 'plan';
    s.ci = 0;
    if (s.step > end) {
      s.done = true;
      save(s);
      const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' });
      console.log('FINAL', summary.trim());
      process.exit(0);
    }
    save(s);
  }
}

const s = load();
if (s.phase === 'plan') {
  execSync(`node mcp-b64-chunks.mjs plan ${s.step} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-b64-plan-${s.step}.json`), 'utf8'));
  s.phase = 'chunk';
  s.ci = 0;
  fs.writeFileSync(nextPath, JSON.stringify(plan.calls[0]));
  save(s);
  console.log(JSON.stringify({ step: s.step, phase: 'chunk', ci: 0, total: plan.chunks }));
  process.exit(0);
}

console.log(JSON.stringify({ error: 'bad state', s }));
process.exit(1);
