/**
 * Read step args and print for agent MCP call; save result from stdin.
 * Usage:
 *   node .cdp-run-mcp-step.mjs args <n> [viewId]
 *   node .cdp-run-mcp-step.mjs save <n>  (reads MCP JSON from stdin)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || '1031af';
const resultsDir = path.join(dir, '.cdp-mcp-results');

if (cmd === 'args') {
  const out = execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' });
  process.stdout.write(out);
} else if (cmd === 'save') {
  const raw = fs.readFileSync(0, 'utf8');
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, `${n}.json`), raw, 'utf8');
  const j = JSON.parse(raw);
  const ex = j?.exceptionDetails || j?.result?.exceptionDetails;
  const val = j?.result?.value ?? j?.value;
  console.log(JSON.stringify({ step: Number(n), ok: !ex, value: val, ex: ex || null }));
  process.exit(ex ? 1 : 0);
}
