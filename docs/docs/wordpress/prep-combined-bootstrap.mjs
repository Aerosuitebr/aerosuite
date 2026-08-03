import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b83599';
const start = Number(process.argv[3] ?? 11);
const end = Number(process.argv[4] ?? 29);

const parts = [];
for (let n = start; n <= end; n++) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
  let expr = args.params.expression.trim();
  if (expr.startsWith('(async()=>{') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>{'.length, -'})()'.length);
  }
  parts.push(`__out[${n}]=await (async()=>{${expr}})();`);
}

const combined = `(async()=>{const __out={};${parts.join('')}return __out;})()`;
const mcpArgs = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.cdp-mcp-args-current.json'), JSON.stringify(mcpArgs));
execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
console.log(JSON.stringify({ start, end, exprLen: combined.length, viewId }));
