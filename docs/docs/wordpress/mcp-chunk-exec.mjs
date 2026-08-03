/**
 * Chunked Runtime.evaluate for large expressions (HTTPS wp-admin safe).
 * Usage: node mcp-chunk-exec.mjs emit-chunks <n> [viewId] [chunkSize]
 *        node mcp-chunk-exec.mjs emit-final <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '37aca3';
const chunkSize = Number(process.argv[5] || 1800);

function loadExpr() {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
  return args.params.expression;
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

if (cmd === 'emit-chunks') {
  const expr = loadExpr();
  const parts = [];
  for (let i = 0; i < expr.length; i += chunkSize) parts.push(expr.slice(i, i + chunkSize));
  const calls = parts.map(
    (p, i) => ({
      viewId,
      method: 'Runtime.evaluate',
      params: {
        expression: `(async()=>{window.__exprParts=window.__exprParts||[];window.__exprParts[${i}]=${JSON.stringify(p)};return{chunk:${i},total:${parts.length}};})()`,
        awaitPromise: true,
        returnByValue: true,
      },
    })
  );
  fs.writeFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), JSON.stringify({ n, chunks: calls.length, calls }), 'utf8');
  console.log(JSON.stringify({ n, chunks: calls.length, exprLen: expr.length }));
  process.exit(0);
}

if (cmd === 'emit-final') {
  const call = {
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression:
        "(async()=>{const e=(window.__exprParts||[]).join('');window.__exprParts=null;let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()",
      awaitPromise: true,
      returnByValue: true,
    },
  };
  console.log(JSON.stringify(call));
  process.exit(0);
}

console.error('usage: emit-chunks|emit-final');
process.exit(2);
