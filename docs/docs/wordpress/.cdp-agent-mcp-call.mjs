/**
 * Agent: node .cdp-agent-mcp-call.mjs -> read stdout JSON -> CallMcpTool browser_cdp
 *        node .cdp-agent-mcp-call.mjs save '<mcpResultJson>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsFile = path.join(dir, '.cdp-mcp-call-min.json');
const cmd = process.argv[2];

if (cmd === 'emit') {
  const a = JSON.parse(fs.readFileSync(argsFile, 'utf8'));
  process.stdout.write(JSON.stringify(a));
  process.exit(0);
}

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  const viewId = process.argv[4] || '84ede5';
  const { execSync } = await import('child_process');
  execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
  const out = { method: call.method, params: call.params, viewId: call.viewId };
  fs.writeFileSync(argsFile, JSON.stringify(out));
  fs.writeFileSync(path.join(dir, '.cdp-expr-only.txt'), call.params?.expression ?? '');
  console.log(JSON.stringify({ step: n, viewId: out.viewId, exprLen: out.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-mcp-done-now.json'), raw);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), raw);
  const v = JSON.parse(raw)?.result?.value;
  console.log(JSON.stringify({ saved: true, value: v }));
  process.exit(0);
}

console.error('prepare N [viewId] | emit | save JSON');
process.exit(2);
