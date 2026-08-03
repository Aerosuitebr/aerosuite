import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(dir, '.deploy-marketing-once.js'), 'utf8');
const b64 = Buffer.from(code, 'utf8').toString('base64');
const cs = 15000;
const chunks = [];
for (let i = 0; i < b64.length; i += cs) chunks.push(b64.slice(i, i + cs));

const out = {
  init: '(async()=>{window.__mktB64=[];return{ok:1}})()',
  chunks: chunks.map(
    (x, i) =>
      `(async()=>{window.__mktB64=window.__mktB64||[];window.__mktB64[${i}]=${JSON.stringify(x)};return{i:${i},n:${chunks.length}}})()`
  ),
  run: `(async()=>{const src=atob(window.__mktB64.join(''));window.__mktB64=null;return await eval(src);})()`,
};
fs.writeFileSync(path.join(dir, '.cdp-marketing-chunks.json'), JSON.stringify(out));
console.log('chunks', chunks.length, 'bytes', code.length);
