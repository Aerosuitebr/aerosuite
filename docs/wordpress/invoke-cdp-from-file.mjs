import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '.exec-chunks-3-13-run.js';
const viewId = process.argv[3] || '4b143e';
const expr = fs.readFileSync(path.join(dir, file), 'utf8');
const payload = {
  method: 'Runtime.evaluate',
  params: { awaitPromise: true, expression: expr, returnByValue: true },
  viewId,
};
process.stdout.write(JSON.stringify(payload));
