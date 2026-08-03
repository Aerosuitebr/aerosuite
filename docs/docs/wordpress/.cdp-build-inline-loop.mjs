/** Build one Runtime.evaluate that runs steps start..end inline (no fetch). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '868beb';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

const bodies = [];
for (let n = start; n <= end; n++) {
  const ready = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.mcp-ready.json`), 'utf8'));
  const expr = ready.params.expression;
  bodies.push(`{n:${n},run:async()=>{${expr.startsWith('(async') ? `return (${expr})` : `return (${expr})`}}}`);
}

const loopExpr = `(async()=>{const steps=[${bodies.join(',')}];const out={};for(const s of steps){let v=await s.run();out[s.n]=v;if(s.n===4&&(!v?.ok||v?.len!==34708))return{stopped:4,out};if(s.n===5&&(!v?.hasGrid||v?.b64!==34708))return{stopped:5,out};if(s.n===6&&!v?.ok)return{stopped:6,out};if(s.n===7&&!v?.ok)return{stopped:7,out};if(s.n===29&&(!v?.ok||!v?.hasHeroV2))return{stopped:29,out};}return{stopped:null,out};})()`;

const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: loopExpr, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.cdp-inline-loop-args.json'), JSON.stringify(args));
console.log(JSON.stringify({ viewId, start, end, exprLen: loopExpr.length }));
