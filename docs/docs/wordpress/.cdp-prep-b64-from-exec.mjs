/** Prep b64-wrapped MCP args from exec-invoke-step. Usage: node .cdp-prep-b64-from-exec.mjs N viewId */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || 'f4acd8';
const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }).trim();
const args = JSON.parse(out);
const expression = args.params.expression;
const b64 = Buffer.from(expression, 'utf8').toString('base64');
const wrapper = `(async()=>{const e=atob('${b64}');return await eval(e);})()`;
const wrapped = {
  viewId: args.viewId,
  method: args.method,
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
process.stdout.write(JSON.stringify(wrapped));
