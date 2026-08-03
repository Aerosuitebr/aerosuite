import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 6);
const end = Number(process.argv[3] ?? 29);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));

for (let n = start; n <= end; n++) {
  const rel = manifest.steps[n].replace(/\\/g, '/');
  const src = path.join(dir, `.cdp-mcp-result-${n}.json`);
  if (!fs.existsSync(src)) {
    console.log(JSON.stringify({ error: 'missing', n, src }));
    process.exit(1);
  }
  try {
    const out = execSync(`node agent-cdp-step.mjs record "${rel}" "${src}"`, { cwd: dir, encoding: 'utf8' }).trim();
    console.log(`${n} ${out}`);
  } catch (e) {
    console.log(`${n} FAIL ${e.stdout?.trim() || e.message}`);
    process.exit(1);
  }
}
