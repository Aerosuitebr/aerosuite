/**
 * Split combined loop MCP response into .cdp-step-N-result.json files.
 * Usage: node .cdp-split-loop-result.mjs <response.json>
 */
import fs from 'fs';

const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const values = raw?.result?.value ?? raw?.value ?? raw;

if (!values || typeof values !== 'object') {
  console.error(JSON.stringify({ error: 'NO_VALUES', raw: typeof raw }));
  process.exit(1);
}

for (const [n, value] of Object.entries(values)) {
  const stepResult = {
    result: { type: typeof value, value },
  };
  fs.writeFileSync(`.cdp-step-${n}-result.json`, JSON.stringify(stepResult));
}

console.log(JSON.stringify({ split: true, steps: Object.keys(values).map(Number).sort((a, b) => a - b) }));
