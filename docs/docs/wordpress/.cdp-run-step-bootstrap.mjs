/** Build bootstrap MCP args from .cdp-step-N.mcp-ready.json (no shared file race). */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '868beb';
const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
const snap = path.join(dir, `.cdp-step-${n}.snap-args.json`);
const args = JSON.parse(fs.readFileSync(ready, 'utf8'));
args.viewId = viewId;
fs.writeFileSync(snap, JSON.stringify({ viewId: args.viewId, method: args.method, params: args.params }));
spawnSync('node', ['.cdp-expr-server.mjs', 'set', snap, viewId], { cwd: dir, stdio: 'pipe' });
const out = spawnSync('node', ['.cdp-expr-server.mjs', 'bootstrap'], { cwd: dir, encoding: 'utf8' });
process.stdout.write(out.stdout.trim());
