/**
 * Reads .cdp-mcp-payload-N.json and writes exact MCP args for agent CallMcpTool.
 * Agent MUST use JSON.parse on .cdp-call-now.json contents without modification.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '84ede5';
const src = path.join(dir, `.cdp-mcp-payload-${n}.json`);
if (!fs.existsSync(src)) {
  const alt = path.join(dir, `.cdp-args-${n}.json`);
  if (!fs.existsSync(alt)) {
    console.error('missing', n);
    process.exit(1);
  }
  const a = JSON.parse(fs.readFileSync(alt, 'utf8'));
  a.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-call-now.json'), JSON.stringify({ method: a.method, params: a.params, viewId: a.viewId }));
} else {
  const call = JSON.parse(fs.readFileSync(src, 'utf8'));
  call.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-call-now.json'), JSON.stringify(call));
}
console.log(JSON.stringify({ step: n, ready: true }));
