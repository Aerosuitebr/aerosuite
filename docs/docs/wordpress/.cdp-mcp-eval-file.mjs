/**
 * Emit exact browser_cdp args from .cdp-call-N.json for agent CallMcpTool.
 * Usage: node .cdp-mcp-eval-file.mjs <n> [viewId]
 */
import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || 'f20479';
const call = JSON.parse(fs.readFileSync(`.cdp-call-${n}.json`, 'utf8'));
call.viewId = viewId;
const out = `.cdp-mcp-args-${n}.json`;
fs.writeFileSync(out, JSON.stringify(call));
console.log(JSON.stringify({ out, exprLen: call.params?.expression?.length }));
