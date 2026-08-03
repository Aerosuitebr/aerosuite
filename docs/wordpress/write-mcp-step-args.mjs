import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '483e84';
const steps = process.argv.slice(3).map(Number).filter(Boolean);
const list = steps.length ? steps : [2, 3, 4, 5];

for (const n of list) {
  const expr = fs.readFileSync(path.join(dir, `.cdp-step${n}-expr.txt`), 'utf8');
  const out = path.join(dir, `.mcp-step${n}-args.json`);
  fs.writeFileSync(
    out,
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { expression: expr, awaitPromise: true, returnByValue: true },
      viewId,
    }),
    'utf8'
  );
  console.log(n, expr.length, out);
}

if (list.includes(99) || process.argv.includes('finalize')) {
  const expr = fs.readFileSync(path.join(dir, 'deploy-css-fix-run.js'), 'utf8');
  const out = path.join(dir, '.mcp-finalize-args.json');
  fs.writeFileSync(
    out,
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { expression: expr, awaitPromise: true, returnByValue: true },
      viewId,
    }),
    'utf8'
  );
  console.log('finalize', expr.length, out);
}
