import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = [0, 1, 2, 3, 4, 'run'];

for (const step of steps) {
  const file = path.join(dir, `deploy-chunk-payload-${step}.json`);
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = path.join(dir, `mcp-call-${step}.json`);
  fs.writeFileSync(
    out,
    JSON.stringify({
      server: 'cursor-ide-browser',
      toolName: 'browser_cdp',
      arguments: payload,
    })
  );
  console.log(step, payload.params.expression.length, fs.statSync(out).size);
}
