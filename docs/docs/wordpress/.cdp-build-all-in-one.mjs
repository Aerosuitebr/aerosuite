import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'af93cf';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

let body = '(async()=>{const __R={};';
for (let n = start; n <= end; n++) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
  let expr = args.params.expression;
  if (!expr.startsWith('(async()=>')) throw new Error(`step ${n} bad expr`);
  body += `try{__R[${n}]=await (${expr});}catch(e){__R[${n}]={error:String(e)};return __R;}`;
}
body += 'return __R;})()';

const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: body, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.cdp-all-in-one.json'), JSON.stringify(out));
console.log(JSON.stringify({ ok: true, exprLen: body.length, outPath: '.cdp-all-in-one.json' }));
