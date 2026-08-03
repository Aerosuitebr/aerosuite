import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e459b9';

const steps = ['enc-init', ...fs.readdirSync(dir)
  .filter((f) => /^deploy-encoding-\d+\.js$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
  .map((f) => 'enc-' + f.match(/\d+/)[0]), 'enc-run'];

for (const name of steps) {
  let expression;
  if (name === 'enc-init') {
    expression = `(async()=>{window.__homeb64='';return{ok:true};})()`;
  } else if (name === 'enc-run') {
    expression = fs.readFileSync(path.join(dir, 'deploy-encoding-run.js'), 'utf8').trim();
  } else {
    const n = name.replace('enc-', '');
    expression = fs.readFileSync(path.join(dir, `deploy-encoding-${n}.js`), 'utf8').trim();
  }
  const payload = { expression, awaitPromise: true, returnByValue: true };
  fs.writeFileSync(path.join(dir, `.invoke-${name}.json`), JSON.stringify(payload));
  console.log(name, expression.length);
}

console.log('viewId', viewId, 'steps', steps.length);
