import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'a9930e';
const map = {
  'css-q1': { file: '.mcp-step-css-q1.json', nested: true },
  'css-q2': { file: '.params-css-q2.json' },
  'css-q3': { file: '.params-css-q3.json' },
  'css-q4': { file: '.params-css-q4.json' },
  'css-verify': { file: '.params-css-verify.json' },
  'css-finalize': { file: '.params-css-finalize.json' },
  'enc-init': { file: '.params-enc-init.json' },
  'enc-0': { file: '.params-enc-0.json' },
  'enc-1': { file: '.params-enc-1.json' },
  'enc-2': { file: '.params-enc-2.json' },
  'enc-3': { file: '.params-enc-3.json' },
  'enc-run': { file: '.params-enc-run.json' },
};
const cfg = map[step];
if (!cfg) {
  console.error('unknown step', step);
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(path.join(dir, cfg.file), 'utf8'));
const inner = cfg.nested ? raw.params.expression : raw.expression;
const b64 = Buffer.from(inner, 'utf8').toString('base64');
const chunkSize = 2000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));
const wrapper = `(async()=>{const b64=${JSON.stringify(chunks)}.join('');const src=atob(b64);return await eval(src);})()`;
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, '.cdp-mcp-args-only.json'), JSON.stringify(payload), 'utf8');
console.log(step, 'inner', inner.length, 'wrapper', wrapper.length);
