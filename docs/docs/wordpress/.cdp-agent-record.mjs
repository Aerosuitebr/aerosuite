/** Record MCP response for step N from .cdp-step-N-mcp-response.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const raw = (process.argv[3] || fs.readFileSync(path.join(dir, `.cdp-step-${n}-mcp-response.json`), 'utf8')).trim();
const proc = spawnSync('node', ['.cdp-mcp-sequential-run.mjs', 'record', String(n), raw], {
  cwd: dir,
  encoding: 'utf8',
});
process.stdout.write(proc.stdout || '');
process.stderr.write(proc.stderr || '');
process.exit(proc.status ?? 0);
