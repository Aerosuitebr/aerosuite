/**
 * Prints each step payload path for agent MCP loop.
 * Agent: for i in start..end: read .mcp-step-{i}-payload.json, browser_cdp, write result, node agent-mcp-step-loop.mjs record i
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '048877';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

for (let i = start; i <= end; i++) {
  const src = path.join(dir, `.invoke-step-${i}.json`);
  const a = JSON.parse(fs.readFileSync(src, 'utf8'));
  const payload = { viewId, method: a.method, params: a.params };
  const out = path.join(dir, `.mcp-step-${i}-payload.json`);
  fs.writeFileSync(out, JSON.stringify(payload));
  console.log(`PAYLOAD ${i} ${out} exprLen=${a.params?.expression?.length ?? 0}`);
}
