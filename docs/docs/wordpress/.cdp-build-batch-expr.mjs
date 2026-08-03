import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 4);
const end = Number(process.argv[3] ?? 29);
const steps = [];
for (let n = start; n <= end; n++) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
  steps.push({ n, expr: args.params.expression });
}
const payload = JSON.stringify(steps);
const wrapper = `(async()=>{const steps=${payload};const out={};for(const {n,expr} of steps){let v=eval(expr);if(v&&typeof v.then==='function')v=await v;out[n]=v;}return out;})()`;
const outPath = path.join(dir, '.cdp-batch-expr-out.json');
fs.writeFileSync(outPath, JSON.stringify({ expression: wrapper, len: wrapper.length }));
console.log(JSON.stringify({ start, end, exprLen: wrapper.length, outPath }));
