import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'a9930e';
const map = {
  'css-verify': '.params-css-verify.json',
  'css-finalize': '.params-css-finalize.json',
  'enc-init': '.params-enc-init.json',
  'enc-run': '.params-enc-run.json',
};
const raw = JSON.parse(fs.readFileSync(path.join(dir, map[step]), 'utf8'));
const payload = {
  server: 'cursor-ide-browser',
  toolName: 'browser_cdp',
  arguments: {
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: raw.expression,
      awaitPromise: raw.awaitPromise ?? true,
      returnByValue: raw.returnByValue ?? true,
    },
  },
};
const out = path.join(dir, `.mcp-${step}.json`);
fs.writeFileSync(out, JSON.stringify(payload));
console.log(out);
