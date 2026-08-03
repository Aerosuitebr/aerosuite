import fs from 'fs';
for (let n = 0; n <= 29; n++) {
  const j = JSON.parse(fs.readFileSync(`.cdp-step-${n}-mcp.json`, 'utf8'));
  fs.writeFileSync(`.cdp-call-${n}.json`, JSON.stringify({ method: j.method, params: j.params }));
}
console.log('synced calls 0-29');
