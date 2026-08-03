/**
 * Emit next step CDP params for browser_cdp Runtime.evaluate.
 * State: cdp-run-state.json { index }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const statePath = path.join(dir, 'cdp-run-state.json');

let state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { index: 0 };

if (process.argv[2] === 'reset') {
  state = { index: 0 };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log('reset', order.length);
  process.exit(0);
}

if (state.index >= order.length) {
  console.log('DONE');
  process.exit(0);
}

const name = order[state.index];
const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
const awaitPromise =
  name.endsWith('-upload') || name === 'apply-pages-footer';
const expression = awaitPromise
  ? content
  : `new Function(${JSON.stringify(content)})()`;
const params = {
  name,
  index: state.index,
  total: order.length,
  method: 'Runtime.evaluate',
  params: {
    expression,
    awaitPromise,
    returnByValue: awaitPromise,
  },
};

state.index += 1;
fs.writeFileSync(statePath, JSON.stringify(state));
fs.writeFileSync(path.join(dir, 'cdp-next.json'), JSON.stringify(params));
console.log('STEP', params.index + 1, '/', params.total, name, awaitPromise);
