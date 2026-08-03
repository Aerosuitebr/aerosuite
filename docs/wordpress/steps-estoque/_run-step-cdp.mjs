/**
 * Generate payload for step index and print MCP browser_cdp arguments as JSON.
 * Usage: node _run-step-cdp.mjs <viewId> <index>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '263924';
const idx = process.argv[3];
if (idx === undefined) {
  console.error('Usage: node _run-step-cdp.mjs <viewId> <index>');
  process.exit(1);
}

const gen = spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, idx], {
  encoding: 'utf8',
});
if (gen.status !== 0) {
  console.error(gen.stderr || gen.stdout);
  process.exit(gen.status ?? 1);
}

const payload = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
const args = {
  method: payload.method,
  params: payload.params,
  viewId: payload.viewId,
};
console.log(JSON.stringify({ meta: JSON.parse(gen.stdout.trim()), mcpArgs: args }));
