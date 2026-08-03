/**
 * Prepare steps start..end for agent MCP loop (emit only).
 * Agent: for each N read .cdp-mcp-call-min.json -> CallMcpTool -> write .cdp-last-mcp-raw.json -> node .cdp-save-mcp-result.mjs -> node .cdp-finish-step.mjs N
 */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '7eacd5';
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 29);
const plan = [];
for (let n = start; n <= end; n++) {
  execSync(`node .cdp-emit-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-call-min.json'), 'utf8'));
  plan.push({ step: n, exprLen: call.params?.expression?.length ?? 0, viewId: call.viewId });
}
fs.writeFileSync(path.join(dir, '.cdp-agent-plan.json'), JSON.stringify({ viewId, start, end, plan }, null, 2));
console.log(JSON.stringify({ viewId, start, end, steps: plan.length }));
