/** Output MCP payload for step N: node .cdp-mcp-payload.mjs <n> <viewId> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'dc48c3';
const callPath = path.join(dir, `.cdp-call-${n}.json`);
if (!fs.existsSync(callPath)) {
  spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'prep', String(n), viewId], { cwd: dir, stdio: 'inherit' });
}
const c = JSON.parse(fs.readFileSync(callPath, 'utf8'));
process.stdout.write(JSON.stringify({ method: c.method, params: c.params, viewId }));
