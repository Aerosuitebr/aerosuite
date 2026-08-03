/**
 * Save MCP result for a step + append to run summary.
 * Usage: node save-step-result.mjs <step> <result-json-file>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const src = process.argv[3];
const result = JSON.parse(fs.readFileSync(src, 'utf8'));
const value = result?.result?.value ?? result?.value ?? result;
const out = path.join(dir, `.mcp-step-${step}-result.json');
fs.writeFileSync(out, JSON.stringify(result));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
const summaryPath = path.join(dir, '.invoke-12-run-summary.json');
const summary = fs.existsSync(summaryPath)
  ? JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  : { viewId: 'bb8370', steps: {}, errors: [] };
summary.steps[step] = value;
if (value?.exceptionDetails || (typeof value === 'object' && value?.error)) {
  summary.errors.push({ step, value });
}
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(value));
