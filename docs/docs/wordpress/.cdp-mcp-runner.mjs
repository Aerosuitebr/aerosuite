/**
 * Run steps start..end via MCP result files.
 * Agent loop: read .cdp-pending-step.txt, call browser_cdp with .cdp-args-N.json, save to .cdp-current-mcp-result.json
 * Usage: node .cdp-mcp-runner.mjs e488fa
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e488fa';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const pendingPath = path.join(dir, '.cdp-pending-step.txt');
const summaryPath = path.join(dir, '.cdp-final-summary.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractValue(result) {
  return result?.result?.result?.value ?? result?.result?.value ?? result?.value ?? null;
}

const summary = {
  viewId,
  activeViewId: viewId,
  errors: [],
  recorded: {},
};

async function runRange(from, to) {
  for (let n = from; n <= to; n++) {
    const argsFile = path.join(dir, `.cdp-args-${n}.json`);
    if (!fs.existsSync(argsFile)) continue;
    if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
    fs.writeFileSync(pendingPath, String(n));
    process.stdout.write(`AWAIT_STEP ${n}\n`);

    let result = null;
    for (let t = 0; t < 900; t++) {
      if (fs.existsSync(resultPath)) {
        result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        break;
      }
      await sleep(200);
    }
    if (!result) {
      summary.errors.push({ step: n, error: 'timeout' });
      return false;
    }

    const value = extractValue(result);
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
    if (summaryKeys[n]) summary.recorded[summaryKeys[n]] = value;

    const fail = checkStep(n, value);
    if (fail) {
      summary.errors.push({ step: n, reason: fail, value });
      return n === 4;
    }
    process.stderr.write(`OK ${n}\n`);
  }
  return false;
}

// prepare args
for (let n = 0; n <= 29; n++) {
  const f = path.join(dir, `.cdp-step-${n}.invoke.json`);
  if (!fs.existsSync(f)) continue;
  const args = JSON.parse(fs.readFileSync(f, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, `.cdp-args-${n}.json`), JSON.stringify(args));
}

let retry = await runRange(start, end);
if (retry) {
  process.stdout.write('RETRY_CLEAR_AND_0_3\n');
  fs.writeFileSync(path.join(dir, '.cdp-pending-clear.txt'), '1');
  for (let t = 0; t < 300; t++) {
    if (!fs.existsSync(path.join(dir, '.cdp-pending-clear.txt'))) break;
    await sleep(200);
  }
  retry = await runRange(0, end);
}

Object.assign(summary, summary.recorded);
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
process.stdout.write(`FINAL ${JSON.stringify(summary)}\n`);
