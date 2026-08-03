/**
 * Invoke one CDP batch via browser_cdp by reading .cdp-mcp-live-N.json or emit file.
 * Prints JSON args to stdout for agent CallMcpTool; or with --apply reads .cdp-mcp-result.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bi = Number(process.argv[2] ?? 1);
const viewId = process.argv[3] ?? '548005';
const emitFiles = [
  '.cdp-emit-0.txt', '.cdp-emit-1-3.txt', '.cdp-emit-4.txt', '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt', '.cdp-emit-13-18.txt', '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt', '.cdp-emit-29.txt',
];
const j = JSON.parse(fs.readFileSync(path.join(dir, emitFiles[bi]), 'utf8'));
const args = { viewId, method: j.method, params: j.params };
fs.writeFileSync(path.join(dir, `.cdp-mcp-live-${bi}.json`), JSON.stringify(args));
process.stdout.write(JSON.stringify(args));
