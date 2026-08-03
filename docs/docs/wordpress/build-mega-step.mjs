/**
 * Build single mega CDP expression for steps 0-29 from .step-out-N.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '8e6349';

const bodies = [];
for (let n = 0; n <= 29; n++) {
  const file = n === 0
    ? path.join(dir, '.cdp-invoke-0.json')
    : path.join(dir, `.step-out-${n}.json`);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  let expr = raw.params.expression.trim();
  if (expr.startsWith('(async()=>{') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>{'.length, -'})()'.length);
  }
  bodies.push(`const __r${n}=await(async()=>{${expr}})();`);
}

const combined = `(async()=>{\n${bodies.join('\n')}\nreturn {${Array.from({ length: 30 }, (_, i) => `${i}:__r${i}`).join(',')}};\n})()`;

const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
};
const outPath = path.join(dir, '.cdp-mega-0-29.json');
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(JSON.stringify({ file: outPath, exprLen: combined.length }));
