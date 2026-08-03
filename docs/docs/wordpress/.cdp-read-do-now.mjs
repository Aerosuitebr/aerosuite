/** Poll NEED_MCP from .cdp-subagent-loop.mjs and invoke browser_cdp via file bridge */
import fs from 'fs';
const doFile = '.cdp-mcp-do-now.json';
const doneFile = '.cdp-mcp-done-now.json';
if (!fs.existsSync(doFile)) {
  console.error('no do file');
  process.exit(1);
}
const call = JSON.parse(fs.readFileSync(doFile, 'utf8'));
console.log(JSON.stringify({ step: call.step, method: call.method, viewId: call.viewId, exprLen: call.params?.expression?.length ?? 0 }));
// Agent writes MCP response to doneFile
