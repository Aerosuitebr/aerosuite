import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'expanded-steps.json'), 'utf8'));
const MAX = 50000;

const batches = [];
let current = [];
let size = 0;
for (const step of order) {
  const stepSize = step.expression.length + 200;
  if (current.length && size + stepSize > MAX) {
    batches.push(current);
    current = [];
    size = 0;
  }
  current.push(step);
  size += stepSize;
}
if (current.length) batches.push(current);

const outDir = path.join(dir, 'batch-evals');
fs.mkdirSync(outDir, { recursive: true });

batches.forEach((batch, bi) => {
  const expr = `(async()=>{
    const batch=${JSON.stringify(batch)};
    const out={};
    for(const s of batch){
      let v=eval(s.expression);
      if(s.awaitPromise)v=await v;
      out[s.name]=v;
    }
    return out;
  })()`;
  const file = path.join(outDir, `batch-${bi}.js`);
  fs.writeFileSync(file, expr);
  console.log('batch', bi, 'steps', batch.length, 'bytes', Buffer.byteLength(expr, 'utf8'));
});
