import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '9e0614';
const p = `.cdp-step-${n}-mcp.json`;
if (!fs.existsSync(p)) {
  const a = JSON.parse(fs.readFileSync(`.cdp-step-${n}-args.json`, 'utf8'));
  fs.writeFileSync(p, JSON.stringify({ method: a.method, params: a.params, viewId: a.viewId }));
}
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
j.viewId = viewId;
process.stdout.write(JSON.stringify(j));
