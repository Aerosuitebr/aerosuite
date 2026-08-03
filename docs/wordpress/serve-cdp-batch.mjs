/**
 * Serve CDP batch expression files for browser fetch+eval fallback.
 * Usage: node serve-cdp-batch.mjs <batchIndex>
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bi = Number(process.argv[2] ?? 1);
const emitFiles = [
  '.cdp-emit-0.txt', '.cdp-emit-1-3.txt', '.cdp-emit-4.txt', '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt', '.cdp-emit-13-18.txt', '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt', '.cdp-emit-29.txt',
];
const j = JSON.parse(fs.readFileSync(path.join(dir, emitFiles[bi]), 'utf8'));
const expr = j.params.expression;
const port = 18765 + bi;
const server = http.createServer((_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(expr);
});
server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ port, batch: bi, exprLen: expr.length }));
});
