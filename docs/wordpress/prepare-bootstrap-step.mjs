/**
 * Prepare bootstrap MCP call for one invoke step (expr served via localhost:18765).
 * Usage: node prepare-bootstrap-step.mjs <step> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'bb8370';
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
const argsPath = path.join(dir, `.bootstrap-args-${step}.json`);
fs.writeFileSync(argsPath, JSON.stringify({ method: 'Runtime.evaluate', params, viewId }));
execSync(`node .cdp-expr-server.mjs set "${argsPath}" ${viewId}`, { cwd: dir, stdio: 'inherit' });
const boot = JSON.parse(execSync('node .cdp-expr-server.mjs bootstrap', { cwd: dir, encoding: 'utf8' }));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(boot));
fs.writeFileSync(path.join(dir, `.mcp-step-${step}-payload.json`), JSON.stringify(boot));
console.log(JSON.stringify({ step, viewId, bootstrap: true, exprLen: params.expression.length }));
