/**
 * Emit progress: node .cdp-run-ls-calls.mjs <start> <end>
 * Agent should CallMcpTool browser_cdp for each .cdp-call-N.json in range.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const all = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-ls-all-calls.json'), 'utf8'));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? all.length - 1);
for (let i = start; i <= end && i < all.length; i++) {
  fs.writeFileSync(path.join(dir, `.cdp-call-${i}.json`), JSON.stringify(all[i]));
  console.log(JSON.stringify({ i, len: all[i].params.expression.length }));
}
