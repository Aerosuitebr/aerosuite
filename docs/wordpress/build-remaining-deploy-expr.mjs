import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = [
  'deploy-step-2.js',
  'deploy-step-3.js',
  'deploy-css-step-0.js',
  'deploy-css-step-1.js',
  'deploy-css-step-2.js',
  'deploy-css-step-3.js',
  'deploy-css-step-4.js',
  'deploy-css-step-5.js',
  'deploy-upload-hero.js',
  'deploy-upload-phone.js',
  'deploy-upload-zoom.js',
  'deploy-finalize-v2.js',
];

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
