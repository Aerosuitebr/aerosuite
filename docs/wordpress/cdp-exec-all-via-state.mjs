/**
 * Executes all pending CDP invocations by writing eval payloads for external MCP runner.
 * Usage: node cdp-exec-all-via-state.mjs run-next  -> outputs cdp-eval-params.json path
 *        node cdp-exec-all-via-state.mjs status
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, 'cdp-exec-state.json');
const listPath = path.join(dir, 'cdp-invocations.jsonl');
const viewId = process.env.CDP_VIEW_ID || 'a52ddb';

const invocations = fs
  .readFileSync(listPath, 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const cmd = process.argv[2] || 'status';
let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { next: 0, results: [] };

if (cmd === 'reset') {
  state = { next: 0, results: [] };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset', invocations.length);
  process.exit(0);
}

if (cmd === 'record') {
  const raw = process.argv[3] || 'null';
  const value = JSON.parse(raw);
  const idx = state.next - 1;
  const inv = invocations[idx];
  if (value?.exceptionDetails) {
    console.log('ERROR', JSON.stringify(value.exceptionDetails));
    process.exit(1);
  }
  state.results.push({ batch: inv?.batch, kind: inv?.kind, value: value?.result?.value ?? value });
  fs.writeFileSync(statePath, JSON.stringify(state));
  if (state.next >= invocations.length) {
    const final = state.results[state.results.length - 1]?.value;
    console.log('DONE', JSON.stringify(final));
  } else {
    console.log('recorded', state.next, '/', invocations.length);
  }
  process.exit(0);
}

if (state.next >= invocations.length) {
  const final = state.results[state.results.length - 1]?.value;
  console.log('DONE', JSON.stringify(final));
  process.exit(0);
}

const inv = invocations[state.next];
fs.writeFileSync(
  path.join(dir, 'cdp-current.json'),
  JSON.stringify({
    index: state.next,
    total: invocations.length,
    batch: inv.batch,
    kind: inv.kind,
    awaitPromise: inv.awaitPromise,
    expression: inv.expression,
  })
);
fs.writeFileSync(
  path.join(dir, 'cdp-eval-params.json'),
  JSON.stringify({
    method: 'Runtime.evaluate',
    params: {
      expression: inv.expression,
      returnByValue: true,
      awaitPromise: inv.awaitPromise,
    },
    viewId,
  })
);
state.next += 1;
fs.writeFileSync(statePath, JSON.stringify(state));
console.log('INVOKE', state.next - 1, inv.batch, inv.kind, inv.awaitPromise);
