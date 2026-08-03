/**
 * Record batch CDP result into .deploy-results.json via mcp-step-bridge.
 * Usage: node record-invoke-batch.mjs <start> <end> [.cdp-mcp-result.json]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const resultFile = process.argv[4] ?? path.join(dir, '.cdp-mcp-result.json');
const raw = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
const batch = raw?.result?.value ?? raw?.value ?? raw;
const errors = [];

for (let n = start; n <= end; n++) {
  const value = batch[n] ?? batch[String(n)];
  if (value === undefined) {
    errors.push({ step: n, error: 'missing in batch' });
    break;
  }
  const arg = JSON.stringify(value).replace(/'/g, "'\\''");
  try {
    execSync(`node mcp-step-bridge.mjs record ${n} '${JSON.stringify(value)}'`, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log('recorded', n, JSON.stringify(value).slice(0, 80));
  } catch (e) {
    errors.push({ step: n, error: String(e.stderr || e.message || e) });
    break;
  }
}

console.log(JSON.stringify({ start, end, errors, ok: !errors.length }));
process.exit(errors.length ? 1 : 0);
