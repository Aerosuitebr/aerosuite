/**
 * Print MCP browser_cdp payload for one manifest step (agent calls CallMcpTool).
 * Usage: node run-cdp-step.mjs <index> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const viewId = process.argv[3] || 'c11c39';
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-step-manifest.json'), 'utf8'));
const item = manifest[idx];
if (!item) {
  console.error('bad index', idx);
  process.exit(1);
}
const args = JSON.parse(fs.readFileSync(item.argsPath, 'utf8'));
args.viewId = viewId;
const out = path.join(dir, `.cdp-step-${idx}.invoke.json`);
fs.writeFileSync(out, JSON.stringify({ server: 'cursor-ide-browser', toolName: 'browser_cdp', arguments: args }));
console.log(JSON.stringify({ index: idx, step: item.step, out, exprLen: args.params.expression.length }));
