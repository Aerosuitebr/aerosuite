import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8');
const r = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', n, raw], {
  cwd: dir,
  encoding: 'utf8',
});
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status ?? 0);
