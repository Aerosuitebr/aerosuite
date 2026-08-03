/**
 * Build combined CDP expressions for step batches.
 * Usage: node .build-combined-steps.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '8e6349';

const bodies = [];
for (let n = start; n <= end; n++) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, `.step-out-${n}.json`), 'utf8'));
  let expr = raw.params.expression.trim();
  if (expr.startsWith('(async()=>{') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>{'.length, -'})()'.length);
  }
  bodies.push(`/* step ${n} */ const __r${n} = await (async()=>{${expr}})();`);
}

const combined = `(async()=>{\n${bodies.join('\n')}\nreturn {${Array.from({ length: end - start + 1 }, (_, i) => {
  const n = start + i;
  return `${n}: __r${n}`;
}).join(',')}};\n})()`;

const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
};
const outPath = path.join(dir, `.cdp-combined-${start}-${end}.json`);
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(JSON.stringify({ file: outPath, exprLen: combined.length, steps: `${start}-${end}` }));
