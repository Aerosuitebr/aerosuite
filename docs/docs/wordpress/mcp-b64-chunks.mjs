/**
 * Build small MCP calls from base64 chunks of invoke expression.
 * Usage: node mcp-b64-chunks.mjs plan <n> [viewId] [chunkSize]
 *        node mcp-b64-chunks.mjs final <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '37aca3';
const chunkSize = Number(process.argv[5] || 1200);

function loadExpr() {
  return JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8')).params.expression;
}

if (cmd === 'plan') {
  const b64 = Buffer.from(loadExpr(), 'utf8').toString('base64');
  const parts = [];
  for (let i = 0; i < b64.length; i += chunkSize) parts.push(b64.slice(i, i + chunkSize));
  const calls = parts.map((p, i) => ({
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async()=>{window.__ub=window.__ub||[];window.__ub[${i}]=${JSON.stringify(p)};return{ci:${i},total:${parts.length}};})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  }));
  fs.writeFileSync(path.join(dir, `.cdp-b64-plan-${n}.json`), JSON.stringify({ n, chunks: calls.length, calls }), 'utf8');
  console.log(JSON.stringify({ n, chunks: calls.length, b64Len: b64.length }));
  process.exit(0);
}

if (cmd === 'final') {
  const call = {
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression:
        "(async()=>{const e=atob((window.__ub||[]).join(''));window.__ub=null;let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()",
      awaitPromise: true,
      returnByValue: true,
    },
  };
  console.log(JSON.stringify(call));
  process.exit(0);
}

console.error('usage: plan|final');
process.exit(2);
