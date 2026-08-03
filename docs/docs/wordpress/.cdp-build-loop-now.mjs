/** Build single CDP loop expression for steps start..end */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'ab2ed3';

const exprs = [];
for (let n = start; n <= end; n++) {
  const a = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-run-${n}-args.json`), 'utf8'));
  exprs.push(a.params.expression);
}

const loop = `(async()=>{const steps=${JSON.stringify(exprs)};const out={};for(let i=0;i<steps.length;i++){const n=${start}+i;let v=eval(steps[i]);if(v&&typeof v.then==='function')v=await v;out[n]=v;if(n===4&&(!v?.ok||v?.len!==34708))return{stopped:4,out};if(n===5&&(!v?.hasGrid||v?.b64!==34708))return{stopped:5,out};if(n===6&&!v?.ok)return{stopped:6,out};if(n===7&&!v?.ok)return{stopped:7,out};if(n===29&&(!v?.ok||!v?.hasHeroV2))return{stopped:29,out};}return{stopped:null,out};})()`;

const mcp = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: loop, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.cdp-loop-mcp-now.json'), JSON.stringify(mcp));
console.log(JSON.stringify({ start, end, exprLen: loop.length, viewId }));
