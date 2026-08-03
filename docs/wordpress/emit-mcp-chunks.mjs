import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'a9930e';

const { execSync } = await import('child_process');
execSync(`node build-chunked-step.mjs ${step} ${viewId}`, { cwd: dir, stdio: 'inherit' });

const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-chunked-step.json'), 'utf8'));
const outDir = path.join(dir, `.mcp-${step}`);
fs.mkdirSync(outDir, { recursive: true });

const mk = (name, expression) => ({
  server: 'cursor-ide-browser',
  toolName: 'browser_cdp',
  arguments: {
    viewId,
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
  },
});

j.uploads.forEach((u, i) => {
  fs.writeFileSync(path.join(outDir, `upload-${i}.json`), JSON.stringify(mk(`upload-${i}`, u)));
});
fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(mk('run', j.run)));
console.log(JSON.stringify({ step, outDir, uploads: j.uploadCount }));
