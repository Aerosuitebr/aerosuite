import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const respPath = process.argv[3] || path.join(dir, '.cdp-temp-resp.json');
const raw = fs.readFileSync(respPath, 'utf8');
const r = spawnSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(step), raw], {
  cwd: dir,
  encoding: 'utf8',
});
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status ?? 1);
