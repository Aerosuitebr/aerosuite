/**
 * Print each step's browser_cdp arguments as one JSON line (for agent loop).
 * Usage: node .cdp-run-steps-1-29.mjs [start] [end] [viewId]
 */
import fs from 'fs';

const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '7e22ca';

for (let n = start; n <= end; n++) {
  const p = `.cdp-step-${n}.args.json`;
  if (!fs.existsSync(p)) {
    const alt = `.cdp-mcp-call-${n}.json`;
    if (!fs.existsSync(alt)) continue;
    const a = JSON.parse(fs.readFileSync(alt, 'utf8'));
    a.viewId = viewId;
    fs.writeFileSync(p, JSON.stringify(a));
  }
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  a.viewId = viewId;
  console.log(JSON.stringify({ step: n, args: { viewId: a.viewId, method: a.method, params: a.params } }));
}
