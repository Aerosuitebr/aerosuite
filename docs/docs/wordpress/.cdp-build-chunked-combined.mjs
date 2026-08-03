/** Build chunked inject + eval MCP payloads for combined 0-29 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'dc48c3';
const combined = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-combined-0-29-mcp.json'), 'utf8'));
const expr = combined.params.expression;
const b64 = Buffer.from(expr, 'utf8').toString('base64');
const chunkSize = 6000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}
const payloads = [];
payloads.push({
  step: 'init',
  method: 'Runtime.evaluate',
  params: {
    expression: `window.__combinedB64='';window.__combinedChunks=${chunks.length};`,
    awaitPromise: false,
    returnByValue: true,
  },
  viewId,
});
chunks.forEach((c, i) => {
  payloads.push({
    step: `chunk-${i}`,
    method: 'Runtime.evaluate',
    params: {
      expression: `window.__combinedB64+=${JSON.stringify(c)};`,
      awaitPromise: false,
      returnByValue: true,
    },
    viewId,
  });
});
payloads.push({
  step: 'eval',
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{const src=atob(window.__combinedB64);window.__combinedB64=null;return await eval(src);})()`,
    awaitPromise: true,
    returnByValue: true,
  },
  viewId,
});
fs.writeFileSync(path.join(dir, '.cdp-chunked-mcp-payloads.json'), JSON.stringify(payloads, null, 2));
console.log(JSON.stringify({ chunks: chunks.length, totalB64: b64.length, mcpCalls: payloads.length, viewId }));
