/**
 * Pump MCP calls: reads .cdp-mcp-current-call.json, prints compact status.
 * Agent loop: node mcp-pump-once.mjs -> if NEED then Read call file, CallMcpTool, node mcp-pump-once.mjs write '<json>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callPath = path.join(dir, '.cdp-mcp-current-call.json');
const respPath = path.join(dir, '.cdp-mcp-current-response.json');
const cmd = process.argv[2];

if (cmd === 'write') {
  const raw = process.argv[3];
  if (!raw) {
    const f = process.argv[4];
    fs.writeFileSync(respPath, fs.readFileSync(f, 'utf8'));
  } else {
    fs.writeFileSync(respPath, raw);
  }
  console.log('WROTE');
  process.exit(0);
}

if (!fs.existsSync(callPath)) {
  console.log(JSON.stringify({ idle: true }));
  process.exit(0);
}
if (fs.existsSync(respPath)) {
  console.log(JSON.stringify({ waiting: true, hasResp: true }));
  process.exit(0);
}
const need = fs.existsSync(path.join(dir, '.cdp-needs-mcp-call'))
  ? fs.readFileSync(path.join(dir, '.cdp-needs-mcp-call'), 'utf8')
  : '';
const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
console.log(
  JSON.stringify({
    need,
    viewId: call.viewId,
    exprLen: call.params?.expression?.length ?? 0,
    callFile: callPath,
  })
);
