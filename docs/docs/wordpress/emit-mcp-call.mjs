import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
const viewId = process.argv[3] || '68004e';
if (!name) {
  console.error('usage: node emit-mcp-call.mjs <file.js> [viewId]');
  process.exit(1);
}
const expression = fs.readFileSync(path.join(dir, name), 'utf8').trim();
const payload = {
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, 'cdp-mcp-call.json'), JSON.stringify(payload));
console.log('OK', name, expression.length);
