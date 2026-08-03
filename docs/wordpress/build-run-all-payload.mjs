import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'a9930e';
const all = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-all-payloads.json'), 'utf8'));

function b64Wrap(inner) {
  const b64 = Buffer.from(inner, 'utf8').toString('base64');
  const chunks = [];
  for (let i = 0; i < b64.length; i += 2000) chunks.push(b64.slice(i, i + 2000));
  return `(async()=>{const b64=${JSON.stringify(chunks)}.join('');const src=atob(b64);return await eval(src);})()`;
}

// One browser-side runner: eval each step expression sequentially
const innerSteps = all.map((x) => x.payload.params.expression);
const runnerInner = `(async()=>{const steps=${JSON.stringify(innerSteps)};const out=[];for(let i=0;i<steps.length;i++){try{out.push({name:${JSON.stringify(all.map(a=>a.name))}[i],value:await eval(steps[i])});}catch(e){out.push({name:${JSON.stringify(all.map(a=>a.name))}[i],error:String(e)});break;}}return out;})()`;
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: b64Wrap(runnerInner), awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, '.cdp-run-all-payload.json'), JSON.stringify(payload), 'utf8');
console.log('runner wrapper len', payload.params.expression.length);
