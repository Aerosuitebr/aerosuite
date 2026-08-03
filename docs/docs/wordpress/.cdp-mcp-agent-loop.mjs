/**
 * Agent helper: process one bridge step — read .cdp-mcp-invoke-now.json, print step + args path.
 * After MCP: node .cdp-mcp-agent-loop.mjs done '<json>'
 */
import fs from 'fs';
const cmd = process.argv[2];
if (cmd === 'done') {
  fs.writeFileSync('.cdp-mcp-result.json', process.argv[3]);
  console.log('ok');
  process.exit(0);
}
const inv = JSON.parse(fs.readFileSync('.cdp-mcp-invoke-now.json', 'utf8'));
const { step, viewId, method, params } = inv;
fs.writeFileSync('.cdp-mcp-current-args.json', JSON.stringify({ viewId, method, params }));
console.log(JSON.stringify({ step, exprLen: params?.expression?.length ?? 0 }));
