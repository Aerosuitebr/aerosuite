/**
 * User workflow sync runner: NEED_MCP -> agent browser_cdp -> result file -> sequential record.
 * Usage: node .cdp-user-sync-runner.mjs <activeViewId> <specViewId> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const activeViewId = process.argv[2] || '4da845';
const specViewId = process.argv[3] || 'b45110';
const start = Number(process.argv[4] ?? 2);
const end = Number(process.argv[5] ?? 29);
const needPath = path.join(dir, '.cdp-mcp-need-step.json');
const resultPath = path.join(dir, '.cdp-mcp-step-result.json');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let n = start; n <= end; n++) {
  const args = JSON.parse(
    execFileSync('node', ['.cdp-mcp-run-step.mjs', String(n), specViewId], { cwd: dir, encoding: 'utf8' })
  );
  args.viewId = activeViewId;
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(needPath, JSON.stringify({ step: n, args }, null, 0));
  process.stderr.write(`NEED_MCP ${n} exprLen=${args.params?.expression?.length ?? 0}\n`);

  let got = false;
  for (let t = 0; t < 6000; t++) {
    if (fs.existsSync(resultPath)) {
      const raw = fs.readFileSync(resultPath, 'utf8');
      fs.unlinkSync(resultPath);
      try {
        execFileSync('node', ['.cdp-mcp-sequential-run.mjs', 'record', String(n), raw], {
          cwd: dir,
          stdio: 'pipe',
        });
        process.stderr.write(`OK ${n}\n`);
        got = true;
      } catch (e) {
        const out = String(e.stdout || e.stderr || e.message);
        process.stderr.write(`FAIL ${n} ${out}\n`);
        if (n === 4) {
          process.stderr.write('RETRY_CSS 0-4\n');
          for (let r = 0; r <= 4; r++) {
            const a2 = JSON.parse(
              execFileSync('node', ['.cdp-mcp-run-step.mjs', String(r), specViewId], {
                cwd: dir,
                encoding: 'utf8',
              })
            );
            a2.viewId = activeViewId;
            if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
            fs.writeFileSync(needPath, JSON.stringify({ step: r, args: a2, retry: true }, null, 0));
            process.stderr.write(`NEED_MCP ${r} retry\n`);
            let g2 = false;
            for (let t2 = 0; t2 < 6000; t2++) {
              if (fs.existsSync(resultPath)) {
                const raw2 = fs.readFileSync(resultPath, 'utf8');
                fs.unlinkSync(resultPath);
                execFileSync('node', ['.cdp-mcp-sequential-run.mjs', 'record', String(r), raw2], {
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
