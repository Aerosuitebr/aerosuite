import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = 'f7ac9f';

for (const n of [4, 5, 6, 'fin']) {
  const f =
    n === 'fin' ? 'deploy-css-fix-finalize.js' : `deploy-css-step-${n}.js`;
  const expr = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r?\n/g, ' ');
  const b64 = Buffer.from(expr, 'utf8').toString('base64');
  const expression = `(async()=>{const r=eval(atob(${JSON.stringify(b64)}));return typeof r?.then==='function'?await r:r;})()`;
  const call = {
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
    viewId,
  };
  fs.writeFileSync(
    path.join(dir, `.mcp-call-css-b64-${n}.json`),
    JSON.stringify(call)
  );
  console.log(n, expr.length, JSON.stringify(call).length);
}
