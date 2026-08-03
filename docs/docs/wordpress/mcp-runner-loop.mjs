/**
 * Sequential MCP runner — writes AWAIT files, waits for RESULT files.
 * Agent: read .mcp-runner-await.json, CallMcpTool browser_cdp with args, write .mcp-runner-result.json
 * Usage: node mcp-runner-loop.mjs [start] [end] [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f29abe';
const awaitPath = path.join(dir, '.mcp-runner-await.json');
const resultPath = path.join(dir, '.mcp-runner-result.json');
const logPath = path.join(dir, '.mcp-runner.log');

function log(msg) {
  fs.appendFileSync(logPath, msg + '\n');
  console.log(msg);
}

function loadPayload(idx) {
  const p = path.join(dir, `.mcp-payload-${idx}.json`);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId };
  return { ...j, viewId };
}

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

function waitForResult(timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (fs.existsSync(resultPath)) {
      const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      fs.unlinkSync(resultPath);
      return raw;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  throw new Error('Timeout waiting for .mcp-runner-result.json');
}

fs.writeFileSync(logPath, '');
const results = {};

for (let i = start; i <= end; i++) {
  const args = loadPayload(i);
  fs.writeFileSync(awaitPath, JSON.stringify({ idx: i, args }, null, 0));
  log(`AWAIT ${i} exprLen=${args.params?.expression?.length ?? 0}`);
  const raw = waitForResult();
  results[i] = extractValue(raw);
  log(`DONE ${i} ${JSON.stringify(results[i])}`);
}

fs.writeFileSync(path.join(dir, '.mcp-runner-final.json'), JSON.stringify({ viewId, results }, null, 2));
log('FINAL');
