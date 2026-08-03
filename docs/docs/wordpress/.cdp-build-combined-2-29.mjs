import fs from 'fs';
import { execSync } from 'child_process';

const viewId = process.argv[2] || '4610b7';
const parts = [];
for (let n = 2; n <= 29; n++) {
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
const payload = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-combined-2-29-mcp-args.json', JSON.stringify(payload));
console.log(JSON.stringify({ exprLen: expression.length, steps: parts.length }));
