/**
 * Builds ordered list of small Runtime.evaluate expressions for screenshot deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const stepsDir = path.join(dir, 'steps');

const ORDER = [
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

const MAX_CHUNK = 5500;

function splitChunkExpr(content) {
  const m = content.match(/^window\.__b64buf\+="([\s\S]*)";return window\.__b64buf\.length;$/);
  if (!m) throw new Error('unexpected chunk format');
  const b64 = m[1];
  const parts = [];
  for (let i = 0; i < b64.length; i += MAX_CHUNK) {
    parts.push(b64.slice(i, i + MAX_CHUNK));
  }
  return parts.map(
    (p, i) =>
      `(function(){window.__b64buf+="${p}";return window.__b64buf.length;})()`
  );
}

const list = [];
for (const name of ORDER) {
  const content = fs.readFileSync(path.join(stepsDir, name), 'utf8').trim();
  const awaitPromise = name.startsWith('upload-') || name === 'finalize.js';
  if (name === 'init.js') {
    list.push({
      name,
      expression: 'new Function("window.__asUrls={};window.__b64buf=\\"\\";return {ok:true};")()',
      awaitPromise: false,
    });
  } else if (name.startsWith('chunk-')) {
    const exprs = splitChunkExpr(content);
    exprs.forEach((expression, i) => {
      list.push({ name: `${name}#${i}`, expression, awaitPromise: false });
    });
  } else {
    list.push({ name, expression: content, awaitPromise });
  }
}

fs.writeFileSync(path.join(dir, 'cdp-step-list.json'), JSON.stringify(list, null, 0));
console.log('steps', list.length, 'bytes', fs.statSync(path.join(dir, 'cdp-step-list.json')).size);
