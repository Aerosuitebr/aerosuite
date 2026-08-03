import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const raw = process.argv[3];
const viewId = process.argv[4] || 'b83599';
const result = typeof raw === 'string' && raw.startsWith('{') ? raw : fs.readFileSync(raw, 'utf8');
const file = path.join(dir, `.cdp-mcp-result-${n}.json`);
fs.writeFileSync(file, result);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));
const rel = manifest.steps[n].replace(/\\/g, '/');
const out = execSync(`node agent-cdp-step.mjs record "${rel}" "${file}"`, { cwd: dir, encoding: 'utf8' }).trim();
console.log(out);
if (n < 29) {
  execSync(`node prep-expr-bootstrap.mjs ${viewId} ${n + 1}`, { cwd: dir, stdio: 'pipe' });
  console.log(JSON.stringify({ next: n + 1 }));
}
