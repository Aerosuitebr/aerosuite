import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const n = Number(process.argv[2]);
const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(
  fs.readFileSync(path.join(dir, `cdp-cssfix-step-${n}.json`), 'utf8')
);
const out = path.join(dir, `.cdp-cssfix-mcp-${n}.json`);
fs.writeFileSync(
  out,
  JSON.stringify({
    method: j.method,
    params: j.params,
    viewId: '483e84',
  }),
  'utf8'
);
console.log(n, j.params.expression.length, out);
