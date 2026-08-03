/**
 * Print chunk MCP calls for agent (stdout JSON lines).
 * Usage: node run-chunk-step-cdp.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '37aca3';

execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
for (const c of plan.calls) console.log(JSON.stringify({ kind: 'chunk', n, call: c }));
const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
console.log(JSON.stringify({ kind: 'final', n, call: fin }));
