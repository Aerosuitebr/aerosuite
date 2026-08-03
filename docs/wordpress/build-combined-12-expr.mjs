import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [
  ['css-q1', '.cdp-css-b64-q1-expr.txt'],
  ['css-q2', '.cdp-css-b64-q2-expr.txt'],
  ['css-q3', '.cdp-css-b64-q3-expr.txt'],
  ['css-q4', '.cdp-css-b64-q4-expr.txt'],
  ['css-verify', '.invoke-css-verify.json'],
  ['css-finalize', '.invoke-css-finalize.json'],
  ['enc-init', '.invoke-enc-init.json'],
  ['enc-0', '.invoke-enc-0.json'],
  ['enc-1', '.invoke-enc-1.json'],
  ['enc-2', '.invoke-enc-2.json'],
  ['enc-3', '.invoke-enc-3.json'],
  ['enc-run', '.invoke-enc-run.json'],
];

function loadExpr(file) {
  const p = path.join(dir, file);
  if (file.endsWith('.txt')) return fs.readFileSync(p, 'utf8').trim();
  return JSON.parse(fs.readFileSync(p, 'utf8')).expression;
}

const parts = STEPS.map(([name, file]) => {
  const expr = loadExpr(file);
  return `try{out[${JSON.stringify(name)}]=await (${expr});}catch(e){const err={step:${JSON.stringify(name)},error:String(e)};errors.push(err);out[${JSON.stringify(name)}]=err;}`;
});

const combined = `(async()=>{const out={};const errors=[];\n${parts.join('\n')}\nreturn{steps:out,errors,cssVerify:out['css-verify'],cssFinalize:out['css-finalize'],encRun:out['enc-run']};})()`;

fs.writeFileSync(path.join(dir, '.cdp-combined-12-expr.txt'), combined);
fs.writeFileSync(
  path.join(dir, '.cdp-step-call.json'),
  JSON.stringify({
    viewId: 'e81202',
    method: 'Runtime.evaluate',
    params: { expression: combined, awaitPromise: true, returnByValue: true },
  })
);
console.log(JSON.stringify({ exprLen: combined.length, steps: STEPS.length }));
