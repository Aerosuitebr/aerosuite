/** Build inline loop for step range; write .cdp-batch-args.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '868beb';
const start = Number(process.argv[3]);
const end = Number(process.argv[4]);

const chunks = [];
for (let n = start; n <= end; n++) {
  const ready = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.mcp-ready.json`), 'utf8'));
  const expr = ready.params.expression.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  chunks.push(`{n:${n},e:\`${expr}\`}`);
}

const loopExpr = `(async()=>{const steps=[${chunks.join(',')}];const out={};for(const s of steps){let v=eval(s.e);if(v&&typeof v.then==='function')v=await v;out[s.n]=v;if(s.n===4&&(!v?.ok||v?.len!==34708))return{stopped:4,out};if(s.n===5&&(!v?.hasGrid||v?.b64!==34708))return{stopped:5,out};if(s.n===6&&!v?.ok)return{stopped:6,out};if(s.n===7&&!v?.ok)return{stopped:7,out};if(s.n===29&&(!v?.ok||!v?.hasHeroV2))return{stopped:29,out};}return{stopped:null,out};})()`;

const args = { viewId, method: 'Runtime.evaluate', params: { expression: loopExpr, awaitPromise: true, returnByValue: true } };
fs.writeFileSync(path.join(dir, '.cdp-batch-args.json'), JSON.stringify(args));
console.log(JSON.stringify({ start, end, exprLen: loopExpr.length }));
