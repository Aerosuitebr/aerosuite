/**
 * Execute all CDP emit batches via sequential MCP result files.
 * Agent calls: node exec-cdp-batch-via-file.mjs <batchIndex> <viewId>
 * which writes .cdp-mcp-invoke-N.json path to stdout; agent runs browser_cdp and saves result.
 * This script processes saved results and runs next batch via page.evaluate simulation.
 *
 * Simpler: read batch N invoke json, output for MCP, read result from .cdp-batch-N-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bi = Number(process.argv[2]);
const viewId = process.argv[3] || '548005';
const batches = [
  '.cdp-emit-0.txt', '.cdp-emit-1-3.txt', '.cdp-emit-4.txt', '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt', '.cdp-emit-13-18.txt', '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt', '.cdp-emit-29.txt',
];
const j = JSON.parse(fs.readFileSync(path.join(dir, batches[bi]), 'utf8'));
const payload = { viewId, method: j.method, params: j.params };
const outPath = path.join(dir, `.cdp-mcp-invoke-${bi}.json`);
fs.writeFileSync(outPath, JSON.stringify(payload));
process.stdout.write(JSON.stringify(payload));
