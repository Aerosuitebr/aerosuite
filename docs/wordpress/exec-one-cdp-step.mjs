/**
 * Read invoke step params and write MCP result (for orchestrator handshake).
 * Usage: node exec-one-cdp-step.mjs <step-name> <result-json-file>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const resultFile = process.argv[3];
if (!step || !resultFile) {
  console.error('Usage: node exec-one-cdp-step.mjs <step> <mcp-result.json>');
  process.exit(1);
}
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
const value = result?.result?.value ?? result?.value ?? result;
console.log(JSON.stringify({ step, paramsKeys: Object.keys(params), value }));
