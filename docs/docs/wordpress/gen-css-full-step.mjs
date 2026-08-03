import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = Buffer.from(fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8')).toString('base64');
if (b64.length !== 34708) {
  console.error('unexpected b64 len', b64.length);
  process.exit(1);
}
const sizes = [8358, 8677, 8677, 8996];
let off = 0;
const parts = sizes.map((n) => {
  const p = b64.slice(off, off + n);
  off += n;
  return p;
});
if (off !== b64.length) {
  console.error('split mismatch', off, b64.length);
  process.exit(1);
}
const expr = `(async()=>{window.__cssb64='';window.__cssb64='${parts[0]}';window.__cssb64+='${parts[1]}';window.__cssb64+='${parts[2]}';window.__cssb64+='${parts[3]}';try{atob(window.__cssb64);return{len:window.__cssb64.length,ok:true}}catch(e){return{len:window.__cssb64.length,ok:false,err:String(e)}}})()`;
fs.writeFileSync(path.join(dir, 'step-css-full.expr.txt'), expr);
console.log('wrote step-css-full.expr.txt', expr.length);
