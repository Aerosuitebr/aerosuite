/**
 * Execute all CDP chunks for one step via stdin/stdout handshake with agent.
 * Agent loop:
 *   node mcp-exec-chunks-step.mjs prepare <step> [viewId]
 *   (read .mcp-chunk-invoke.json -> CallMcpTool -> write .mcp-chunk-result.json)
 *   node mcp-exec-chunks-step.mjs save
 * Until prepare prints {done:true}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.mcp-chunk-exec-state.json');
const invokePath = path.join(dir, '.mcp-chunk-invoke.json');
const resultPath = path.join(dir, '.mcp-chunk-result.json');

function loadPayload(step, viewId) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${step}.json`), 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId };
  return { ...j, viewId };
}

function ensureChunks(step, viewId) {
  const chunksPath = path.join(dir, `.mcp-chunks-step-${step}.json`);
  if (!fs.existsSync(chunksPath)) {
    const payloadPath = path.join(dir, `.mcp-payload-${step}.json`);
    const raw = execSync(`node "${path.join(dir, 'mcp-cdp-chunked-invoke.mjs')}" "${payloadPath}" 1800`, {
      encoding: 'utf8',
      cwd: dir,
    });
    const chunks = JSON.parse(raw).map((c) => ({ ...c, viewId }));
    fs.writeFileSync(chunksPath, JSON.stringify(chunks));
  }
  return JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
}

const cmd = process.argv[2];

if (cmd === 'prepare') {
  const step = Number(process.argv[3]);
  const viewId = process.argv[4] || '4efe11';
  const chunks = ensureChunks(step, viewId);
  let state = { step, viewId, idx: 0, total: chunks.length, chunks, final: null };
  if (fs.existsSync(statePath)) {
    const prev = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (prev.step === step) state = prev;
  }
  if (state.idx >= state.total) {
    console.log(JSON.stringify({ done: true, step, final: state.final }));
    process.exit(0);
  }
  fs.writeFileSync(invokePath, JSON.stringify(state.chunks[state.idx]));
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log(
    JSON.stringify({
      done: false,
      step,
      chunk: state.idx,
      total: state.total,
      exprLen: state.chunks[state.idx].params.expression.length,
    }),
  );
  process.exit(0);
}

if (cmd === 'save') {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  fs.unlinkSync(resultPath);
  const isLast = state.idx === state.total - 1;
  if (isLast) state.final = raw;
  state.idx += 1;
  fs.writeFileSync(statePath, JSON.stringify(state));
  if (state.idx >= state.total) {
    console.log(JSON.stringify({ done: true, step: state.step, final: state.final }));
    process.exit(0);
  }
  fs.writeFileSync(invokePath, JSON.stringify(state.chunks[state.idx]));
  console.log(
    JSON.stringify({
      done: false,
      step: state.step,
      chunk: state.idx,
      total: state.total,
      exprLen: state.chunks[state.idx].params.expression.length,
    }),
  );
  process.exit(0);
}

console.error('Usage: prepare <step> [viewId] | save');
process.exit(1);
