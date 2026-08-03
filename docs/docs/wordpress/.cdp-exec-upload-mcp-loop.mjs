/**
 * Agent helper: run upload calls [start..end] via .cdp-mcp-response.json handshake.
 * Usage: node .cdp-exec-upload-mcp-loop.mjs <calls.json> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callsFile = path.resolve(process.argv[2] || path.join(dir, '.cdp-upload-0-4-calls.json'));
const start = Number(process.argv[3] || 1);
const end = Number(process.argv[4] || 14);
const respPath = path.join(dir, '.cdp-mcp-response.json');
const argsPath = path.join(dir, '.cdp-current-mcp-args.json');
const { calls } = JSON.parse(fs.readFileSync(callsFile, 'utf8'));

for (let i = start; i <= end; i++) {
  if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
  fs.writeFileSync(argsPath, JSON.stringify(calls[i]));
  console.log(`AWAIT_UPLOAD ${i} exprLen=${calls[i].params?.expression?.length ?? 0}`);
  const deadline = Date.now() + 300000;
  while (!fs.existsSync(respPath)) {
    if (Date.now() > deadline) {
      console.error(JSON.stringify({ error: 'TIMEOUT', step: i }));
      process.exit(4);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  const resp = fs.readFileSync(respPath, 'utf8');
  fs.unlinkSync(respPath);
  if (i === end) {
    fs.writeFileSync(path.join(dir, '.cdp-upload-final-result.json'), resp);
    console.log('UPLOAD_DONE');
    console.log(resp);
  }
}
