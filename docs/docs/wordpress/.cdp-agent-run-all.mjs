/**
 * Sequential MCP handshake: writes args, waits for .cdp-mcp-last-result.json, records.
 * Usage: node .cdp-agent-run-all.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '6eb035';
const resultPath = path.join(dir, '.cdp-mcp-last-result.json');
const awaitPath = path.join(dir, '.cdp-await-step.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-save-step-args.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(awaitPath, JSON.stringify({ step: n, viewId, argsFile: '.cdp-mcp-last-args.json' }));
  console.log(`AWAIT_STEP ${n}`);
  let got = false;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultPath)) {
      got = true;
      break;
    }
    await sleep(200);
  }
  if (!got) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  try {
    const rec = execSync(`node .cdp-record-mcp-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' }).trim();
    const parsed = JSON.parse(rec);
    if (!parsed.ok) {
      console.log(rec);
      process.exit(1);
    }
    console.log(`OK_STEP ${n} ${rec.slice(0, 200)}`);
  } catch (e) {
    console.log(String(e.stdout || e.message));
    process.exit(1);
  }
}

const summary = execSync(`node .cdp-mcp-step-from-file.mjs summary 0 ${viewId}`, { cwd: dir, encoding: 'utf8' });
console.log(summary.trim());
