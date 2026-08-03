import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 14);
const end = Number(process.argv[3] ?? 19);
const viewId = process.argv[4] ?? '1031af';
const parts = [];
for (let n = start; n <= end; n++) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-b64-step-${n}.json`), 'utf8'));
  const inner = j.params.expression.match(/atob\('([^']+)'\)/)?.[1];
  if (!inner) throw new Error(`no b64 in step ${n}`);
  parts.push(`{n:${n},b:'${inner}'}`);
}
const loopExpr = `(async()=>{const steps=[${parts.join(',')}];const out={};for(const s of steps){const e=atob(s.b);out[s.n]=await eval(e);}return out;})()`;
const args = { viewId, method: 'Runtime.evaluate', params: { expression: loopExpr, awaitPromise: true, returnByValue: true } };
fs.writeFileSync(path.join(dir, `.cdp-batch-${start}-${end}-args.json`), JSON.stringify(args));
console.log(JSON.stringify({ viewId, start, end, exprLen: loopExpr.length }));
