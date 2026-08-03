import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const keep = new Set(['cssVerify', 'cssFinalize', 'encInit', 'enc0', 'enc1', 'enc2', 'enc3', 'encRun']);
const state = JSON.parse(fs.readFileSync(path.join(dir, 'mcp-deploy-state.json'), 'utf8'));
const summary = {};
for (const k of Object.keys(state.summary)) {
  if (keep.has(k)) summary[k] = state.summary[k];
}
summary.cssFullRun = null;
fs.writeFileSync(
  path.join(dir, 'mcp-deploy-state.json'),
  JSON.stringify({ summary, errors: [], done: state.done.filter((f) => !f.includes('cssfull')) }, null, 2)
);
console.log('reset css checkpoints');
