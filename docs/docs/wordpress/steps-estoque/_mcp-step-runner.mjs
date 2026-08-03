/**
 * Prepare step N payload; print one-line JSON for agent MCP browser_cdp call.
 * Usage: node _mcp-step-runner.mjs <viewId> <index>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'd9c791';
const idx = process.argv[3];
if (idx === undefined) {
  console.error('Usage: node _mcp-step-runner.mjs <viewId> <index>');
  process.exit(1);
}

spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, idx], { stdio: 'pipe' });
const payload = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
const out = {
  index: Number(idx),
  mcp: {
    method: payload.method,
    viewId: payload.viewId,
    params: payload.params,
  },
};
const outPath = path.join(dir, `_mcp-step-${idx}.json`);
fs.writeFileSync(outPath, JSON.stringify(out.mcp));
console.log(JSON.stringify({ index: out.index, outPath, awaitPromise: payload.params.awaitPromise, exprLen: payload.params.expression.length }));
