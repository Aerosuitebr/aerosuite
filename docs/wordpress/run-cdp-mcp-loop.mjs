/**
 * Run batches 1-8 via sequential MCP file handshake.
 * Writes batch payload; reads .cdp-mcp-batch-result.json after agent MCP call.
 * Usage: node run-cdp-mcp-loop.mjs <startBatch> <endBatch> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 8);
const viewId = process.argv[4] ?? '548005';
const batches = [
  '.cdp-emit-0.txt', '.cdp-emit-1-3.txt', '.cdp-emit-4.txt', '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt', '.cdp-emit-13-18.txt', '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt', '.cdp-emit-29.txt',
];
const stepResults = {};
const errors = [];
const statePath = path.join(dir, '.cdp-mcp-loop-state.json');

if (fs.existsSync(statePath)) {
  Object.assign(stepResults, JSON.parse(fs.readFileSync(statePath, 'utf8')).stepResults || {});
}

for (let bi = start; bi <= end; bi++) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, batches[bi]), 'utf8'));
  const payload = { viewId, method: j.method, params: j.params };
  const reqPath = path.join(dir, '.cdp-mcp-batch-request.json');
  const resPath = path.join(dir, '.cdp-mcp-batch-result.json');
  if (fs.existsSync(resPath)) fs.unlinkSync(resPath);
  fs.writeFileSync(reqPath, JSON.stringify(payload));
  console.log(JSON.stringify({ action: 'MCP_CALL', batch: bi, viewId, exprLen: payload.params.expression.length }));
  process.exit(0); // agent calls MCP, saves result, re-runs with next batch
}
