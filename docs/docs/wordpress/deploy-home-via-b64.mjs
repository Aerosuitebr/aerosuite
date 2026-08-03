import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const all = fs.readFileSync(path.join(dir, 'deploy-encoding-all.js'), 'utf8').trim();
const b64 = Buffer.from(all, 'utf8').toString('base64');
const loader = `(async()=>{return await eval(atob(${JSON.stringify(b64)}));})()`;
fs.writeFileSync(path.join(dir, '.deploy-home-b64-loader.txt'), loader);
console.log('all', all.length, 'b64', b64.length, 'loader', loader.length);
