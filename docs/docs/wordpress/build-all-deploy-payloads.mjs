import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, 'cdp-deploy-steps');
fs.mkdirSync(outDir, { recursive: true });
const viewId = process.env.CDP_VIEW_ID || '68004e';
const order = [
  'deploy-step-0.js',
  'deploy-step-1.js',
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

order.forEach((name, i) => {
  const expression = fs.readFileSync(path.join(dir, name), 'utf8').trim();
  const payload = {
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
    viewId,
  };
  fs.writeFileSync(path.join(outDir, `${String(i).padStart(2, '0')}-${name}.json`), JSON.stringify(payload));
});
console.log('written', order.length, 'to', outDir);
