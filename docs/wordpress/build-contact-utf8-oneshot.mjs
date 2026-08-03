import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-contact-utf8-chunks.json'), 'utf8'));
const parts = j.chunks.map((c) => {
  const start = c.indexOf(']=') + 2;
  const end = c.indexOf(';return');
  return JSON.parse(c.slice(start, end));
});
const b64 = parts.join('');
const expr = `(async()=>{
  const bin=atob(${JSON.stringify(b64)});
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const src=new TextDecoder('utf-8').decode(bytes);
  return await eval(src);
})()`;
fs.writeFileSync(path.join(dir, 'expr-contact-utf8-oneshot.txt'), expr);
console.log('b64len', b64.length, 'exprlen', expr.length);
