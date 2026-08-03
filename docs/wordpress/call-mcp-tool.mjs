/**
 * Reads MCP payload JSON from argv[2] and prints MCP-shaped result to stdout.
 * When run by agent after CallMcpTool, pass response via argv[3] file instead.
 * Usage: node call-mcp-tool.mjs <payload.json> [response.json]
 */
import fs from 'fs';

const payloadPath = process.argv[2];
const responsePath = process.argv[3];

if (!payloadPath) {
  console.error('usage: node call-mcp-tool.mjs <payload.json> [response.json]');
  process.exit(2);
}

if (responsePath) {
  const raw = fs.readFileSync(responsePath, 'utf8');
  process.stdout.write(raw);
  process.exit(0);
}

const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const args = payload.arguments || payload;
console.error(
  JSON.stringify({
    need: 'CallMcpTool',
    server: 'cursor-ide-browser',
    toolName: 'browser_cdp',
    viewId: args.viewId,
    exprLen: args.params?.expression?.length ?? 0,
  })
);
process.exit(3);
