/**
 * Agent helper: read batch index, output MCP browser_cdp arguments as JSON on stdout.
 * Usage: node read-cdp-batch.mjs <0-8> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];
const idx = Number(process.argv[2]);
const viewId = process.argv[3] || '548005';
const j = JSON.parse(fs.readFileSync(path.join(dir, batches[idx]), 'utf8'));
process.stdout.write(
  JSON.stringify({ viewId, method: j.method, params: j.params })
);
