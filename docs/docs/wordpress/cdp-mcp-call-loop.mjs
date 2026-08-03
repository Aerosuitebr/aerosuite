/**
 * Run all MCP calls for current .cdp-mcp-batch.json via agent handshake files.
 * Writes .cdp-mcp-current-call.json, waits for .cdp-mcp-current-response.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batchPath = path.join(dir, '.cdp-mcp-batch.json');
const resultsPath = path.join(dir, '.cdp-mcp-batch-results.json');
const callPath = path.join(dir, '.cdp-mcp-current-call.json');
const respPath = path.join(dir, '.cdp-mcp-current-response.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const results = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];

for (let i = results.length; i < batch.calls.length; i++) {
  if (fs.existsSync(respPath)) fs.unlinkSync(respPath);
  fs.writeFileSync(callPath, JSON.stringify(batch.calls[i]));
  fs.writeFileSync(path.join(dir, '.cdp-needs-mcp-call'), String(i));
  console.log(`NEED_CALL step=${batch.step} index=${i}/${batch.calls.length}`);

  let ok = false;
  for (let t = 0; t < 300; t++) {
    if (fs.existsSync(respPath)) {
      try {
        JSON.parse(fs.readFileSync(respPath, 'utf8'));
        ok = true;
        break;
      } catch {
        /* partial */
      }
    }
    await sleep(100);
  }
  if (!ok) {
    console.log(JSON.stringify({ error: 'timeout', step: batch.step, index: i }));
    process.exit(1);
  }
  results.push(JSON.parse(fs.readFileSync(respPath, 'utf8')));
  fs.writeFileSync(resultsPath, JSON.stringify(results));
  fs.unlinkSync(respPath);
  console.log(`GOT_CALL step=${batch.step} index=${i + 1}/${batch.calls.length}`);
}

console.log(JSON.stringify({ ok: true, step: batch.step, calls: results.length }));
