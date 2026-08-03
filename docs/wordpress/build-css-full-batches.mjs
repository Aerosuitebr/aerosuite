import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-css-full-chunked.json'), 'utf8'));
const batchSize = 5;
const batches = [];
for (let b = 0; b < j.uploads.length; b += batchSize) {
  const slice = j.uploads.slice(b, b + batchSize);
  const assigns = slice
    .map((u) => {
      const m = u.match(/window\.__cssParts\[(\d+)\]=(.+);return/);
      return m ? `window.__cssParts[${m[1]}]=${m[2]};` : '';
    })
    .join('');
  const ex = `(async()=>{window.__cssParts=window.__cssParts||[];${assigns}return{batch:${b / batchSize},from:${b},to:${b + slice.length - 1}};})()`;
  batches.push(ex);
  fs.writeFileSync(path.join(dir, `.cssfull-batch-${b / batchSize}.txt`), ex);
}
fs.writeFileSync(path.join(dir, '.cssfull-run.txt'), j.run);
console.log(JSON.stringify({ batches: batches.length, lens: batches.map((b) => b.length) }));
