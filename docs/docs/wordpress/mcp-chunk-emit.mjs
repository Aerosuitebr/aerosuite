/**
 * Emit one chunk for agent CallMcpTool.
 * node mcp-chunk-emit.mjs <step> <chunkIdx> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const chunkIdx = Number(process.argv[3]);
const viewId = process.argv[4] || '4efe11';

function loadPayload(i, vid) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${i}.json`), 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId: vid };
  return { ...j, viewId: vid };
}

const args = loadPayload(step, viewId);
const chunksPath = path.join(dir, `.mcp-chunks-step-${step}.json`);
if (!fs.existsSync(chunksPath)) {
  const raw = execSync(`node "${path.join(dir, 'mcp-cdp-chunked-invoke.mjs')}" "${path.join(dir, `.mcp-payload-${step}.json`)}" 1800`, {
    encoding: 'utf8',
    cwd: dir,
  });
  const chunks = JSON.parse(raw);
  fs.writeFileSync(chunksPath, JSON.stringify(chunks.map((c) => ({ viewId, ...c }))));
}
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
const call = chunks[chunkIdx];
if (!call) {
  console.error(JSON.stringify({ error: 'no-chunk', step, chunkIdx, total: chunks.length }));
  process.exit(1);
}
const out = path.join(dir, '.mcp-chunk-invoke.json');
fs.writeFileSync(out, JSON.stringify(call));
process.stdout.write(JSON.stringify({ step, chunkIdx, total: chunks.length, exprLen: call.params.expression.length }));
