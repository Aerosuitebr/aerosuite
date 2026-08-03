import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = fs
  .readdirSync(dir)
  .filter((f) => /^\.invoke-enc-\d+\.json$/.test(f) || f === '.invoke-enc-run.json')
  .map((f) => f.replace('.invoke-', '').replace('.json', ''))
  .sort((a, b) => {
    if (a === 'enc-run') return 1;
    if (b === 'enc-run') return -1;
    return Number(a.replace('enc-', '')) - Number(b.replace('enc-', ''));
  });

for (const name of steps) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  const b64 = Buffer.from(j.expression, 'utf8').toString('base64');
  const loader = `(async()=>{return await eval(atob(${JSON.stringify(b64)}));})()`;
  const payload = { expression: loader, awaitPromise: true, returnByValue: true };
  fs.writeFileSync(path.join(dir, `.invoke-${name}-b64.json`), JSON.stringify(payload));
  console.log(name, 'src', j.expression.length, 'loader', loader.length);
}
