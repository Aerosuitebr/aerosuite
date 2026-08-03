/**
 * Execute steps via MCP browser_cdp by reading _invoke-step-{i}.json.
 * Usage: node _exec-step.mjs <viewId> <index>
 * Prints JSON result line: {"index", "value", "exception"?}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b46d46';
const idx = process.argv[3];
if (!idx) {
  console.error('Usage: node _exec-step.mjs <viewId> <index>');
  process.exit(1);
}

spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, idx], { stdio: 'pipe' });
const invoke = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));

// Write compact invoke for agent MCP call
const outPath = path.join(dir, '_next-mcp.json');
fs.writeFileSync(outPath, JSON.stringify({ method: invoke.method, params: invoke.params, viewId: invoke.viewId }));

// Also write expression-only for size check
console.log(JSON.stringify({
  index: Number(idx),
  awaitPromise: invoke.params.awaitPromise,
  exprLen: invoke.params.expression.length,
  outPath,
}));
