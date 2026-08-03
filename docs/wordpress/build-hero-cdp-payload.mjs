import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'steps-hero-tight');
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'hero-cdp-payloads');
const name = process.argv[2];
if (!name) {
  console.error('usage: node build-hero-cdp-payload.mjs <step-name>');
  process.exit(1);
}
const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8');
const awaitPromise = name === 'upload-apply';
const expression = awaitPromise ? content.trim() : `new Function(${JSON.stringify(content)})()`;
fs.mkdirSync(outDir, { recursive: true });
const payload = {
  method: 'Runtime.evaluate',
  params: {
    expression,
    awaitPromise,
    returnByValue: true,
  },
};
fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(payload));
