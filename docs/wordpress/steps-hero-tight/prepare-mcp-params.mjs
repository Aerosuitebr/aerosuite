import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
const inv = JSON.parse(fs.readFileSync(path.join(dir, 'split-invokes', file), 'utf8'));
fs.writeFileSync(
  path.join(dir, 'mcp-params-current.json'),
  JSON.stringify(inv.params, null, 0)
);
console.log(file, inv.step, inv.params.expression.length);
