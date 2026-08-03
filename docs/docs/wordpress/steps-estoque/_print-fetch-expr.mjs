import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const port = process.env.CHUNK_PORT || '8765';
const expression = `(async()=>{const start=4,end=13,port=${port};for(let i=start;i<=end;i++){const r=await fetch('http://127.0.0.1:'+port+'/chunk/'+i);if(!r.ok)throw new Error('fetch chunk '+i+' '+r.status);window.__b64buf+=await r.text();}return window.__b64buf.length;})()`;
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '_fetch-chunks-expr.txt'), expression);
console.log(JSON.stringify({exprLen: expression.length, port}));
