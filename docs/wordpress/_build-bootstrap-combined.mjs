import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const q = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-all-chunk-queue.json'), 'utf8'));
const step3 = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-step-3.json'), 'utf8'));
const exprs = q.chunks.map((c) => c.call.params.expression);
exprs.push(step3.params.expression);
const combined = `(async()=>{const __r=[];const __e=${JSON.stringify(exprs)};for(let i=0;i<__e.length;i++){let v=eval(__e[i]);if(v&&typeof v.then==='function')v=await v;__r.push(v);}return{count:__r.length,last:__r[__r.length-1],partsLen:(window.__cssParts||[]).join('').length};})()`;
const out = {
  viewId: '88bb5a',
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.bootstrap-combined-mcp.json'), JSON.stringify(out));
console.log(JSON.stringify({ exprLen: combined.length, chunks: exprs.length }));
