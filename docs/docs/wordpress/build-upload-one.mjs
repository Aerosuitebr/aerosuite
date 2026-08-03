import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
const key = process.argv[3];
const title = process.argv[4];
const b64 = fs.readFileSync(path.join(dir, 'screenshots', 'web', file)).toString('base64');

const ex = `(async()=>{
  const b64 = ${JSON.stringify(b64)};
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const fd = new FormData();
  fd.append('file', new Blob([arr], { type: 'image/webp' }), ${JSON.stringify(file)});
  fd.append('title', ${JSON.stringify(title)});
  fd.append('alt_text', ${JSON.stringify(title)});
  const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  window.__asUrls = window.__asUrls || {};
  window.__asUrls[${JSON.stringify(key)}] = m.source_url;
  return { key: ${JSON.stringify(key)}, url: m.source_url };
})()`;

const out = path.join(dir, `upload-eval-${key}.js`);
fs.writeFileSync(out, ex);
console.log(out, ex.length);
