/**
 * Chunk orchestrator: writes .cdp-current-mcp-args.json per chunk, waits for result.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '258c93';
const start = Number(process.argv[3] || 0);
const end = Number(process.argv[4] || 60);

const files = fs.readdirSync(path.join(dir, '.chunk-calls')).filter((f) => f.endsWith('.json')).sort();
const summary = { viewId, chunks: [], errors: [] };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let i = start; i <= end && i < files.length; i++) {
  const f = files[i];
  const params = JSON.parse(fs.readFileSync(path.join(dir, '.chunk-calls', f), 'utf8'));
  const args = { method: 'Runtime.evaluate', params, viewId };
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (fs.existsSync(rp)) fs.unlinkSync(rp);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  console.log(`AWAIT_CHUNK ${i} ${f} exprLen=${params.expression?.length ?? 0}`);
  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(rp)) {
      result = JSON.parse(fs.readFileSync(rp, 'utf8'));
      break;
    }
    await sleep(300);
  }
  if (!result) {
    summary.errors.push({ i, file: f, error: 'timeout' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  summary.chunks.push({ i, file: f, value });
  if (value?.error || (typeof value === 'object' && value?.type === 'object' && value?.subtype === 'error')) {
    summary.errors.push({ i, file: f, value });
    break;
  }
  console.log(`DONE_CHUNK ${i}`, JSON.stringify(value).slice(0, 200));
}

fs.writeFileSync(path.join(dir, 'deploy-chunk-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL', JSON.stringify({ done: summary.chunks.length, errors: summary.errors.length }));
