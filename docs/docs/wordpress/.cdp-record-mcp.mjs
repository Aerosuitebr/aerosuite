import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const key = process.argv[2];
const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
const mcp = JSON.parse(raw);
const value = mcp?.result?.value ?? mcp?.value ?? null;
const statePath = path.join(dir, '.cdp-mcp-orchestrate-state.json');
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { stepResults: {}, errors: [], done: [] };
if (value && typeof value === 'object') {
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) state.stepResults[Number(k)] = v;
  }
}
const s = state.stepResults;
const errors = [];
if (s[4] && (s[4].len !== 34708 || !s[4].ok)) errors.push({ step: 4, value: s[4] });
if (s[5] && (s[5].b64 !== 34708 || !s[5].hasGrid)) errors.push({ step: 5, value: s[5] });
if (s[6] && !s[6].ok) errors.push({ step: 6, value: s[6] });
if (s[7] && !s[7].ok) errors.push({ step: 7, value: s[7] });
if (s[29] && (!s[29].ok || !s[29].hasHeroV2)) errors.push({ step: 29, value: s[29] });
state.errors = errors;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
fs.writeFileSync(path.join(dir, `.cdp-mcp-result-${key}.json`), JSON.stringify(mcp));
console.log(JSON.stringify({ key, value, errors }));
