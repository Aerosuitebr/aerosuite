/** Prep step N: stdout = browser_cdp args JSON. Usage: node .cdp-next-step.mjs N viewId */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '2effaf';
execSync(`node .cdp-mcp-run-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const c = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
process.stdout.write(JSON.stringify({ method: c.method, params: c.params, viewId }));
