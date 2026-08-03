import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
const mcpResult = JSON.parse(fs.readFileSync(process.argv[3] || path.join(dir, '.cdp-last-mcp-result.json'), 'utf8'));
const value = mcpResult?.result?.value ?? mcpResult?.value ?? mcpResult;
const statePath = path.join(dir, '.deploy-batch-results.json');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { results: {} };
if (value?.out) {
  for (const [k, v] of Object.entries(value.out)) state.results[Number(k)] = v;
}
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
fs.writeFileSync(path.join(dir, '.cdp-last-mcp-result.json'), JSON.stringify(mcpResult));
console.log(JSON.stringify({ file, keys: Object.keys(state.results).map(Number).sort((a,b)=>a-b) }));
