import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = [
  'init.js',
  'chunk-URL_OS-0.js',
  'chunk-URL_OS-18000.js',
  'chunk-URL_OS-36000.js',
  'chunk-URL_OS-54000.js',
  'upload-URL_OS.js',
  'chunk-URL_ESTOQUE-0.js',
  'chunk-URL_ESTOQUE-18000.js',
  'upload-URL_ESTOQUE.js',
  'chunk-URL_COMERCIAL-0.js',
  'chunk-URL_COMERCIAL-18000.js',
  'chunk-URL_COMERCIAL-36000.js',
  'chunk-URL_COMERCIAL-54000.js',
  'upload-URL_COMERCIAL.js',
  'chunk-URL_DASHBOARD-0.js',
  'chunk-URL_DASHBOARD-18000.js',
  'chunk-URL_DASHBOARD-36000.js',
  'chunk-URL_DASHBOARD-54000.js',
  'upload-URL_DASHBOARD.js',
  'finalize.js',
];

const steps = order.map((name) => ({
  name,
  code: fs.readFileSync(path.join(dir, 'steps', name), 'utf8'),
  await: name.startsWith('upload-') || name === 'finalize.js',
}));

const expr = `(async()=>{
  const steps=${JSON.stringify(steps)};
  const out={};
  for(const s of steps){
    let v=eval(s.code);
    if(s.await)v=await v;
    out[s.name]=v;
  }
  return out;
})()`;

fs.writeFileSync(path.join(dir, 'mega-eval.js'), expr);
console.log('bytes', Buffer.byteLength(expr, 'utf8'));
