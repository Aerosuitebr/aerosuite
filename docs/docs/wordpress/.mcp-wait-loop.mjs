import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 14);
const end = Number(process.argv[3] ?? 19);
const viewId = process.argv[4] ?? '46863b';

for (let n = start; n <= end; n++) {
  const src = path.join(dir, `.step-out-${n}.json`);
  const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
  raw.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-call.json'), JSON.stringify(raw));
  console.log(`AWAIT_MCP ${n}`);
  const resultPath = path.join(dir, '.cdp-mcp-result.json');
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  let found = false;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultPath)) {
      const r = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      const value = r?.result?.value ?? r?.value ?? r;
      console.log(JSON.stringify({ step: n, value }));
      found = true;
      fs.unlinkSync(resultPath);
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!found) {
    console.log(JSON.stringify({ step: n, error: 'timeout' }));
    process.exit(1);
  }
}
