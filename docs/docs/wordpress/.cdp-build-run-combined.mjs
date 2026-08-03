import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '3a0808';
const steps = [];
for (let n = 0; n <= 29; n++) {
  if (n === 1) continue;
  execSync(`node .cdp-prep-and-snapshot.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const snap = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-snap-${n}.json`), 'utf8'));
  const inner = snap.params.expression.replace(/^\(async\(\)=>\{/, '').replace(/\}\)\(\)$/, '');
  steps.push({ n, inner });
}
const combined = `(async()=>{const __out={};${steps
  .map(
    ({ n, inner }) =>
      `try{__out[${n}]=await (async()=>{${inner}})();}catch(e){__out[${n}]={error:String(e)};}`,
  )
  .join('')}return __out;})()`;
const payload = { viewId, method: 'Runtime.evaluate', params: { expression: combined, awaitPromise: true, returnByValue: true } };
fs.writeFileSync(path.join(dir, '.cdp-combined-run-args.json'), JSON.stringify(payload));
console.log(JSON.stringify({ steps: steps.map((s) => s.n), exprLen: combined.length }));
