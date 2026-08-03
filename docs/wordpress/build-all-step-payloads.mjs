import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
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

const payloads = order.map((name) => {
  const raw = execFileSync(process.execPath, ['exec-step-expr.mjs', name], {
    cwd: dir,
    encoding: 'utf8',
  });
  return JSON.parse(raw);
});
fs.writeFileSync(path.join(dir, 'step-payloads.json'), JSON.stringify(payloads, null, 0));
