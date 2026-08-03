/**
 * Build one Runtime.evaluate expression that runs steps start..end sequentially in-page.
 * Usage: node .cdp-build-combined-expr.mjs 0 29 > .cdp-combined-expr.txt
 */
import fs from 'fs';
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const steps = [];
for (let n = start; n <= end; n++) {
  const j = JSON.parse(fs.readFileSync(`.cdp-step-${n}-mcp.json`, 'utf8'));
  const expr = j.params.expression;
  steps.push(`results[${n}]=await (async()=>${expr.replace(/^\(async\(\)=>\{/, '').replace(/\}\)\(\)$/, '')})();`);
}
const combined = `(async()=>{const results={};${steps.join('')}return results;})()`;
process.stdout.write(combined);
