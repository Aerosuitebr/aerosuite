/** Prepare one step for MCP relay. Usage: node .cdp-agent-relay-step.mjs prep N viewId | record N */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'f4acd8';

if (cmd === 'prep') {
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }).trim();
  const args = JSON.parse(out);
  fs.writeFileSync(path.join(dir, '.cdp-relay-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ step: n, viewId: args.viewId, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync(0, 'utf8');
  const proc = execSync(`node .cdp-mcp-loop-exec.mjs record ${n} ${viewId}`, {
    cwd: dir,
    input: raw,
    encoding: 'utf8',
  });
  process.stdout.write(proc);
  process.exit(0);
}

console.error('usage: prep N [viewId] | record N [viewId]');
process.exit(2);
