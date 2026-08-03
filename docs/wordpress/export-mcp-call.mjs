import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const a = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-args.json'), 'utf8'));
const payload = {
  method: a.method,
  viewId: a.viewId,
  params: {
    awaitPromise: a.params.awaitPromise,
    returnByValue: a.params.returnByValue,
    expression: a.params.expression,
  },
};
fs.writeFileSync(path.join(dir, '.mcp-call-out.json'), JSON.stringify(payload));
console.log(JSON.stringify({ viewId: payload.viewId, exprLen: payload.params.expression.length }));
