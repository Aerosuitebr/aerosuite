import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'a9930e';
const outFile = path.join(dir, '.cdp-step-result.json');

const stepList = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4', 'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const startIdx = step ? stepList.indexOf(step) : 0;
if (startIdx < 0) {
  console.error('unknown step', step);
  process.exit(1);
}

function loadPayload(name) {
  if (name === 'css-q1') {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-step-css-q1.json'), 'utf8'));
    return { method: 'Runtime.evaluate', params: raw.params, viewId };
  }
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.params-${name}.json`), 'utf8'));
  return { method: 'Runtime.evaluate', params, viewId };
}

const summary = { viewId, originalViewId: '8f0e3d', note: 'Tab 8f0e3d lost; re-ran q1+q2 on a9930e', errors: [], steps: {} };
for (let i = startIdx; i < stepList.length; i++) {
  const name = stepList[i];
  const payload = loadPayload(name);
  fs.writeFileSync(path.join(dir, '.cdp-invoke-payload.json'), JSON.stringify(payload), 'utf8');
  fs.writeFileSync(outFile, JSON.stringify({ pending: name, index: i }), 'utf8');
  console.log('INVOKE', name, payload.params.expression.length);
  process.exit(0);
}
