import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const parts = [];
for (let n = start; n <= end; n++) {
  const f = path.join(dir, `.cdp-mcp-payload-${n}.json`);
  if (!fs.existsSync(f)) continue;
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  const params = p.params || p.arguments?.params;
  if (!params?.expression) continue;
  let expr = params.expression.trim();
  if (expr.startsWith('(async()=>') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>'.length, -4);
  }
  parts.push(`results[${n}]=await (async()=>${expr})();`);
}
const combined = `(async()=>{const results={};${parts.join('')}return results;})()`;
const out = {
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.cdp-combined-expr.json'), JSON.stringify(out));
console.log(JSON.stringify({ len: combined.length, steps: parts.length }));
