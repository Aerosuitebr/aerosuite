// Prints minimal instruction for agent; actual MCP must be called externally.
import fs from 'fs';
const file = process.argv[2];
const a = JSON.parse(fs.readFileSync(file, 'utf8'));
fs.writeFileSync('.cdp-last-mcp-viewId.txt', a.viewId);
console.log(JSON.stringify({ viewId: a.viewId, method: a.method, exprLen: a.params?.expression?.length }));
