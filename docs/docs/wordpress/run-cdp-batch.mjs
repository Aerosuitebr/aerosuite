/**
 * Load cdp-mcp-call.json and print MCP browser_cdp arguments as one JSON line.
 * Agent: node run-cdp-batch.mjs | use output with CallMcpTool browser_cdp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payload = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-mcp-call.json'), 'utf8'));
process.stdout.write(JSON.stringify({
  method: payload.method,
  params: payload.params,
  viewId: payload.viewId,
}));
