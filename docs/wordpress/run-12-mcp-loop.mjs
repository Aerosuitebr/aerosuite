/**
 * Prints each step name; pair with agent browser_cdp + save-mcp-result.mjs
 * Or run with --self if CURSOR_CDP_URL set (delegates to run-12-via-cdp-ws.mjs).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const viewId = process.argv[2] || '258c93';
const summary = { viewId, steps: {}, errors: [] };

if (process.argv.includes('--self')) {
  const ws = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
  if (!ws) {
    console.log(JSON.stringify({ error: 'NO_CDP' }));
    process.exit(2);
  }
  spawnSync('node', ['run-12-via-cdp-ws.mjs', ws, viewId], { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

for (const step of STEPS) {
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (fs.existsSync(rp)) fs.unlinkSync(rp);
  spawnSync('node', ['emit-cdp-args.mjs', step, viewId], { cwd: dir, stdio: 'inherit' });
  console.log(`NEED_MCP ${step}`);
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(rp)) {
      const result = JSON.parse(fs.readFileSync(rp, 'utf8'));
      const value = result?.result?.value ?? result?.value ?? result;
      summary.steps[step] = value;
      console.log(`DONE ${step}`, JSON.stringify(value).slice(0, 200));
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  }
  if (!summary.steps[step]) {
    summary.errors.push({ step, error: 'timeout' });
    break;
  }
}

summary.cssVerify = summary.steps['css-verify'] ?? null;
summary.cssFinalize = summary.steps['css-finalize'] ?? null;
summary.encRun = summary.steps['enc-run'] ?? null;
fs.writeFileSync(path.join(dir, 'deploy-invoke-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL', JSON.stringify(summary));
