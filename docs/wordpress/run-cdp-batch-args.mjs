import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];

const idx = parseInt(process.argv[2] ?? '-1', 10);
if (idx < 0 || idx >= batches.length) {
  console.error('usage: node run-cdp-batch-args.mjs <0-8>');
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(path.join(dir, batches[idx]), 'utf8'));
const out = path.join(dir, `.mcp-batch-${idx}.json`);
fs.writeFileSync(
  out,
  JSON.stringify({
    server: 'cursor-ide-browser',
    toolName: 'browser_cdp',
    arguments: { viewId: j.viewId, method: j.method, params: j.params },
  })
);
console.log(out, batches[idx], j.params?.expression?.length ?? 0);
