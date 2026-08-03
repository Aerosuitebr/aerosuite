/**
 * Agent helper: read .cdp-call-N.json, write .cdp-mcp-tool-args.json for CallMcpTool.
 * After MCP, agent writes .cdp-mcp-resp-N.json then: node .cdp-agent-mcp-from-call.mjs done N
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);

if (cmd === 'emit') {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-mcp-tool-args.json'), JSON.stringify(call));
  console.log(JSON.stringify({ step: n, viewId: call.viewId, exprLen: call.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'done') {
  const respPath = path.join(dir, `.cdp-mcp-resp-${n}.json`);
  if (!fs.existsSync(respPath)) {
    console.error('missing', respPath);
    process.exit(2);
  }
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: fs.readFileSync(respPath, 'utf8'),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  process.stderr.write(proc.stderr || '');
  process.exit(proc.status ?? 1);
}

console.error('usage: emit|done <n>');
process.exit(2);
