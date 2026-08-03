/**
 * Print browser_cdp args for agent: node mcp-invoke-from-json.mjs invoke-call-0.json
 */
import fs from 'fs';
const file = process.argv[2];
if (!file) {
  console.error('usage: node mcp-invoke-from-json.mjs <json-file>');
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
process.stdout.write(JSON.stringify(j));
