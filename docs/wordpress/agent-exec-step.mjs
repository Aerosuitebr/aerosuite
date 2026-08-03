/**
 * Execute one CDP step: read args, write placeholder for agent MCP call, record result.
 * Agent must write MCP response to .cdp-mcp-result.json before record.
 * Usage: node agent-exec-step.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'ac636f';

const src = path.join(dir, `.invoke-step-${n}.json`);
const payloadPath = path.join(dir, `.mcp-step-${n}-payload.json`);
let args;
if (fs.existsSync(payloadPath)) {
  args = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
} else {
  args = JSON.parse(fs.readFileSync(src, 'utf8'));
}
args.viewId = viewId;

const argsOut = path.join(dir, '.cdp-mcp-args-current.json');
fs.writeFileSync(argsOut, JSON.stringify(args));
console.log(JSON.stringify({ step: n, viewId, method: args.method, exprLen: args.params?.expression?.length ?? 0 }));
