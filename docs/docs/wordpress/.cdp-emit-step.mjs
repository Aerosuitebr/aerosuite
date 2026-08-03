/**
 * Emit MCP args for step N to .cdp-mcp-call-min.json
 * Usage: node .cdp-emit-step.mjs <n> [viewId]
 */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '84ede5';
execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
const out = { method: call.method, params: call.params, viewId: call.viewId };
fs.writeFileSync(path.join(dir, '.cdp-mcp-call-min.json'), JSON.stringify(out));
const batch = out.params.expression.match(/return\{batch:(\d+)/)?.[1];
console.log(JSON.stringify({ step: n, batch, exprLen: out.params.expression.length }));
