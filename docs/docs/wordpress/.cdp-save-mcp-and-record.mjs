import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const respPath = process.argv[3] || path.join(dir, '.cdp-last-mcp.json');
const raw = fs.readFileSync(respPath, 'utf8');
fs.writeFileSync(path.join(dir, `.cdp-step-${step}.mcp-out.json`), raw);
const r = spawnSync('node', ['.cdp-finish-step.mjs', String(step), respPath], {
  cwd: dir,
  encoding: 'utf8',
});
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status ?? 0);
