/**
 * Prints one JSON line per CDP call for agent browser_cdp.
 * Usage: node run-invoke-push-sequence.mjs | while read line; do ...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const seq = [
  'invoke-push-1a.json',
  'invoke-push-1b.json',
  'invoke-push-2.json',
  'invoke-push-3.json',
  'invoke-push-4.json',
  'invoke-push-5.json',
];
for (const name of seq) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  process.stdout.write(JSON.stringify(j) + '\n');
}
