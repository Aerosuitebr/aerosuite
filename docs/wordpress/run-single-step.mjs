/**
 * Helper: load step N args for browser_cdp MCP call.
 * Usage: node run-single-step.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
process.stdout.write(JSON.stringify(args));
