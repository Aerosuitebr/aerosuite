import fs from 'fs';
import { spawnSync } from 'child_process';

const raw = fs.readFileSync('.cdp-chain-mcp-result.json', 'utf8');
const parsed = JSON.parse(raw);
const out = parsed?.result?.value?.out ?? parsed?.result?.value;
if (!out || typeof out !== 'object') {
  console.error('missing out');
  process.exit(1);
}
for (let n = 0; n <= 29; n++) {
  const value = out[String(n)] ?? out[n];
  const mcpOut = JSON.stringify({ result: { type: 'object', value } });
  fs.writeFileSync('.cdp-mcp-last-result.json', mcpOut);
  const r = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', String(n), mcpOut], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    process.exit(r.status ?? 1);
  }
}
console.log(JSON.stringify({ recorded: 30 }));
