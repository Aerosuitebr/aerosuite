/**
 * Emit browser_cdp arguments for step N (verbatim from .cdp-mcp-b64-step-N.json + viewId).
 * Agent: node .cdp-mcp-emit-step.mjs 22 441704 | then CallMcpTool with parsed stdout JSON.
 */
import fs from 'fs';

const n = process.argv[2];
const viewId = process.argv[3] ?? '441704';
if (!n) {
  console.error('usage: node .cdp-mcp-emit-step.mjs <step> [viewId]');
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(`.cdp-mcp-b64-step-${n}.json`, 'utf8'));
j.viewId = viewId;
const out = process.argv[4] || '';
if (out) fs.writeFileSync(out, JSON.stringify(j), 'utf8');
else process.stdout.write(JSON.stringify(j));
