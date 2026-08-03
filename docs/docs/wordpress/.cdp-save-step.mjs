/** Save MCP response and record. Usage: node .cdp-save-step.mjs N (reads stdin) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const raw = fs.readFileSync(0, 'utf8').trim();
fs.writeFileSync(path.join(dir, `.cdp-step-${n}-mcp-response.json`), raw);
fs.writeFileSync(path.join(dir, '.cdp-last-mcp.json'), raw);
const proc = spawnSync('node', ['.cdp-agent-record.mjs', String(n)], { cwd: dir, encoding: 'utf8' });
process.stdout.write(proc.stdout || '');
process.stderr.write(proc.stderr || '');
process.exit(proc.status ?? 0);
