/**
 * Writes invocations list and executes next via stdout for agent.
 * State: cdp-exec-state.json { next: number, results: [] }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, 'cdp-exec-state.json');
const listPath = path.join(dir, 'cdp-invocations.jsonl');

if (!fs.existsSync(listPath)) {
  const out = spawnSync(process.execPath, ['run-all-cdp-batches.mjs'], {
    cwd: dir,
    encoding: 'utf8',
  });
  fs.writeFileSync(listPath, out.stdout);
}

const invocations = fs
  .readFileSync(listPath, 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { next: 0, results: [] };

const cmd = process.argv[2] || 'next';
if (cmd === 'reset') {
  state = { next: 0, results: [] };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset', invocations.length);
  process.exit(0);
}

if (cmd === 'record') {
  const value = process.argv[3] ? JSON.parse(process.argv[3]) : null;
  const last = invocations[state.next - 1];
  state.results.push({ batch: last?.batch, kind: last?.kind, value });
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('recorded', state.next, '/', invocations.length);
  process.exit(0);
}

if (state.next >= invocations.length) {
  console.log('DONE', JSON.stringify(state.results[state.results.length - 1]?.value));
  process.exit(0);
}

const inv = invocations[state.next];
const outPath = path.join(dir, 'cdp-current.json');
fs.writeFileSync(
  outPath,
  JSON.stringify({
    index: state.next,
    total: invocations.length,
    batch: inv.batch,
    kind: inv.kind,
    awaitPromise: inv.awaitPromise,
    expression: inv.expression,
  })
);
state.next += 1;
fs.writeFileSync(statePath, JSON.stringify(state));

console.log('INVOKE', state.next - 1, inv.batch, inv.kind, inv.expression.length);
