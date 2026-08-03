/**
 * Reads .cdp-step-N.args.json, sets viewId, writes compact result summary.
 * Parent agent calls browser_cdp per step; this only prepares payloads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '4a20d1';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

const manifest = JSON.parse(
  fs.readFileSync(path.join(base, '.cdp-step-manifest.json'), 'utf8')
);

for (let i = start; i <= end; i++) {
  const entry = manifest.find((m) => m.i === i);
  if (!entry) continue;
  const a = JSON.parse(fs.readFileSync(entry.argsPath, 'utf8'));
  a.viewId = viewId;
  const out = path.join(base, `.cdp-step-${i}.mcp-ready.json`);
  fs.writeFileSync(out, JSON.stringify(a), 'utf8');
  console.log(JSON.stringify({ i, step: entry.step, out, exprLen: a.params?.expression?.length ?? 0 }));
}
