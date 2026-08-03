import fs from 'fs';
const inv = JSON.parse(fs.readFileSync('.cdp-mcp-invoke-now.json', 'utf8'));
const { uploadStep, ...call } = inv;
const args = {
  viewId: call.viewId,
  method: call.method,
  params: call.params,
};
if (process.argv.includes('--write')) {
  fs.writeFileSync('.cdp-last-mcp-args.json', JSON.stringify(args), 'utf8');
  console.log(JSON.stringify({ ok: true, exprLen: args.params?.expression?.length ?? 0 }));
} else {
  process.stdout.write(JSON.stringify(args));
}
