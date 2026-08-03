/**
 * Prepare + save MCP results for orchestrator loop.
 * Agent runs: node .cdp-agent-batch.mjs prep <n>
 *             [CallMcpTool from .cdp-mcp-tool-args.json]
 *             node .cdp-agent-batch.mjs save '<json>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = '87550c';

if (cmd === 'prep') {
  const n = Number(process.argv[3]);
  const src = fs.existsSync(path.join(dir, '.cdp-current-mcp-args.json'))
    ? '.cdp-current-mcp-args.json'
    : `.cdp-mcp-call-${n}.json`;
  const a = JSON.parse(fs.readFileSync(path.join(dir, src), 'utf8'));
  const c = a.arguments || a;
  const flat = { viewId, method: c.method, params: c.params };
  fs.writeFileSync(path.join(dir, '.cdp-mcp-tool-args.json'), JSON.stringify(flat));
  console.log(JSON.stringify({ n, len: flat.params?.expression?.length }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = process.argv[3];
  const data = JSON.parse(raw);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(data));
  console.log('ok');
  process.exit(0);
}

if (cmd === 'await') {
  const log = fs.readFileSync(path.join(dir, '.cdp-orchestrate-run2.log'), 'utf8').catch?.() || '';
  const m = log.match(/AWAIT_STEP (\d+)/g);
  console.log(m ? m[m.length - 1] : 'none');
  process.exit(0);
}

console.error('prep|save|await');
