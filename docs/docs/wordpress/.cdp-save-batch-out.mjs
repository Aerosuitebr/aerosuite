/**
 * Read .cdp-full-runner.mcp-ready.json and output MCP args for agent CallMcpTool.
 * After MCP: node .cdp-save-batch-out.mjs '<json response>'
 */
import fs from 'fs';

const cmd = process.argv[2];
const viewIdOverride = process.argv[3] || 'f8a339';

if (cmd === 'load') {
  const args = JSON.parse(fs.readFileSync('.cdp-full-runner.mcp-ready.json', 'utf8'));
  args.viewId = viewIdOverride;
  fs.writeFileSync('.cdp-mcp-call.json', JSON.stringify(args));
  console.log(JSON.stringify({ viewId: args.viewId, method: args.method, exprLen: args.params.expression.length }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = JSON.parse(process.argv[3]);
  fs.writeFileSync('.cdp-batch-out.json', JSON.stringify(raw));
  const out = raw?.result?.value?.out ?? raw?.result?.value?.out ?? {};
  for (const [k, v] of Object.entries(out)) {
    fs.writeFileSync(`.cdp-step-${k}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value: v } }));
  }
  const val = raw?.result?.value ?? raw?.result?.result?.value;
  console.log(JSON.stringify({ ok: val?.ok ?? true, failedAt: val?.failedAt, keys: Object.keys(out) }));
  process.exit(val?.ok === false ? 1 : 0);
}

console.error('usage: load [viewId] | save JSON');
process.exit(2);
