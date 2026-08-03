/**
 * Prints MCP browser_cdp payload JSON to stdout (agent reads and calls CallMcpTool).
 * Usage: node .cdp-mcp-via-node.mjs <step|combined-file>
 */
import fs from 'fs';
const arg = process.argv[2];
let payload;
if (arg.includes('combined')) {
  payload = JSON.parse(fs.readFileSync(arg, 'utf8'));
} else {
  const inv = JSON.parse(fs.readFileSync(`.cdp-invoke-${arg}.json`, 'utf8'));
  payload = { viewId: inv.viewId, method: inv.method, params: inv.params };
}
process.stdout.write(JSON.stringify(payload));
