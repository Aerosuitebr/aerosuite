/**
 * Prints ordered MCP JSON paths for agent CallMcpTool loop.
 * Agent: node prep-mcp-args.mjs <viewId> <file> && CallMcpTool browser_cdp with .cdp-pending-args.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b5108e';

const list = [
  '.mcp-cssfull-batch-0.json',
  '.mcp-cssfull-batch-1.json',
  '.mcp-cssfull-batch-2.json',
  '.mcp-cssfull-batch-3.json',
  '.mcp-cssfull-run.json',
  '.mcp-css-verify.json',
  '.mcp-css-finalize.json',
  '.mcp-enc-init.json',
];

for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
  const encDir = path.join(dir, `.mcp-${enc}`);
  if (!fs.existsSync(encDir)) {
    console.error(`MISSING ${encDir} — run: node emit-mcp-chunks.mjs ${enc} ${viewId}`);
    process.exit(2);
  }
  const uploads = fs
    .readdirSync(encDir)
    .filter((f) => /^upload-\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  for (const u of uploads) list.push(path.join(`.mcp-${enc}`, u));
  list.push(path.join(`.mcp-${enc}`, 'run.json'));
}
list.push('.mcp-enc-run.json');

console.log(JSON.stringify({ viewId, steps: list, count: list.length }));
