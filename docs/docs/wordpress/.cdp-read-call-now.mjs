/**
 * Read .cdp-call-now.json and print MCP arguments (for agent CallMcpTool).
 * Usage: node .cdp-read-call-now.mjs [path]
 */
import fs from 'fs';
const p = process.argv[2] || '.cdp-call-now.json';
const a = JSON.parse(fs.readFileSync(p, 'utf8'));
process.stdout.write(JSON.stringify({ method: a.method, params: a.params, viewId: a.viewId }));
