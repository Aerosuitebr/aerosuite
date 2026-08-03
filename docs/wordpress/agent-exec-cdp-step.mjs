/**
 * Emit exact browser_cdp args for step N (stdout JSON).
 * Usage: node agent-exec-cdp-step.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'edc223';
const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
const inv = path.join(dir, `.invoke-step-${n}.json`);
let payload;
if (fs.existsSync(mcp)) {
  payload = JSON.parse(fs.readFileSync(mcp, 'utf8'));
} else {
  const a = JSON.parse(fs.readFileSync(inv, 'utf8'));
  payload = { viewId, method: a.method, params: a.params };
}
payload.viewId = viewId;
process.stdout.write(JSON.stringify({ viewId: payload.viewId, method: payload.method, params: payload.params }));
