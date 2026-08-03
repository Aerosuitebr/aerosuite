import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'a9930e';
const b64 = fs.readFileSync(path.join(dir, 'aerosuite-premium.css')).toString('base64');
const chunkSize = 1800;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

const uploads = chunks.map(
  (c, i) =>
    `(async()=>{window.__cssParts=window.__cssParts||[];window.__cssParts[${i}]=${JSON.stringify(c)};return{i:${i},total:${chunks.length}};})()`
);
const run = `(async()=>{window.__cssb64=(window.__cssParts||[]).join('');window.__cssParts=null;return{len:window.__cssb64.length,ok:window.__cssb64.length===${b64.length}}})()`;

const out = { step: 'css-full', viewId, uploads, run, uploadCount: uploads.length, expectedLen: b64.length };
fs.writeFileSync(path.join(dir, '.cdp-css-full-chunked.json'), JSON.stringify(out, null, 2));
uploads.forEach((u, i) => fs.writeFileSync(path.join(dir, `.cssfull-${i}.txt`), u));
fs.writeFileSync(path.join(dir, '.cssfull-run.txt'), run);
console.log(JSON.stringify({ uploads: uploads.length, expectedLen: b64.length, viewId }));
