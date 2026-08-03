import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const viewId = process.argv[2] || 'bb8370';
const start = process.argv[3] || STEPS[1];
const startIdx = STEPS.indexOf(start);
if (startIdx < 0) {
  console.error('unknown step', start);
  process.exit(2);
}
for (let i = startIdx; i < STEPS.length; i++) {
  const step = STEPS[i];
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
  const payload = { method: 'Runtime.evaluate', params, viewId };
  fs.writeFileSync(path.join(dir, '.mcp-call-payload.json'), JSON.stringify(payload));
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify({ method: 'Runtime.evaluate', params, viewId }));
  console.log(JSON.stringify({ index: i, step, viewId, exprLen: params.expression?.length ?? 0 }));
  break;
}
