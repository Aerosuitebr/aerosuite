import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e488fa';
for (let n = 0; n <= 29; n++) {
  const f = path.join(dir, `.cdp-step-${n}.invoke.json`);
  if (!fs.existsSync(f)) continue;
  const args = JSON.parse(fs.readFileSync(f, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, `.cdp-args-${n}.json`), JSON.stringify(args));
}
console.log('prepared', viewId);
