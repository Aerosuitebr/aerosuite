/**
 * Run steps via MCP file handshake — agent calls browser_cdp for each AWAIT line.
 * Usage: node .cdp-mcp-handshake-run.mjs <viewId> <start> <end>
 * Agent loop:
 *   while read line; do
 *     if AWAIT N: read .cdp-handshake-args.json, CallMcpTool, write .cdp-handshake-result.json
 *   done
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'c8305f';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const argsPath = path.join(dir, '.cdp-handshake-args.json');
const resultPath = path.join(dir, '.cdp-handshake-result.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (n === 6 && !value?.ok) return 'step6 ok';
  if (n === 7 && !value?.ok) return 'step7 ok';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

const errors = [];

for (let n = start; n <= end && errors.length === 0; n++) {
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  const args = JSON.parse(out);
  args.viewId = viewId;
  fs.writeFileSync(argsPath, JSON.stringify(args));
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(`AWAIT ${n}`);

  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultPath)) {
      result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      fs.unlinkSync(resultPath);
      break;
    }
    await sleep(200);
  }
  if (!result) {
    errors.push({ step: n, error: 'timeout waiting for .cdp-handshake-result.json' });
    break;
  }

  const raw = JSON.stringify(result);
  try {
    execSync(`node .cdp-mcp-loop-exec.mjs record ${viewId} ${n}`, {
      cwd: dir,
      input: raw,
      encoding: 'utf8',
    });
  } catch (e) {
    const msg = String(e.stdout || e.message);
    errors.push({ step: n, error: msg });
    if (n === 4) {
      for (let r = 0; r <= 3; r++) {
        const o2 = execSync(`node .cdp-exec-invoke-step.mjs ${r} ${viewId}`, { cwd: dir, encoding: 'utf8' }).trim();
        const a2 = JSON.parse(o2);
        a2.viewId = viewId;
        fs.writeFileSync(argsPath, JSON.stringify(a2));
        if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        console.log(`AWAIT ${r}`);
        let r2 = null;
        for (let t = 0; t < 600; t++) {
          if (fs.existsSync(resultPath)) {
            r2 = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
            fs.unlinkSync(resultPath);
            break;
          }
          await sleep(200);
        }
        if (!r2) { errors.push({ step: r, error: 'retry timeout' }); break; }
        execSync(`node .cdp-mcp-loop-exec.mjs record ${viewId} ${r}`, {
          cwd: dir,
          input: JSON.stringify(r2),
          encoding: 'utf8',
        });
      }
      n = 3;
      continue;
    }
    break;
  }
  process.stderr.write(`OK ${n}\n`);
}

if (errors.length) {
  console.log(JSON.stringify({ ok: false, errors }));
  process.exit(1);
}
console.log('ALL_OK');
execSync('node .cdp-mcp-loop-exec.mjs summary', { cwd: dir, stdio: 'inherit' });
