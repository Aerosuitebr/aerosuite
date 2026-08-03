/**
 * Split a chunk-*.js (window.__b64buf+=...) into smaller CDP expressions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
const max = Number(process.argv[3] || 6000);
const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
const m = content.match(/^window\.__b64buf\+="([\s\S]*)";return window\.__b64buf\.length;$/);
if (!m) throw new Error('unexpected chunk format: ' + name);
const b64 = m[1];
const parts = [];
for (let i = 0; i < b64.length; i += max) {
  parts.push(b64.slice(i, i + max));
}
const exprs = parts.map((p, idx) => {
  const body =
    parts.length === 1
      ? `window.__b64buf+="${p}";return window.__b64buf.length;`
      : idx === parts.length - 1
        ? `window.__b64buf+="${p}";return window.__b64buf.length;`
        : `window.__b64buf+="${p}";return window.__b64buf.length;`;
  return `new Function(${JSON.stringify(body)})()`;
});
process.stdout.write(JSON.stringify({ name, parts: parts.length, exprs }));
