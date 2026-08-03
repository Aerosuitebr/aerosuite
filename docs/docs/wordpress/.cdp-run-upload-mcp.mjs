/**
 * Emit upload call index for agent MCP loop.
 * Usage: node .cdp-run-upload-mcp.mjs <calls.json> <fromIndex>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callsFile = path.resolve(process.argv[2] || path.join(dir, '.cdp-upload-0-4-calls.json'));
const from = Number(process.argv[3] || 1);
const { calls } = JSON.parse(fs.readFileSync(callsFile, 'utf8'));
for (let i = from; i < calls.length; i++) {
  const out = path.join(dir, `.cdp-upload-call-${i}.json`);
  fs.writeFileSync(out, JSON.stringify(calls[i]));
  const len = calls[i].params?.expression?.length ?? 0;
  console.log(`UPLOAD_CALL ${i} exprLen=${len} file=${path.basename(out)}`);
}
