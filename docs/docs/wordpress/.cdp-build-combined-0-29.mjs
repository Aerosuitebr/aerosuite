/** Build combined Runtime.evaluate for steps start..end from .cdp-call-N.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'dc48c3';
const parts = [];
for (let n = start; n <= end; n++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
  let expr = call.params.expression.trim();
  if (expr.startsWith('(async()=>') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>'.length, -4);
  }
  parts.push(`results[${n}]=await (async()=>${expr})();`);
}
const combined = `(async()=>{const results={};${parts.join('')}return results;})()`;
const out = {
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, '.cdp-combined-0-29-mcp.json'), JSON.stringify(out));
console.log(JSON.stringify({ len: combined.length, steps: parts.length, viewId }));
