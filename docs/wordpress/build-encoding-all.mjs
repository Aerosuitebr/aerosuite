import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

function bodyOf(file) {
  const s = fs.readFileSync(path.join(dir, file), 'utf8').trim();
  return s.replace(/^\(async\(\)=>\{/, '').replace(/\}\)\(\)$/, '').trim();
}

const initBody = bodyOf('deploy-encoding-init.js').replace(/return\s*\{ok:true\};?/, '');
const chunkFiles = fs
  .readdirSync(dir)
  .filter((f) => /^deploy-encoding-\d+\.js$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

const parts = [initBody, ...chunkFiles.map((f) => bodyOf(f)), bodyOf('deploy-encoding-run.js')];

const combined = `(async()=>{\n${parts.join('\n')}\n})()`;
fs.writeFileSync(path.join(dir, 'deploy-encoding-all.js'), combined);
console.log('length', combined.length);
