/**
 * Write browser_cdp MCP response to .mcp-runner-result.json
 * Usage: node write-runner-result.mjs <response-json-file>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(process.argv[2]);
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
fs.writeFileSync(path.join(dir, '.mcp-runner-result.json'), JSON.stringify(raw));
const v =
  raw?.result?.result?.value ??
  raw?.result?.value ??
  raw?.value ??
  null;
console.log(JSON.stringify({ written: true, value: v }));
