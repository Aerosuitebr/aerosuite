import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const resultJson = process.argv[3];
if (!step || !resultJson) {
  console.error('Usage: node persist-mcp-result.mjs <step> <result-json-string-or-file>');
  process.exit(1);
}
let result;
if (fs.existsSync(resultJson)) {
  result = JSON.parse(fs.readFileSync(resultJson, 'utf8'));
} else {
  result = JSON.parse(resultJson);
}
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
fs.writeFileSync(path.join(dir, `.mcp-step-${step}-result.json`), JSON.stringify(result));
const value = result?.result?.value ?? result?.value ?? result;
const summaryPath = path.join(dir, '.invoke-12-run-summary.json');
const summary = fs.existsSync(summaryPath)
  ? JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  : { viewId: 'bb8370', requestedViewId: '258c93', steps: {}, errors: [] };
summary.steps[step] = value;
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ step, value }));
