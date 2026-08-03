import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
// Already applied: split 0-4 (through first 6000 of chunk-18000). Remaining: rest of chunk-18000 + 36000 + 54000
const files = ['chunk-18000.js', 'chunk-36000.js', 'chunk-54000.js'];
let body = 'window.__b64buf=window.__b64buf||"";\n';
for (const f of files) {
  const line = fs.readFileSync(path.join(dir, f), 'utf8').trim();
  // skip first 6000 chars of b64 in chunk-18000 (already in buffer from split-004)
  if (f === 'chunk-18000.js') {
    const m = line.match(/^window\.__b64buf\+="([\s\S]*)";return/);
    if (!m) throw new Error('parse ' + f);
    const rest = m[1].slice(6000);
    body += `window.__b64buf+="${rest}";\n`;
  } else {
    body += line + '\n';
  }
}
body += 'return window.__b64buf.length;';
const expression = `(function(){${body}})()`;
fs.writeFileSync(path.join(dir, 'remaining-chunks-eval.json'), JSON.stringify({ expression, awaitPromise: false, returnByValue: true, len: expression.length }));
console.log('len', expression.length);
