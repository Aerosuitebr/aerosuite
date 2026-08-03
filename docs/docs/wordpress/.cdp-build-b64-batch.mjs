/** Batch base64 chunk appends into fewer MCP calls. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callsFile = path.resolve(process.argv[2] || path.join(dir, '.cdp-upload-0-4-calls.json'));
const start = Number(process.argv[3] || 2);
const end = Number(process.argv[4] || 13);
const perBatch = Number(process.argv[5] || 3);
const viewId = process.argv[6] || '265634';
const { calls } = JSON.parse(fs.readFileSync(callsFile, 'utf8'));

function extractAppend(expr) {
  const m = expr.match(/__b64\+='([\s\S]*)';return/);
  if (!m) throw new Error('no append: ' + expr.slice(0, 80));
  return m[1];
}

const parts = [];
for (let i = start; i <= end; i++) parts.push(extractAppend(calls[i].params.expression));

const batches = [];
for (let i = 0; i < parts.length; i += perBatch) {
  const slice = parts.slice(i, i + perBatch);
  const joined = slice.join('');
  batches.push({
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(()=>{window.__b64+='${joined}';return{phase:'batch',len:window.__b64.length}})()`,
      returnByValue: true,
    },
  });
}

const out = path.join(dir, '.cdp-b64-batch-calls.json');
fs.writeFileSync(out, JSON.stringify({ batches }));
console.log(JSON.stringify({ batches: batches.length, exprLens: batches.map((b) => b.params.expression.length) }));
