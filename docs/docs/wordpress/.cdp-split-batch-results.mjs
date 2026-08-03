import fs from 'fs';
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const raw = fs.readFileSync(process.argv[4] || 0, 'utf8');
const parsed = JSON.parse(raw);
const values = parsed.result?.value ?? parsed;
for (let n = start; n <= end; n++) {
  const value = values[n];
  fs.writeFileSync(
    `.cdp-step-${n}-result.json`,
    JSON.stringify({ result: { type: 'object', value } })
  );
}
console.log(JSON.stringify({ saved: end - start + 1, keys: Object.keys(values).map(Number) }));
