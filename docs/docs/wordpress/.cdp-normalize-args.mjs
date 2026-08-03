import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e488fa';

for (let n = 0; n <= 29; n++) {
  const invoke = path.join(dir, `.cdp-step-${n}.invoke.json`);
  const argsFile = path.join(dir, `.cdp-args-${n}.json`);
  if (!fs.existsSync(invoke)) continue;
  const inv = JSON.parse(fs.readFileSync(invoke, 'utf8'));
  const c = inv.arguments?.arguments || inv.arguments || inv;
  fs.writeFileSync(
    argsFile,
    JSON.stringify({ method: c.method, params: c.params, viewId }),
  );
}
console.log('normalized', viewId);
