/** Writes cdp-eval-params.json from cdp-current.json for MCP browser_cdp. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'a52ddb';
const j = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-current.json'), 'utf8'));
fs.writeFileSync(
  path.join(dir, 'cdp-eval-params.json'),
  JSON.stringify({
    method: 'Runtime.evaluate',
    params: {
      expression: j.expression,
      returnByValue: true,
      awaitPromise: j.awaitPromise,
    },
    viewId,
    meta: { index: j.index, batch: j.batch, kind: j.kind, total: j.total },
  })
);
console.log('PREPARE', j.index + 1, '/', j.total, j.batch, j.kind, j.awaitPromise);
