/**
 * Prepare b64-wrapped CDP args for current .mcp-runner-await.json step.
 * Usage: node agent-runner-invoke.mjs [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'bba9a4';
const awaitPath = path.join(dir, '.mcp-runner-await.json');
if (!fs.existsSync(awaitPath)) {
  console.log(JSON.stringify({ ready: false }));
  process.exit(0);
}
const { idx } = JSON.parse(fs.readFileSync(awaitPath, 'utf8'));
execSync(`node wrap-payload-b64.mjs ${idx} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const args = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-cdp-args-only.json'), 'utf8'));
const out = path.join(dir, '.mcp-agent-call.json');
fs.writeFileSync(out, JSON.stringify({ idx, args }));
console.log(JSON.stringify({ ready: true, idx, wrapperLen: args.params.expression.length }));
