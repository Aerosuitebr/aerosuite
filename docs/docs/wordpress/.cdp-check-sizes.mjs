import fs from 'fs';
for (let i = 0; i < 9; i++) {
  const p = `.cdp-mcp-invoke-${i}.json`;
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = j.params?.expression || '';
  console.log(i, fs.statSync(p).size, e.length);
}
