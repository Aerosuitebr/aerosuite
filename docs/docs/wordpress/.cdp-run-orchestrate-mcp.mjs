/**
 * Agent driver: for each orchestrator AWAIT, call browser_cdp via short fetch wrapper.
 * Writes .cdp-current-mcp-result.json in MCP shape.
 * Run alongside: node .cdp-orchestrate.mjs <viewId> 0 29
 * This script uses CallMcpTool equivalent via printing steps for agent OR
 * when CURSOR_AGENT_AUTO=1, uses fetch to local MCP proxy (not available).
 *
 * Usage: node .cdp-run-orchestrate-mcp.mjs <viewId> <port>
 * Prints JSON lines: {"step":N,"expr":"..."} for agent to CallMcpTool
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '84ede5';
const port = Number(process.argv[3] || 8768);

export function wrapStep(n) {
  const expr = `(async()=>{const body=await fetch('http://127.0.0.1:${port}/step/${n}.js').then(r=>r.text());let v=eval('('+body+')');if(v&&typeof v.then==='function')v=await v;return v;})()`;
  return {
    method: 'Runtime.evaluate',
    params: { expression: expr, awaitPromise: true, returnByValue: true },
    viewId,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('.cdp-run-orchestrate-mcp.mjs')) {
  const n = Number(process.argv[4] ?? 0);
  console.log(JSON.stringify(wrapStep(n)));
}
