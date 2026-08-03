/** Run all .cdp-mcp-part-N.json via agent handshake. Writes .cdp-mcp-part-need.json, waits .cdp-mcp-part-done.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const need = path.join(dir, '.cdp-mcp-part-need.json');
const done = path.join(dir, '.cdp-mcp-part-done.json');
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 18);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let i = start; i <= end; i++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-part-${i}.json`), 'utf8'));
  if (fs.existsSync(done)) fs.unlinkSync(done);
  fs.writeFileSync(need, JSON.stringify({ part: i, args: call }));
  process.stderr.write(`NEED_PART ${i}\n`);
  let got = false;
  for (let t = 0; t < 6000; t++) {
    if (fs.existsSync(done)) {
      const raw = fs.readFileSync(done, 'utf8');
      fs.unlinkSync(done);
      if (i === end) {
        fs.writeFileSync(path.join(dir, '.cdp-mcp-batch-result.json'), raw);
      }
      process.stderr.write(`OK_PART ${i}\n`);
      got = true;
      break;
    }
    sleep(50);
  }
  if (!got) {
    process.stderr.write(`TIMEOUT_PART ${i}\n`);
    process.exit(2);
  }
}
process.stderr.write('PARTS_DONE\n');
