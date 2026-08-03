import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const expr = fs.readFileSync(path.join(dir, 'deploy-css-fix.js'), 'utf8');
const b64 = Buffer.from(expr, 'utf8').toString('base64');
const chunkSize = 5000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

const steps = [
  `(async()=>{window.__deployB64='';return{ok:true,phase:'init'}})()`,
  ...chunks.map(
    (c, i) =>
      `(async()=>{window.__deployB64=(window.__deployB64||'')+${JSON.stringify(c)};return{chunk:${i},len:window.__deployB64.length}})()`
  ),
  `(async()=>{const r=await eval(atob(window.__deployB64));return r})()`,
];

steps.forEach((s, i) => {
  fs.writeFileSync(
    path.join(dir, `cdp-cssfix-step-${i}.json`),
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { expression: s, awaitPromise: true, returnByValue: true },
    })
  );
});
console.log('chunks', chunks.length, 'steps', steps.length);
