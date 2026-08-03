import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 11);
const end = Number(process.argv[3] ?? 29);
const src = path.join(dir, '.cdp-last-mcp-response.json');
const parsed = JSON.parse(fs.readFileSync(src, 'utf8'));
const out = parsed?.result?.value ?? parsed?.value ?? parsed;
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));

for (let n = start; n <= end; n++) {
  const value = out[n];
  if (value === undefined) {
    console.log(JSON.stringify({ error: 'missing key', n, keys: Object.keys(out) }));
    process.exit(1);
  }
  const file = path.join(dir, `.cdp-mcp-result-${n}.json`);
  fs.writeFileSync(file, JSON.stringify({ result: { type: 'object', value } }));
  const rel = manifest.steps[n].replace(/\\/g, '/');
  const rec = execSync(`node agent-cdp-step.mjs record "${rel}" "${file}"`, { cwd: dir, encoding: 'utf8' }).trim();
  console.log(`${n} ${rec}`);
}
