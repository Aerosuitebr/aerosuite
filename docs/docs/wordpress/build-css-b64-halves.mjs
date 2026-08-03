import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = fs.readFileSync(path.join(dir, 'aerosuite-premium.css')).toString('base64');
const mid = Math.ceil(b64.length / 2);
const a = b64.slice(0, mid);
const b = b64.slice(mid);
const ex1 = `(async()=>{window.__cssb64='${a}';return{part:1,len:window.__cssb64.length}})()`;
const ex2 = `(async()=>{window.__cssb64+=${JSON.stringify(b)};const css=atob(window.__cssb64);return{part:2,b64:window.__cssb64.length,dec:css.length,hasGrid:css.includes('as-hero-v2__grid')}})()`;
fs.writeFileSync(path.join(dir, '.cdp-css-b64-half1-expr.txt'), ex1);
fs.writeFileSync(path.join(dir, '.cdp-css-b64-half2-expr.txt'), ex2);
console.log('half1', ex1.length, 'half2', ex2.length);
