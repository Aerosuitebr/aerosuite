/**
 * Build one Runtime.evaluate that runs steps start..end expressions from .cdp-await-N-args.json
 */
import fs from 'fs';

const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '3dbbe2';

const steps = [];
for (let n = start; n <= end; n++) {
  const p = JSON.parse(fs.readFileSync(`.cdp-await-${n}-args.json`, 'utf8'));
  const outer = p.params.expression;
  const m = outer.match(/^\(async\(\)=>\{([\s\S]*)\}\)\(\)$/);
  if (!m) throw new Error(`step ${n}: bad expression shape`);
  steps.push({ n, body: m[1] });
}

const runner = `(async()=>{
  const bodies=${JSON.stringify(steps.map((s) => s.body))};
  const nums=${JSON.stringify(steps.map((s) => s.n))};
  const out={};
  for(let i=0;i<bodies.length;i++){
    const n=nums[i];
    try{
      const fn=new Function('return (async()=>{'+bodies[i]+'})()');
      let v=await fn();
      out[n]=v;
    }catch(e){
      out[n]={error:String(e&&e.message||e)};
      return{stopped:n,out,error:String(e&&e.message||e)};
    }
  }
  return{stopped:null,out};
})()`;

const payload = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: runner, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-chain-runner-args.json', JSON.stringify(payload));
console.log(JSON.stringify({ start, end, viewId, exprLen: runner.length, steps: steps.length }));
