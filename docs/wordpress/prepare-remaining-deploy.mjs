/**
 * Execute all deploy steps via browser_cdp using Cursor MCP HTTP if available,
 * otherwise prints step payloads for manual/agent invocation.
 *
 * Primary path: sequential Runtime.evaluate on wp-admin tab (viewId from env).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.env.CDP_VIEW_ID || '68004e';
const startAt = Number(process.env.START_AT || 2);
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

const results = [];
for (let i = startAt; i < order.length; i++) {
  const name = order[i];
  spawnSync(process.execPath, ['emit-mcp-call.mjs', name, viewId], {
    cwd: dir,
    stdio: 'inherit',
  });
  const payload = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-mcp-call.json'), 'utf8'));
  const outPath = path.join(dir, 'cdp-step-payload.json');
  fs.writeFileSync(outPath, JSON.stringify({ step: i + 1, name, ...payload }));
  console.log('PAYLOAD', i + 1, name);
  results.push({ step: i + 1, name, payloadPath: outPath });
}

fs.writeFileSync(
  path.join(dir, 'cdp-deploy-manifest.json'),
  JSON.stringify({ viewId, startAt, results }, null, 2)
);
console.log('MANIFEST', results.length, 'steps from', startAt + 1);
