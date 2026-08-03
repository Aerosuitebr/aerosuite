import fs from 'fs';
const combined = JSON.parse(fs.readFileSync('.cdp-combined-2-29-result.json', 'utf8'));
const values = combined?.result?.value ?? combined?.value ?? combined;
if (!values || typeof values !== 'object') {
  console.error(JSON.stringify({ error: 'no values', combined }));
  process.exit(1);
}
const errors = [];
for (let n = 2; n <= 29; n++) {
  const v = values[n];
  if (v?.__error) {
    errors.push({ step: n, error: v.__error });
    continue;
  }
  fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value: v } }));
}
console.log(JSON.stringify({ saved: Object.keys(values).length, errors }));
process.exit(errors.length ? 1 : 0);
