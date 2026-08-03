import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const size = 4000;
let part = 0;
for (let i = 0; i < css.length; i += size, part++) {
  const chunk = css.slice(i, i + size);
  const ex = `(async()=>{window.__cssP${part}=${JSON.stringify(chunk)};window.__asFooterCss=(window.__asFooterCss||'')+window.__cssP${part};return{part:${part},total:window.__asFooterCss.length}})()`;
  fs.writeFileSync(path.join(dir, `expr-css-part-${part}.txt`), ex);
  console.log(part, ex.length);
}
