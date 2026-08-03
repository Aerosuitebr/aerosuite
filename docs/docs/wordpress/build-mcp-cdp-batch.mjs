import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = '483e84';
const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node build-mcp-cdp-batch.mjs <expr.txt> ...');
  process.exit(1);
}
files.forEach((f, i) => {
  const expression = fs.readFileSync(path.join(dir, f), 'utf8');
  const out = {
    server: 'cursor-ide-browser',
    toolName: 'browser_cdp',
    arguments: {
      method: 'Runtime.evaluate',
      params: { expression, awaitPromise: true, returnByValue: true },
      viewId,
    },
  };
  const name = path.basename(f, '.txt');
  fs.writeFileSync(path.join(dir, `.mcp-${name}.json`), JSON.stringify(out));
  console.log(name, expression.length);
});
