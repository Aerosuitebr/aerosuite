/**
 * B64-wrap any invoke file for compact browser_cdp relay.
 * Usage: node .cdp-mcp-b64-from.mjs <source.json> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(dir, process.argv[2]);
const viewId = process.argv[3] || '847540';
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
const expression = j.params.expression;
const b64 = Buffer.from(expression, 'utf8').toString('base64');
const wrapper = `(async()=>{const e=atob('${b64}');let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`;
const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
const outPath = path.join(dir, '.cdp-mcp-b64-now.json');
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(JSON.stringify({ outPath, wrapperLen: wrapper.length, origLen: expression.length }));
