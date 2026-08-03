import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SLICE = 6000;
const order = [
  'init.js',
  'chunk-URL_OS-0.js',
  'chunk-URL_OS-18000.js',
  'chunk-URL_OS-36000.js',
  'chunk-URL_OS-54000.js',
  'upload-URL_OS.js',
  'chunk-URL_ESTOQUE-0.js',
  'chunk-URL_ESTOQUE-18000.js',
  'upload-URL_ESTOQUE.js',
  'chunk-URL_COMERCIAL-0.js',
  'chunk-URL_COMERCIAL-18000.js',
  'chunk-URL_COMERCIAL-36000.js',
  'chunk-URL_COMERCIAL-54000.js',
  'upload-URL_COMERCIAL.js',
  'chunk-URL_DASHBOARD-0.js',
  'chunk-URL_DASHBOARD-18000.js',
  'chunk-URL_DASHBOARD-36000.js',
  'chunk-URL_DASHBOARD-54000.js',
  'upload-URL_DASHBOARD.js',
  'finalize.js',
];

const expanded = [];
for (const name of order) {
  const raw = fs.readFileSync(path.join(dir, 'steps', name), 'utf8').trim();
  const awaitPromise = name.startsWith('upload-') || name === 'finalize.js';
  if (awaitPromise) {
    expanded.push({ name, expression: raw, awaitPromise: true });
    continue;
  }
  if (name === 'init.js') {
    expanded.push({
      name,
      expression: `new Function(${JSON.stringify(raw)})()`,
      awaitPromise: false,
    });
    continue;
  }
  const m = raw.match(/^window\.__b64buf\+="([\s\S]*)";return window\.__b64buf\.length;$/);
  if (!m) throw new Error('unexpected chunk format: ' + name);
  const b64 = m[1];
  const parts = [];
  for (let i = 0; i < b64.length; i += SLICE) parts.push(b64.slice(i, i + SLICE));
  parts.forEach((part, idx) => {
    const isLast = idx === parts.length - 1;
    const expr = isLast
      ? `window.__b64buf+=${JSON.stringify(part)};window.__b64buf.length`
      : `window.__b64buf+=${JSON.stringify(part)};window.__b64buf.length`;
    expanded.push({
      name: `${name}#${idx}`,
      expression: expr,
      awaitPromise: false,
    });
  });
}

fs.writeFileSync(path.join(dir, 'expanded-steps.json'), JSON.stringify(expanded, null, 0));
console.log('expanded steps', expanded.length);
expanded.forEach((s) => console.log(s.name, s.expression.length, s.awaitPromise));
