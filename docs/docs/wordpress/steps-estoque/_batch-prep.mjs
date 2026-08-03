/** Loop steps 2-14: prep payload, print index for parent MCP calls. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b46d46';
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 14);
const results = [];

for (let i = start; i <= end; i++) {
  spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, String(i)], { stdio: 'inherit' });
  const p = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '_mcp-call-step.json'), JSON.stringify({ method: p.method, params: p.params, viewId: p.viewId }));
  results.push({ index: i, exprLen: p.params.expression.length, awaitPromise: p.params.awaitPromise });
}
fs.writeFileSync(path.join(dir, '_batch-prep.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
