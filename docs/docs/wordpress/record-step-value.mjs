import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'bb8370';
const raw = process.argv[4];
if (!step || !raw) {
  console.error('usage: node record-step-value.mjs <step> <viewId> <resultJson>');
  process.exit(2);
}
const result = JSON.parse(raw);
const value = result?.result?.value ?? result?.value ?? result;
const statePath = path.join(dir, '.invoke-mcp-run-state.json');
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { viewId, steps: {}, errors: [] };
state.viewId = viewId;
state.steps[step] = value;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
console.log(JSON.stringify({ step, value }));
