import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'a9930e';
if (!step) {
  console.error('usage: node invoke-step.mjs <step-name> [viewId]');
  process.exit(1);
}
let params;
if (step === 'css-q1') {
  params = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-step-css-q1.json'), 'utf8')).params;
} else {
  params = JSON.parse(fs.readFileSync(path.join(dir, `.params-${step}.json`), 'utf8'));
}
const payload = { method: 'Runtime.evaluate', params, viewId };
fs.writeFileSync(path.join(dir, '.cdp-invoke-payload.json'), JSON.stringify(payload), 'utf8');
console.log(step, 'exprLen=' + params.expression.length);
