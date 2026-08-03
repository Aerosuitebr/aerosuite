import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const js = fs.readFileSync(path.join(dir, 'deploy-footer-inline.js'), 'utf8');
const CH = 5200;
const parts = [];
for (let i = 0; i < js.length; i += CH) parts.push(js.slice(i, i + CH));

const chunkParams = parts.map((p) => {
  const esc = p
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  const expression =
    `window.__footerInline=(window.__footerInline||"")+"${esc}";window.__footerInline.length`;
  return { expression, awaitPromise: false, returnByValue: true };
});

fs.writeFileSync(
  path.join(dir, 'cdp-footer-chunks.json'),
  JSON.stringify(chunkParams)
);

const run = {
  expression: '(async()=>{eval(window.__footerInline);})()',
  awaitPromise: true,
  returnByValue: true,
};
fs.writeFileSync(path.join(dir, 'cdp-footer-run.json'), JSON.stringify(run));
console.log('chunks', chunkParams.length, chunkParams.map((c) => c.expression.length));
