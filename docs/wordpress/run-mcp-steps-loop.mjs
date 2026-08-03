/**
 * Print each step's MCP arguments as JSON lines for sequential browser_cdp invocation.
 * Usage: node run-mcp-steps-loop.mjs [start] [end] [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'd79a58';

for (let n = start; n <= end; n++) {
  const file = path.join(dir, `.step-out-${n}.json`);
  const args = JSON.parse(fs.readFileSync(file, 'utf8'));
  args.viewId = viewId;
  process.stdout.write(JSON.stringify({ step: n, args }) + '\n');
}
