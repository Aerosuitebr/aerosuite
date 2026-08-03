/**
 * Emit step N to .cdp-mcp-call-min.json and print metadata for agent MCP.
 * Usage: node .cdp-agent-mcp-loop-steps.mjs <n> [viewId]
 */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '7eacd5';
execSync(`node .cdp-emit-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-call-min.json'), 'utf8'));
fs.writeFileSync(path.join(dir, '.cdp-mcp-invoke-args.json'), JSON.stringify(call));
console.log(JSON.stringify({ step: n, viewId: call.viewId, exprLen: call.params.expression.length }));
