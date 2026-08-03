import fs from 'fs';

const viewId = process.argv[2] || '868beb';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

const loopExpr = `(async()=>{const out={};for(let n=${start};n<=${end};n++){const p=await fetch('http://127.0.0.1:8769/step/'+n).then(r=>r.json());let v=eval(p.expression);if(p.awaitPromise&&v&&typeof v.then==='function')v=await v;out[n]=v;if(n===4&&(!v?.ok||v?.len!==34708))return{stopped:4,out};if(n===5&&(!v?.hasGrid||v?.b64!==34708))return{stopped:5,out};if(n===6&&!v?.ok)return{stopped:6,out};if(n===7&&!v?.ok)return{stopped:7,out};if(n===29&&(!v?.ok||!v?.hasHeroV2))return{stopped:29,out};}return{stopped:null,out};})()`;

const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: loopExpr, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-loop-all-args.json', JSON.stringify(args));
console.log(JSON.stringify({ viewId, start, end, exprLen: loopExpr.length }));
