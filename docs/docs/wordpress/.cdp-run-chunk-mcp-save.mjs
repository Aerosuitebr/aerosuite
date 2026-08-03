/**
 * After agent writes MCP response to .cdp-last-mcp.json:
 *   node .cdp-run-chunk-mcp-save.mjs chunk 3-7 3 4 5 6 7
 *   node .cdp-run-chunk-mcp-save.mjs step 1
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2];
const respPath = path.join(dir, '.cdp-last-mcp.json');

if (mode === 'chunk') {
  const steps = process.argv.slice(4).map(Number);
  const r = spawnSync('node', ['.cdp-record-chunk.mjs', respPath, ...steps.map(String)], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 0);
}

if (mode === 'step') {
  const n = process.argv[3];
  const r = spawnSync('node', ['.cdp-save-mcp-and-record.mjs', n, respPath], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 0);
}

console.error('usage: chunk <label> <steps...> | step <n>');
process.exit(2);
