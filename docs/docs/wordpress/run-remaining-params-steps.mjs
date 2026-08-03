/**
 * Reads .params-*.json and prints step payloads for sequential MCP browser_cdp execution.
 * Usage: node run-remaining-params-steps.mjs [--preload-q1-q2]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const preload = process.argv.includes('--preload-q1-q2');

const steps = [];
if (preload) {
  const q1 = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-step-css-q1.json'), 'utf8'));
  steps.push({ name: 'css-q1-preload', ...q1.params });
  steps.push({ name: 'css-q2-preload', ...JSON.parse(fs.readFileSync(path.join(dir, '.params-css-q2.json'), 'utf8')) });
}

for (const file of [
  '.params-css-q3.json',
  '.params-css-q4.json',
  '.params-css-verify.json',
  '.params-css-finalize.json',
  '.params-enc-init.json',
  '.params-enc-0.json',
  '.params-enc-1.json',
  '.params-enc-2.json',
  '.params-enc-3.json',
  '.params-enc-run.json',
]) {
  steps.push({ name: file.replace(/^\.params-|-\d+\.json|\.json$/g, '').replace(/^enc-/, 'enc-'), file, ...JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) });
}

const out = path.join(dir, '.remaining-steps-manifest.json');
fs.writeFileSync(out, JSON.stringify(steps, null, 0));
console.log(JSON.stringify({ count: steps.length, out, names: steps.map((s) => s.name) }));
