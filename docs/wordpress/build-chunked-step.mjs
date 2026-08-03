import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'a9930e';
const map = {
  'css-q3': '.params-css-q3.json',
  'css-q4': '.params-css-q4.json',
  'css-verify': '.params-css-verify.json',
  'css-finalize': '.params-css-finalize.json',
  'enc-init': '.params-enc-init.json',
  'enc-0': '.params-enc-0.json',
  'enc-1': '.params-enc-1.json',
  'enc-2': '.params-enc-2.json',
  'enc-3': '.params-enc-3.json',
  'enc-run': '.params-enc-run.json',
};
const raw = JSON.parse(fs.readFileSync(path.join(dir, map[step]), 'utf8'));
const inner = raw.expression;
const b64 = Buffer.from(inner, 'utf8').toString('base64');
const chunkSize = 1800;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));
const uploads = chunks.map(
  (c, i) =>
    `(async()=>{window.__stepB64=window.__stepB64||[];window.__stepB64[${i}]="${c}";return{step:"${step}",i:${i},total:${chunks.length}};})()`
);
const run = `(async()=>{const src=atob((window.__stepB64||[]).join(''));window.__stepB64=null;return await eval(src);})()`;
const out = { step, viewId, uploads, run, uploadCount: uploads.length };
fs.writeFileSync(path.join(dir, '.cdp-chunked-step.json'), JSON.stringify(out, null, 2));
console.log(step, 'uploads', uploads.length, 'runLen', run.length);
