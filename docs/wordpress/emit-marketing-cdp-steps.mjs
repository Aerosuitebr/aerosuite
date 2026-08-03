import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-marketing-chunks.json'), 'utf8'));
const steps = [{ name: 'init', expr: j.init }, ...j.chunks.map((expr, i) => ({ name: `chunk-${i}`, expr })), { name: 'run', expr: j.run }];
steps.forEach((s, i) => {
  fs.writeFileSync(
    path.join(dir, `.cdp-marketing-step-${i}.json`),
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { awaitPromise: true, expression: s.expr, returnByValue: true },
      viewId: 'a51b7f',
    })
  );
});
console.log('steps', steps.length);
