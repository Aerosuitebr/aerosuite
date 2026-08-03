import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = process.argv.slice(2);
if (!order.length) {
  console.error('usage: node build-batch-deploy-expr.mjs <file.js> ...');
  process.exit(1);
}

const steps = order.map((name) => fs.readFileSync(path.join(dir, name), 'utf8').trim());
const expr = `(async()=>{
  const steps = ${JSON.stringify(steps)};
  const names = ${JSON.stringify(order)};
  const results = [];
  for (let i = 0; i < steps.length; i++) {
    try {
      const value = await eval(steps[i]);
      results.push({ name: names[i], ok: true, value });
    } catch (e) {
      results.push({ name: names[i], ok: false, error: String(e && e.message || e) });
      return results;
    }
  }
  return results;
})()`;

const payload = {
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId: process.env.CDP_VIEW_ID || '68004e',
};
fs.writeFileSync(path.join(dir, 'cdp-mcp-call.json'), JSON.stringify(payload));
console.log('exprLen', expr.length, 'steps', order.length);
