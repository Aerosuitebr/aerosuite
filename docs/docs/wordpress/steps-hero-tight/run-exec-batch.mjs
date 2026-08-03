/**
 * Prints one JSON line per exec step for agent MCP browser_cdp calls.
 * Usage: node run-exec-batch.mjs 6 11
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const from = Number(process.argv[2] || 6);
const to = Number(process.argv[3] || 11);

for (let i = from; i <= to; i++) {
  const p = path.join(dir, `exec-${i}.json`);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log(JSON.stringify({ step: i, method: 'Runtime.evaluate', viewId: '097ced', params: j }));
}
