import fs from 'fs';
import { execSync } from 'child_process';

const batch = process.argv[2];
const tmp = `.tmp-mcp-${batch}.json`;
const invoke = JSON.parse(fs.readFileSync(tmp, 'utf8'));
const respPath = `.cdp-batch-${batch}-response.json`;

// Agent must CallMcpTool browser_cdp with invoke; this script records results after response file exists.
if (process.argv[3] === 'write-invoke') {
  fs.writeFileSync(`.cdp-pending-batch-${batch}.json`, JSON.stringify(invoke));
  console.log(JSON.stringify({ batch, exprLen: invoke.params.expression.length }));
  process.exit(0);
}

if (process.argv[3] === 'record') {
  const raw = JSON.parse(fs.readFileSync(respPath, 'utf8'));
  const value = raw?.result?.result?.value ?? raw?.result?.value;
  if (!value?.ok) {
    console.error(JSON.stringify({ ok: false, batch, value }));
    process.exit(1);
  }
  const wrap = (v) =>
    JSON.stringify({ result: { result: { value: v } } });
  for (const [k, v] of Object.entries(value.out || {})) {
    fs.writeFileSync(`.cdp-mcp-result-${k}.json`, wrap(v));
  }
  console.log(JSON.stringify({ ok: true, batch, steps: Object.keys(value.out || {}) }));
}
