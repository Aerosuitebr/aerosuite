/**
 * Prepare one step for MCP execution and record result.
 * node mcp-exec-step.mjs get <index> [viewId]
 * node mcp-exec-step.mjs save <index> <resultJsonPath>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, '.mcp-sequence-state.json');

function loadPayload(idx, viewId) {
  const p = path.join(dir, `.mcp-payload-${idx}.json`);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId };
  return { viewId, method: 'Runtime.evaluate', params: j };
}

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

const [,, cmd, a1, a2] = process.argv;

if (cmd === 'get') {
  const idx = Number(a1);
  const viewId = a2 || 'f29abe';
  const args = loadPayload(idx, viewId);
  const out = path.join(dir, '.mcp-handshake-call.json');
  fs.writeFileSync(out, JSON.stringify({ idx, args }));
  console.log(JSON.stringify({ idx, viewId, exprLen: args.params?.expression?.length ?? 0 }));
} else if (cmd === 'save') {
  const idx = Number(a1);
  const resultPath = path.resolve(a2);
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const state = fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [] };
  state.results[idx] = extractValue(raw);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(dir, '.mcp-handshake-result.json'), JSON.stringify(raw));
  console.log(JSON.stringify({ idx, value: state.results[idx] }));
} else {
  console.error('Usage: get <index> [viewId] | save <index> <resultJsonPath>');
  process.exit(1);
}
