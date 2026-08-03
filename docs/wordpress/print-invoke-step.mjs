/**
 * Execute .invoke-*.json steps via page.evaluate using Playwright + MCP bridge.
 * Reads chunked manifest and writes deploy-remaining-summary.json.
 * Requires ACTIVE_VIEW_ID env (MCP tab) - uses browser_cdp through sequential evaluate simulation.
 *
 * This script is meant to be driven by the agent calling browser_cdp; it prepares step payloads.
 * Run with --print-step <name> to output params JSON for one step.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const stepName = process.argv.find((a, i) => process.argv[i - 1] === '--print-step');

const order = [
  'css-q1',
  'css-q2',
  'css-q3',
  'css-q4',
  'css-verify',
  'css-finalize',
  'enc-init',
  'enc-0',
  'enc-1',
  'enc-2',
  'enc-3',
  'enc-run',
];

if (stepName) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${stepName}.json`), 'utf8'));
  process.stdout.write(JSON.stringify(p));
  process.exit(0);
}

const summary = { steps: order, invokeFiles: order.map((s) => `.invoke-${s}.json`) };
fs.writeFileSync(path.join(dir, '.remaining-step-order.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
