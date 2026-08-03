/**
 * Record all step values from a loop MCP result object.
 * Usage: node record-loop-results.mjs <start> <end> <loopResultFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const raw = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
const value = raw?.result?.value ?? raw?.value ?? raw;
const out = value?.out ?? value;
const stopped = value?.stopped ?? null;
const errors = [];

if (stopped != null) {
  errors.push({ step: stopped, reason: 'checkpoint', value: out?.[stopped] });
}

for (let n = start; n <= end; n++) {
  if (out?.[n] === undefined) continue;
  fs.writeFileSync(
    path.join(dir, '.cdp-mcp-result.json'),
    JSON.stringify({ result: { type: 'object', value: out[n] } })
  );
  try {
    const rec = execSync(`node record-step-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
    console.log(`step ${n}: ${rec.trim()}`);
    if (rec.includes('"stopped":true') || rec.includes('"ok":false')) {
      errors.push({ step: n, rec: rec.trim() });
    }
  } catch (e) {
    errors.push({ step: n, error: String(e.stdout || e.message) });
  }
}

console.log(JSON.stringify({ stopped, errors, recorded: Object.keys(out || {}).length }));
