import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const exprFile = process.argv[2];
if (!exprFile) {
  console.error('usage: node exec-cdp-expr-file.mjs <expr-file>');
  process.exit(1);
}
const expr = fs.readFileSync(path.resolve(exprFile), 'utf8');
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId: '483e84',
};
fs.writeFileSync('cdp-payload.json', JSON.stringify(payload));
console.log(expr.length, 'written cdp-payload.json');
