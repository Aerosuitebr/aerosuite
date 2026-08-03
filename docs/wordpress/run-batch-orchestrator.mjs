/**
 * Orchestrator for batch CDP steps via agent CallMcpTool.
 * Writes .cdp-current-mcp-args.json, waits for .cdp-current-mcp-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '258c93';
const batches = [
  { file: '.batch-0.json', label: 'css-q1+q2' },
  { file: '.batch-1.json', label: 'css-q3+q4' },
  { file: '.batch-2.json', label: 'verify+finalize+enc-init' },
  { file: '.batch-3.json', label: 'enc-0+enc-1' },
  { file: '.batch-4.json', label: 'enc-2+enc-3+enc-run' },
];

const summary = { viewId, batches: [], errors: [] };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let i = 0; i < batches.length; i++) {
  const { file, label } = batches[i];
  const params = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const args = { method: 'Runtime.evaluate', params, viewId };
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (fs.existsSync(rp)) fs.unlinkSync(rp);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  console.log(`AWAIT_BATCH ${i} ${label} exprLen=${params.expression?.length ?? 0}`);
  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(rp)) {
      result = JSON.parse(fs.readFileSync(rp, 'utf8'));
      break;
    }
    await sleep(500);
  }
  if (!result) {
    summary.errors.push({ batch: i, label, error: 'timeout' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  summary.batches.push({ i, label, value });
  console.log(`DONE_BATCH ${i}`, JSON.stringify(value).slice(0, 300));
}

fs.writeFileSync(path.join(dir, 'deploy-batch-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL', JSON.stringify(summary));
