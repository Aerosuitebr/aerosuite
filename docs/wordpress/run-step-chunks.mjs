/**
 * Emit all chunk invokes for one runner step (for agent batch MCP).
 * node run-step-chunks.mjs <step> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const viewId = process.argv[3] || 'bba9a4';
execSync(`node mcp-b64-parts.mjs emit ${step} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const calls = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-b64-calls-${step}.json`), 'utf8'));
const out = path.join(dir, `.mcp-step-${step}-chunks.json`);
fs.writeFileSync(out, JSON.stringify(calls));
console.log(JSON.stringify({ step, parts: calls.length, out }));
