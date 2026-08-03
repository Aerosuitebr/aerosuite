/** Save MCP JSON to .cdp-last-mcp-response.json and record step or batch range. */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const raw = fs.readFileSync(path.join(dir, '.cdp-last-mcp-response.json'), 'utf8');

if (cmd === 'step') {
  const n = process.argv[3];
  const r = spawnSync('node', ['.cdp-save-record.mjs', n, '.cdp-last-mcp-response.json'], { cwd: dir, encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 1);
}

if (cmd === 'batch') {
  const start = process.argv[3];
  const end = process.argv[4];
  fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), raw);
  const r = spawnSync('node', ['.cdp-record-batch.mjs', start, end], { cwd: dir, encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 1);
}

console.error('usage: step <n> | batch <start> <end>');
process.exit(2);
