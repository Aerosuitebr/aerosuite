/**
 * Apply MCP response for step N using dedicated result file (avoids handshake races).
 * Usage: node apply-step-result.mjs <n> <responseJsonPath>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const respPath = path.resolve(process.argv[3]);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));
const rel = manifest.steps[n].replace(/\\/g, '/');
const raw = fs.readFileSync(respPath, 'utf8');
JSON.parse(raw);
const out = execSync(`node agent-cdp-step.mjs record "${rel}" "${respPath.replace(/\\/g, '/')}"`, {
  cwd: dir,
  encoding: 'utf8',
});
console.log(out.trim());
