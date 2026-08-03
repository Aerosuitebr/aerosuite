/**
 * Read step N call args and record MCP response from stdin.
 * Usage: node .cdp-do-step-mcp.mjs args <n> <viewId>
 *        echo '{...}' | node .cdp-do-step-mcp.mjs record <n>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'c8305f';

if (cmd === 'args') {
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  process.stdout.write(out);
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync(0, 'utf8');
  const proc = execSync(`node .cdp-mcp-loop-exec.mjs record ${viewId} ${n}`, {
    cwd: dir,
    input: raw,
    encoding: 'utf8',
  });
  process.stdout.write(proc);
  process.exit(0);
}

console.error('usage: args|record');
process.exit(2);
