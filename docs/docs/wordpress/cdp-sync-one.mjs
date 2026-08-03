/**
 * Run one sync step: next -> exec via MCP file -> result
 * Agent must run: node cdp-sync-one.mjs mcp .cdp-temp-resp.json after CallMcpTool
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];

if (cmd === 'next') {
  execSync('node cdp-deploy-sync.mjs next', { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

if (cmd === 'apply') {
  const resp = path.resolve(process.argv[3] || path.join(dir, '.cdp-temp-resp.json'));
  execSync(`node cdp-deploy-sync.mjs result "${resp.replace(/\\/g, '/')}"`, { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

if (cmd === 'call') {
  const next = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-sync-next.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-mcp-current-call.json'), JSON.stringify(next.call));
  console.log(JSON.stringify({ step: next.step, callIndex: next.callIndex, callTotal: next.callTotal, viewId: next.call.viewId }));
  process.exit(0);
}

console.error('usage: next|call|apply');
process.exit(2);
