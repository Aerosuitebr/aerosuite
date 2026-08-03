/**
 * Execute one step from .cdp-snap-N.json via browser_cdp equivalent.
 * Reads snap, writes .cdp-current-mcp-args.json; agent must CallMcpTool then:
 *   node .cdp-save-record.mjs N
 * Or pass result: node .cdp-mcp-exec-snap.mjs record N '<json>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || '3a0808';

if (cmd === 'prep') {
  execSync(`node .cdp-prep-and-snapshot.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'inherit' });
  const snap = path.join(dir, `.cdp-snap-${n}.json`);
  const args = JSON.parse(fs.readFileSync(snap, 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ step: Number(n), ready: true, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = process.argv[4] || fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), raw);
  execSync(`node .cdp-save-record.mjs ${n}`, { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

console.error('usage: prep <n> [viewId] | record <n> [json]');
process.exit(2);
