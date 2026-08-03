import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const png = path.join(dir, '../../frontend/src/assets/Pictureandletter.png');
const b64 = fs.readFileSync(png).toString('base64');
const size = 32000;
const outDir = path.join(dir, 'eval-chunks');
let part = 0;
for (let i = 0; i < b64.length; i += size, part++) {
  const chunk = b64.slice(i, i + size);
  const ex =
    '(async()=>{window.__logoB64=(window.__logoB64||"")+' +
    JSON.stringify(chunk) +
    ';return{part:' +
    part +
    ',len:window.__logoB64.length}})()';
  fs.writeFileSync(path.join(outDir, `logo-expr-${part}.txt`), ex);
  console.log(part, ex.length);
}
console.log('parts', part);
