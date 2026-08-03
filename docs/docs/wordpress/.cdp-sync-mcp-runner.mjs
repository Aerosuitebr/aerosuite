/**
 * Sync runner: writes .cdp-mcp-need-step.json, waits for .cdp-mcp-step-result.json.
 * Agent: read need file -> CallMcpTool -> write result file.
 * Usage: node .cdp-sync-mcp-runner.mjs <viewId> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'ae099b';
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 29);
const needPath = path.join(dir, '.cdp-mcp-need-step.json');
const resultPath = path.join(dir, '.cdp-mcp-step-result.json');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let n = start; n <= end; n++) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
  args.viewId = viewId;
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(needPath, JSON.stringify({ step: n, args }, null, 2));
  process.stderr.write(`NEED_MCP ${n}\n`);

  let got = false;
  for (let t = 0; t < 6000; t++) {
    if (fs.existsSync(resultPath)) {
      const raw = fs.readFileSync(resultPath, 'utf8');
      fs.unlinkSync(resultPath);
      try {
        execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), raw], { cwd: dir, stdio: 'pipe' });
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
