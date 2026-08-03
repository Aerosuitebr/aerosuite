/**
 * Print one-line JSON for MCP browser_cdp from cdp-batch-invoke-live.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const live = path.join(dir, 'cdp-batch-invoke-live.json');
const fallback = path.join(dir, 'cdp-batch-invoke.json');
const file = fs.existsSync(live) ? live : fallback;
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
process.stdout.write(
  JSON.stringify({
    method: j.method,
    params: j.params,
    viewId: j.viewId || '7b8d4e',
  })
);
