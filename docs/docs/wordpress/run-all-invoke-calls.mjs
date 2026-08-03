import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const calls = [];
for (let i = 0; i <= 5; i++) {
  const j = JSON.parse(
    fs.readFileSync(path.join(dir, `invoke-call-${i}.json`), 'utf8')
  );
  calls.push(j);
}
fs.writeFileSync(
  path.join(dir, 'cdp-batch-mcp-result-pending.json'),
  JSON.stringify({ note: 'Agent must CallMcpTool for each entry in calls', calls }, null, 2)
);
console.log('calls', calls.length);
calls.forEach((c, i) =>
  console.log(i, c.params.expression.length, !!c.params.awaitPromise)
);
