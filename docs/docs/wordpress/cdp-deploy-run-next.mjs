/**
 * Emit next deploy step for MCP browser_cdp Runtime.evaluate.
 * Usage: node cdp-deploy-run-next.mjs [reset|record <json>]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = [
  'deploy-step-0.js',
  'deploy-step-1.js',
  'deploy-step-2.js',
  'deploy-step-3.js',
  'deploy-css-step-0.js',
  'deploy-css-step-1.js',
  'deploy-css-step-2.js',
  'deploy-css-step-3.js',
  'deploy-css-step-4.js',
  'deploy-css-step-5.js',
  'deploy-upload-hero.js',
  'deploy-upload-phone.js',
  'deploy-upload-zoom.js',
  'deploy-finalize-v2.js',
];
const statePath = path.join(dir, 'cdp-deploy-state.json');

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { index: 0, results: [] };

const cmd = process.argv[2] || 'next';

if (cmd === 'reset') {
  state = { index: 0, results: [] };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset', order.length);
  process.exit(0);
}

if (cmd === 'record') {
  const value = process.argv[3] ? JSON.parse(process.argv[3]) : null;
  const name = order[state.index - 1];
  state.results.push({ name, value });
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('recorded', state.index, '/', order.length, name);
  process.exit(0);
}

if (state.index >= order.length) {
  console.log('DONE', JSON.stringify(state.results[state.results.length - 1]?.value ?? null));
  process.exit(0);
}

const name = order[state.index];
const expression = fs.readFileSync(path.join(dir, name), 'utf8').trim();
const payload = {
  name,
  index: state.index,
  total: order.length,
  method: 'Runtime.evaluate',
  params: {
    expression,
    awaitPromise: true,
    returnByValue: true,
  },
};

state.index += 1;
fs.writeFileSync(statePath, JSON.stringify(state));
fs.writeFileSync(path.join(dir, 'cdp-deploy-next.json'), JSON.stringify(payload));
console.log('STEP', payload.index + 1, '/', payload.total, name);
