/**
 * Read cdp-next.json and print MCP browser_cdp arguments as one JSON line.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '097ced';
const payload = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-next.json'), 'utf8'));
const out = {
  method: payload.method,
  params: payload.params,
  viewId,
};
process.stdout.write(JSON.stringify(out));
