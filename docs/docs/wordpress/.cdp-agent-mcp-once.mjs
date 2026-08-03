/** Read .cdp-mcp-do-now.json step, write MCP result to .cdp-mcp-done-now.json and record.
 * Usage: node .cdp-agent-mcp-once.mjs write-result '<json>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const doneFile = path.join(dir, '.cdp-mcp-done-now.json');

if (cmd === 'pending') {
  const doFile = path.join(dir, '.cdp-mcp-do-now.json');
  if (!fs.existsSync(doFile)) {
    console.log(JSON.stringify({ pending: false }));
    process.exit(0);
  }
  const c = JSON.parse(fs.readFileSync(doFile, 'utf8'));
  console.log(JSON.stringify({ pending: true, step: c.step, viewId: c.viewId, method: c.method, params: c.params }));
  process.exit(0);
}

if (cmd === 'write-result') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  const doFile = path.join(dir, '.cdp-mcp-do-now.json');
  const c = JSON.parse(fs.readFileSync(doFile, 'utf8'));
  const step = c.step;
  fs.writeFileSync(doneFile, raw);
  fs.writeFileSync(path.join(dir, '.cdp-last-mcp.json'), raw);
  fs.writeFileSync(path.join(dir, `.cdp-step-${step}-mcp-response.json`), raw);
  try {
    execSync(`node .cdp-record-mcp-response.mjs ${step} ${JSON.stringify(raw)}`, { cwd: dir, stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
  console.log(JSON.stringify({ recorded: step }));
  process.exit(0);
}

console.error('usage: pending | write-result <json>');
process.exit(2);
