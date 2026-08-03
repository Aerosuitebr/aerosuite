/**
 * Execute one CDP step via file-exact MCP handshake.
 * Usage: node .cdp-mcp-file-exec.mjs <step> [viewId]
 * Writes .cdp-mcp-do-now.json, waits for .cdp-mcp-done-now.json (agent fills via CallMcpTool + save).
 * Agent helper: node .cdp-mcp-file-exec.mjs save
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[4] || '84ede5';
const doFile = path.join(dir, '.cdp-mcp-do-now.json');
const doneFile = path.join(dir, '.cdp-mcp-done-now.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

if (cmd === 'save') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  fs.writeFileSync(doneFile, raw);
  console.log('saved');
  process.exit(0);
}

if (cmd === 'read') {
  const call = JSON.parse(fs.readFileSync(doFile, 'utf8'));
  process.stdout.write(JSON.stringify({ method: call.method, params: call.params, viewId: call.viewId }));
  process.exit(0);
}

const n = Number(cmd);
execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
if (fs.existsSync(doneFile)) fs.unlinkSync(doneFile);
fs.writeFileSync(doFile, JSON.stringify({ step: n, ...call }));
fs.writeFileSync(path.join(dir, '.cdp-active-call.json'), JSON.stringify({ method: call.method, params: call.params, viewId: call.viewId }));
console.log(JSON.stringify({ step: n, viewId: call.viewId, exprLen: call.params?.expression?.length ?? 0, file: '.cdp-active-call.json' }));
