import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e81202';
const steps = process.argv.slice(3);
if (!steps.length) {
  console.error('usage: node run-enc-batch.mjs <viewId> enc-0 enc-1 ...');
  process.exit(2);
}

const parts = steps.map((name) => {
  const expr = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8')).expression;
  return `try{out[${JSON.stringify(name)}]=await(${expr});}catch(e){errors.push({step:${JSON.stringify(name)},error:String(e)});out[${JSON.stringify(name)}]={error:String(e)};}`;
});

const combined = `(async()=>{const out={};const errors=[];\n${parts.join('\n')}\nreturn{out,errors,encRun:out['enc-run']};})()`;

fs.writeFileSync(
  path.join(dir, '.cdp-step-call.json'),
  JSON.stringify({
    viewId,
    method: 'Runtime.evaluate',
    params: { expression: combined, awaitPromise: true, returnByValue: true },
  })
);
console.log(JSON.stringify({ steps, exprLen: combined.length }));
