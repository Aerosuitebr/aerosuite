/**
 * Prints each CDP slice as JSON lines for external runner.
 * Usage: node run-cdp-slices.mjs [start] [count]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-slices-manifest.json'), 'utf8'));
const start = Number(process.argv[2] || 0);
const count = Number(process.argv[3] || manifest.length);
const slice = manifest.slice(start, start + count);
for (const item of slice) {
  const file = path.join(dir, 'cdp-slices', item.name);
  const expression = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : item.expr;
  process.stdout.write(
    JSON.stringify({
      name: item.name,
      expression,
      awaitPromise: item.awaitPromise || item.name.endsWith('-eval.js'),
    }) + '\n'
  );
}
