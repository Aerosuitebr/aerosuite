/**
 * Prints step N invoke path for agent MCP (stdout = path only).
 * Agent: args=JSON.parse(fs.readFileSync(path)); browser_cdp(args); 
 *         node .cdp-save-mcp-and-record.mjs N .cdp-last-mcp.json
 */
import fs from 'fs';
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'af93cf';
const { execSync } = await import('child_process');
const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, { encoding: 'utf8' }).trim();
const path = `.cdp-call-${n}.json`;
fs.writeFileSync(path, out);
const j = JSON.parse(out);
console.log(JSON.stringify({ step: n, path, viewId: j.viewId, exprLen: j.params?.expression?.length }));
