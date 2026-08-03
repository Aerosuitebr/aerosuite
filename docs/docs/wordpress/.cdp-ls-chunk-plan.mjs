import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'dab36f';
const chunkSize = 1800;
const steps = [1, 2, 3];
const all = [];

for (const n of steps) {
  const expr = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}-args.json`), 'utf8')).params.expression;
  const parts = [];
  for (let i = 0; i < expr.length; i += chunkSize) parts.push(expr.slice(i, i + chunkSize));
  const prefix = `as_c${n}_`;
  parts.forEach((p, i) => {
    all.push({
      viewId,
      method: 'Runtime.evaluate',
      params: {
        expression: `(async()=>{localStorage.setItem('${prefix}${i}',${JSON.stringify(p)});return{step:${n},chunk:${i},total:${parts.length}};})()`,
        awaitPromise: true,
        returnByValue: true,
      },
    });
  });
  all.push({
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async()=>{const n=${parts.length};const p='${prefix}';let e='';for(let i=0;i<n;i++)e+=localStorage.getItem(p+i)||'';for(let i=0;i<n;i++)localStorage.removeItem(p+i);let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
}

const out = path.join(dir, '.cdp-ls-all-calls.json');
fs.writeFileSync(out, JSON.stringify(all));
console.log(JSON.stringify({ calls: all.length, out }));
