/**
 * Split batch CDP result and record steps start..end via agent-mcp-step-loop.
 * Usage: node record-batch-mcp-results.mjs <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const raw = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-result.json'), 'utf8'));
const batch = raw?.result?.value ?? raw?.value ?? raw;
const errors = [];

for (let n = start; n <= end; n++) {
  const value = batch[n] ?? batch[String(n)];
  if (value === undefined) {
    errors.push({ step: n, error: 'missing in batch' });
    break;
  }
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), JSON.stringify({ result: { type: 'object', value } }));
  try {
    const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
    process.stderr.write(`OK ${n} ${out.trim()}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

console.log(JSON.stringify({ start, end, errors, ok: !errors.length }));
process.exit(errors.length ? 1 : 0);
