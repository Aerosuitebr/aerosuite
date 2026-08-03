/**
 * Print one MCP browser_cdp invoke JSON for chunk index argv[2].
 * Usage: node invoke-chunk-cdp.mjs 2
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const i = Number(process.argv[2]);
const file = path.join(dir, `cdp-chunk-${i}.json`);
if (!fs.existsSync(file)) {
  console.error('missing', file);
  process.exit(1);
}
process.stdout.write(fs.readFileSync(file, 'utf8'));
