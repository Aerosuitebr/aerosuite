import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'steps');
const name = process.argv[2];
if (!name) {
  console.error('usage: node exec-step-expr.mjs <step-file.js>');
  process.exit(1);
}
const content = fs.readFileSync(path.join(dir, name), 'utf8');
const awaitPromise = name.startsWith('upload-') || name === 'finalize.js';
const expression =
  awaitPromise ? content.trim() : `new Function(${JSON.stringify(content)})()`;
process.stdout.write(JSON.stringify({ name, expression, awaitPromise }));
