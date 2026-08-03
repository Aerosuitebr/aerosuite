/** Prep single step b64 for MCP. Usage: node .cdp-run-step-mcp.mjs <n> [viewId] */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '4f1b3c';
spawnSync('node', ['.cdp-mcp-b64-from.mjs', `.cdp-mcp-call-${n}.json`, viewId], { cwd: dir, stdio: 'inherit' });
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-b64-now.json'), 'utf8'));
fs.writeFileSync(path.join(dir, `.cdp-mcp-b64-step-${n}.json`), JSON.stringify(j));
console.log(JSON.stringify({ step: Number(n), viewId: j.viewId, exprLen: j.params.expression.length }));
