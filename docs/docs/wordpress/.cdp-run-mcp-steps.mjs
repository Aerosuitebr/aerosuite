/**
 * Run steps start..end: read .cdp-call-N.json, write .cdp-mcp-current-call.json, print step.
 * Agent: CallMcpTool browser_cdp with that file, write .cdp-last-mcp.json, node .cdp-save-mcp-and-record.mjs N
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 3);
const end = Number(process.argv[3] ?? 29);
const cmd = process.argv[4] ?? 'emit';

if (cmd === 'emit') {
  const n = Number(process.argv[5] ?? start);
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-mcp-current-call.json'), JSON.stringify(call));
  console.log(JSON.stringify({ step: n, viewId: call.viewId, exprLen: call.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'list') {
  const out = [];
  for (let n = start; n <= end; n++) {
    const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
    out.push({ n, exprLen: call.params?.expression?.length ?? 0, viewId: call.viewId });
  }
  console.log(JSON.stringify(out));
  process.exit(0);
}

process.exit(2);
