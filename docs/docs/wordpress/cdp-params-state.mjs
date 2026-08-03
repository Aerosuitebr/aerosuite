/**
 * State machine for MCP browser_cdp step execution.
 * node cdp-params-state.mjs next     -> writes .cdp-invoke-payload.json, prints step name
 * node cdp-params-state.mjs record '<json>' -> saves result, advances
 * node cdp-params-state.mjs summary  -> prints final JSON summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.cdp-params-state.json');
const viewId = process.argv.includes('--view') ? process.argv[process.argv.indexOf('--view') + 1] : 'a9930e';

const stepList = [
  { name: 'css-q1', file: '.mcp-step-css-q1.json', nested: true },
  { name: 'css-q2', file: '.params-css-q2.json' },
  { name: 'css-q3', file: '.params-css-q3.json' },
  { name: 'css-q4', file: '.params-css-q4.json' },
  { name: 'css-verify', file: '.params-css-verify.json', key: 'cssVerify' },
  { name: 'css-finalize', file: '.params-css-finalize.json', key: 'cssFinalize' },
  { name: 'enc-init', file: '.params-enc-init.json' },
  { name: 'enc-0', file: '.params-enc-0.json' },
  { name: 'enc-1', file: '.params-enc-1.json' },
  { name: 'enc-2', file: '.params-enc-2.json' },
  { name: 'enc-3', file: '.params-enc-3.json' },
  { name: 'enc-run', file: '.params-enc-run.json', key: 'encRun' },
];

function loadPayload(step) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, step.file), 'utf8'));
  const params = step.nested ? raw.params : raw;
  return { method: 'Runtime.evaluate', params, viewId };
}

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { next: 0, results: {}, errors: [] };

const cmd = process.argv[2] || 'next';

if (cmd === 'reset') {
  state = { next: 0, results: {}, errors: [] };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset');
  process.exit(0);
}

if (cmd === 'record') {
  const raw = process.argv[3] || '{}';
  const resp = JSON.parse(raw);
  const idx = state.next - 1;
  const step = stepList[idx];
  if (!step) {
    console.error('no step for index', idx);
    process.exit(1);
  }
  if (resp?.exceptionDetails || resp?.result?.subtype === 'error') {
    state.errors.push({ step: step.name, error: resp.exceptionDetails || resp.result });
    fs.writeFileSync(statePath, JSON.stringify(state));
    console.log('ERROR', step.name);
    process.exit(1);
  }
  const value = resp?.result?.value ?? resp?.value ?? resp;
  state.results[step.name] = value;
  if (step.key) state.results[step.key] = value;
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('recorded', step.name, JSON.stringify(value).slice(0, 160));
  process.exit(state.next >= stepList.length ? 0 : 0);
}

if (cmd === 'summary') {
  const summary = {
    viewId,
    originalViewId: '8f0e3d',
    note: 'Tab 8f0e3d was closed; restored css buffer via q1+q2 on new tab',
    cssVerify: state.results.cssVerify ?? null,
    cssFinalize: state.results.cssFinalize ?? null,
    encRun: state.results.encRun ?? null,
    steps: state.results,
    errors: state.errors,
  };
  fs.writeFileSync(path.join(dir, '.cdp-params-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

if (state.next >= stepList.length) {
  console.log('DONE');
  process.exit(0);
}

const step = stepList[state.next];
const payload = loadPayload(step);
fs.writeFileSync(path.join(dir, '.cdp-invoke-payload.json'), JSON.stringify(payload), 'utf8');
state.next += 1;
fs.writeFileSync(statePath, JSON.stringify(state));
console.log('NEXT', step.name, state.next - 1, '/', stepList.length);
