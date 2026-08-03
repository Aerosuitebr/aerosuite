/**
 * Emit chunked CDP calls to load batch expression (base64) then run it.
 * Agent calls browser_cdp for each printed JSON line.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = JSON.parse(
  fs.readFileSync(path.join(dir, 'cdp-batch-mcp-args-only.json'), 'utf8')
);
const expr = args.params.expression;
const viewId = args.viewId || '7b8d4e';
const b64 = Buffer.from(expr, 'utf8').toString('base64');
const CHUNK = 8000;

const calls = [];
calls.push({
  method: 'Runtime.evaluate',
  viewId,
  params: {
    expression: "window.__batchB64='';",
    returnByValue: true,
  },
});

for (let i = 0; i < b64.length; i += CHUNK) {
  const part = b64.slice(i, i + CHUNK);
  calls.push({
    method: 'Runtime.evaluate',
    viewId,
    params: {
      expression: `window.__batchB64+=${JSON.stringify(part)};`,
      returnByValue: true,
    },
  });
}

calls.push({
  method: 'Runtime.evaluate',
  viewId,
  params: {
    expression: `(async()=>{const code=atob(window.__batchB64);return await eval(code);})()`,
    awaitPromise: true,
    returnByValue: true,
  },
});

for (const c of calls) {
  process.stdout.write(JSON.stringify(c) + '\n');
}
