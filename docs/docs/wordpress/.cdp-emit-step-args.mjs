/** Emit full MCP args for step N from mcp-ready snapshot. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '868beb';
const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
const args = JSON.parse(fs.readFileSync(ready, 'utf8'));
const payload = { viewId, method: args.method, params: args.params };
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(payload));
process.stdout.write(JSON.stringify(payload));
