/**
 * Agent helper: load .cdp-mcp-do-now.json and save MCP response to .cdp-mcp-done-now.json
 * Usage: node .cdp-save-mcp-done.mjs '<json response>'
 */
import fs from 'fs';
const raw = process.argv[2] || fs.readFileSync(0, 'utf8');
fs.writeFileSync('.cdp-mcp-done-now.json', raw);
const j = JSON.parse(raw);
const v = j?.result?.value ?? j?.result?.result?.value;
console.log(JSON.stringify({ saved: true, value: v }));
