import fs from 'fs';
const chunkPath = process.argv[2];
const outPrefix = process.argv[3] || '.cdp-step-';
const raw = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
const value = raw.result?.value ?? raw.value ?? raw;
for (const [k, v] of Object.entries(value)) {
  const n = Number(k);
  if (!Number.isFinite(n)) continue;
  const file = `${outPrefix}${n}.mcp-out.json`;
  fs.writeFileSync(file, JSON.stringify({ result: { type: 'object', value: v } }));
  console.log('wrote', file, JSON.stringify(v).slice(0, 80));
}
