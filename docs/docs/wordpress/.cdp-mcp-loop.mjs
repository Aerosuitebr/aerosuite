/**
 * File handshake runner for MCP steps.
 * Usage: node .cdp-mcp-loop.mjs <start> <end> [specViewId] [activeViewId]
 * Agent: on NEED N, read .cdp-mcp-need.json -> browser_cdp -> write .cdp-mcp-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 4);
const end = Number(process.argv[3] ?? 29);
const specView = process.argv[4] || 'b45110';
const activeView = process.argv[5] || '4da845';
const needPath = path.join(dir, '.cdp-mcp-need.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let n = start; n <= end; n++) {
  const raw = execFileSync('node', ['.cdp-mcp-run-step.mjs', String(n), specView], {
    cwd: dir,
    encoding: 'utf8',
  });
  const args = JSON.parse(raw.trim());
  args.viewId = activeView;
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(needPath, JSON.stringify({ step: n, args }));
  process.stderr.write(`NEED ${n} exprLen=${args.params?.expression?.length ?? 0}\n`);

  let got = false;
  for (let t = 0; t < 6000; t++) {
    if (fs.existsSync(resultPath)) {
      const resp = fs.readFileSync(resultPath, 'utf8');
      fs.unlinkSync(resultPath);
      try {
        execFileSync('node', ['.cdp-mcp-sequential-run.mjs', 'record', String(n), resp], {
          cwd: dir,
          stdio: 'pipe',
        });
        process.stderr.write(`OK ${n}\n`);
        got = true;
      } catch (e) {
        const msg = String(e.stdout || e.stderr || e.message);
        process.stderr.write(`FAIL ${n} ${msg}\n`);
        if (n === 4) {
          process.stderr.write('RETRY_CSS\n');
          for (let r = 0; r <= 3; r++) {
            const rraw = execFileSync('node', ['.cdp-mcp-run-step.mjs', String(r), specView], {
              cwd: dir,
              encoding: 'utf8',
            });
            const rargs = JSON.parse(rraw.trim());
            rargs.viewId = activeView;
            if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
            fs.writeFileSync(needPath, JSON.stringify({ step: r, args: rargs, retry: true }));
            process.stderr.write(`NEED ${r} retry\n`);
            let g2 = false;
            for (let t2 = 0; t2 < 6000; t2++) {
              if (fs.existsSync(resultPath)) {
                const r2 = fs.readFileSync(resultPath, 'utf8');
                fs.unlinkSync(resultPath);
                execFileSync('node', ['.cdp-mcp-sequential-run.mjs', 'record', String(r), r2], {
                  cwd: dir,
                  stdio: 'pipe',
                });
                process.stderr.write(`OK ${r} retry\n`);
                g2 = true;
                break;
              }
              sleep(100);
            }
            if (!g2) process.exit(3);
          }
          n = 3;
          got = true;
          break;
        }
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
