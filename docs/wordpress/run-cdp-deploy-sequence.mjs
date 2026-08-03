/**
 * Prints ordered MCP JSON paths for agent browser_cdp sequence.
 * Usage: node run-cdp-deploy-sequence.mjs [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'c11c39';

const steps = [
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
  const d = path.join(dir, `.mcp-${enc}`);
  if (fs.existsSync(d)) {
    const uploads = fs
      .readdirSync(d)
      .filter((f) => /^upload-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const u of uploads) steps.push(path.join(`.mcp-${enc}`, u));
    steps.push(path.join(`.mcp-${enc}`, 'run.json'));
  } else {
    steps.push(`__emit__:${enc}`);
  }
}
steps.push('.mcp-enc-run.json');

console.log(JSON.stringify({ viewId, steps }, null, 2));
