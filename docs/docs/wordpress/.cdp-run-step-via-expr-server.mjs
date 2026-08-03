/**
 * Prep step N for expr-server + bootstrap MCP args.
 * Usage: node .cdp-run-step-via-expr-server.mjs <n> [viewId]
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || 'bfb4f3';

spawnSync('node', ['.cdp-prep-await-only.mjs', n, viewId], { cwd: dir, stdio: 'inherit' });
const awaitFile = path.join(dir, `.cdp-await-${n}-args.json`);
spawnSync('node', ['.cdp-expr-server.mjs', 'set', awaitFile, viewId], { cwd: dir, stdio: 'inherit' });
const boot = spawnSync('node', ['.cdp-expr-server.mjs', 'bootstrap'], { cwd: dir, encoding: 'utf8' });
const args = JSON.parse(boot.stdout.trim());
fs.writeFileSync(path.join(dir, '.cdp-mcp-bootstrap-args.json'), JSON.stringify(args));
console.log(JSON.stringify({ step: Number(n), viewId: args.viewId, bootstrap: true }));
