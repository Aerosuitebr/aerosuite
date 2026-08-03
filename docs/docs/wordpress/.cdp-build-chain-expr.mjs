import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const outPath =
  process.argv[4] ||
  path.join(dir, `.cdp-chain-${start}-${end}.json`);
const exprs = [];
for (let n = start; n <= end; n++) {
  const { params } = JSON.parse(
    fs.readFileSync(path.join(dir, `.cdp-mcp-args-${n}.json`), 'utf8')
  );
  exprs.push(params.expression);
}
const body = `
(async()=>{
  const steps=${JSON.stringify(exprs)};
  const results={};
  for(let i=0;i<steps.length;i++){
    const n=${start}+i;
    try{
      let v=eval(steps[i]);
      if(v&&typeof v.then==='function')v=await v;
      results[n]=v;
    }catch(e){
      results[n]={error:String(e)};
      break;
    }
  }
  return results;
})()
`.trim();
fs.writeFileSync(outPath, JSON.stringify({ expression: body, len: body.length }));
console.log(JSON.stringify({ len: body.length, out: outPath }));
