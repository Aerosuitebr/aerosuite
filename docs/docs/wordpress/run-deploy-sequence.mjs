/**
 * Run CSS quarters + finalize + home encoding via pending MCP args files.
 * Usage: node run-deploy-sequence.mjs <viewId>
 * Prints one JSON line per step: {step, ok, value|error}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b639e2';
const steps = [
  '.mcp-deploy-css-q1.json',
  '.mcp-deploy-css-q2.json',
  '.mcp-deploy-css-q3.json',
  '.mcp-deploy-css-q4.json',
  '.mcp-deploy-css-finalize.json',
  '.mcp-deploy-enc-init.json',
  '.mcp-deploy-enc-0.json',
  '.mcp-deploy-enc-1.json',
  '.mcp-deploy-enc-2.json',
  '.mcp-deploy-enc-3.json',
  '.mcp-deploy-enc-run.json',
];

for (const file of steps) {
  execSync(`node prep-mcp-args.mjs ${viewId} ${file}`, { cwd: dir, stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-pending-args.json'), 'utf8'));
  const out = { step: file, argsPath: path.join(dir, '.cdp-pending-args.json'), method: args.method, exprLen: args.params?.expression?.length ?? 0 };
  console.log(JSON.stringify(out));
}
