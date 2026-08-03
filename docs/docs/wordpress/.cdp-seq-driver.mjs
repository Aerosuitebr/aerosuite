/**
 * Sequential driver using per-step arg/result files (no shared race).
 * Usage: node .cdp-seq-driver.mjs 868beb 1 29
 * Agent on AWAIT N: read .cdp-await-N-args.json -> browser_cdp -> write .cdp-await-N-result.json
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '868beb';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  spawnSync('node', ['.cdp-prep-ready.mjs', String(n), viewId], { cwd: dir, stdio: 'pipe' });
  const ready = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.mcp-ready.json`), 'utf8'));
  const payload = { viewId, method: ready.method, params: ready.params };
  const argsPath = path.join(dir, `.cdp-await-${n}-args.json`);
  const resultPath = path.join(dir, `.cdp-await-${n}-result.json`);
  fs.writeFileSync(argsPath, JSON.stringify(payload));
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(`AWAIT ${n}`);

  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultPath)) {
      result = fs.readFileSync(resultPath, 'utf8');
      break;
    }
    await sleep(200);
  }
  if (!result) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }

  fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), result);
  const rec = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', String(n), result], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(rec.stdout || '');
  if (rec.status !== 0) {
    process.stderr.write(rec.stderr || '');
    process.exit(rec.status ?? 1);
  }
  try {
    fs.unlinkSync(resultPath);
  } catch {
    /* ok */
  }
  process.stderr.write(`OK ${n}\n`);
}

console.log('DONE');
