/** Save MCP batch response and split step outs */
import fs from 'fs';
const raw = JSON.parse(fs.readFileSync('.cdp-batch-out.json', 'utf8'));
const out = raw?.result?.value?.out ?? raw?.result?.value?.out ?? {};
for (const [k, v] of Object.entries(out)) {
  fs.writeFileSync(`.cdp-step-${k}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value: v } }));
}
const val = raw?.result?.value;
console.log(JSON.stringify({ ok: val?.ok ?? true, failedAt: val?.failedAt, keys: Object.keys(out) }));
