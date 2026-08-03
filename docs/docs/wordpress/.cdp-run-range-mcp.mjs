/**
 * Emit one step's browser_cdp args from .cdp-live-step-N.json (full expression).
 * Usage: node .cdp-run-range-mcp.mjs emit <n> [viewId]
 * Save:  node .cdp-run-range-mcp.mjs save <n>  (reads .cdp-temp-resp.json, records via exec-loop)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || 'ae099b';

if (cmd === 'emit') {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
  args.viewId = viewId;
  const out = path.join(dir, '.cdp-current-mcp-args.json');
  fs.writeFileSync(out, JSON.stringify(args));
  process.stdout.write(JSON.stringify(args));
} else if (cmd === 'save') {
  execFileSync('node', ['.cdp-record-resp.mjs', n], { cwd: dir, stdio: 'inherit' });
}
