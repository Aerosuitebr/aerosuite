import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
for (let i = 2; i <= 5; i++) {
  const src = fs.readFileSync(path.join(dir, `deploy-css-step-${i}.js`), 'utf8');
  const m = src.match(/\+\"([\s\S]*)\";return\{chunk/);
  if (!m) throw new Error('parse fail ' + i);
  const chunk = m[1];
  const ex = `(async()=>{window.__cssb64=(window.__cssb64||'')+${JSON.stringify(chunk)};return{step:${i},len:window.__cssb64.length}})()`;
  fs.writeFileSync(path.join(dir, `.cdp-step${i}-expr.txt`), ex);
  console.log(i, ex.length);
}
