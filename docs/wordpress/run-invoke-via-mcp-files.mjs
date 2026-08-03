/**
 * Writes per-step MCP payloads; agent runs browser_cdp from .cdp-step-call.json.
 * After all steps, reads .cdp-step-results.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'e81202';
const STEPS = process.argv.slice(3).length
  ? process.argv.slice(3)
  : [
      'css-q1', 'css-q2', 'css-q3', 'css-q4',
      'css-verify', 'css-finalize',
      'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
    ];

const step = process.argv[3] === undefined && process.argv[2] && !process.argv[2].startsWith('css') && !process.argv[2].startsWith('enc')
  ? null
  : process.argv[4];

if (process.argv[2] === 'write' && process.argv[3]) {
  const name = process.argv[3];
  const vid = process.argv[4] || viewId;
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  fs.writeFileSync(
    path.join(dir, '.cdp-step-call.json'),
    JSON.stringify({ viewId: vid, method: 'Runtime.evaluate', params })
  );
  process.stdout.write(name);
  process.exit(0);
}

if (process.argv[2] === 'save' && process.argv[3]) {
  const result = JSON.parse(process.argv[3]);
  const results = fs.existsSync(path.join(dir, '.cdp-step-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, '.cdp-step-results.json'), 'utf8'))
    : {};
  results[process.argv[4]] = result?.result?.value ?? result?.value ?? result;
  fs.writeFileSync(path.join(dir, '.cdp-step-results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
  process.exit(0);
}

console.log(JSON.stringify({ viewId, steps: STEPS }));
