import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b83599';
const step = Number(process.argv[3]);

const argsPath = path.join(dir, `.invoke-step-${step}.json`);
const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
const mcpArgs = {
  viewId,
  method: args.method || 'Runtime.evaluate',
  params: args.params,
};
fs.writeFileSync(path.join(dir, '.cdp-mcp-args-current.json'), JSON.stringify(mcpArgs));
execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
const boot = execSync('node .cdp-expr-server.mjs bootstrap', { cwd: dir, encoding: 'utf8' }).trim();
fs.writeFileSync(path.join(dir, '.cdp-bootstrap-now.json'), boot);
console.log(boot);
