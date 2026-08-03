/**
 * Emit step numbers 11-29 for agent MCP loop; record results from .mcp-runner-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 11);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '5f37a3';
const cmd = process.argv[5] ?? 'emit';

if (cmd === 'emit') {
  const n = Number(process.argv[6]);
  execSync(`node mcp-step-bridge.mjs prepare ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-current.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '.mcp-await-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ n, exprLen: args.params.expression.length }));
} else if (cmd === 'save') {
  const n = Number(process.argv[6]);
  const raw = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-runner-result.json'), 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  execSync(`node mcp-step-bridge.mjs record ${n} ${JSON.stringify(JSON.stringify(value))}`, {
    cwd: dir,
    stdio: 'inherit',
  });
  console.log(JSON.stringify({ saved: n, value }));
}
