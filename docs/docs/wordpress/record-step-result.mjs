import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));
const rel = manifest.steps[idx].replace(/\\/g, '/');
const resultPath = path.join(dir, '.cdp-mcp-result.json');
if (!fs.existsSync(resultPath)) {
  console.error(JSON.stringify({ error: 'missing .cdp-mcp-result.json' }));
  process.exit(1);
}
const out = execSync(`node cdp-bridge.mjs save "${rel}"`, { cwd: dir, encoding: 'utf8' });
console.log(out.trim());
