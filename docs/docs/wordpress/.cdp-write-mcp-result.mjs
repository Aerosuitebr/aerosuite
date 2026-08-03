/** Write MCP result for sync runner. Usage: node .cdp-write-mcp-result.mjs [file] */
import fs from 'fs';
const src = process.argv[2] || '.cdp-last-mcp-resp.json';
fs.writeFileSync('.cdp-mcp-step-result.json', fs.readFileSync(src, 'utf8'));
console.log('written');
