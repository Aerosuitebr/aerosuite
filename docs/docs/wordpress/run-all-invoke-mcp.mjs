/**
 * Execute all .invoke-*.json steps by reading exact params and driving browser_cdp via Cursor MCP.
 * Uses chunked manifest when single invoke payload exceeds limit.
 *
 * Agent usage: node run-all-invoke-mcp.mjs --step css-q1
 * Prints exact params JSON to stdout for CallMcpTool.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];

const stepArg = process.argv.indexOf('--step');
if (stepArg >= 0) {
  const name = process.argv[stepArg + 1];
  const file = path.join(dir, `.invoke-${name}.json`);
  process.stdout.write(fs.readFileSync(file, 'utf8'));
  process.exit(0);
}

const chunkArg = process.argv.indexOf('--chunk-index');
if (chunkArg >= 0) {
  const idx = Number(process.argv[chunkArg + 1]);
  const files = fs.readdirSync(path.join(dir, '.chunk-calls')).filter((f) => f.endsWith('.json')).sort();
  const f = files[idx];
  if (!f) {
    console.error(JSON.stringify({ error: 'chunk not found', idx }));
    process.exit(1);
  }
  process.stdout.write(fs.readFileSync(path.join(dir, '.chunk-calls', f), 'utf8'));
  process.exit(0);
}

console.log(JSON.stringify({ steps: STEPS, chunkCount: fs.readdirSync(path.join(dir, '.chunk-calls')).length }));
