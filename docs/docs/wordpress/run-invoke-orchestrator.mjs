/**
 * Invoke-step orchestrator for 12 deploy steps via agent CallMcpTool.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '258c93';
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];

const summary = { viewId, steps: {}, errors: [] };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (const name of STEPS) {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  const args = { method: 'Runtime.evaluate', params, viewId };
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (fs.existsSync(rp)) fs.unlinkSync(rp);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  console.log(`AWAIT_STEP ${name} exprLen=${params.expression?.length ?? 0}`);
  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(rp)) {
      result = JSON.parse(fs.readFileSync(rp, 'utf8'));
      break;
    }
    await sleep(300);
  }
  if (!result) {
    summary.errors.push({ step: name, error: 'timeout' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  summary.steps[name] = value;
  console.log(`DONE_STEP ${name}`, JSON.stringify(value).slice(0, 300));
  if (value?.exceptionDetails || (typeof value === 'string' && value.includes('Error'))) {
    summary.errors.push({ step: name, value });
    break;
  }
}

summary.cssVerify = summary.steps['css-verify'] ?? null;
summary.cssFinalize = summary.steps['css-finalize'] ?? null;
summary.encRun = summary.steps['enc-run'] ?? null;

fs.writeFileSync(path.join(dir, 'deploy-invoke-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL', JSON.stringify(summary));
