/**
 * Run remaining deploy steps by emitting cdp-mcp-call.json for each.
 * Agent reads cdp-mcp-call.json and calls browser_cdp.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = [
  'deploy-step-0.js',
  'deploy-step-1.js',
  'deploy-step-2.js',
  'deploy-step-3.js',
  'deploy-css-step-0.js',
  'deploy-css-step-1.js',
  'deploy-css-step-2.js',
  'deploy-css-step-3.js',
  'deploy-css-step-4.js',
  'deploy-css-step-5.js',
  'deploy-upload-hero.js',
  'deploy-upload-phone.js',
  'deploy-upload-zoom.js',
  'deploy-finalize-v2.js',
];
const start = Number(process.argv[2] || 0);
const viewId = process.argv[3] || '68004e';
const name = order[start];
if (!name) {
  console.log('DONE');
  process.exit(0);
}
spawnSync(process.execPath, ['emit-mcp-call.mjs', name, viewId], {
  cwd: dir,
  stdio: 'inherit',
});
console.log('INDEX', start, 'NAME', name, 'NEXT', order[start + 1] || 'DONE');
