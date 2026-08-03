/**
 * Split step expression into chunked MCP uploads + final eval.
 * Usage: node .cdp-chunk-step-runner.mjs <n> [liveViewId] [chunkSize]
 * Prints JSON array of browser_cdp argument objects.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const live = process.argv[3] || 'b45110';
const chunkSize = Number(process.argv[4] || 4500);
const livePath = path.join(dir, `.cdp-step-${n}-live-args.json`);
if (!fs.existsSync(livePath)) {
  execSync(`node .cdp-agent-mcp-step.mjs ${n} ${live}`, { cwd: dir, stdio: 'pipe' });
}
const args = JSON.parse(fs.readFileSync(livePath, 'utf8'));
const expr = args.params.expression;
const chunks = [];
for (let i = 0; i < expr.length; i += chunkSize) {
  chunks.push(expr.slice(i, i + chunkSize));
}
const calls = [];
chunks.forEach((c, i) => {
  const esc = JSON.stringify(c).slice(1, -1);
  calls.push({
    viewId: live,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async()=>{window.__cdpExprParts=window.__cdpExprParts||[];window.__cdpExprParts[${i}]=${JSON.stringify(c)};return{chunk:${i},total:${chunks.length}};})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
});
calls.push({
  viewId: live,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{const src=(window.__cdpExprParts||[]).join('');window.__cdpExprParts=null;let v=eval(src);if(v&&typeof v.then==='function')v=await v;return v;})()`,
    awaitPromise: true,
    returnByValue: true,
  },
});
process.stdout.write(JSON.stringify({ step: n, calls }));
