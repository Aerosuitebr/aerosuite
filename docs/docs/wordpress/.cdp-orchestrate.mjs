/**
 * Execute steps 0..29 by reading .cdp-args-N.json and writing .cdp-step-N.mcp-out.json
 * Agent must call browser_cdp for each AWAIT line and save raw result via:
 *   node .cdp-save-mcp-result.mjs '<json>'
 * Or write .cdp-current-mcp-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e488fa';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const argsOut = path.join(dir, '.cdp-current-mcp-args.json');

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

function extractValue(result) {
  return result?.result?.result?.value ?? result?.result?.value ?? result?.value ?? null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runSteps(from, to) {
  const recorded = {};
  const errors = [];
  for (let n = from; n <= to; n++) {
    const argsFile = path.join(dir, `.cdp-args-${n}.json`);
    if (!fs.existsSync(argsFile)) continue;
    const args = JSON.parse(fs.readFileSync(argsFile, 'utf8'));
    args.viewId = viewId;
    if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
    fs.writeFileSync(argsOut, JSON.stringify(args));
    process.stdout.write(`AWAIT_STEP ${n}\n`);

    let result = null;
    for (let t = 0; t < 900; t++) {
      if (fs.existsSync(resultPath)) {
        result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        fs.unlinkSync(resultPath);
        break;
      }
      await sleep(150);
    }
    if (!result) {
      errors.push({ step: n, error: 'timeout' });
      return { recorded, errors, retryFrom: null };
    }

    const value = extractValue(result);
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
    if (summaryKeys[n]) recorded[summaryKeys[n]] = value;

    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      return { recorded, errors, retryFrom: n === 4 ? 0 : null };
    }
    process.stderr.write(`OK ${n}\n`);
  }
  return { recorded, errors, retryFrom: null };
}

// prepare
for (let n = 0; n <= 29; n++) {
  const f = path.join(dir, `.cdp-step-${n}.invoke.json`);
  if (!fs.existsSync(f)) continue;
  const args = JSON.parse(fs.readFileSync(f, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, `.cdp-args-${n}.json`), JSON.stringify(args));
}

let { recorded, errors, retryFrom } = await runSteps(start, end);
if (retryFrom !== null) {
  process.stdout.write('RETRY_CLEAR\n');
  fs.writeFileSync(path.join(dir, '.cdp-needs-clear.txt'), '1');
  for (let t = 0; t < 300 && fs.existsSync(path.join(dir, '.cdp-needs-clear.txt')); t++) await sleep(150);
  ({ recorded, errors } = await runSteps(0, end));
}

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: recorded.cssFullRun ?? null,
  cssVerify: recorded.cssVerify ?? null,
  cssFinalize: recorded.cssFinalize ?? null,
  encInit: recorded.encInit ?? null,
  enc0: recorded.enc0 ?? null,
  enc1: recorded.enc1 ?? null,
  enc2: recorded.enc2 ?? null,
  enc3: recorded.enc3 ?? null,
  encRun: recorded.encRun ?? null,
  errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-out.json'), JSON.stringify(out, null, 2));
process.stdout.write(`FINAL ${JSON.stringify(out)}\n`);
