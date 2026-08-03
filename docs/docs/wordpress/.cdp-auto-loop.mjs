/**
 * Automated MCP loop helper: for steps start..end, writes .cdp-call-now.json and waits for .cdp-current-mcp-result.json
 * Run: node .cdp-auto-loop.mjs 84ede5 0 29
 * Agent reads .cdp-call-now.json, CallMcpTool browser_cdp exact args, writes .cdp-current-mcp-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '84ede5';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const callPath = path.join(dir, '.cdp-call-now.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function prepare(n) {
  execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
}

function extractValue(result) {
  return result?.result?.value ?? result?.result?.result?.value ?? result?.value ?? null;
}

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (n === 6 && !value?.ok) return 'step6 ok';
  if (n === 7 && !value?.ok) return 'step7 ok';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

const recorded = {};
const errors = [];

for (let n = start; n <= end; n++) {
  prepare(n);
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(path.join(dir, '.cdp-await-agent.json'), JSON.stringify({ step: n, viewId, callFile: callPath }));
  process.stdout.write(`NEED_MCP ${n}\n`);

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
    errors.push({ step: n, error: 'timeout' });
    break;
  }
  const value = extractValue(result);
  if (summaryKeys[n]) recorded[summaryKeys[n]] = value;
  const fail = checkStep(n, value);
  if (fail) {
    errors.push({ step: n, reason: fail, value });
    if (n === 4) {
      execSync(`node -e "fetch"`, { stdio: 'ignore' }).catch?.(() => {});
      // clear handled by agent on RETRY_CLEAR
      for (let r = 0; r <= 3; r++) {
        prepare(r);
        if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        fs.writeFileSync(path.join(dir, '.cdp-await-agent.json'), JSON.stringify({ step: r, retry: true }));
        process.stdout.write(`NEED_MCP ${r}\n`);
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
      }
      n = 3;
      continue;
    }
    break;
  }
  process.stderr.write(`OK ${n}\n`);
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
console.log('FINAL ' + JSON.stringify(out));
