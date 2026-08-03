import fs from 'fs';
const viewId = process.argv[2] ?? '041fe0';
for (let n = 1; n <= 29; n++) {
  const src = `.cdp-step-${n}.mcp-ready.json`;
  const dst = `.cdp-step-${n}.call.json`;
  const a = JSON.parse(fs.readFileSync(src, 'utf8'));
  a.viewId = viewId;
  fs.writeFileSync(dst, JSON.stringify(a));
}
if (fs.existsSync('.cdp-current-mcp-result.json')) fs.unlinkSync('.cdp-current-mcp-result.json');
console.log('synced 1-29', viewId);
