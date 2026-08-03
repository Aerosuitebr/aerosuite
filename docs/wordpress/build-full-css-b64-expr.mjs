import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = fs.readFileSync(path.join(dir, 'aerosuite-premium.css')).toString('base64');
const ex = `(async()=>{window.__cssb64='${b64}';const css=atob(window.__cssb64);return{ok:true,b64:window.__cssb64.length,dec:css.length,hasGrid:css.includes('as-hero-v2__grid')}})()`;
const out = path.join(dir, '.cdp-full-css-b64-expr.txt');
fs.writeFileSync(out, ex, 'utf8');
console.log(out, ex.length);
