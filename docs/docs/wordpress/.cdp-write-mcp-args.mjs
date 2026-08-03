import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'c8a606';

for (const n of ['12', '13', 'run']) {
  const f =
    n === 'run' ? 'deploy-manifest-run.js' : `deploy-manifest-${n}.js`;
  const e = fs.readFileSync(path.join(dir, f), 'utf8').trim();
  const out = path.join(dir, `.cdp-mcp-args-${n}.json`);
  fs.writeFileSync(
    out,
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { awaitPromise: true, returnByValue: true, expression: e },
      viewId,
    })
  );
  console.log(n, e.length, out);
}
