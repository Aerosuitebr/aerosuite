import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const rawPath = path.join(dir, '.cdp-mcp-last-result.json');
const statePath = path.join(dir, '.cdp-steps-run-state.json');
if (!fs.existsSync(rawPath)) {
  console.error(JSON.stringify({ error: 'missing .cdp-mcp-last-result.json' }));
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const value = raw?.result?.value ?? raw?.value ?? null;
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { results: {}, errors: [] };
state.results[n] = value;
const fail =
  (n === 4 && (!value?.ok || value?.len !== 34708)) ? `step4 ${JSON.stringify(value)}` :
  (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) ? `step5 ${JSON.stringify(value)}` :
  (n === 6 && !value?.ok) ? 'step6' :
  (n === 7 && !value?.ok) ? 'step7' :
  (n === 29 && (!value?.ok || !value?.hasHeroV2)) ? `step29 ${JSON.stringify(value)}` :
  null;
if (fail) {
  state.errors.push({ step: n, reason: fail, value });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ ok: false, step: n, value, reason: fail }));
  process.exit(1);
}
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
console.log(JSON.stringify({ ok: true, step: n, value }));
