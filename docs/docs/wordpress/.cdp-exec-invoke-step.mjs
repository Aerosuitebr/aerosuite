/**
 * Emit browser_cdp payload for one step (stdout JSON = arguments only).
 * Usage: node .cdp-exec-invoke-step.mjs <step>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'd15c6f';
const invokePath = path.join(dir, `.cdp-step-${n}.invoke.json`);
const argsPath = path.join(dir, `.cdp-step-${n}.args.json`);
const invokeStepPath = path.join(dir, `.invoke-step-${n}.json`);
let args;
if (fs.existsSync(argsPath)) {
  args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
} else if (fs.existsSync(invokeStepPath)) {
  args = JSON.parse(fs.readFileSync(invokeStepPath, 'utf8'));
} else if (fs.existsSync(invokePath)) {
  const wrap = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  args = wrap.arguments ?? wrap;
} else {
  console.error('missing step files for', n);
  process.exit(1);
}
args.viewId = viewId;
process.stdout.write(JSON.stringify(args));
