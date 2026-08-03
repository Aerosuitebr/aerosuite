import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url)) + path.sep;
let body = '(async()=>{window.__cssb64=window.__cssb64||"";';
for (let i = 1; i <= 6; i++) {
  const s = fs.readFileSync(dir + `deploy-css-step-${i}.js`, 'utf8').trim();
  const m = s.match(/\+"([\s\S]*)";return/);
  if (!m) throw new Error('parse failed step ' + i);
  body += `window.__cssb64=(window.__cssb64||"")+"${m[1]}";`;
}
body += 'return{ok:true,len:window.__cssb64.length};})()';
fs.writeFileSync(dir + '.combined-css-steps-once.js', body);
