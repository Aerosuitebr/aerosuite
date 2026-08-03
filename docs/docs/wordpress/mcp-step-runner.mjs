/**
 * Serial runner: signals agent via .cdp-needs-mcp-step, waits for .cdp-step-result-N.json
 * Usage: node mcp-step-runner.mjs <start> <end> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '7c1495';
const flagPath = path.join(dir, '.cdp-needs-mcp-step');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  const argsFile = path.join(dir, `.cdp-step-${n}-args.json`);
  if (!fs.existsSync(argsFile)) {
    execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  }
  const resultFile = path.join(dir, `.cdp-step-result-${n}.json`);
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(flagPath, String(n));
  console.log(`AWAIT ${n}`);
  let ok = false;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultFile)) {
      try {
        JSON.parse(fs.readFileSync(resultFile, 'utf8'));
        ok = true;
        break;
      } catch {
        /* wait for valid JSON */
      }
    }
    await sleep(200);
  }
  if (!ok) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  const rec = execSync(`node apply-step-result.mjs ${n} "${resultFile.replace(/\\/g, '/')}"`, {
    cwd: dir,
    encoding: 'utf8',
  });
  console.log(`DONE ${n} ${rec.trim()}`);
  if (rec.includes('"stopped":true') || rec.includes('"ok":false')) process.exit(1);
}
if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
console.log('ALL_DONE');
