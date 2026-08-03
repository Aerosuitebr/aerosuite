/** Run one CDP step via MCP args file; prints compact result line for agent. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b46d46';
const idx = process.argv[3];
if (!idx) {
  console.error('Usage: node _emit-mcp-args.mjs <viewId> <index>');
  process.exit(1);
}

spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, idx], { stdio: 'pipe' });
const payload = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
const out = path.join(dir, '_cdp-call-args.json');
fs.writeFileSync(out, JSON.stringify({ method: payload.method, params: payload.params, viewId: payload.viewId }));
console.log(JSON.stringify({ index: Number(idx), awaitPromise: payload.params.awaitPromise, exprLen: payload.params.expression.length, outFile: out }));
