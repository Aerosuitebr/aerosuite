import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [
  ...[0, 1, 2, 3, 4].map((n) => `deploy-encoding-${n}.js`),
  'deploy-encoding-run.js',
];
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8').trim();
  const b64 = Buffer.from(src, 'utf8').toString('base64');
  const loader = `(async()=>{return await eval(atob(${JSON.stringify(b64)}));})()`;
  const out = path.join(dir, `.b64-loader-${path.basename(f, '.js')}.txt`);
  fs.writeFileSync(out, loader);
  console.log(f, src.length, 'loader', loader.length);
}
