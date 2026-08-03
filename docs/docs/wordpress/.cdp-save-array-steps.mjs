import fs from 'fs';
const arr = JSON.parse(process.argv[2]);
for (const [k, v] of Object.entries(arr)) {
  const n = Number(k);
  if (Number.isNaN(n)) continue;
  fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value: v } }));
}
console.log(JSON.stringify({ saved: Object.keys(arr).length }));
