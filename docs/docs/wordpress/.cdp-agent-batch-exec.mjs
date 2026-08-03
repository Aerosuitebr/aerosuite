/**
 * Build one browser_cdp expression that runs steps start..end sequentially
 * using verbatim expressions from .cdp-mcp-b64-step-N.json (inner eval after atob unwrap).
 */
import fs from 'fs';

const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '441704';

const stepExprs = [];
for (let n = start; n <= end; n++) {
  const j = JSON.parse(fs.readFileSync(`.cdp-mcp-b64-step-${n}.json`, 'utf8'));
  const outer = j.params.expression;
  const m = outer.match(/atob\('([^']+)'\)/);
  if (!m) throw new Error(`step ${n}: no atob`);
  stepExprs.push({ n, innerB64: m[1] });
}

const runner = `(async()=>{
  const steps=${JSON.stringify(stepExprs.map((s) => s.innerB64))};
  const nums=${JSON.stringify(stepExprs.map((s) => s.n))};
  const out={};
  for(let i=0;i<steps.length;i++){
    const n=nums[i];
    const src=atob(steps[i]);
    try{
      let v=eval(src);
      if(v&&typeof v.then==='function')v=await v;
      out[n]=v;
    }catch(e){
      out[n]={error:String(e&&e.message||e)};
      break;
    }
  }
  return out;
})()`;

const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: runner, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-mcp-batch-args.json', JSON.stringify(args));
console.log(JSON.stringify({ start, end, viewId, exprLen: runner.length, steps: stepExprs.length }));
