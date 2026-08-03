import fs from 'fs';
const n = process.argv[2];
const raw = fs.readFileSync(0, 'utf8');
fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, raw);
const r = JSON.parse(raw);
const v = r?.result?.value ?? r?.value;
if (r?.exceptionDetails) {
  console.log(JSON.stringify({ ok: false, step: Number(n), exceptionDetails: r.exceptionDetails }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, step: Number(n), value: v }));
