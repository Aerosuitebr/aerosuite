/**
 * Compact browser_cdp args: fetch full step expression from local server.
 * node mcp-fetch-args.mjs <step> [viewId] [outFile]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const viewId = process.argv[3] || '4d6eae';
const port = Number(process.env.CDP_STEP_PORT || 8769);
const expression = `(async()=>{const p=await fetch('http://127.0.0.1:${port}/step/${step}').then(r=>r.json());let v=eval(p.expression);if(p.awaitPromise&&v&&typeof v.then==='function')v=await v;return v;})()`;
const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
};
const out = process.argv[4] ? path.resolve(process.argv[4]) : null;
if (out) fs.writeFileSync(out, JSON.stringify(args));
else process.stdout.write(JSON.stringify(args));
console.error(JSON.stringify({ step, viewId, wrapperLen: expression.length }));
