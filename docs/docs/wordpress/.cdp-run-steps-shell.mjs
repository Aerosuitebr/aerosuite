import fs from 'fs';
import { spawnSync } from 'child_process';

const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const viewId = process.argv[4] || 'f4231a';
const results = {};

for (let n = start; n <= end; n++) {
  const callPath = `.cdp-step-${n}-call.json`;
  if (!fs.existsSync(callPath)) {
    console.error('missing', callPath);
    process.exit(1);
  }
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  call.viewId = viewId;
  const payload = JSON.stringify({
    viewId: call.viewId,
    method: call.method,
    params: call.params,
  });
  fs.writeFileSync(`.cdp-mcp-payload-${n}.json`, payload);
  results[n] = { written: true, len: payload.length };
}
console.log(JSON.stringify({ start, end, results }));
