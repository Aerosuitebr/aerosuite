/**
 * Prepares args for steps 1-29; parent agent calls browser_cdp per step.
 * Usage: node run-cdp-mcp-steps.mjs prepare <n>
 *        node run-cdp-mcp-steps.mjs record <n> '<result-json>'
 */
import fs from 'fs';
import path from 'path';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const viewId = 'c11c39';
const resultsPath = path.join(dir, '.cdp-run-results.json');

function loadArgs(n) {
  const p = path.join(dir, `.cdp-step-${n}.args.json`);
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  a.viewId = viewId;
  return a;
}

const cmd = process.argv[2];
const n = Number(process.argv[3]);

if (cmd === 'prepare') {
  process.stdout.write(JSON.stringify(loadArgs(n)));
} else if (cmd === 'record') {
  const result = JSON.parse(process.argv[4]);
  const results = fs.existsSync(resultsPath)
    ? JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    : {};
  results[n] = result;
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('recorded', n);
} else if (cmd === 'summary') {
  console.log(fs.readFileSync(resultsPath, 'utf8'));
} else {
  console.error('commands: prepare|record|summary');
  process.exit(1);
}
