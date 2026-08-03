import fs from 'fs';
const cmd = process.argv[2];
const dir = import.meta.dirname;
const viewId = process.argv[4] || '84ede5';

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  const a = JSON.parse(fs.readFileSync(`${dir}/.cdp-args-${n}.json`, 'utf8'));
  a.viewId = viewId;
  const call = { method: a.method, params: a.params, viewId: a.viewId };
  fs.writeFileSync(`${dir}/.cdp-call-now.json`, JSON.stringify(call));
  console.log(JSON.stringify({ step: n, exprLen: a.params.expression.length }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = process.argv[3];
  if (!raw) {
    console.error('missing json arg');
    process.exit(1);
  }
  const parsed = JSON.parse(raw);
  fs.writeFileSync(`${dir}/.cdp-current-mcp-result.json`, JSON.stringify(parsed));
  console.log('saved');
  process.exit(0);
}

if (cmd === 'await') {
  const log = fs.readFileSync(`${dir}/.cdp-orchestrate.log`, 'utf8');
  const m = log.match(/AWAIT_STEP (\d+)\s*$/m);
  console.log(JSON.stringify({ awaitStep: m ? Number(m[1]) : null, hasResult: fs.existsSync(`${dir}/.cdp-current-mcp-result.json`) }));
  process.exit(0);
}

console.error('usage: prepare N | save JSON | await');
process.exit(2);
