/** Batch runner: writes .cdp-relay-args.json per step, waits for .cdp-relay-result.json */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'f4acd8';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);
const argsPath = path.join(dir, '.cdp-relay-args.json');
const resultPath = path.join(dir, '.cdp-relay-result.json');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let n = start; n <= end; n++) {
  const out = execSync(`node .cdp-prep-b64-from-exec.mjs ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }).trim();
  fs.writeFileSync(argsPath, out);
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  process.stderr.write(`NEED_MCP ${n}\n`);
  let got = false;
  for (let t = 0; t < 6000; t++) {
    if (fs.existsSync(resultPath)) {
      const raw = fs.readFileSync(resultPath, 'utf8');
      fs.unlinkSync(resultPath);
      try {
        execSync(`node .cdp-mcp-loop-exec.mjs record ${n} ${viewId}`, { cwd: dir, input: raw, encoding: 'utf8' });
        process.stderr.write(`OK ${n}\n`);
        got = true;
      } catch (e) {
        process.stderr.write(`FAIL ${n} ${e.stdout || e.message}\n`);
        process.exit(1);
      }
      break;
    }
    sleep(100);
  }
  if (!got) {
    process.stderr.write(`TIMEOUT ${n}\n`);
    process.exit(2);
  }
}
process.stderr.write('DONE\n');
