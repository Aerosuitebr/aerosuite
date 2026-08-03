import fs from 'fs';
import { execSync } from 'child_process';
const viewId = process.argv[2] || '4610b7';
const start = Number(process.argv[3]);
const end = Number(process.argv[4]);
const parts = [];
for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'pipe' });
  const a = JSON.parse(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
  parts.push({ n, expression: a.params.expression });
}
const inner = parts
  .map(
    (p) =>
      `try{__out[${p.n}]=await (async()=>{return await (${p.expression});})();}catch(e){__out[${p.n}]={__error:String(e)};}`
  )
  .join('');
const expression = `(async()=>{const __out={};${inner}return __out;})()`;
const out = { viewId, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } };
const file = `.cdp-chunk-${start}-${end}-mcp-args.json`;
fs.writeFileSync(file, JSON.stringify(out));
console.log(JSON.stringify({ file, exprLen: expression.length, steps: parts.length }));
