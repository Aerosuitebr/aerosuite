/**
 * Upload a large Runtime.evaluate expression via in-page base64 chunks + final eval.
 * Usage: node .cdp-build-expr-upload.mjs <mcp-ready.json> [viewId] [outFile]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(process.argv[2] || path.join(dir, '.cdp-combined-0-4.mcp-ready.json'));
const viewId = process.argv[3] || '265634';
const outFile = process.argv[4] || path.join(dir, '.cdp-upload-calls.json');
const CHUNK = Number(process.env.CDP_UPLOAD_CHUNK || 4000);

const args = JSON.parse(fs.readFileSync(src, 'utf8'));
const expr = args.params?.expression;
if (!expr) {
  console.error(JSON.stringify({ error: 'NO_EXPRESSION', src }));
  process.exit(2);
}

const b64 = Buffer.from(expr, 'utf8').toString('base64');
const calls = [];
calls.push({
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(()=>{window.__b64='';return{phase:'init',ok:true}})()`,
    returnByValue: true,
  },
});

for (let i = 0; i < b64.length; i += CHUNK) {
  const part = b64.slice(i, i + CHUNK);
  calls.push({
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(()=>{window.__b64+='${part}';return{phase:'chunk',len:window.__b64.length}})()`,
      returnByValue: true,
    },
  });
}

const awaitPromise = args.params?.awaitPromise !== false;
calls.push({
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{window.__expr=atob(window.__b64);window.__b64=null;let v=eval(window.__expr);if(v&&typeof v.then==='function')v=await v;return v})()`,
    awaitPromise,
    returnByValue: args.params?.returnByValue !== false,
  },
});

fs.writeFileSync(outFile, JSON.stringify({ src: path.basename(src), exprLen: expr.length, b64Len: b64.length, calls }));
console.log(JSON.stringify({ exprLen: expr.length, b64Len: b64.length, calls: calls.length, outFile: path.basename(outFile) }));
