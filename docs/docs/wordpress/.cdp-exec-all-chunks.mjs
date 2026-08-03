/**
 * Agent helper: node .cdp-exec-all-chunks.mjs <chunkIndex>
 * Prints MCP args JSON line for browser_cdp.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const i = Number(process.argv[2]);
const map = [];
for (let n = 0; n <= 13; n++) map.push(`deploy-manifest-${n}.js`);
map.push('deploy-manifest-run.js');
const file = map[i];
if (!file) {
  console.error('index 0-14');
  process.exit(1);
}
const expression = fs.readFileSync(path.join(base, file), 'utf8').trim();
process.stdout.write(
  JSON.stringify({
    method: 'Runtime.evaluate',
    viewId: 'c8a606',
    params: { awaitPromise: true, returnByValue: true, expression },
  })
);
