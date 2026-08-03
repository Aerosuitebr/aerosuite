/**
 * Prints ordered CDP invocations for browser_cdp Runtime.evaluate.
 * Usage: node run-all-cdp-batches.mjs > invocations.jsonl
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cdp-batches');
const metas = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('-meta.json'))
  .sort();

for (const metaFile of metas) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, metaFile), 'utf8'));
  const prefix = metaFile.replace('-meta.json', '');
  const syncFile = path.join(dir, `${prefix}.js`);
  const syncAlt = path.join(dir, `${prefix}-sync.js`);
  if (fs.existsSync(syncFile)) {
    const expression = fs.readFileSync(syncFile, 'utf8');
    console.log(JSON.stringify({ batch: prefix, kind: 'sync', expression, awaitPromise: false }));
  } else if (fs.existsSync(syncAlt)) {
    const expression = fs.readFileSync(syncAlt, 'utf8');
    console.log(JSON.stringify({ batch: prefix, kind: 'sync', expression, awaitPromise: false }));
  }
  const asyncFile = path.join(dir, `${prefix}-async.js`);
  if (fs.existsSync(asyncFile)) {
    const expression = fs.readFileSync(asyncFile, 'utf8');
    console.log(JSON.stringify({ batch: prefix, kind: 'async', expression, awaitPromise: true }));
  }
}
