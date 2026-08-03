import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'e81202';
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
fs.writeFileSync(
  path.join(dir, '.cdp-step-call.json'),
  JSON.stringify({ viewId, method: 'Runtime.evaluate', params })
);
