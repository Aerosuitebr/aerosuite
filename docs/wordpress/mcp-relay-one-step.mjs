/**
 * One-shot relay: node mcp-relay-one-step.mjs <index> [viewId]
 * Writes .mcp-relay-args.json; agent CallMcpTool; then:
 * node mcp-relay-one-step.mjs save <index> <resultPath>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const idx = Number(process.argv[3]);
const viewId = process.argv[4] || 'f29abe';

function loadPayload(i, vid) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${i}.json`), 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId: vid };
  return { ...j, viewId: vid };
}

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

if (cmd === 'prepare') {
  const args = loadPayload(idx, viewId);
  fs.writeFileSync(path.join(dir, '.mcp-relay-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ idx, exprLen: args.params?.expression?.length ?? 0 }));
} else if (cmd === 'save') {
  const rp = path.resolve(process.argv[4]);
  const raw = JSON.parse(fs.readFileSync(rp, 'utf8'));
  fs.writeFileSync(path.join(dir, '.mcp-runner-result.json'), JSON.stringify(raw));
  console.log(JSON.stringify({ idx, value: extractValue(raw) }));
} else {
  console.error('prepare <idx> [viewId] | save <idx> <resultPath>');
  process.exit(2);
}
