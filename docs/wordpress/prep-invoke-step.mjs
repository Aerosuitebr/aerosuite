import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || '258c93';
if (!step) {
  console.error('usage: node prep-invoke-step.mjs <step> [viewId]');
  process.exit(2);
}
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
const args = { method: 'Runtime.evaluate', params, viewId };
const rp = path.join(dir, '.cdp-current-mcp-result.json');
if (fs.existsSync(rp)) fs.unlinkSync(rp);
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
console.log(JSON.stringify({ step, viewId, exprLen: params.expression?.length ?? 0 }));
