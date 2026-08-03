import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'dab36f';
const chunkSize = Number(process.argv[4] || 1800);
const src = path.join(dir, `.cdp-step-${n}-args.json`);
const expr = JSON.parse(fs.readFileSync(src, 'utf8')).params.expression;
const parts = [];
for (let i = 0; i < expr.length; i += chunkSize) parts.push(expr.slice(i, i + chunkSize));
const key = `__exprS${n}`;
const calls = parts.map((p, i) => ({
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{window.${key}=window.${key}||[];window.${key}[${i}]=${JSON.stringify(p)};return{step:${n},chunk:${i},total:${parts.length}};})()`,
    awaitPromise: true,
    returnByValue: true,
  },
}));
const final = {
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{const e=(window.${key}||[]).join('');window.${key}=null;let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`,
    awaitPromise: true,
    returnByValue: true,
  },
};
const out = path.join(dir, `.cdp-chunk-plan-step-${n}.json`);
fs.writeFileSync(out, JSON.stringify({ step: n, chunks: calls.length, calls, final }));
console.log(JSON.stringify({ step: n, chunks: calls.length, out }));
