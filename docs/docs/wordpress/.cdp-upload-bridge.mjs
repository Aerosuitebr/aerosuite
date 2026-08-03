/**
 * Upload chain bridge: writes .cdp-mcp-invoke-now.json per .cdp-up-N.json, waits for .cdp-mcp-result.json
 * Agent: on AWAIT stderr, CallMcpTool with invoke file, write result to .cdp-mcp-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 14);
const invokeFile = path.join(dir, '.cdp-mcp-invoke-now.json');
const resultFile = path.join(dir, '.cdp-mcp-result.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let i = start; i <= end; i++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-up-${i}.json`), 'utf8'));
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(invokeFile, JSON.stringify({ uploadStep: i, ...call }));
  process.stderr.write(`AWAIT_UPLOAD ${i}\n`);

  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultFile)) {
      const raw = fs.readFileSync(resultFile, 'utf8').trim();
      if (raw.length > 2) {
        try {
          result = JSON.parse(raw);
          fs.unlinkSync(resultFile);
          break;
        } catch {
          /* partial write */
        }
      }
    }
    await sleep(200);
  }
  if (!result) {
    console.error(JSON.stringify({ ok: false, uploadStep: i, error: 'timeout' }));
    process.exit(1);
  }
  const val = result?.result?.value ?? result?.value ?? result;
  process.stderr.write(`OK_UPLOAD ${i} ${JSON.stringify(val)}\n`);
}

console.log(JSON.stringify({ ok: true, from: start, to: end }));
