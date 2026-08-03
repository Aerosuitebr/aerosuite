/**
 * Outputs step numbers and checkpoint expectations for agent MCP loop.
 * Agent must CallMcpTool per step using .cdp-step-N.args.json
 */
import fs from 'fs';
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
for (let n = start; n <= end; n++) {
  const p = `.cdp-step-${n}.args.json`;
  if (!fs.existsSync(p)) {
    console.error('MISSING', n);
    continue;
  }
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  const out = `.cdp-step-${n}.mcp-out.json`;
  const done = fs.existsSync(out);
  console.log(JSON.stringify({ n, done, exprLen: a.params?.expression?.length ?? 0 }));
}
