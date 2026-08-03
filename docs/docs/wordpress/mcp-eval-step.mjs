/**
 * Read step-{name}.expr.txt, print MCP payload JSON for agent (or --save-result file).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || '165b2f';
const exprPath = path.join(dir, `step-${step}.expr.txt`);
const invokePath = path.join(dir, `.invoke-${step}.json`);

let expression;
if (fs.existsSync(exprPath)) {
  expression = fs.readFileSync(exprPath, 'utf8').trim();
} else if (fs.existsSync(invokePath)) {
  expression = JSON.parse(fs.readFileSync(invokePath, 'utf8')).expression;
} else {
  console.error('missing', step);
  process.exit(1);
}

const payload = {
  method: 'Runtime.evaluate',
  viewId,
  params: { expression, awaitPromise: true, returnByValue: true },
};
if (process.argv.includes('--write-call')) {
  fs.writeFileSync(path.join(dir, `cdp-call-${step}.json`), JSON.stringify(payload));
}
console.log(JSON.stringify(payload));
