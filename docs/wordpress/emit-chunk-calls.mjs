/**
 * Execute chunked manifest steps via stdin-driven MCP helper.
 * Outputs one CallMcpTool payload per line for agent consumption.
 * Usage: node emit-chunk-calls.mjs css-q1 | ...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.chunked-manifest.json'), 'utf8'));
const entry = manifest.find((s) => s.name === step);
if (!entry) {
  console.error(JSON.stringify({ error: 'step not found', step }));
  process.exit(1);
}
for (const item of entry.items) {
  console.log(JSON.stringify({ step, phase: item.phase, params: item.params }));
}
