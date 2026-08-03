/**
 * Execute one CDP call JSON file via MCP-shaped result file.
 * Usage: node .cdp-exec-via-mcp-read.mjs <callJsonPath> <viewId>
 * Prints MCP args path; agent must CallMcpTool and write result to .cdp-last-result.json
 */
import fs from 'fs';
const callPath = process.argv[2];
const viewId = process.argv[3] || '041fe0';
const a = JSON.parse(fs.readFileSync(callPath, 'utf8'));
a.viewId = viewId;
fs.writeFileSync('.cdp-mcp-call-now.json', JSON.stringify(a));
console.log('READY', callPath, a.params.expression.length);
