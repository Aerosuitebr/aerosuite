/**
 * Flatten .cdp-current-mcp-args.json -> .cdp-flat-call.json (viewId override)
 * Usage: node .cdp-exec-step.mjs flatten [viewId]
 *        node .cdp-exec-step.mjs from-call <n> [viewId]
 *        node .cdp-exec-step.mjs save-result <json-file>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[4] || process.argv[3] || '87550c';

if (cmd === 'flatten') {
  const a = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-args.json'), 'utf8'));
  const c = a.arguments || a;
  const flat = { viewId: process.argv[3] || '87550c', method: c.method, params: c.params };
  fs.writeFileSync(path.join(dir, '.cdp-flat-call.json'), JSON.stringify(flat));
  console.log(JSON.stringify({ step: 'flat', len: flat.params.expression?.length, preview: flat.params.expression?.slice(0, 80) }));
  process.exit(0);
}

if (cmd === 'from-call') {
  const n = Number(process.argv[3]);
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-call-${n}.json`), 'utf8'));
  call.viewId = process.argv[4] || '87550c';
  fs.writeFileSync(path.join(dir, '.cdp-flat-call.json'), JSON.stringify(call));
  console.log(JSON.stringify({ n, len: call.params.expression?.length }));
  process.exit(0);
}

if (cmd === 'save-result') {
  const src = process.argv[3];
  const raw = fs.readFileSync(src, 'utf8');
  JSON.parse(raw);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), raw);
  console.log('saved');
  process.exit(0);
}

console.error('unknown cmd');
