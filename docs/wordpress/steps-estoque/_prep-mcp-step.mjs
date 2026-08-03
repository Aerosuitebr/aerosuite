/** Output MCP args for step index. Usage: node _prep-mcp-step.mjs <viewId> <index> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b46d46';
const idx = process.argv[3];
if (idx === undefined) {
  console.error('Usage: node _prep-mcp-step.mjs <viewId> <index>');
  process.exit(1);
}
spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, idx], { stdio: 'inherit' });
const p = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
const out = { method: p.method, params: p.params, viewId: p.viewId };
fs.writeFileSync(path.join(dir, '_mcp-call-step.json'), JSON.stringify(out));
console.log(JSON.stringify({ index: Number(idx), exprLen: out.params.expression.length, awaitPromise: out.params.awaitPromise }));
